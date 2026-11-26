/* Rizolopy in-game chat for online games.
 *
 * Each message pops up as a speech bubble over the player's token on the board
 * and on their card in the player list, then fades. A small chat button opens
 * the log, quick-chat buttons and the settings (hide bubbles, mute a player,
 * and for the host: turn chat off for everyone). Messages go through the host,
 * which filters them, so every screen shows the same clean text.
 */
import { CHARACTERS } from "./data.js";
import { cleanChat } from "./filter.js";
import "./chat.css";

export const CHAT_MAX = 80;
export const QUICK_CHAT = [
  "Nice roll! 🎲", "Salamat! 🙏", "Galing! 👏", "Ay naku! 😅", "Sayang! 😩",
  "Your turn na! ⏳", "Good luck! 🍀", "Hala! 😱", "Mabuhay! 🇵🇭", "GG! 🤝",
];
const COOLDOWN = 1200;           // ms between my own messages
const HIDE_KEY = "rizolopy-chat-hidden";

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = (sel, root = document) => root.querySelector(sel);
const charById = id => CHARACTERS.find(c => c.id === id);

/** Host-side checks for a message from a guest: filter it and limit how fast one player can post. */
export function makeChatGate() {
  const recent = new Map(); // cid -> timestamps
  return function gate(cid, raw) {
    const now = Date.now();
    const times = (recent.get(cid) || []).filter(t => now - t < 10000);
    if (times.length && now - times[times.length - 1] < 700) return null; // too fast
    if (times.length >= 6) return null;                                   // more than 6 in 10 s
    const { text } = cleanChat(raw, CHAT_MAX);
    if (!text) return null;
    times.push(now); recent.set(cid, times);
    return text;
  };
}

/**
 * api:
 *   info() -> { online, isHost, mySeat, chatOff, players: [{ name, char, bankrupt, ai }] }
 *   send(text)            -> deliver my message (guest: to host; host: broadcast)
 *   setChatOff(bool)      -> host only
 *   sayOnBoard(seat, text, color, name)
 *   sound()               -> play the chat blip
 */
