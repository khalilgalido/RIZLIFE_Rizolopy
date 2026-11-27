/* Rizolopy trading: offer checks, moving things between players, and how CPUs judge and make offers.
 *
 * An offer: { from, to, give: [tile], get: [tile], giveMoney, getMoney, giveLetters, getLetters }
 *   from = the player who proposes (always the player whose turn it is), to = the partner.
 *   give / giveMoney / giveLetters go from -> to; get / getMoney / getLetters go to -> from.
 *
 * Like Monopoly, a place can only change hands while its whole colour group has no landmarks.
 * Functions here never touch the DOM. ctx = { G, ownsGroup, groupTiles, propsOf, rentFor }
 */
import { TILES, GROUPS } from "./data.js";

export const MAX_TRADES_PER_TURN = 3;
const LETTER_VALUE = 50; // what a Blumentritt letter is worth to a CPU

/** can this place be traded right now? (owned, and no landmarks anywhere in its group) */
export function tradable(ctx, i) {
  const own = ctx.G.owned[i];
  if (!own) return false;
  return ctx.groupTiles(TILES[i].group).every(k => !ctx.G.owned[k] || ctx.G.owned[k].level === 0);
}

export function tradableOf(ctx, pi) {
  return ctx.propsOf(pi).filter(i => tradable(ctx, i));
}

export function emptyOffer(from, to) {
  return { from, to, give: [], get: [], giveMoney: 0, getMoney: 0, giveLetters: 0, getLetters: 0 };
}

/** tidy an offer that arrived over the network; returns null when it cannot be read */
export function cleanOffer(o) {
  if (!o || typeof o !== "object") return null;
  const tiles = a => Array.isArray(a) ? [...new Set(a.map(Number).filter(n => Number.isInteger(n) && TILES[n] && TILES[n].type === "property"))] : [];
  const num = n => Math.max(0, Math.floor(Number(n) || 0));
  return {
    from: Number(o.from), to: Number(o.to),
    give: tiles(o.give), get: tiles(o.get),
    giveMoney: num(o.giveMoney), getMoney: num(o.getMoney),
    giveLetters: num(o.giveLetters), getLetters: num(o.getLetters),
  };
}

/** returns "" when the offer is fine, otherwise a reason to show */
export function checkOffer(ctx, o) {
  const { G } = ctx;
  const A = G.players[o.from], B = G.players[o.to];
  if (!A || !B || o.from === o.to) return "Pick someone to trade with.";
  if (A.bankrupt || B.bankrupt) return "That player is out of the game.";
  const empty = !o.give.length && !o.get.length && !o.giveMoney && !o.getMoney && !o.giveLetters && !o.getLetters;
  if (empty) return "Add something to the offer first.";
  if (!o.give.length && !o.get.length && !o.giveLetters && !o.getLetters) return "A trade needs a place or a letter in it, not just Piso.";
  for (const i of o.give) {
    if (!G.owned[i] || G.owned[i].owner !== o.from) return `${A.name} no longer owns ${TILES[i].name}.`;
    if (!tradable(ctx, i)) return `Sell the landmarks in ${GROUPS[TILES[i].group].name} before trading ${TILES[i].name}.`;
  }
  for (const i of o.get) {
    if (!G.owned[i] || G.owned[i].owner !== o.to) return `${B.name} no longer owns ${TILES[i].name}.`;
    if (!tradable(ctx, i)) return `${TILES[i].name} has landmarks in its group, so it cannot be traded.`;
  }
  if (o.giveMoney > A.money) return `${A.name} only has ₱${A.money}.`;
  if (o.getMoney > B.money) return `${B.name} only has ₱${B.money}.`;
  if (o.giveLetters > (A.freeExit || 0)) return `${A.name} does not have that many letters.`;
  if (o.getLetters > (B.freeExit || 0)) return `${B.name} does not have that many letters.`;
  return "";
}

/** move everything in an (already checked) offer. Returns the groups each side completed. */
export function applyOffer(ctx, o) {
  const { G } = ctx;
  const A = G.players[o.from], B = G.players[o.to];
  o.give.forEach(i => { G.owned[i].owner = o.to; });
  o.get.forEach(i => { G.owned[i].owner = o.from; });
  A.money += o.getMoney - o.giveMoney;
  B.money += o.giveMoney - o.getMoney;
  A.freeExit = (A.freeExit || 0) + o.getLetters - o.giveLetters;
  B.freeExit = (B.freeExit || 0) + o.giveLetters - o.getLetters;
  const done = (pi, tiles) => [...new Set(tiles.map(i => TILES[i].group))].filter(g => ctx.ownsGroup(pi, g));
  return { from: done(o.from, o.get), to: done(o.to, o.give) };
}

/* ---------- valuing places for the CPU ---------- */

const groupPrice = (ctx, g) => ctx.groupTiles(g).reduce((s, i) => s + TILES[i].price, 0);

