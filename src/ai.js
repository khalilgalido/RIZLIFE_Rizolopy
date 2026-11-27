/* Rizolopy computer opponents.
 *
 * Pure decision functions: they read the game state and return a choice,
 * and never change the state themselves. game.js asks them what to do and
 * plays the move with the normal animations, so humans can follow along.
 *
 * Levels:
 *   easy  - casual player: buys most things it can afford, builds now and then,
 *           answers about half of the quiz questions.
 *   hard  - plans ahead: keeps a cash cushion sized to the rents on the board,
 *           chases and blocks colour groups, builds evenly, picks when to stay in exile.
 */
import { TILES, RULES, CHARACTERS } from "./data.js";
import "./ai.css";

export const AI_LEVELS = {
  easy: { label: "Easy CPU", short: "Easy", quizAccuracy: 0.55 },
  hard: { label: "Hard CPU", short: "Hard", quizAccuracy: 0.85 },
};

/* Delay multipliers for the "Computer speed" setting. */
export const AI_SPEEDS = {
  relaxed: { label: "Relaxed", mult: 1.6 },
  normal: { label: "Normal", mult: 1 },
  fast: { label: "Fast", mult: 0.45 },
};

/* Base pauses in ms, scaled by the speed setting. */
const PAUSE = { think: 900, modal: 1500, quiz: 1700, build: 800, end: 900, splash: 1600 };
export function pause(G, kind) {
  const s = AI_SPEEDS[G.aiSpeed] || AI_SPEEDS.normal;
  return Math.round(PAUSE[kind] * s.mult);
}

export function isAI(player) { return !!(player && player.ai && AI_LEVELS[player.ai]); }

/* ---------- helpers on top of the ctx game.js passes in ----------
 * ctx = { G, rentFor(i), ownsGroup(pi, g), upgradeCost(i), propsOf(pi), groupTiles(g) } */

function opponents(ctx, pi) {
  return ctx.G.players.map((p, i) => i).filter(i => i !== pi && !ctx.G.players[i].bankrupt);
}

/** The biggest rents opponents can charge right now. */
function threat(ctx, pi) {
  const rents = [];
  for (const [k, own] of Object.entries(ctx.G.owned)) {
    if (own.owner !== pi && !ctx.G.players[own.owner].bankrupt) rents.push(ctx.rentFor(Number(k)));
  }
  rents.sort((a, b) => b - a);
  return { max: rents[0] || 0, top3: rents.slice(0, 3).reduce((a, b) => a + b, 0) / 3 };
}

/** Cash a hard CPU tries to keep in hand after spending. */
function reserve(ctx, pi) {
  const t = threat(ctx, pi);
  const early = ctx.G.round <= 3;
  const base = early ? 60 : 120;
  return Math.min(450, Math.max(base, Math.round(t.max * 0.6 + t.top3 * 0.3)));
}

function groupStatus(ctx, pi, group) {
  const tiles = ctx.groupTiles(group);
  let mine = 0, free = 0;
  const others = {};
  for (const i of tiles) {
    const own = ctx.G.owned[i];
    if (!own) free++;
    else if (own.owner === pi) mine++;
    else others[own.owner] = (others[own.owner] || 0) + 1;
  }
  return { size: tiles.length, mine, free, others };
}

function roundsLeft(G) { return G.maxRounds ? G.maxRounds - G.round + 1 : 99; }

/* ---------- decisions ---------- */

/** Buy the unowned place at tile i? Returns "buy" or "skip". */
export function decideBuy(ctx, pi, i) {
  const p = ctx.G.players[pi];
  const t = TILES[i];
  if (p.money < t.price) return "skip";
  const after = p.money - t.price;

  if (p.ai === "easy") {
    if (after < 40) return "skip";
    return Math.random() < (after > 300 ? 0.9 : 0.6) ? "buy" : "skip";
  }

  // hard
  const gs = groupStatus(ctx, pi, t.group);
  const completes = gs.mine === gs.size - 1;
  const blocks = Object.values(gs.others).some(n => n === gs.size - 1);
  const contested = Object.keys(gs.others).length > 0;
  let need = reserve(ctx, pi);
  if (completes) need *= 0.35;
  else if (blocks) need *= 0.5;
  else if (gs.mine > 0 && !contested) need *= 0.7;
  else if (contested && gs.mine === 0) need *= 1.15; // a group we can no longer finish
  // net worth counts the full price, so buying late is never a loss
  if (roundsLeft(ctx.G) <= 2) need = Math.min(need, 50);
  return after >= need ? "buy" : "skip";
}

/** What to do at the start of a turn in Dapitan: "pay", "card" or "roll". */
export function decideExile(ctx, pi) {
  const p = ctx.G.players[pi];
  const canPay = p.money >= RULES.exileFee;
  if (p.ai === "easy") {
    if (p.freeExit > 0) return "card";
    return canPay && p.money > 400 ? "pay" : "roll";
  }
  // hard: leave early while there is land to buy, sit tight once the board is dangerous
  const unowned = TILES.filter((t, i) => t.type === "property" && !ctx.G.owned[i]).length;
  const danger = threat(ctx, pi).max;
  const wantOut = unowned >= 5 || danger < 60;
  if (!wantOut) return "roll";
  if (p.freeExit > 0) return "card";
  return canPay && p.money - RULES.exileFee >= 100 ? "pay" : "roll";
}

