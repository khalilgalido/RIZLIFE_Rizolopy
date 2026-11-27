/* Rizolopy interactive tutorial.
   A scripted two-player practice game: the dice, the cards and the quiz question are
   fixed so every new player sees buying, rent, NOLI and FILI cards, Dapitan Exile,
   Quiz Corner, trading, an auction and a mortgage in a few minutes. The game itself runs normally; this module only
   picks the dice, listens to game events and draws a coach bubble with a spotlight. */
import "./tutorial.css";

const DONE_KEY = "rizalopoly-tutorial-seen";

export const TUTORIAL_PLAYERS = [
  { name: "You", char: "rizal" },
  { name: "Friend", char: "josephine" },
];

/* Dice for each roll, in order. The tiles they reach are noted on the right. */
const DICE = [
  [1, 3], // You: START -> Ateneo (buy)
  [3, 4], // Friend: START -> Intramuros (buy)
  [1, 2], // You: Ateneo -> Intramuros (pay rent)
  [1, 3], // Friend: Intramuros -> NOLI (card sends them to Dapitan)
  [5, 6], // You: Intramuros -> FILI (card pays ₱200)
  [3, 5], // Friend: leaves Dapitan -> Café Rest (in exile this becomes doubles 4 + 4)
  [2, 4], // You: FILI -> Quiz Corner
  [1, 2], // Friend: Café Rest -> Ghent (skip it: auction)
];
/* Which card or question each deck hands out first (index into the data lists). */
const FORCED_DRAWS = { noliDeck: 5, filiDeck: 0, quizDeck: 6 };

const peso = n => "₱" + Math.round(n).toLocaleString("en-PH");

/* ---------- the script ----------
   wait:   game event that moves to the next step (no wait = a Next button)
   target: what to spotlight: "roll" | "end" | "dice" | {tile} | "modal" | "modalBtn" | CSS selector
   silent: no bubble, just wait for the event
   allowTrade / allowSkip: the Trade button / the Skip button on a buy offer work during this step */