/** what a set of owners is worth to player pi: places, plus a bonus for full and nearly full groups */
function holdingValue(ctx, pi, ownerOf) {
  let v = 0;
  for (const g of Object.keys(GROUPS)) {
    const tiles = ctx.groupTiles(g);
    const mine = tiles.filter(i => ownerOf(i) === pi);
    if (!mine.length) continue;
    v += mine.reduce((s, i) => s + TILES[i].price * (ctx.G.owned[i] && ctx.G.owned[i].mortgaged ? 0.45 : 1), 0);
    const blockedBy = new Set(tiles.filter(i => ownerOf(i) !== pi && ownerOf(i) !== undefined).map(ownerOf));
    if (mine.length === tiles.length) v += groupPrice(ctx, g) * 0.9;
    else if (mine.length === tiles.length - 1) v += groupPrice(ctx, g) * (blockedBy.size ? 0.12 : 0.22);
  }
  return v;
}

/** how much better off (in Piso) player pi is after the offer, and how much better the other side is */
function offerGain(ctx, o, pi) {
  const { G } = ctx;
  const before = i => G.owned[i] ? G.owned[i].owner : undefined;
  const after = i => o.give.includes(i) ? o.to : o.get.includes(i) ? o.from : before(i);
  const other = pi === o.from ? o.to : o.from;
  const sign = pi === o.from ? 1 : -1;
  const cash = sign * (o.getMoney - o.giveMoney) + sign * (o.getLetters - o.giveLetters) * LETTER_VALUE;
  const mine = holdingValue(ctx, pi, after) - holdingValue(ctx, pi, before) + cash;
  const theirs = holdingValue(ctx, other, after) - holdingValue(ctx, other, before) - cash;
  return { mine, theirs };
}

/** "accept" or "decline", for the CPU at seat o.to */
export function decideTrade(ctx, o) {
  const { G } = ctx;
  const me = G.players[o.to];
  if (checkOffer(ctx, o)) return "decline";
  const { mine, theirs } = offerGain(ctx, o, o.to);
  const cashLeft = me.money - o.getMoney + o.giveMoney;
  if (o.getMoney > 0 && cashLeft < 60) return "decline";
  const moved = [...o.give, ...o.get].reduce((s, i) => s + TILES[i].price, 0) + o.giveMoney + o.getMoney;
  if (me.ai === "easy") {
    // a casual player looks at its own side and wants a small sweetener
    return mine > 10 + moved * 0.04 ? "accept" : "decline";
  }
  // hard: wants a clear win, and counts what the other side gains against it
  return mine - Math.max(0, theirs) * 0.6 > 25 + moved * 0.06 ? "accept" : "decline";
}

/** a trade the CPU at seat pi would like to propose this turn, or null.
 *  memo: { key: round } of offers already turned down, so a CPU does not keep asking. */
export function proposeTrade(ctx, pi, memo = {}) {
  const { G } = ctx;
  const me = G.players[pi];
  if (!me.ai) return null;
  if (me.ai === "easy" && Math.random() > 0.25) return null;
  const keep = me.ai === "hard" ? 150 : 250;
  const ideas = [];
  for (const g of Object.keys(GROUPS)) {
    const tiles = ctx.groupTiles(g);
    const missing = tiles.filter(i => !G.owned[i] || G.owned[i].owner !== pi);
    const mineCount = tiles.length - missing.length;
    if (!mineCount || missing.length > 2 || missing.some(i => !G.owned[i])) continue; // still on sale: just buy it
    const owners = [...new Set(missing.map(i => G.owned[i].owner))];
    if (owners.length !== 1 || G.players[owners[0]].bankrupt) continue;
    if (missing.length === 2 && mineCount < 1) continue;
    if (!missing.every(i => tradable(ctx, i)) || !tiles.every(i => tradable(ctx, i))) continue;
    const to = owners[0];
    const o = { ...emptyOffer(pi, to), get: missing };
    // a swap: offer a place that would finish one of their groups, if we have one that is not worth much to us
    const swap = tradableOf(ctx, pi).find(i => {
      if (ctx.groupTiles(TILES[i].group).includes(missing[0])) return false;
      const gt = ctx.groupTiles(TILES[i].group);
      const theirs = gt.filter(k => G.owned[k] && G.owned[k].owner === to).length;
      const ours = gt.filter(k => G.owned[k] && G.owned[k].owner === pi).length;
      return ours === 1 && theirs === gt.length - 1;
    });
    if (swap !== undefined) o.give = [swap];
    // top up with cash until the partner would come out ahead by its own measure
    const price = missing.reduce((s, i) => s + TILES[i].price, 0);
    const steps = [0, 0.25, 0.5, 0.8, 1.1, 1.5, 2];
    for (const s of steps) {
      o.giveMoney = Math.round(price * s / 10) * 10;
      if (o.giveMoney > me.money - keep) break;
      const probe = { ...o };
      // only offer what the partner would take by a careful measure (humans are judged like a hard CPU)
      if (decideTrade(ctx, probe) === "accept") {
        const { mine } = offerGain(ctx, probe, pi);
        if (mine > 40) ideas.push({ o: probe, gain: mine });
        break;
      }
    }
  }
  ideas.sort((a, b) => b.gain - a.gain);
  const pick = ideas.find(x => !(offerKey(x.o) in memo && G.round - memo[offerKey(x.o)] < 3));
  return pick ? pick.o : null;
}

export function offerKey(o) {
  return `${o.from}>${o.to}:${[...o.give].sort().join(",")}/${[...o.get].sort().join(",")}`;
}
