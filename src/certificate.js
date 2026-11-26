/* Rizolopy completion certificates.
 *
 * Finishing a game (reaching the winner screen, not quitting) earns every person on that
 * screen a certificate: all human seats on a shared device, or your own seat in an online
 * game. Certificates are kept in this browser's localStorage, which also drives the
 * "Completed" badge on the home screen.
 *
 * The certificate is drawn on a canvas, so the same picture is shown on screen, printed
 * and downloaded as a PNG.
 */
import { CHARACTERS } from "./data.js";
import { portraitUrl } from "./art.js";
import "./certificate.css";

const KEY = "rizolopy-certificates";
const MAX_KEPT = 40;
const W = 1600, H = 1131; // A4 landscape proportions

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = (sel, root = document) => root.querySelector(sel);
const peso = n => "₱" + Math.round(n).toLocaleString("en-PH");
const charById = id => CHARACTERS.find(c => c.id === id) || CHARACTERS[0];

export function newStats() {
  return { quizAsked: 0, quizRight: 0, rentPaid: 0, rentEarned: 0, bought: 0, landmarks: 0, cards: 0 };
}

function load() {
  try { const a = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(a) ? a : []; } catch (e) { return []; }
}
function store(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_KEPT))); } catch (e) { /* storage unavailable */ }
}

export function ordinal(n) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function resultLine(r) {
  if (r.place === 1) return `Winner of a ${r.of}-player game`;
  if (r.bankrupt) return `Went bankrupt and finished ${ordinal(r.place)} of ${r.of}`;
  return `Finished ${ordinal(r.place)} of ${r.of} players`;
}
function modeLine(r) {
  return r.mode === "online" ? "in an online game" : r.mode === "cpu" ? "against computer players" : "on one shared device";
}
function dateText(ts) {
  return new Date(ts).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}
function certNo(r) {
  return ("RZ-" + String(r.gameId).slice(-6) + "-" + (r.seat + 1)).toUpperCase();
}

/* ---------------- drawing ---------------- */
const loadImg = src => new Promise(res => {
  if (!src) { res(null); return; }
  const im = new Image();
  im.onload = () => res(im);
  im.onerror = () => res(null);
  im.src = src;
});

function fitText(ctx, text, font, size, maxW) {
  let s = size;
  ctx.font = font.replace("{s}", s);
  while (ctx.measureText(text).width > maxW && s > 18) { s -= 2; ctx.font = font.replace("{s}", s); }
  return s;
}

function diamond(ctx, x, y, r, fill) {
  ctx.save(); ctx.fillStyle = fill; ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); ctx.fill(); ctx.restore();
}

function corner(ctx, x, y, sx, sy) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(sx, sy);
  ctx.strokeStyle = "#b8913a"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 90); ctx.quadraticCurveTo(0, 0, 90, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(18, 110); ctx.quadraticCurveTo(18, 18, 110, 18); ctx.stroke();
  diamond(ctx, 30, 30, 11, "#6e1a2c");
  diamond(ctx, 62, 12, 5, "#b8913a"); diamond(ctx, 12, 62, 5, "#b8913a");
  ctx.restore();
}