const STEPS = [
  { silent: true, wait: "turnStart" },
  { title: "Welcome to Rizolopy!", text: `This short practice game shows you how to play. You control both players, just like passing one phone around a group. You can skip it at any time.` },
  { target: "#playerList", title: "Two players", text: `Here are <b>You</b> (José Rizal) and your <b>Friend</b> (Josephine Bracken). Everyone starts with <b>₱1,500</b>. The richest player at the end wins.` },
  { target: "roll", title: "Roll the dice", text: `Tap <b>Roll Dice</b> to start your turn.`, wait: "rolled", tap: true },
  { target: { tile: 4 }, title: "Move", text: d => `You rolled <b>${d.total}</b>. Your token hops ${d.total} spaces around the board, counter-clockwise from START.`, wait: "buyOffer" },
  { target: "modal", title: "Buy places", text: `<b>Ateneo</b> has no owner yet, so you can buy it. The deed shows its price, its rent and a bit of history. Tap <b>Buy</b>.`, wait: "bought", tap: true },
  { target: { tile: 4 }, title: "It's yours", text: `Your colour now marks Ateneo. Anyone else who lands here pays you rent. Your places are also listed in the sidebar.` },
  { target: "end", title: "End your turn", text: `That's your whole turn. Tap <b>End Turn</b>, then pass the device to the next player.`, wait: "turnEnded", tap: true },

  { silent: true, wait: "turnStart" },
  { target: "roll", title: "Friend's turn", text: `Now it's your Friend's turn. Roll for them.`, wait: "rolled", tap: true },
  { silent: true, wait: "buyOffer" },
  { target: "modal", title: "Friend buys too", text: `Friend landed on <b>Intramuros</b>. Buy it for them, so we can see what rent is.`, wait: "bought", tap: true },
  { target: "end", title: "Pass it back", text: `End Friend's turn.`, wait: "turnEnded", tap: true },

  { silent: true, wait: "turnStart" },
  { target: "roll", title: "Your turn again", text: `Intramuros, owned by Friend, is three spaces ahead of you. Roll and see where you land.`, wait: "rolled", tap: true },
  { silent: true, wait: "rent" },
  { target: "modal", title: "Paying rent", text: d => `You landed on Friend's place, so you pay <b>${peso(d.amount)}</b> rent. Rent is a tenth of the price, and it <b>doubles</b> when one player owns the whole colour group.`, wait: "rentPaid", tap: true },
  { target: "#playerList", title: "Money moves", text: `The rent went from your purse to Friend's. Keep an eye on everyone's Piso here.` },
  { target: "end", title: "End your turn", text: `Tap <b>End Turn</b>.`, wait: "turnEnded", tap: true },

  { silent: true, wait: "turnStart" },
  { target: "roll", title: "Friend's turn", text: `Roll for Friend.`, wait: "rolled", tap: true },
  { silent: true, wait: "card" },
  { target: "modal", title: "NOLI cards", text: `Friend landed on a <b>NOLI</b> tile and drew a card. NOLI cards come from <i>Noli Me Tangere</i> (1887) and each one teaches a fact. They can give or take Piso, or move you.`, wait: "exiled", tap: true },
  { target: "modal", title: "Dapitan Exile", text: `This card sends Friend to <b>Dapitan Exile</b>, where Rizal really was exiled from 1892 to 1896. Rolling doubles three times in a row also sends you there.`, wait: "rollDone", tap: true },
  { target: { tile: 8 }, title: "Stuck in Dapitan", text: `While exiled, Friend can't move until they pay or roll doubles. Landing here normally is just a visit.` },
  { target: "end", title: "End Friend's turn", text: `Tap <b>End Turn</b> and pass the device back.`, wait: "turnEnded", tap: true },

  { silent: true, wait: "turnStart" },
  { target: "roll", title: "Your turn", text: `Roll the dice.`, wait: "rolled", tap: true },
  { silent: true, wait: "card" },
  { target: "modal", title: "FILI cards", text: `A <b>FILI</b> tile! These cards come from <i>El Filibusterismo</i> (1891). This one pays you <b>₱200</b>.`, wait: "cardDone", tap: true },
  { target: "end", title: "End your turn", text: `Tap <b>End Turn</b>.`, wait: "turnEnded", tap: true },

  { silent: true, wait: "exilePrompt" },
  { target: "modal", title: "Leaving exile", text: `Friend starts the turn in Dapitan. Pay <b>₱50</b> to leave now, or roll and hope for <b>doubles</b>. After 3 failed tries you must pay. Pick either one.`, wait: "exileChoice", tap: true },
  { target: "roll", title: "Roll", text: d => d.choice === "roll" ? `Roll for doubles.` : `Friend is free. Roll the dice.`, wait: "rolled", tap: true },
  { silent: true, wait: "rollDone" },
  { target: { tile: 16 }, title: "Café Rest", text: d => `${d.exileDoubles ? "Doubles! Friend left Dapitan and" : "Friend"} reached <b>Café Rest</b>, a safe corner where nothing happens.` },
  { target: "end", title: "End Friend's turn", text: `Tap <b>End Turn</b> and pass the device back.`, wait: "turnEnded", tap: true },

  { silent: true, wait: "turnStart" },
  { target: "roll", title: "Last roll", text: `One more roll for you.`, wait: "rolled", tap: true },
  { silent: true, wait: "quiz" },
  { target: "modal", title: "Quiz Corner", text: `Answer a question about Rizal's life. Get it right for <b>₱100</b>. (Hint: you just learned this one.)`, wait: "quizDone", tap: true },
  { target: "#tradeBtn", title: "Trading", allowTrade: true, wait: "tradeOpen", tap: true,
    text: d => `${d.correct ? "Correct! " : ""}On your turn you can also <b>trade</b> with other players. Friend owns Intramuros, in the same colour group as your Ateneo. Tap <b>Trade</b>.` },
  { target: "modal", title: "Make an offer", allowTrade: true, wait: "tradeOffer", tap: true,
    text: `We filled in an offer for you: <b>₱150</b> for Friend's <b>Intramuros</b>. You can tick places and type Piso on either side, and swap Blumentritt letters too. Tap <b>Send offer</b>.` },
  { target: "modal", title: "Friend decides", wait: "tradeDone", tap: true,
    text: `Now Friend answers. On one phone you pass it over, and online the offer pops up on their own phone. Computer players decide for themselves. Accept it for Friend.` },
  { target: "#myProps", title: d => d.accepted ? "Deal!" : "No deal",
    text: d => d.accepted ? `Intramuros is yours now. Places can't be traded while any place in their colour group has landmarks.` : `Friend said no, and that's fine. Anyone can turn down a trade they don't like.` },
  { target: "end", title: "End your turn", text: `Tap <b>End Turn</b>.`, wait: "turnEnded", tap: true },

  { silent: true, wait: "turnStart" },
  { target: "roll", title: "Friend's turn", text: `Roll for Friend.`, wait: "rolled", tap: true },
  { silent: true, wait: "buyOffer" },
  { target: "modal", title: "Skip it", allowSkip: true, wait: "auctionStart", tap: true,
    text: `Friend landed on <b>Ghent</b>. This time tap <b>Skip</b>. When a player doesn't buy a place, it goes up for <b>auction</b>.` },
  { target: "modal", title: "Auction", wait: "auctionDone", tap: true,
    text: `Players take turns raising the bid by ₱10, ₱50 or ₱100, or dropping out. The last player left pays their bid. Bid for both of you until someone wins.` },
  { target: "#playerList", title: d => d.winner ? "Sold!" : "No bids",
    text: d => d.winner ? `<b>${d.winner}</b> won Ghent for <b>${peso(d.bid)}</b>. An auction can be a bargain, because bids start at just ₱10.` : `Nobody bid, so Ghent stays with the bank for now.` },
  { target: "end", title: "End Friend's turn", text: `Tap <b>End Turn</b> and pass the device back.`, wait: "turnEnded", tap: true },

  { silent: true, wait: "turnStart" },
  { target: "#myProps", title: "Mortgages", wait: "mortgaged", tap: true,
    text: `Short on Piso? You can <b>mortgage</b> a place to the bank for half its price. Tap <b>Mortgage</b> next to one of your places.` },
  { target: "#myProps", title: "Lift the mortgage", wait: "lifted", tap: true,
    text: `A mortgaged place charges <b>no rent</b>. Tap <b>Lift</b> to pay the bank back, plus 10%.` },
  { title: "Landmarks and bankruptcy", text: `Two more rules for later:
      <ul>
        <li>Own a whole <b>colour group</b> to build up to 3 <b>landmarks 🏛</b> per place. Build <b>evenly</b>: every place in the group needs one before any gets a second. Tap <b>−🏛</b> to sell one back for half price.</li>
        <li>If you can't pay, the bank sells your landmarks and mortgages your places for you. If that's still not enough you're <b>bankrupt</b>, and the player you owe takes everything you have left.</li>
      </ul>` },
  { final: true, title: "You're ready!", text: `A few more things you'll meet in a real game:
      <ul>
        <li><b>Doubles</b> let you roll again.</li>
        <li>Passing <b>START</b> pays ₱200.</li>
        <li>You can make up to 3 trade offers on each turn.</li>
        <li>The game ends at the round limit or when one player is left. Highest <b>net worth</b> wins.</li>
      </ul>` },
];
const TURN_EDGES = ["turnEnded", "turnStart", "exilePrompt"];
const COUNTED = STEPS.filter(s => !s.silent).length;

