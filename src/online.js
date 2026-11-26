/* Rizolopy online lobby: host a room or join one with a 4-letter code, pick a character, start. */
import qrcode from "qrcode-generator";
import { CHARACTERS } from "./data.js";
import { portrait } from "./art.js";
import { hostRoom, joinRoom, makeRoomCode, cleanCode, myClientId } from "./net.js";

const PROFILE_KEY = "rizolopy-online-profile";
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = (sel, root = document) => root.querySelector(sel);
const charById = id => CHARACTERS.find(c => c.id === id);
const MAX_PLAYERS = 6;

/**
 * api (from game.js):
 *   showScreen(id)
 *   hostStart(room, players[{cid,name,char}], maxRounds, hostCid)  -> starts the game as host
 *   hostResume(room, hostCid)                                       -> continue a saved online game
 *   guestStart(room, cid)                                           -> become a guest; game state follows
 *   gameMessage(msg)                                                -> host or guest in-game messages
 *   toast(text)
 */
export function initOnline(api) {
  const cid = myClientId();
  let profile = { name: "", char: CHARACTERS[0].id };
  try { Object.assign(profile, JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}); } catch (e) { /* none */ }
  const saveProfile = () => { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (e) { /* ignore */ } };

  let view = "menu";        // menu | connecting | hostLobby | guestLobby
  let room = null;
  let role = null;          // host | guest
  let inGame = false;
  let lobby = { players: [], maxRounds: 20 };
  let hostPlays = true;
  let joinCode = "";
  let error = "";
  let status = null;

  const el = () => $("#onlineBody");

  /* ---------------- rendering ---------------- */
  function render() {
    if (view === "menu") renderMenu();
    else if (view === "connecting") el().innerHTML = `<div class="ol-connecting"><div class="ol-spinner"></div><p>${esc(status || "Connecting…")}</p></div>`;
    else renderLobby();
  }

  function charPicker(selected, taken) {
    return `<div class="slot-chars">${CHARACTERS.map(ch => `<button class="mini-char ${ch.id === selected ? "on" : ""}" style="background:${ch.color}"
      title="${esc(ch.name)}" data-olchar="${ch.id}" ${taken.has(ch.id) ? "disabled" : ""}>${portrait(ch)}</button>`).join("")}</div>
      <div class="chosen">${esc(charById(selected).name)} · ${esc(charById(selected).kind)}</div>`;
  }

  function renderMenu() {
    el().innerHTML = `
      <div class="slot ol-me">
        <div class="slot-top">
          <div class="avatar" style="background:${charById(profile.char).color};width:44px;height:44px;margin:0;border-width:2px">${portrait(charById(profile.char))}</div>
          <input type="text" id="olName" maxlength="16" placeholder="Your name" value="${esc(profile.name)}" aria-label="Your name">
        </div>
        ${charPicker(profile.char, new Set())}
      </div>
      <div class="ol-split">
        <div class="ol-box">
          <h3>Join a room</h3>
          <p class="muted">Type the 4-letter code on the host's screen.</p>
          <input type="text" id="olCode" class="ol-code-input" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="ABCD" value="${esc(joinCode)}" aria-label="Room code">
          <button class="btn btn-green big" data-ol="join">Join room</button>
        </div>
        <div class="ol-box">
          <h3>Host a room</h3>
          <p class="muted">Get a code to share. Your screen keeps the game going, so keep it open.</p>
          <label class="ol-check"><input type="checkbox" id="olHostPlays" ${hostPlays ? "checked" : ""}> I'm playing too</label>
          <p class="muted ol-small">Untick to use this screen as a shared board on a projector.</p>
          <button class="btn btn-maroon big" data-ol="host">Create room</button>
        </div>
      </div>
      <p class="error" id="olError">${esc(error)}</p>`;
    $("#olName").addEventListener("input", e => { profile.name = e.target.value; saveProfile(); });
    $("#olCode").addEventListener("input", e => { joinCode = cleanCode(e.target.value); e.target.value = joinCode; });
    $("#olCode").addEventListener("keydown", e => { if (e.key === "Enter") join(); });
    $("#olHostPlays").addEventListener("change", e => { hostPlays = e.target.checked; });
  }

  function joinUrl(code) {
    if (!/^https?:$/.test(location.protocol)) return null;
    const u = new URL(location.href);
    u.hash = "";
    const keep = u.searchParams.get("broker");
    u.search = "";
    if (keep) u.searchParams.set("broker", keep);
    u.searchParams.set("room", code);
    return u.toString();
  }

  function qrSvg(text) {
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  }

  function renderLobby() {
    const isHost = role === "host";
    const me = lobby.players.find(p => p.cid === cid);
    const taken = new Set(lobby.players.filter(p => p.cid !== cid).map(p => p.char));
    const url = joinUrl(room.code);
    const enough = lobby.players.length >= 2;
    el().innerHTML = `
      <div class="ol-lobby">
        <div class="ol-codebox">
          <div class="ol-code-label">Room code</div>
          <div class="ol-code" id="olRoomCode">${esc(room.code)}</div>
          ${isHost && url ? `<div class="ol-qr">${qrSvg(url)}</div><div class="ol-link">${esc(url)}</div>` : ""}
          ${isHost ? `<p class="muted ol-small">Players open Rizolopy, tap <b>Play Online</b> and type this code${url ? ", or scan the QR code" : ""}.</p>` : ""}
        </div>
        <div class="ol-players">
          <h3>Players <span class="muted">${lobby.players.length} of ${MAX_PLAYERS}</span></h3>
          <ul class="ol-list">${lobby.players.map(p => {
            const c = charById(p.char);
            return `<li class="${p.cid === cid ? "me" : ""}"><div class="avatar" style="background:${c.color}">${portrait(c)}</div>
              <div><b>${esc(p.name)}</b>${p.host ? ` <span class="tag">Host</span>` : ""}${p.cid === cid ? ` <span class="tag">You</span>` : ""}
              <div class="muted ol-small">${esc(c.name)}</div></div></li>`;
          }).join("") || `<li class="muted">Waiting for players to join…</li>`}</ul>
          ${isHost ? `
            <div class="setup-row"><label>Game length</label><div class="seg" id="olRounds">${[[10, "Short · 10"], [20, "Normal · 20"], [0, "No limit"]]
              .map(([n, l]) => `<button class="${n === lobby.maxRounds ? "on" : ""}" data-olr="${n}">${l}</button>`).join("")}</div></div>
            <button class="btn btn-maroon big" data-ol="start" ${enough ? "" : "disabled"}>${enough ? `Start game with ${lobby.players.length} players` : "Waiting for at least 2 players"}</button>`
            : `<p class="ol-waiting">⏳ Waiting for the host to start the game…</p>`}
        </div>
      </div>
      ${me ? `<div class="slot ol-me"><b>Your character</b>${charPicker(me.char, taken)}</div>` : ""}
      ${status ? `<p class="error">${esc(status)}</p>` : ""}
      <button class="btn btn-link" data-ol="leave">Leave room</button>`;
  }

  /* ---------------- host ---------------- */
  function hostLobbyBroadcast() {
    room.send({ t: "lobby", players: lobby.players, maxRounds: lobby.maxRounds });
    if (view === "hostLobby") render();
  }

  function freeChar(want, exceptCid) {
    const used = new Set(lobby.players.filter(p => p.cid !== exceptCid).map(p => p.char));
    if (want && !used.has(want) && charById(want)) return want;
    return CHARACTERS.find(c => !used.has(c.id)).id;
  }

  function hostOnMessage(m) {
    if (inGame) { api.gameMessage(m); return; }
    if (m.t === "hello") {
      const name = String(m.name || "Player").slice(0, 16);
      let p = lobby.players.find(q => q.cid === m.cid);
      if (!p) {
        if (lobby.players.length >= MAX_PLAYERS) { room.send({ t: "full", to: m.cid }); return; }
        let nm = name, k = 2;
        while (lobby.players.some(q => q.name.toLowerCase() === nm.toLowerCase())) nm = `${name} ${k++}`;
        p = { cid: m.cid, name: nm, char: freeChar(m.char, m.cid) };
        lobby.players.push(p);
        api.toast(`${p.name} joined`);
      }
      hostLobbyBroadcast();
    } else if (m.t === "pick") {
      const p = lobby.players.find(q => q.cid === m.cid);
      if (p) { p.char = freeChar(m.char, m.cid); hostLobbyBroadcast(); }
    } else if (m.t === "bye") {
      const p = lobby.players.find(q => q.cid === m.cid);
      if (p && !p.host) { lobby.players = lobby.players.filter(q => q !== p); api.toast(`${p.name} left`); hostLobbyBroadcast(); }
    } else if (m.t === "_reconnected") {
      hostLobbyBroadcast();
    }
  }

  async function host() {
    if (!readName()) return;
    role = "host"; view = "connecting"; status = "Creating a room…"; render();
    const code = makeRoomCode();
    try {
      room = await hostRoom(code, { onMessage: hostOnMessage, onStatus: s => { status = s; if (!inGame && view !== "connecting") render(); } });
    } catch (e) {
      view = "menu"; error = e.message; role = null; render(); return;
    }
    status = null;
    lobby = { players: hostPlays ? [{ cid, name: profile.name.trim(), char: profile.char, host: true }] : [], maxRounds: lobby.maxRounds };
    view = "hostLobby";
    hostLobbyBroadcast();
  }

  /** Re-open the room for a saved online game, under the same code, so guests can rejoin. */
  async function resumeHost(code) {
    role = "host"; view = "connecting"; status = `Re-opening room ${code}…`;
    api.showScreen("online"); render();
    try {
      room = await hostRoom(code, { onMessage: hostOnMessage, onStatus: s => { status = s; } });
    } catch (e) {
      view = "menu"; error = e.message; role = null; render(); return;
    }
    status = null; inGame = true;
    api.hostResume(room, cid);
  }

  function startGame() {
    if (lobby.players.length < 2) return;
    inGame = true;
    api.hostStart(room, lobby.players.map(p => ({ cid: p.cid, name: p.name, char: p.char })), lobby.maxRounds, cid);
  }

  /* ---------------- guest ---------------- */
  function guestOnMessage(m) {
    if (inGame) { api.gameMessage(m); return; }
    if (m.t === "lobby") {
      lobby = { players: m.players, maxRounds: m.maxRounds };
      const me = lobby.players.find(p => p.cid === cid);
      if (me) { profile.char = me.char; saveProfile(); }
      status = null;
      view = "guestLobby"; render();
    } else if (m.t === "full") {
      leave(); error = "That room is full (6 players)."; render();
    } else if (m.t === "hostGone") {
      status = "The host disconnected. Waiting for them to come back…"; render();
    } else if (m.t === "state" || m.t === "start") {
      // game started (or we joined a game already in progress)
      inGame = true;
      api.guestStart(room, cid);
      if (m.t === "state") api.gameMessage(m);
    }
  }

  async function join(codeArg) {
    if (!readName()) return;
    const code = cleanCode(codeArg || joinCode);
    if (code.length !== 4) { error = "Room codes have 4 letters."; render(); return; }
    joinCode = code;
    role = "guest"; view = "connecting"; status = `Looking for room ${code}…`; render();
    try {
      room = await joinRoom(code, { cid, name: profile.name.trim(), char: profile.char }, {
        onMessage: guestOnMessage,
        onStatus: s => { status = s; if (!inGame) render(); else api.gameMessage({ t: "_status", text: s }); },
      });
    } catch (e) {
      role = null; view = "menu"; error = e.message; render(); return;
    }
    if (view === "connecting") { view = "guestLobby"; status = null; render(); }
  }

  function readName() {
    const n = ($("#olName")?.value ?? profile.name).trim();
    if (!n) { error = "Type your name first."; render(); $("#olName")?.focus(); return false; }
    profile.name = n; saveProfile(); error = "";
    return true;
  }

  function leave() {
    if (room) room.close();
    room = null; role = null; inGame = false; view = "menu"; status = null; lobby = { players: [], maxRounds: lobby.maxRounds };
  }

  /* ---------------- wiring ---------------- */
  document.addEventListener("click", e => {
    if (!$("#online").classList.contains("active")) return;
    const ch = e.target.closest("[data-olchar]");
    if (ch && !ch.disabled) {
      const id = ch.dataset.olchar;
      if (view === "menu") { profile.char = id; saveProfile(); render(); }
      else if (role === "guest") { room.send({ t: "pick", char: id }); }
      else if (role === "host") { const me = lobby.players.find(p => p.cid === cid); if (me) { me.char = freeChar(id, cid); profile.char = me.char; saveProfile(); hostLobbyBroadcast(); } }
      return;
    }
    const r = e.target.closest("[data-olr]");
    if (r) { lobby.maxRounds = Number(r.dataset.olr); hostLobbyBroadcast(); return; }
    const b = e.target.closest("[data-ol]");
    if (!b) return;
    const act = b.dataset.ol;
    if (act === "host") host();
    else if (act === "join") join();
    else if (act === "start") startGame();
    else if (act === "leave") { leave(); render(); }
  });

  // a join link (?room=ABCD) opens straight to the join form
  let linkCode = "";
  try { linkCode = cleanCode(new URLSearchParams(location.search).get("room")); } catch (e) { /* ignore */ }
  if (linkCode.length === 4) joinCode = linkCode;

  return {
    open() { if (!room) { view = "menu"; error = ""; } api.showScreen("online"); render(); },
    openFromLink() { if (joinCode.length === 4) { api.showScreen("online"); view = "menu"; render(); $("#olName")?.focus(); return true; } return false; },
    resumeHost,
    /** called by game.js when the player leaves an online game */
    left() { leave(); },
    get active() { return !!room; },
  };
}