export function createChat(api) {
  let hidden = false;
  try { hidden = localStorage.getItem(HIDE_KEY) === "1"; } catch (e) { /* ignore */ }
  const muted = new Set();          // seats I muted
  const live = new Map();           // seat -> { text, until } bubbles showing on player cards
  let log = [];                     // { seat, name, text, char }
  let open = false, settings = false, unread = 0, lastSent = 0;

  const fab = $("#chatFab"), panel = $("#chatPanel");

  function speaker(m, info) {
    const p = m.seat >= 0 ? info.players[m.seat] : null;
    const ch = p ? charById(p.char) : null;
    return { name: p ? p.name : (m.name || "Host"), color: ch ? ch.color : "#6e1a2c" };
  }

  /* ---------- incoming ---------- */
  function receive(m) {
    const info = api.info();
    if (!info.online) return;
    const text = String(m.text || "").slice(0, CHAT_MAX * 2);
    if (!text) return;
    const who = speaker(m, info);
    log.push({ seat: m.seat, name: who.name, color: who.color, text, mine: m.seat === info.mySeat && m.seat >= 0 || (m.seat < 0 && info.isHost && info.mySeat < 0) });
    if (log.length > 100) log = log.slice(-100);
    const quiet = hidden || (m.seat >= 0 && muted.has(m.seat));
    if (!quiet) {
      api.sayOnBoard(m.seat, text, who.color, who.name);
      if (m.seat >= 0) {
        live.set(m.seat, { text, until: Date.now() + Math.min(7000, 3200 + text.length * 55), fresh: true });
        setTimeout(() => sync(), Math.min(7000, 3200 + text.length * 55) + 50);
      }
      if (!(log[log.length - 1].mine)) api.sound();
    }
    if (!open && !quiet && !log[log.length - 1].mine) unread++;
    sync();
    if (open) renderLog();
  }

  /* ---------- rendering ---------- */
  function renderLog() {
    const box = $("#chatLog");
    if (!box) return;
    const items = log.filter(l => !(l.seat >= 0 && muted.has(l.seat)));
    box.innerHTML = items.length ? items.map(l => `<li class="${l.mine ? "mine" : ""}" style="--c:${l.color}"><b>${esc(l.name)}</b> ${esc(l.text)}</li>`).join("")
      : `<li class="muted chat-empty">No messages yet. Say hi! 👋</li>`;
    box.scrollTop = box.scrollHeight;
  }

  function renderPanel() {
    const info = api.info();
    const blocked = info.chatOff && !info.isHost;
    if (settings) {
      panel.innerHTML = `
        <div class="chat-head"><b>Chat settings</b><button class="chat-x" data-chat="back" aria-label="Back to chat">←</button></div>
        <label class="chat-opt"><input type="checkbox" data-chatopt="hide" ${hidden ? "checked" : ""}> Hide all chat bubbles and sounds</label>
        ${info.isHost ? `<label class="chat-opt"><input type="checkbox" data-chatopt="off" ${info.chatOff ? "checked" : ""}> Turn chat off for everyone <span class="muted">(host only)</span></label>` : ""}
        <div class="chat-sub">Mute a player</div>
        <ul class="chat-mutes">${info.players.map((p, i) => i === info.mySeat || p.ai ? "" :
          `<li><label><input type="checkbox" data-chatmute="${i}" ${muted.has(i) ? "checked" : ""}> 🔇 ${esc(p.name)}</label></li>`).join("") || `<li class="muted">No other players.</li>`}</ul>
        <p class="muted chat-note">Bad words are hidden automatically. Messages only last for this game.</p>`;
      return;
    }
    panel.innerHTML = `
      <div class="chat-head"><b>💬 Chat</b>
        <span><button class="chat-x" data-chat="settings" title="Chat settings" aria-label="Chat settings">⚙️</button>
        <button class="chat-x" data-chat="close" title="Close chat" aria-label="Close chat">✕</button></span></div>
      <ul class="chat-log" id="chatLog" aria-live="polite"></ul>
      ${blocked ? `<p class="chat-off">🔕 The host turned chat off for this game.</p>` : `
      <div class="chat-quick">${QUICK_CHAT.map(q => `<button data-chatq="${esc(q)}">${esc(q)}</button>`).join("")}</div>
      <form class="chat-form" id="chatForm" autocomplete="off">
        <input id="chatInput" type="text" maxlength="${CHAT_MAX}" placeholder="Type a message…" aria-label="Chat message" enterkeyhint="send">
        <button class="btn btn-maroon" type="submit">Send</button>
      </form>`}
      ${info.chatOff && info.isHost ? `<p class="chat-off">🔕 Chat is off for players. Only you can post.</p>` : ""}`;
    renderLog();
  }

  /** keep the button, panel and player-card bubbles in step with the game (called on every refresh) */
  function sync() {
    const info = api.info();
    const show = info.online;
    fab.classList.toggle("hidden", !show);
    if (!show) { panel.classList.add("hidden"); open = false; }
    fab.innerHTML = `${hidden ? "🔕" : "💬"}${unread ? `<span class="chat-badge">${unread > 9 ? "9+" : unread}</span>` : ""}`;
    fab.title = hidden ? "Chat (bubbles hidden)" : "Chat";
    // bubbles on the player cards in the sidebar
    const now = Date.now();
    document.querySelectorAll("#playerList .p-bubble").forEach(b => b.remove());
    if (!show || hidden) return;
    live.forEach((v, seat) => {
      if (v.until < now || muted.has(seat)) { live.delete(seat); return; }
      const row = $(`#playerList [data-prow="${seat}"]`);
      if (!row) return;
      const b = document.createElement("div");
      b.className = "p-bubble" + (v.fresh ? " pop" : "");
      b.textContent = v.text;
      row.appendChild(b);
      v.fresh = false;
    });
  }

  function setOpen(v) {
    open = v;
    if (open) { unread = 0; settings = false; renderPanel(); }
    panel.classList.toggle("hidden", !open);
    sync();
    if (open && window.matchMedia("(pointer: fine)").matches) $("#chatInput")?.focus();
  }

  function sendText(raw) {
    const info = api.info();
    if (!info.online || (info.chatOff && !info.isHost)) return;
    const { text } = cleanChat(raw, CHAT_MAX);
    if (!text) return;
    const now = Date.now();
    if (now - lastSent < COOLDOWN) return;
    lastSent = now;
    api.send(text);
  }

  /* ---------- wiring ---------- */
  fab.addEventListener("click", () => setOpen(!open));
  panel.addEventListener("click", e => {
    const q = e.target.closest("[data-chatq]");
    if (q) { sendText(q.dataset.chatq); return; }
    const b = e.target.closest("[data-chat]");
    if (!b) return;
    const a = b.dataset.chat;
    if (a === "close") setOpen(false);
    else if (a === "settings") { settings = true; renderPanel(); }
    else if (a === "back") { settings = false; renderPanel(); }
  });
  panel.addEventListener("change", e => {
    const t = e.target;
    if (t.dataset.chatopt === "hide") {
      hidden = t.checked;
      try { localStorage.setItem(HIDE_KEY, hidden ? "1" : "0"); } catch (err) { /* ignore */ }
      sync();
    } else if (t.dataset.chatopt === "off") {
      api.setChatOff(t.checked);
    } else if (t.dataset.chatmute !== undefined) {
      const seat = Number(t.dataset.chatmute);
      if (t.checked) muted.add(seat); else muted.delete(seat);
      sync();
    }
  });
  panel.addEventListener("submit", e => {
    e.preventDefault();
    const input = $("#chatInput");
    if (!input || !input.value.trim()) return;
    if (Date.now() - lastSent < COOLDOWN) { input.classList.add("shake"); setTimeout(() => input.classList.remove("shake"), 400); return; }
    sendText(input.value);
    input.value = "";
  });
  // "T" opens chat, Escape closes it
  document.addEventListener("keydown", e => {
    if (!api.info().online || !$("#game").classList.contains("active")) return;
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      if (e.key === "Escape" && e.target.id === "chatInput") setOpen(false);
      return;
    }
    if (!$("#modal").classList.contains("hidden")) return;
    if ((e.key === "t" || e.key === "T") && !open) { e.preventDefault(); setOpen(true); }
  });

  return {
    receive,
    sync,
    /** the host changed the chat-off setting, or new state arrived */
    refreshPanel() { if (open) renderPanel(); },
    reset() { log = []; live.clear(); muted.clear(); unread = 0; open = false; settings = false; panel.classList.add("hidden"); sync(); },
    get open() { return open; },
  };
}