/** Landmarks to build this turn, in order. Returns tile indices (may repeat). */
export function decideBuilds(ctx, pi) {
  const p = ctx.G.players[pi];
  const mortgagedGroup = g => ctx.groupTiles(g).some(k => ctx.G.owned[k] && ctx.G.owned[k].mortgaged);
  const owned = ctx.propsOf(pi).filter(i => ctx.ownsGroup(pi, TILES[i].group) && !mortgagedGroup(TILES[i].group));
  if (!owned.length) return [];
  const levels = {};
  owned.forEach(i => { levels[i] = ctx.G.owned[i].level; });
  let money = p.money;
  const out = [];

  if (p.ai === "easy") {
    if (Math.random() < 0.5) return [];
    const i = owned.find(k => ctx.canBuildOn(pi, k) && money - ctx.upgradeCost(k) >= 350);
    return i === undefined ? [] : [i];
  }

  // hard: build evenly, best rent gain per Piso first, keep the cushion
  const keep = reserve(ctx, pi);
  const gain = k => {
    const base = Math.round(TILES[k].price / 10);
    const now = levels[k] > 0 ? base * RULES.upgradeMultipliers[levels[k]] : base * RULES.monopolyMultiplier;
    return (base * RULES.upgradeMultipliers[levels[k] + 1] - now) / ctx.upgradeCost(k);
  };
  for (let guard = 0; guard < 30; guard++) {
    const cands = owned.filter(k => levels[k] < RULES.maxUpgrades && money - ctx.upgradeCost(k) >= keep);
    if (!cands.length) break;
    const minLvl = Math.min(...cands.map(k => levels[k]));
    const even = cands.filter(k => levels[k] === minLvl);
    even.sort((a, b) => gain(b) - gain(a));
    const k = even[0];
    money -= ctx.upgradeCost(k);
    levels[k]++;
    out.push(k);
  }
  return out;
}

/** Mortgages to lift this turn: full groups first, while keeping a cushion. */
export function decideLifts(ctx, pi) {
  const p = ctx.G.players[pi];
  const keep = p.ai === "easy" ? 300 : reserve(ctx, pi) + 60;
  const mine = ctx.propsOf(pi).filter(i => ctx.G.owned[i].mortgaged);
  mine.sort((a, b) => (ctx.ownsGroup(pi, TILES[b].group) - ctx.ownsGroup(pi, TILES[a].group)) || TILES[b].price - TILES[a].price);
  let money = p.money;
  const out = [];
  for (const i of mine) {
    if (money - ctx.liftCost(i) < keep) continue;
    money -= ctx.liftCost(i);
    out.push(i);
  }
  return out;
}

/** The most the CPU would pay for tile i at auction. */
function auctionLimit(ctx, pi, i) {
  const p = ctx.G.players[pi];
  const t = TILES[i];
  const gs = groupStatus(ctx, pi, t.group);
  let worth = t.price;
  if (gs.mine === gs.size - 1) worth *= 1.6;                                    // finishes our group
  else if (Object.values(gs.others).some(n => n === gs.size - 1)) worth *= 1.3; // stops someone finishing theirs
  else if (Object.keys(gs.others).length && !gs.mine) worth *= 0.8;
  if (p.ai === "easy") return Math.min(worth * 0.9, p.money - 80);
  if (roundsLeft(ctx.G) <= 2) worth = Math.min(worth, t.price); // late on, only bargains pay off
  return Math.min(worth, p.money - reserve(ctx, pi) * 0.6);
}

/** Auction move: the smallest raise that stays under the CPU's limit, or "pass". */
export function decideBid(ctx, pi, i, bid, options) {
  const limit = auctionLimit(ctx, pi, i);
  const ok = options.filter(v => v <= limit);
  if (!ok.length) return "pass";
  // jump ahead now and then when far below the limit, so auctions don't drag on
  const pick = ok.length > 1 && limit - bid > 150 && Math.random() < 0.5 ? ok[1] : ok[0];
  return String(pick);
}

/** Index of the answer the CPU picks for quiz question q. */
export function decideQuiz(player, q) {
  const acc = (AI_LEVELS[player.ai] || AI_LEVELS.easy).quizAccuracy;
  if (Math.random() < acc) return q.c;
  const wrong = q.a.map((_, k) => k).filter(k => k !== q.c);
  return wrong[Math.floor(Math.random() * wrong.length)];
}

/* ---------- setup screen ---------- */

/** Seat type picker for one player slot on the setup screen. */
export function seatPickerHtml(slot, idx) {
  const opts = [["", "🧑 Human"], ["easy", "🤖 Easy CPU"], ["hard", "🤖 Hard CPU"]];
  return `<div class="seat-type" role="group" aria-label="Player ${idx + 1} type">${opts.map(([v, l]) =>
    `<button type="button" class="${(slot.ai || "") === v ? "on" : ""}" data-seat="${idx}" data-ai="${v}">${l}</button>`).join("")}</div>`;
}

/** Speed picker, shown only when at least one seat is a CPU. */
export function speedPickerHtml(current) {
  return Object.entries(AI_SPEEDS).map(([k, s]) =>
    `<button type="button" class="${k === current ? "on" : ""}" data-aispeed="${k}">${s.label}</button>`).join("");
}

/** Default CPU name for a seat: the character's first name plus a robot badge. */
export function cpuName(charId) {
  const c = CHARACTERS.find(ch => ch.id === charId);
  return c ? c.name.split(" ")[0] + " (CPU)" : "CPU";
}

export function badgeHtml(player) {
  if (!isAI(player)) return "";
  return `<span class="tag ai-tag">🤖 ${AI_LEVELS[player.ai].short}</span>`;
}

