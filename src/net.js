/* Rizolopy online rooms: tiny message relay over free public MQTT brokers.
 *
 * Why MQTT and not WebRTC: phones on school wifi or mobile data are often behind
 * NATs that block peer-to-peer links unless you pay for a TURN relay. A public
 * MQTT broker relays every message over a normal secure websocket, so it works on
 * any network that can open a web page. Nobody has to run or pay for a server.
 *
 * The host's browser keeps the real game state. Guests only send requests
 * ("roll", "buy") and draw what the host tells them. The host connects to every
 * broker in the list (more chances that one is up); each guest uses the first
 * broker where it can find the room, so it sees host messages in order.
 */
import mqtt from "mqtt";

const DEFAULT_BROKERS = [
  "wss://broker.emqx.io:8084/mqtt",
  "wss://broker.hivemq.com:8884/mqtt",
  "wss://test.mosquitto.org:8081/mqtt",
];
const PREFIX = "rizolopy/v1/";
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I or O, so codes are easy to read aloud

function brokers() {
  // ?broker=ws://localhost:8888 overrides the list (used by the automated tests)
  try {
    const q = new URLSearchParams(location.search).get("broker");
    if (q) return q.split(",");
  } catch (e) { /* no location */ }
  return DEFAULT_BROKERS;
}

export function makeRoomCode() {
  let s = "";
  for (let i = 0; i < 4; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}

export function cleanCode(s) {
  return String(s || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
}

/** A per-tab player id, kept across reloads of the same tab so a guest can rejoin their seat. */
export function myClientId() {
  const KEY = "rizolopy-cid";
  try {
    let id = sessionStorage.getItem(KEY);
    if (!id) { id = Math.random().toString(36).slice(2, 10); sessionStorage.setItem(KEY, id); }
    return id;
  } catch (e) {
    return (window.__rzCid ||= Math.random().toString(36).slice(2, 10));
  }
}

function connect(url, opts) {
  return new Promise((resolve, reject) => {
    const c = mqtt.connect(url, { connectTimeout: 7000, reconnectPeriod: 2500, keepalive: 20, clean: true, ...opts });
    let settled = false;
    const t = setTimeout(() => { if (!settled) { settled = true; c.end(true); reject(new Error("timeout")); } }, 8000);
    c.once("connect", () => { if (!settled) { settled = true; clearTimeout(t); resolve(c); } });
    c.once("error", err => { if (!settled) { settled = true; clearTimeout(t); c.end(true); reject(err); } });
  });
}

const parse = buf => { try { return JSON.parse(typeof buf === "string" ? buf : new TextDecoder().decode(buf)); } catch (e) { return null; } };

/**
 * Host a room. onMessage(msg) gets every guest message. onStatus(text|null) reports connection trouble.
 * Resolves once at least one broker is connected.
 */
export async function hostRoom(code, { onMessage, onStatus }) {
  const hTopic = PREFIX + code + "/h", cTopic = PREFIX + code + "/c";
  const will = { topic: hTopic, payload: JSON.stringify({ t: "hostGone" }), qos: 0, retain: false };
  const clients = [];
  const attempts = brokers().map(url => connect(url, { will }).then(c => {
    clients.push(c);
    c.subscribe(cTopic, { qos: 1 });
    c.on("message", (topic, payload) => { const m = parse(payload); if (m) onMessage(m); });
    c.on("offline", () => update());
    c.on("connect", () => { update(); onMessage({ t: "_reconnected" }); });
    return c;
  }).catch(() => null));
  const update = () => onStatus(clients.some(c => c.connected) ? null : "Reconnecting to the internet…");

  // resolve as soon as the first broker is up; the others keep joining in the background
  await new Promise((resolve, reject) => {
    let left = attempts.length;
    attempts.forEach(p => p.then(c => {
      if (c) resolve();
      else if (--left === 0) reject(new Error("Could not reach any game server. Check the internet connection."));
    }));
  });

  return {
    code,
    send(msg) {
      const s = JSON.stringify(msg);
      clients.forEach(c => c.connected && c.publish(hTopic, s, { qos: 1 }));
    },
    close() {
      clients.forEach(c => { try { c.publish(hTopic, JSON.stringify({ t: "hostGone" }), { qos: 0 }); c.end(); } catch (e) { /* ignore */ } });
    },
  };
}

/**
 * Join a room. Sends `hello` and waits for the host to answer, trying each broker in turn.
 * onMessage(msg) receives host messages addressed to everyone or to this player.
 */
export async function joinRoom(code, hello, { onMessage, onStatus }) {
  const hTopic = PREFIX + code + "/h", cTopic = PREFIX + code + "/c";
  const cid = hello.cid;
  const will = { topic: cTopic, payload: JSON.stringify({ t: "bye", cid }), qos: 0, retain: false };
  let lastErr = "Room not found. Check the code and that the host's screen is open.";
  for (const url of brokers()) {
    let c;
    try { c = await connect(url, { will }); } catch (e) { lastErr = "Could not reach the game server. Check the internet connection."; continue; }
    let answered = false;
    const buffer = [];
    let deliver = m => buffer.push(m);
    c.on("message", (topic, payload) => {
      const m = parse(payload);
      if (!m || (m.to && m.to !== cid)) return;
      if (m.t === "lobby" || m.t === "welcome" || m.t === "full" || m.t === "state") answered = true;
      deliver(m);
    });
    await new Promise(r => c.subscribe(hTopic, { qos: 1 }, r));
    const sendHello = () => c.publish(cTopic, JSON.stringify({ t: "hello", ...hello }), { qos: 1 });
    sendHello();
    for (let k = 0; k < 20 && !answered; k++) {
      await new Promise(r => setTimeout(r, 250));
      if (k === 8) sendHello();
    }
    if (!answered) { c.end(true); continue; }

    c.on("offline", () => onStatus("Reconnecting…"));
    c.on("connect", () => { onStatus(null); sendHello(); });
    // hand over what already arrived once the caller has the room object
    setTimeout(() => { buffer.splice(0).forEach(m => onMessage(m)); deliver = onMessage; }, 0);
    return {
      code,
      send(msg) { c.publish(cTopic, JSON.stringify({ ...msg, cid }), { qos: 1 }); },
      close() { try { c.publish(cTopic, JSON.stringify({ t: "bye", cid }), { qos: 0 }); c.end(); } catch (e) { /* ignore */ } },
    };
  }
  throw new Error(lastErr);
}