export function createTutorial({ getBoard, onExit }) {
  let active = false;
  let idx = 0;
  let data = {};
  let dice = [];
  let draws = {};
  let raf = 0;
  let root = null, spot = null, dim = null, bubble = null;
  let lastPress = 0;

  function mount() {
    root = document.createElement("div");
    root.className = "tut-root";
    root.innerHTML = `<div class="tut-dim"></div><div class="tut-spot"></div>
      <div class="tut-bubble" role="dialog" aria-live="polite"></div>`;
    document.body.appendChild(root);
    dim = root.querySelector(".tut-dim");
    spot = root.querySelector(".tut-spot");
    bubble = root.querySelector(".tut-bubble");
    // Phaser listens for pointerup on the whole window, so a tap on the bubble could
    // also "tap" the board tile underneath it. The game asks justPressed() to ignore it.
    bubble.addEventListener("pointerdown", () => { lastPress = Date.now(); });
    bubble.addEventListener("pointerup", () => { lastPress = Date.now(); });
    bubble.addEventListener("click", e => {
      const b = e.target.closest("[data-tut]");
      if (!b) return;
      const a = b.dataset.tut;
      if (a === "next") go(idx + 1);
      else if (a === "skip") finish("home");
      else if (a === "play") finish("play");
      else if (a === "home") finish("home");
    });
  }

  function start() {
    if (!root) mount();
    active = true;
    idx = -1;
    data = {};
    dice = DICE.slice();
    draws = { ...FORCED_DRAWS };
    root.classList.add("on");
    go(0);
    cancelAnimationFrame(raf);
    const loop = () => { if (!active) return; place(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    active = false;
    cancelAnimationFrame(raf);
    if (root) root.classList.remove("on");
    document.body.classList.remove("tut-dock");
  }

  function finish(choice) {
    markSeen();
    stop();
    onExit && onExit(choice);
  }

  function go(k) {
    idx = k;
    const s = STEPS[idx];
    if (!s) return;
    root.classList.toggle("silent", !!s.silent);
    document.body.classList.remove("tut-dock");
    if (s.silent) return;
    const n = STEPS.slice(0, idx + 1).filter(x => !x.silent).length;
    const text = typeof s.text === "function" ? s.text(data) : s.text;
    const title = typeof s.title === "function" ? s.title(data) : s.title;
    let buttons;
    if (s.final) {
      buttons = `<button class="btn btn-outline" data-tut="home">Back to menu</button>
        <button class="btn btn-maroon" data-tut="play">Start a real game</button>`;
    } else if (s.wait) {
      // while pieces are moving the game is mid-turn, so skipping waits for the next pause
      buttons = `${s.tap ? `<button class="btn btn-link tut-skip" data-tut="skip">Skip tutorial</button>` : ""}
        <span class="tut-hint">${s.tap ? "👆 Tap the glowing spot" : "Watch the board…"}</span>`;
    } else {
      buttons = `<button class="btn btn-link tut-skip" data-tut="skip">Skip tutorial</button>
        <button class="btn btn-maroon" data-tut="next">Next</button>`;
    }
    bubble.innerHTML = `<div class="tut-head"><span class="tut-coach">🎓</span>
        <span class="tut-title">${title || "Tutorial"}</span><span class="tut-count">${n} / ${COUNTED}</span></div>
      <div class="tut-text">${text}</div><div class="tut-buttons">${buttons}</div>`;
    bubble.classList.remove("pop");
    void bubble.offsetWidth;
    bubble.classList.add("pop");
    spot.classList.toggle("tap", !!s.tap);
    const tile = s.target && s.target.tile;
    if (tile !== undefined) { const b = getBoard(); b && b.highlight(tile); }
    const el = targetElement(s.target);
    if (el && el.scrollIntoView) {
      const r = el.getBoundingClientRect();
      if (r.top < 0 || r.bottom > innerHeight) el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    place();
    const next = bubble.querySelector('[data-tut="next"], [data-tut="play"]');
    next && next.focus({ preventScroll: true });
  }

  /* Called by the game. Moves to the step waiting for this event. If the player
     raced ahead (for example ended the turn before pressing Next), skip forward. */
  function emit(name, d = {}) {
    if (!active) return;
    Object.assign(data, d);
    for (let k = idx; k < Math.min(STEPS.length, idx + 6); k++) {
      if (STEPS[k].wait === name) { go(k + 1); return; }
      if (TURN_EDGES.includes(STEPS[k].wait)) return; // never skip across a turn change
    }
  }

  /* ---------- rigged dice and cards ---------- */
  function rollFor(G) {
    if (!active) return null;
    const p = G.players[G.turn];
    const next = dice.shift();
    if (p.inExile) { data.exileDoubles = true; return [4, 4]; }
    return next || null;
  }
  function forceDraw(deckName) {
    if (!active || draws[deckName] === undefined) return null;
    const k = draws[deckName];
    delete draws[deckName];
    return k;
  }

  /* ---------- spotlight and bubble placement ---------- */
  function boardRect(target) {
    const board = getBoard();
    if (!board || !board.game) return null;
    const c = board.game.canvas.getBoundingClientRect();
    const s = c.width / board.scale.width;
    let r = null;
    if (target === "roll" || target === "end") {
      const btn = target === "roll" ? board.rollBtn : board.endBtn;
      r = { x: btn.x - 113, y: btn.y - 39, w: 226, h: 78 };
    } else if (target === "dice" && board.tray) {
      const t = board.tray;
      r = { x: t.x - t.w / 2 - 12, y: t.y - t.h / 2 - 12, w: t.w + 24, h: t.h + 24 };
    } else if (target && target.tile !== undefined && board.tiles[target.tile]) {
      r = board.tiles[target.tile].r;
    }
    if (!r) return null;
    return { left: c.left + r.x * s, top: c.top + r.y * s, width: r.w * s, height: r.h * s };
  }

  function targetElement(target) {
    if (target === "roll" || target === "end" || target === "dice" || (target && target.tile !== undefined)) {
      const b = getBoard();
      return b && b.game ? b.game.canvas : null;
    }
    if (target === "modal") return document.querySelector("#modal:not(.hidden) .modal");
    if (target === "modalBtn") return document.querySelector("#modal:not(.hidden) #modalButtons button:last-child");
    if (typeof target === "string") return document.querySelector(target);
    return null;
  }

  function targetRect(target) {
    if (!target) return null;
    if (typeof target === "object" || target === "roll" || target === "end" || target === "dice") return boardRect(target);
    const el = targetElement(target);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return null;
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  }

  function place() {
    const s = STEPS[idx];
    if (!s || s.silent) return;
    const vw = document.documentElement.clientWidth, vh = innerHeight;
    const r = targetRect(s.target);
    const pad = 8;
    // a modal already dims the page, so only add our own dim when nothing else does
    const modalOpen = !document.querySelector("#modal").classList.contains("hidden");
    // a dialog the step is not about (tile info, rules) goes on top so the coach never covers it
    root.classList.toggle("under", modalOpen && s.target !== "modal" && s.target !== "modalBtn" && !s.final);
    if (r) {
      spot.style.display = "block";
      spot.style.left = `${r.left - pad}px`;
      spot.style.top = `${r.top - pad}px`;
      spot.style.width = `${r.width + pad * 2}px`;
      spot.style.height = `${r.height + pad * 2}px`;
      spot.classList.toggle("light", modalOpen);
      dim.style.display = "none";
    } else {
      spot.style.display = "none";
      dim.style.display = modalOpen ? "none" : "block";
    }

    const bw = Math.min(360, vw - 24);
    bubble.style.width = `${bw}px`;
    const bh = bubble.offsetHeight;
    let x, y;
    // On small screens a dialog fills the view, so the bubble docks at the top and the
    // dialog is pushed down below it instead of being covered.
    const dock = s.target === "modal" && modalOpen && vw < 760;
    document.body.classList.toggle("tut-dock", dock);
    if (dock) {
      document.body.style.setProperty("--tut-h", `${bh}px`);
      x = (vw - bw) / 2; y = 10;
      spot.style.display = "none";
    } else if (!r) {
      x = (vw - bw) / 2; y = (vh - bh) / 2;
      if (modalOpen) y = 12;
    } else {
      const gap = 18;
      const below = vh - (r.top + r.height + pad);
      const above = r.top - pad;
      const right = vw - (r.left + r.width + pad);
      const left = r.left - pad;
      if (right >= bw + gap && s.target !== "modal") {
        x = r.left + r.width + pad + gap; y = r.top + r.height / 2 - bh / 2;
      } else if (left >= bw + gap && s.target !== "modal") {
        x = r.left - pad - gap - bw; y = r.top + r.height / 2 - bh / 2;
      } else if (below >= bh + gap) {
        x = r.left + r.width / 2 - bw / 2; y = r.top + r.height + pad + gap;
      } else if (above >= bh + gap) {
        x = r.left + r.width / 2 - bw / 2; y = r.top - pad - gap - bh;
      } else if (right >= bw + gap) {
        x = r.left + r.width + pad + gap; y = r.top + r.height / 2 - bh / 2;
      } else if (left >= bw + gap) {
        x = r.left - pad - gap - bw; y = r.top + r.height / 2 - bh / 2;
      } else {
        // no room anywhere: dock to whichever screen edge is further from the target
        x = (vw - bw) / 2;
        y = r.top + r.height / 2 > vh / 2 ? 12 : vh - bh - 12;
      }
    }
    x = Math.max(12, Math.min(vw - bw - 12, x));
    y = Math.max(12, Math.min(vh - bh - 12, y));
    bubble.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  return {
    get active() { return active; },
    justPressed: () => active && Date.now() - lastPress < 500,
    start, stop, emit, rollFor, forceDraw,
    /** does the current step let the player use the Trade button / skip a buy? */
    allows: what => active && !!STEPS[idx] && !!STEPS[idx][what],
  };
}

export function tutorialSeen() {
  try { return localStorage.getItem(DONE_KEY) === "1"; } catch (e) { return true; }
}
export function markSeen() {
  try { localStorage.setItem(DONE_KEY, "1"); } catch (e) { /* storage unavailable */ }
}