function seal(ctx, x, y, r, top, big, bottom) {
  ctx.save();
  // rosette
  ctx.fillStyle = "#b8913a";
  ctx.beginPath();
  const n = 28;
  for (let k = 0; k <= n * 2; k++) {
    const a = (k / (n * 2)) * Math.PI * 2, rr = k % 2 ? r : r * 0.9;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.fill();
  // ribbons
  ctx.fillStyle = "#6e1a2c";
  [[-1, 1], [1, 1]].forEach(([d]) => {
    ctx.beginPath();
    ctx.moveTo(x + d * r * 0.25, y + r * 0.6); ctx.lineTo(x + d * r * 0.75, y + r * 1.3);
    ctx.lineTo(x + d * r * 0.5, y + r * 1.17); ctx.lineTo(x + d * r * 0.35, y + r * 1.37);
    ctx.lineTo(x - d * r * 0.05, y + r * 0.7); ctx.closePath(); ctx.fill();
  });
  // re-draw the rosette over the ribbon tops
  ctx.fillStyle = "#b8913a";
  ctx.beginPath(); ctx.arc(x, y, r * 0.86, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#d9bf7a"; ctx.beginPath(); ctx.arc(x, y, r * 0.76, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#94732a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r * 0.68, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "#521221"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.round(r * 0.17)}px Lato, sans-serif`;
  ctx.fillText(top, x, y - r * 0.38);
  ctx.font = `900 ${Math.round(r * (big.length > 4 ? 0.36 : 0.5))}px "Playfair Display", Georgia, serif`;
  ctx.fillText(big, x, y + r * 0.04);
  ctx.font = `900 ${Math.round(r * 0.15)}px Lato, sans-serif`;
  ctx.fillText(bottom, x, y + r * 0.42);
  ctx.restore();
}

export async function drawCertificate(r) {
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  const ch = charById(r.char);
  const st = { ...newStats(), ...(r.stats || {}) };

  // paper
  const g = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.7);
  g.addColorStop(0, "#fbf3e0"); g.addColorStop(1, "#ecd9ae");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // faint watermark
  ctx.save(); ctx.globalAlpha = 0.05; ctx.fillStyle = "#6e1a2c"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = '400 430px "Noto Sans Tagalog", serif'; ctx.fillText("ᜇᜒᜐᜎ᜔", W / 2, H / 2 + 40); ctx.restore();
  // borders
  ctx.strokeStyle = "#6e1a2c"; ctx.lineWidth = 16; ctx.strokeRect(30, 30, W - 60, H - 60);
  ctx.strokeStyle = "#b8913a"; ctx.lineWidth = 3; ctx.strokeRect(54, 54, W - 108, H - 108);
  ctx.lineWidth = 1.5; ctx.strokeRect(64, 64, W - 128, H - 128);
  corner(ctx, 76, 76, 1, 1); corner(ctx, W - 76, 76, -1, 1); corner(ctx, 76, H - 76, 1, -1); corner(ctx, W - 76, H - 76, -1, -1);

  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  // header
  ctx.fillStyle = "#b8913a"; ctx.font = '900 30px Lato, sans-serif';
  ctx.save(); if ("letterSpacing" in ctx) ctx.letterSpacing = "14px";
  ctx.fillText("RIZOLOPY", W / 2 + 7, 160); ctx.restore();
  ctx.fillStyle = "#6e1a2c"; ctx.font = '900 92px "Playfair Display", Georgia, serif';
  ctx.fillText("Certificate of Completion", W / 2, 262);
  // divider
  ctx.strokeStyle = "#b8913a"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W / 2 - 300, 300); ctx.lineTo(W / 2 - 24, 300); ctx.moveTo(W / 2 + 24, 300); ctx.lineTo(W / 2 + 300, 300); ctx.stroke();
  diamond(ctx, W / 2, 300, 10, "#6e1a2c");

  ctx.fillStyle = "#6b5a45"; ctx.font = 'italic 400 34px "Playfair Display", Georgia, serif';
  ctx.fillText("This certifies that", W / 2, 370);

  // name with portrait medallion
  const size = fitText(ctx, r.name, 'italic 600 {s}px "Playfair Display", Georgia, serif', 100, 900);
  const nameW = ctx.measureText(r.name).width;
  ctx.fillStyle = "#2b1d14"; ctx.fillText(r.name, W / 2, 470);
  ctx.strokeStyle = "#b8913a"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(W / 2 - Math.max(320, nameW / 2 + 40), 496); ctx.lineTo(W / 2 + Math.max(320, nameW / 2 + 40), 496); ctx.stroke();
  const img = await loadImg(portraitUrl(r.char));
  const mx = W / 2 - Math.max(320, nameW / 2 + 40) - 80, my = 452 - size * 0.25;
  ctx.save();
  ctx.fillStyle = ch.color; ctx.beginPath(); ctx.arc(mx, my, 62, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#b8913a"; ctx.lineWidth = 6; ctx.stroke();
  if (img) { ctx.beginPath(); ctx.arc(mx, my, 58, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(img, mx - 58, my - 58, 116, 116); }
  ctx.restore();

  // body text
  ctx.fillStyle = "#2b1d14";
  [`playing as ${ch.name} (${ch.kind}),`, `completed a full game of Rizolopy ${modeLine(r)},`,
    "following José Rizal's journey from Calamba to Bagumbayan."].forEach((line, k) => {
    fitText(ctx, line, '400 {s}px Lato, sans-serif', 32, 1200);
    ctx.fillText(line, W / 2, 556 + k * 42);
  });
  ctx.fillStyle = "#6e1a2c"; fitText(ctx, resultLine(r), '900 {s}px "Playfair Display", Georgia, serif', 44, 1200);
  ctx.fillText(resultLine(r), W / 2, 704);

  // stats row
  const stats = [
    ["Net worth", peso(r.worth)],
    ["Places owned", String(r.places)],
    ["Landmarks built", String(st.landmarks || r.landmarks || 0)],
    ["Quiz answers", st.quizAsked ? `${st.quizRight} of ${st.quizAsked}` : "None"],
    ["Rent collected", peso(st.rentEarned)],
    ["Rounds played", String(r.rounds)],
  ];
  const bw = 196, gap = 18, total = stats.length * bw + (stats.length - 1) * gap;
  let x0 = W / 2 - total / 2;
  stats.forEach(([label, val]) => {
    ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.strokeStyle = "#d9bf7a"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x0, 740, bw, 112, 14) : ctx.rect(x0, 740, bw, 112); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#2b1d14"; fitText(ctx, val, '900 {s}px "Playfair Display", Georgia, serif', 40, bw - 20);
    ctx.fillText(val, x0 + bw / 2, 802);
    ctx.fillStyle = "#6b5a45"; ctx.font = '700 19px Lato, sans-serif';
    ctx.fillText(label.toUpperCase(), x0 + bw / 2, 834);
    x0 += bw + gap;
  });

  // footer: date, certificate number, seal
  const fy = 985;
  ctx.strokeStyle = "#2b1d14"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(220, fy); ctx.lineTo(600, fy); ctx.stroke();
  ctx.fillStyle = "#2b1d14"; ctx.font = '700 30px "Playfair Display", Georgia, serif';
  ctx.fillText(dateText(r.date), 410, fy - 14);
  ctx.fillStyle = "#6b5a45"; ctx.font = '700 19px Lato, sans-serif';
  ctx.fillText("DATE COMPLETED", 410, fy + 30);

  ctx.font = '400 20px Lato, sans-serif';
  ctx.fillText(`Certificate no. ${certNo(r)}`, W / 2, fy + 30);
  if (r.place !== 1 && r.winner) { ctx.font = 'italic 400 22px "Playfair Display", Georgia, serif'; ctx.fillText(`Game won by ${r.winner}`, W / 2, fy - 14); }

  const sealBig = r.place === 1 ? "1st" : ordinal(r.place);
  seal(ctx, W - 330, fy - 38, 86, "RIZOLOPY", sealBig, r.place === 1 ? "WINNER" : "COMPLETED");

  return cv;
}

/* ---------------- screen ---------------- */
/**
 * api: { showScreen(id), back() -> called by "Back" (returns to the board or home) , hasBoard() }
 */
export function initCertificates(api) {
  let shown = [];     // records on the tabs
  let current = 0;
  let canvas = null;
  let fromGame = false;

  const all = () => load();

  function record(r) {
    const list = load();
    const k = list.findIndex(x => x.gameId === r.gameId && x.seat === r.seat);
    if (k >= 0) return list[k];
    const rec = { ...r, earnedAt: Date.now() };
    list.unshift(rec);
    store(list);
    renderBadge();
    return rec;
  }

  async function draw() {
    const r = shown[current];
    $("#certTabs").innerHTML = shown.length > 1 ? shown.map((x, i) => `<button class="cert-tab ${i === current ? "on" : ""}" data-certtab="${i}">
        <b>${esc(x.name)}</b><span>${esc(new Date(x.date).toLocaleDateString("en-PH", { month: "short", day: "numeric" }))} · ${esc(x.place === 1 ? "Winner" : ordinal(x.place))}</span></button>`).join("") : "";
    $("#certImg").removeAttribute("src");
    $("#certImg").alt = `Certificate of completion for ${r.name}`;
    $("#certLoading").classList.remove("hidden");
    canvas = await drawCertificate(r);
    if (shown[current] !== r) return;
    $("#certImg").src = canvas.toDataURL("image/png");
    $("#certLoading").classList.add("hidden");
    $("#certTitle").textContent = shown.length > 1 ? "Your certificates" : `Well played, ${r.name}!`;
  }

  function open(records, opts = {}) {
    if (!records.length) return false;
    shown = records; current = 0; fromGame = !!opts.fromGame;
    $("#certBack").textContent = fromGame ? "← Back to the board" : "← Home";
    api.showScreen("certificate");
    draw();
    return true;
  }

  function download() {
    if (!canvas) return;
    const r = shown[current];
    const a = document.createElement("a");
    a.download = `Rizolopy-certificate-${r.name.replace(/[^\w-]+/g, "-")}.png`;
    a.href = canvas.toDataURL("image/png");
    document.body.appendChild(a); a.click(); a.remove();
  }

  function renderBadge() {
    const list = load();
    const el = $("#completedBadge");
    if (!el) return;
    el.classList.toggle("hidden", list.length === 0);
    if (!list.length) return;
    const wins = list.filter(r => r.place === 1).length;
    const games = new Set(list.map(r => r.gameId)).size;
    el.innerHTML = `<div class="cb-seal"><span>✓</span></div>
      <div class="cb-text"><b>Completed</b><span>${games} game${games === 1 ? "" : "s"} finished on this device${wins ? ` · ${wins} win${wins === 1 ? "" : "s"}` : ""}</span></div>
      <span class="cb-link">View certificates →</span>`;
  }

  document.addEventListener("click", e => {
    if (e.target.closest("#completedBadge")) { open(all()); return; }
    const t = e.target.closest("[data-certtab]");
    if (t) { current = Number(t.dataset.certtab); draw(); return; }
    const b = e.target.closest("[data-cert]");
    if (!b) return;
    const act = b.dataset.cert;
    if (act === "print") window.print();
    else if (act === "download") download();
    else if (act === "back") { if (fromGame && api.hasBoard()) api.back(); else api.showScreen("landing"); }
  });

  renderBadge();

  return {
    record,
    open,
    forGame: id => load().filter(r => r.gameId === id).sort((a, b) => a.seat - b.seat),
    all,
    renderBadge,
    showing: () => $("#certificate").classList.contains("active"),
  };
}
