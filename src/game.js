/* Rizolopy: hot-seat game logic and UI. Plain browser JavaScript, no build step. */
import { GROUPS, TILES, EXILE_INDEX, CHARACTERS, NOLI_CARDS, FILI_CARDS, QUIZ, RULES } from "./data.js";
import { FX } from "./fx.js";
import { createBoard } from "./board.js";
import { gsap } from "gsap";
import { portrait } from "./art.js";
import { createTutorial, tutorialSeen, markSeen, TUTORIAL_PLAYERS } from "./tutorial.js";

export function boot() {

  const SAVE_KEY = "rizalopoly-save-v1";
  const $ = (sel, root = document) => root.querySelector(sel);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const peso = n => "₱" + Math.round(n).toLocaleString("en-PH");
  const charById = id => CHARACTERS.find(c => c.id === id);
  const shuffle = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let G = null;          // current game state
  let busy = false;      // true while an animation / modal flow is running
  let board = null;      // Phaser board scene

  // interactive tutorial: a scripted practice game that never touches the real save
  const tut = createTutorial({
    getBoard: () => board,
    onExit: choice => { leaveTutorial(); showScreen(choice === "play" ? "setup" : "landing"); },
  });
  function startTutorial() {
    tut.start();
    newGame({ players: TUTORIAL_PLAYERS, maxRounds: 0 });
    G.tutorial = true;
    enterGame();
  }
  function leaveTutorial() {
    tut.stop();
    markSeen();
    if (!$("#modal").classList.contains("hidden")) closeModal();
    G = null;
  }

  /* =========================================================
     Board rendering
     ========================================================= */
  function gridPos(i) {
    if (i <= 8) return { row: 9, col: 9 - i };
    if (i <= 16) return { row: 9 - (i - 8), col: 1 };
    if (i <= 24) return { row: 1, col: 1 + (i - 16) };
    return { row: 1 + (i - 24), col: 9 };
  }

  function buildBoard(boardEl, interactive) {
    boardEl.querySelectorAll(".tile").forEach(t => t.remove());
    TILES.forEach((t, i) => {
      const el = document.createElement("div");
      const p = gridPos(i);
      el.className = "tile";
      el.style.gridRow = p.row;
      el.style.gridColumn = p.col;
      el.dataset.index = i;
      if (t.type === "property") {
        el.innerHTML = `<div class="band" style="background:${GROUPS[t.group].color}"></div>
          <div class="t-icon">${t.icon}</div><div class="t-name">${esc(t.name)}</div>
          <div class="t-price">${peso(t.price)}</div>`;
      } else if (t.type === "noli" || t.type === "fili") {
        el.classList.add("card-" + t.type);
        el.innerHTML = `<div class="t-icon">${t.icon}</div><div class="t-name">${t.name}</div>`;
      } else {
        el.classList.add("corner");
        el.innerHTML = `<div class="t-icon">${t.icon}</div><div class="t-name">${esc(t.name)}</div>`;
      }
      el.addEventListener("click", () => showTileInfo(i));
      boardEl.appendChild(el);
    });
  }

  /* =========================================================
     Rules helpers
     ========================================================= */
  function groupTiles(group) { return TILES.map((t, i) => i).filter(i => TILES[i].group === group); }
  function ownsGroup(pi, group) { return groupTiles(group).every(i => G.owned[i] && G.owned[i].owner === pi); }
  function baseRent(i) { return Math.round(TILES[i].price / 10); }
  function upgradeCost(i) { return Math.round(TILES[i].price / 2); }

  function rentFor(i) {
    const own = G.owned[i];
    if (!own) return 0;
    const base = baseRent(i);
    if (own.level > 0) return base * RULES.upgradeMultipliers[own.level];
    return ownsGroup(own.owner, TILES[i].group) ? base * RULES.monopolyMultiplier : base;
  }

  function netWorth(pi) {
    const p = G.players[pi];
    let total = p.money;
    for (const [i, own] of Object.entries(G.owned)) {
      if (own.owner === pi) total += TILES[i].price + own.level * upgradeCost(i);
    }
    return total;
  }

  function propsOf(pi) {
    return Object.keys(G.owned).map(Number).filter(i => G.owned[i].owner === pi).sort((a, b) => a - b);
  }

  function activePlayers() { return G.players.filter(p => !p.bankrupt); }
  function cur() { return G.players[G.turn]; }

  function log(msg) {
    G.log.push(msg);
    if (G.log.length > 200) G.log.shift();
  }

  function save() {
    if (tut.active || (G && G.tutorial)) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); } catch (e) { /* storage unavailable */ }
  }
  function loadSave() {
    try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
  }
  function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }

  function drawFrom(deckName, source) {
    const forced = tut.forceDraw(deckName);
    if (forced !== null) return forced;
    if (!G[deckName] || G[deckName].length === 0) G[deckName] = shuffle(source.map((_, i) => i));
    return G[deckName].shift();
  }

  /* =========================================================
     Money: paying, raising funds, bankruptcy
     ========================================================= */
  async function raiseFunds(pi, needed) {
    const p = G.players[pi];
    const sold = [];
    // 1) sell landmarks back at half price, most expensive property first
    let props = propsOf(pi).sort((a, b) => TILES[b].price - TILES[a].price);
    for (const i of props) {
      while (p.money < needed && G.owned[i].level > 0) {
        G.owned[i].level--;
        const v = Math.round(upgradeCost(i) / 2);
        p.money += v;
        sold.push(`a landmark on ${TILES[i].name} (${peso(v)})`);
      }
    }
    // 2) sell properties back to the bank at half price, cheapest first
    props = propsOf(pi).sort((a, b) => TILES[a].price - TILES[b].price);
    for (const i of props) {
      if (p.money >= needed) break;
      const v = Math.round(TILES[i].price / 2);
      delete G.owned[i];
      p.money += v;
      sold.push(`${TILES[i].name} (${peso(v)})`);
    }
    if (sold.length) {
      log(`${p.name} sold ${sold.join(", ")} to pay debts.`);
      await alertModal("Raising funds", `<p><b>${esc(p.name)}</b> did not have enough Piso and sold:</p><ul>${sold.map(s => `<li>${esc(s)}</li>`).join("")}</ul>`);
    }
  }

  /** from pays amount to `to` (player index) or to the bank (null). Returns false if `from` went bankrupt. */
  async function pay(fromIdx, toIdx, amount) {
    const p = G.players[fromIdx];
    if (p.money < amount) await raiseFunds(fromIdx, amount);
    if (p.money < amount) {
      // bankrupt: hand over whatever is left
      const left = p.money;
      if (toIdx !== null) G.players[toIdx].money += left;
      p.money = 0;
      p.bankrupt = true;
      propsOf(fromIdx).forEach(i => delete G.owned[i]);
      log(`💀 ${p.name} is bankrupt!`);
      refresh();
      await alertModal("Bankrupt!", `<p><b>${esc(p.name)}</b> cannot pay ${peso(amount)} and is out of the game. Their places return to the bank.</p>`);
      return false;
    }
    p.money -= amount;
    if (toIdx !== null) G.players[toIdx].money += amount;
    return true;
  }

  /* =========================================================
     Turn flow
     ========================================================= */
  function newGame(setup) {
    G = {
      players: setup.players.map(s => ({
        name: s.name, char: s.char, money: RULES.startMoney, pos: 0,
        inExile: false, exileTries: 0, freeExit: 0, bankrupt: false,
      })),
      owned: {},
      turn: 0,
      round: 1,
      maxRounds: setup.maxRounds,
      doubles: 0,
      phase: "roll",        // roll | end | over
      lastDice: [1, 1],
      msg: "",
      log: [],
      noliDeck: [], filiDeck: [], quizDeck: [],
    };
    log(`Game started with ${G.players.map(p => p.name).join(", ")}.`);
    G.msg = `${cur().name}, roll the dice!`;
    save();
  }

  async function rollDice() {
    const forced = tut.rollFor(G);
    const d1 = forced ? forced[0] : 1 + Math.floor(Math.random() * 6);
    const d2 = forced ? forced[1] : 1 + Math.floor(Math.random() * 6);
    FX.sound.dice();
    await board.rollDice(d1, d2);
    G.lastDice = [d1, d2];
    tut.emit("rolled", { total: d1 + d2 });
    return [d1, d2];
  }

  async function onRoll() {
    if (busy || G.phase !== "roll") return;
    busy = true; refresh();
    try {
      const p = cur();
      const [d1, d2] = await rollDice();
      const total = d1 + d2;
      const isDouble = d1 === d2;
      log(`${p.name} rolled ${d1} + ${d2} = ${total}${isDouble ? " (doubles)" : ""}.`);

      if (p.inExile) {
        if (isDouble) {
          p.inExile = false; p.exileTries = 0;
          log(`${p.name} rolled doubles and leaves Dapitan.`);
          await moveBy(G.turn, total);
          await resolveTile(G.turn);
        } else {
          p.exileTries++;
          if (p.exileTries >= RULES.maxExileTurns) {
            log(`${p.name} has served their exile and pays ${peso(RULES.exileFee)}.`);
            const ok = await pay(G.turn, null, RULES.exileFee);
            p.inExile = false; p.exileTries = 0;
            if (ok) { await moveBy(G.turn, total); await resolveTile(G.turn); }
          } else {
            G.msg = `No doubles. ${p.name} stays in Dapitan (try ${p.exileTries} of ${RULES.maxExileTurns}).`;
          }
        }
        G.phase = "end";
        return;
      }

      if (isDouble) {
        G.doubles++;
        if (G.doubles >= 3) {
          log(`${p.name} rolled doubles three times and is sent to Dapitan Exile!`);
          await sendToExile(G.turn);
          G.phase = "end";
          return;
        }
      }
      await moveBy(G.turn, total);
      await resolveTile(G.turn);

      if (!p.bankrupt && !p.inExile && isDouble && G.phase !== "over") {
        G.phase = "roll";
        G.msg = `Doubles! ${p.name} rolls again.`;
      } else if (G.phase !== "over") {
        G.phase = "end";
      }
    } finally {
      busy = false;
      if (G.phase === "end" && !G.msg) G.msg = `${cur().name}, end your turn when ready.`;
      checkLastStanding();
      save(); refresh();
      tut.emit("rollDone");
    }
  }

  async function moveBy(pi, steps) {
    const p = G.players[pi];
    const dir = steps < 0 ? -1 : 1;
    const fast = Math.abs(steps) > 12;
    for (let s = 0; s < Math.abs(steps); s++) {
      p.pos = (p.pos + dir + TILES.length) % TILES.length;
      FX.sound.step();
      await board.hop(G, pi, p.pos, fast);
      if (dir > 0 && p.pos === 0) {
        p.money += RULES.passStart;
        log(`${p.name} passed START and collected ${peso(RULES.passStart)}.`);
        toast(`${p.name} collects ${peso(RULES.passStart)} for passing START`);
        FX.sound.coin();
      }
      refresh();
    }
  }

  async function moveTo(pi, target) {
    const p = G.players[pi];
    const steps = (target - p.pos + TILES.length) % TILES.length;
    await moveBy(pi, steps);
  }

  async function sendToExile(pi) {
    const p = G.players[pi];
    if (p.freeExit > 0) {
      p.freeExit--;
      log(`${p.name} used Blumentritt's letter to avoid exile.`);
      await alertModal("Saved by a letter", `<p>${esc(p.name)} uses Blumentritt's letter and avoids exile.</p>`);
      return;
    }
    p.pos = EXILE_INDEX;
    p.inExile = true;
    p.exileTries = 0;
    G.doubles = 0;
    FX.sound.exile();
    await board.teleport(G, pi, EXILE_INDEX);
    refresh();
    tut.emit("exiled");
    await alertModal("Exiled to Dapitan 🌴", `<p><b>${esc(p.name)}</b> is sent to Dapitan Exile and does not pass START.</p>
      <p class="fact">On their next turn they can pay ${peso(RULES.exileFee)} or try to roll doubles. After ${RULES.maxExileTurns} failed tries they must pay and move.</p>`);
  }

  async function resolveTile(pi) {
    const p = G.players[pi];
    const i = p.pos;
    const t = TILES[i];
    G.msg = `${p.name} landed on ${t.name}.`;
    refresh();
    highlight(i);

    if (t.type === "property") {
      const own = G.owned[i];
      if (!own) {
        await offerBuy(pi, i);
      } else if (own.owner !== pi) {
        const owner = G.players[own.owner];
        const rent = rentFor(i);
        tut.emit("rent", { amount: rent });
        await alertModal(`Rent due at ${t.name}`, `${deedHtml(i)}<p><b>${esc(p.name)}</b> pays <b>${peso(rent)}</b> rent to <b>${esc(owner.name)}</b>.</p>`, "Pay rent");
        FX.sound.pay();
        const ok = await pay(pi, own.owner, rent);
        log(`${p.name} paid ${peso(rent)} rent to ${owner.name} for ${t.name}.`);
        if (ok) G.msg = `${p.name} paid ${peso(rent)} rent to ${owner.name}.`;
        refresh();
        tut.emit("rentPaid");
      } else {
        G.msg = `${p.name} is visiting their own ${t.name}.`;
      }
    } else if (t.type === "noli" || t.type === "fili") {
      await drawCard(pi, t.type);
    } else if (t.type === "quiz") {
      await runQuiz(pi);
    } else if (t.type === "cafe") {
      G.msg = `${p.name} rests at the café. ☕`;
    } else if (t.type === "exile") {
      G.msg = `${p.name} is just visiting Dapitan.`;
    } else if (t.type === "start") {
      G.msg = `${p.name} is back at START.`;
    }
  }

  async function offerBuy(pi, i) {
    const p = G.players[pi];
    const t = TILES[i];
    const can = p.money >= t.price;
    tut.emit("buyOffer", { tile: i });
    const choice = await modal({
      body: `${deedHtml(i)}<p>${can ? `Buy <b>${esc(t.name)}</b> for <b>${peso(t.price)}</b>? You have ${peso(p.money)}.`
        : `You need ${peso(t.price)} but only have ${peso(p.money)}.`}</p>`,
      buttons: [
        { label: "Skip", value: "skip", cls: "btn-outline", disabled: tut.active },
        { label: `Buy for ${peso(t.price)}`, value: "buy", cls: "btn-maroon", disabled: !can },
      ],
    });
    if (choice === "buy") {
      p.money -= t.price;
      G.owned[i] = { owner: pi, level: 0 };
      FX.sound.coin();
      stampTile(i);
      log(`${p.name} bought ${t.name} for ${peso(t.price)}.`);
      G.msg = `${p.name} bought ${t.name}!`;
      refresh();
      tut.emit("bought", { tile: i });
      if (ownsGroup(pi, t.group)) {
        log(`${p.name} now owns all of ${GROUPS[t.group].name}. Rent doubles and landmarks can be built.`);
        toast(`${p.name} completed the ${GROUPS[t.group].name} group!`);
        board.confetti(120);
      }
    } else {
      G.msg = `${p.name} decided not to buy ${t.name}.`;
    }
  }

  async function drawCard(pi, kind) {
    const p = G.players[pi];
    const deck = kind === "noli" ? NOLI_CARDS : FILI_CARDS;
    const card = deck[drawFrom(kind + "Deck", deck)];
    await board.drawCardFly(kind);
    FX.sound.card();
    tut.emit("card", { kind });
    await alertModal(null, `<div class="flip-scene"><div class="flip-card">
        <div class="flip-back ${kind}"><span>${kind === "noli" ? "📖" : "🗡️"}</span><b>${kind.toUpperCase()}</b></div>
        <div class="card-face ${kind}"><div class="ct">${kind === "noli" ? "📖" : "🗡️"} ${kind.toUpperCase()}</div>
          <p class="cx">${esc(card.text)}</p></div>
      </div></div><p class="fact">📜 ${esc(card.fact)}</p>`, "OK");
    log(`${p.name} drew ${kind.toUpperCase()}: ${card.text}`);
    G.msg = card.text;

    if (card.money > 0) { p.money += card.money; }
    if (card.money < 0) { await pay(pi, null, -card.money); }
    if (card.collectEach) {
      for (let k = 0; k < G.players.length; k++) {
        if (k === pi || G.players[k].bankrupt) continue;
        await pay(k, pi, card.collectEach);
      }
    }
    if (card.payEach) {
      for (let k = 0; k < G.players.length; k++) {
        if (k === pi || G.players[k].bankrupt || p.bankrupt) continue;
        await pay(pi, k, card.payEach);
      }
    }
    if (card.freeExit) { p.freeExit++; }
    if (card.exile) { await sendToExile(pi); return; }
    if (card.moveTo !== undefined) { await moveTo(pi, card.moveTo); await resolveTile(pi); return; }
    if (card.moveBy) { await moveBy(pi, card.moveBy); await resolveTile(pi); }
    refresh();
    tut.emit("cardDone");
  }

  async function runQuiz(pi) {
    const p = G.players[pi];
    const q = QUIZ[drawFrom("quizDeck", QUIZ)];
    const order = shuffle(q.a.map((_, k) => k));
    const correct = await new Promise(resolve => {
      openModal(`<h2>❓ Quiz Corner</h2><p><b>${esc(p.name)}</b>, answer for ${peso(RULES.quizReward)}:</p>
        <p style="font-size:1.15rem;font-weight:700">${esc(q.q)}</p>
        <div class="quiz-opts">${order.map(k => `<button data-k="${k}">${esc(q.a[k])}</button>`).join("")}</div>`, []);
      $("#modalBody").querySelectorAll(".quiz-opts button").forEach(btn => {
        btn.addEventListener("click", () => {
          const k = Number(btn.dataset.k);
          $("#modalBody").querySelectorAll(".quiz-opts button").forEach(b => {
            b.disabled = true;
            if (Number(b.dataset.k) === q.c) b.classList.add("right");
          });
          if (k !== q.c) { btn.classList.add("wrong"); FX.sound.wrong(); } else { FX.sound.right(); }
          setTimeout(() => { closeModal(); resolve(k === q.c); }, 1300);
        });
      });
      tut.emit("quiz");
    });
    if (correct) {
      p.money += RULES.quizReward;
      log(`${p.name} answered the quiz correctly and earned ${peso(RULES.quizReward)}.`);
      board.confetti(90);
      G.msg = `Correct! ${p.name} earns ${peso(RULES.quizReward)}.`;
    } else {
      log(`${p.name} missed the quiz question.`);
      G.msg = `Not quite. The answer was "${q.a[q.c]}".`;
    }
    refresh();
    tut.emit("quizDone", { correct });
  }

  async function onEndTurn() {
    if (busy || G.phase !== "end") return;
    advanceTurn();
    save(); refresh();
    tut.emit("turnEnded");
    if (G.phase === "roll") await showSplash();
    await startTurnPrompt();
  }

  function advanceTurn() {
    G.doubles = 0;
    let next = G.turn;
    do {
      next = (next + 1) % G.players.length;
      if (next === 0) G.round++;
    } while (G.players[next].bankrupt);
    G.turn = next;
    if (G.maxRounds && G.round > G.maxRounds) {
      G.round = G.maxRounds;
      endGame("The final round is over!");
      return;
    }
    G.phase = "roll";
    G.msg = `${cur().name}, roll the dice!`;
  }

  async function startTurnPrompt() {
    if (G.phase !== "roll") return;
    const p = cur();
    tut.emit("turnStart", { exile: p.inExile });
    if (!p.inExile) return;
    const buttons = [{ label: "Roll for doubles", value: "roll", cls: "btn-green" }];
    if (p.freeExit > 0) buttons.unshift({ label: "Use Blumentritt's letter", value: "card", cls: "btn-gold" });
    buttons.unshift({ label: `Pay ${peso(RULES.exileFee)}`, value: "pay", cls: "btn-maroon", disabled: p.money < RULES.exileFee });
    const choice = await modal({
      body: `<h2>🌴 ${esc(p.name)} is in Dapitan</h2><p>Pay ${peso(RULES.exileFee)} to leave now, or try to roll doubles (try ${p.exileTries + 1} of ${RULES.maxExileTurns}).</p>`,
      buttons,
      onOpen: () => tut.emit("exilePrompt"),
    });
    if (choice === "pay") {
      p.money -= RULES.exileFee; p.inExile = false; p.exileTries = 0;
      log(`${p.name} paid ${peso(RULES.exileFee)} to leave Dapitan.`);
      G.msg = `${p.name} is free. Roll the dice!`;
    } else if (choice === "card") {
      p.freeExit--; p.inExile = false; p.exileTries = 0;
      log(`${p.name} used Blumentritt's letter to leave Dapitan.`);
      G.msg = `${p.name} is free. Roll the dice!`;
    } else {
      G.msg = `${p.name} needs doubles to leave Dapitan.`;
    }
    save(); refresh();
    tut.emit("exileChoice", { choice });
  }

  function checkLastStanding() {
    if (G.phase === "over") return;
    if (activePlayers().length <= 1) endGame("Only one player is left standing!");
  }

  function endGame(reason) {
    G.phase = "over";
    const ranking = G.players.map((p, i) => ({ p, i, worth: p.bankrupt ? -1 : netWorth(i) }))
      .sort((a, b) => b.worth - a.worth);
    const winner = ranking[0].p;
    log(`🏆 ${winner.name} wins!`);
    FX.sound.fanfare();
    FX.confetti(5000, 260);
    board.confetti(240);
    G.msg = `🏆 ${winner.name} wins!`;
    save(); refresh();
    showWinner(reason, ranking);
  }

  async function showWinner(reason, ranking) {
    const w = ranking[0].p;
    const c = charById(w.char);
    const choice = await modal({
      body: `<div style="text-align:center"><div class="avatar" style="background:${c.color}">${portrait(c)}</div>
        <h2>🏆 ${esc(w.name)} wins!</h2><p class="muted">${esc(reason)} The wealthiest player builds the greatest legacy.</p></div>
        <ul class="winner-list">${ranking.map(r => `<li><span>${portrait(charById(r.p.char))} ${esc(r.p.name)}</span><span>${r.p.bankrupt ? "Bankrupt" : peso(r.worth)}</span></li>`).join("")}</ul>
        <p class="fact">Net worth counts cash plus the price of every place and landmark owned.</p>`,
      buttons: [
        { label: "View board", value: "stay", cls: "btn-outline" },
        { label: "Play again", value: "again", cls: "btn-maroon" },
      ],
    });
    if (choice === "again") { clearSave(); showScreen("setup"); }
  }

  /* =========================================================
     Building landmarks
     ========================================================= */
  async function build(i) {
    if (busy || G.phase === "over") return;
    const p = cur();
    const own = G.owned[i];
    if (!own || own.owner !== G.turn || !ownsGroup(G.turn, TILES[i].group) || own.level >= RULES.maxUpgrades) return;
    const cost = upgradeCost(i);
    if (p.money < cost) { toast(`You need ${peso(cost)} to build here.`); return; }
    p.money -= cost;
    own.level++;
    FX.sound.build();
    stampTile(i);
    log(`${p.name} built a landmark on ${TILES[i].name} for ${peso(cost)}. Rent is now ${peso(rentFor(i))}.`);
    toast(`Landmark built on ${TILES[i].name}! Rent is now ${peso(rentFor(i))}`);
    save(); refresh();
  }

  /* =========================================================
     Rendering: sidebar, dice, center
     ========================================================= */
  function refresh() {
    if (!G) return;
    const p = cur();
    if (board) board.sync(G, { busy, msg: G.msg });
    $("#roundInfo").textContent = G.maxRounds ? `Round ${G.round} of ${G.maxRounds}` : `Round ${G.round}`;

    $("#playerList").innerHTML = G.players.map((pl, i) => {
      const ch = charById(pl.char);
      const tags = pl.bankrupt ? `<span class="tag">💀 Bankrupt</span>` : [
        pl.inExile ? `<span class="tag">🌴 Exiled</span>` : "",
        pl.freeExit ? `<span class="tag">✉️ Letter</span>` : "",
      ].join("");
      const swatches = propsOf(i).map(t => `<i style="background:${GROUPS[TILES[t].group].color}" title="${esc(TILES[t].name)}"></i>`).join("");
      return `<div class="p-row ${i === G.turn && G.phase !== "over" ? "current" : ""} ${pl.bankrupt ? "out" : ""}" style="--c:${ch.color}" data-prow="${i}">
        <div class="avatar" style="background:${ch.color}">${portrait(ch)}</div>
        <div class="p-mid"><div class="p-name">${esc(pl.name)} ${tags}</div><div class="p-sub">${esc(ch.name)}</div>
          <div class="p-swatches">${swatches || `<span class="muted">no places yet</span>`}</div></div>
        <div class="p-money">${peso(pl.money)}</div></div>`;
    }).join("");
    if (lastMoney) {
      G.players.forEach((pl, i) => {
        const d = pl.money - (lastMoney[i] ?? pl.money);
        if (d !== 0) {
          FX.floatText($(`[data-prow="${i}"] .p-money`), (d > 0 ? "+" : "−") + peso(Math.abs(d)), d > 0);
          if (board && !pl.bankrupt) board.floatAtTile(pl.pos, (d > 0 ? "+" : "−") + peso(Math.abs(d)), d > 0);
        }
      });
    }
    lastMoney = G.players.map(pl => pl.money);

    const mine = propsOf(G.turn);
    $("#myProps").innerHTML = mine.length === 0 ? `<p class="muted" style="margin:0">${esc(p.name)} owns no places yet.</p>`
      : mine.map(i => {
        const t = TILES[i], own = G.owned[i];
        const canBuild = ownsGroup(G.turn, t.group) && own.level < RULES.maxUpgrades && G.phase !== "over" && !busy;
        return `<div class="prop-row"><span class="sw" style="background:${GROUPS[t.group].color}"></span>
          <span class="nm">${t.icon} ${esc(t.name)} ${"🏛".repeat(own.level)}</span>
          <span class="muted">rent ${peso(rentFor(i))}</span>
          ${canBuild ? `<button class="btn btn-gold" data-build="${i}" title="Build a landmark for ${peso(upgradeCost(i))}">+🏛 ${peso(upgradeCost(i))}</button>` : ""}</div>`;
      }).join("");

    $("#log").innerHTML = G.log.slice(-60).reverse().map(l => `<li>${esc(l)}</li>`).join("");
  }

  let lastMoney = null;

  function stampTile(i) { board.stamp(i); }

  function updateMute() {
    $("#muteBtn").textContent = FX.isMuted() ? "🔇" : "🔊";
    $("#musicBtn").classList.toggle("off", !FX.isMusicOn());
  }

  function showSplash() {
    const p = cur();
    const c = charById(p.char);
    const sp = $("#splash");
    sp.style.setProperty("--c", c.color);
    sp.innerHTML = `<div class="splash-inner">
      <div class="splash-round">Round ${G.round}${G.maxRounds ? ` of ${G.maxRounds}` : ""}</div>
      <div class="avatar splash-avatar" style="background:${c.color}">${portrait(c)}</div>
      <div class="splash-name">${esc(p.name)}</div>
      <div class="splash-char">${esc(c.name)}</div>
      <div class="splash-hint">${p.inExile ? "🌴 You are in Dapitan Exile" : "Pass the device · tap to start your turn"}</div></div>`;
    sp.classList.remove("hidden");
    FX.sound.turn();
    const tl = gsap.timeline();
    tl.fromTo(sp, { opacity: 0 }, { opacity: 1, duration: 0.25 })
      .from(".splash-round", { y: -30, opacity: 0, duration: 0.35 }, 0.05)
      .from(".splash-avatar", { scale: 0, rotation: -180, duration: 0.7, ease: "back.out(1.7)" }, 0.1)
      .from(".splash-name", { y: 40, opacity: 0, duration: 0.45, ease: "power3.out" }, 0.35)
      .from(".splash-char, .splash-hint", { y: 20, opacity: 0, duration: 0.4, stagger: 0.1 }, 0.5);
    return new Promise(resolve => {
      let done = false;
      const close = () => {
        if (done) return; done = true; lastOverlayClose = Date.now();
        gsap.to(sp, { opacity: 0, duration: 0.25, onComplete: () => { sp.classList.add("hidden"); sp.style.opacity = ""; resolve(); } });
      };
      sp.onclick = close;
      setTimeout(close, 2000);
    });
  }

  function highlight(i) { board.highlight(i); }

  /* =========================================================
     Modals and toasts
     ========================================================= */
  let modalResolve = null;
  function openModal(bodyHtml, buttons) {
    $("#modalBody").innerHTML = bodyHtml;
    const bw = $("#modalButtons");
    bw.innerHTML = "";
    buttons.forEach(b => {
      const el = document.createElement("button");
      el.className = "btn " + (b.cls || "btn-maroon");
      el.textContent = b.label;
      el.disabled = !!b.disabled;
      el.addEventListener("click", () => { const r = modalResolve; closeModal(); r && r(b.value); });
      bw.appendChild(el);
    });
    bw.classList.toggle("hidden", buttons.length === 0);
    $("#modal").classList.remove("hidden");
    gsap.fromTo("#modal .modal", { scale: 0.85, y: 30, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.4, ease: "back.out(1.6)" });
    gsap.fromTo("#modalBody > *", { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.04, delay: 0.1 });
    const first = bw.querySelector("button:not(:disabled):last-child") || bw.querySelector("button:not(:disabled)");
    first && first.focus();
  }
  let lastOverlayClose = 0;
  function closeModal() { $("#modal").classList.add("hidden"); modalResolve = null; lastOverlayClose = Date.now(); }
  function modal({ body, buttons, onOpen }) {
    return new Promise(resolve => { openModal(body, buttons); modalResolve = resolve; onOpen && onOpen(); });
  }
  function alertModal(title, html, ok = "Continue") {
    return modal({ body: (title ? `<h2>${esc(title)}</h2>` : "") + html, buttons: [{ label: ok, value: true }] });
  }
  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2400);
  }

  function deedHtml(i) {
    const t = TILES[i];
    const g = GROUPS[t.group];
    const base = baseRent(i);
    const own = G && G.owned[i];
    const owner = own ? G.players[own.owner].name : null;
    return `<div class="deed-band" style="background:${g.color}"></div>
      <div class="group-label">${esc(g.name)}</div>
      <h2>${t.icon} ${esc(t.name)}</h2>
      <p class="note">${esc(t.note)}</p>
      <table>
        <tr><td>Price</td><td>${peso(t.price)}</td></tr>
        <tr><td>Rent</td><td>${peso(base)}</td></tr>
        <tr><td>Rent with whole group</td><td>${peso(base * RULES.monopolyMultiplier)}</td></tr>
        ${[1, 2, 3].map(l => `<tr><td>With ${l} landmark${l > 1 ? "s" : ""} 🏛</td><td>${peso(base * RULES.upgradeMultipliers[l])}</td></tr>`).join("")}
        <tr><td>Landmark cost</td><td>${peso(upgradeCost(i))}</td></tr>
        ${owner ? `<tr><td>Owner</td><td>${esc(owner)}${own.level ? ` (${own.level} 🏛)` : ""}</td></tr>` : ""}
      </table>`;
  }

  function showTileInfo(i) {
    if (busy || !$("#modal").classList.contains("hidden")) return;
    const t = TILES[i];
    let html;
    if (t.type === "property") html = deedHtml(i);
    else if (t.type === "noli") html = `<h2>📖 NOLI card</h2><p>Draw a card inspired by <i>Noli Me Tangere</i> (1887).</p>`;
    else if (t.type === "fili") html = `<h2>🗡️ FILI card</h2><p>Draw a card inspired by <i>El Filibusterismo</i> (1891).</p>`;
    else html = `<h2>${t.icon} ${esc(t.name)}</h2><p>${esc(t.note)}</p>`;
    modal({ body: html, buttons: [{ label: "Close", value: 0, cls: "btn-outline" }] });
  }

  function rulesHtml() {
    return `<h2>How to Play</h2>
      <ol class="rules-list">
        <li>2 to 6 players share one device. Each picks a character and starts with <b>${peso(RULES.startMoney)}</b>.</li>
        <li>On your turn, <b>roll two dice</b> and move counter-clockwise. Passing <b>START</b> pays ${peso(RULES.passStart)}.</li>
        <li>Land on an unowned place to <b>buy</b> it. Land on someone else's place and you <b>pay rent</b>.</li>
        <li>Own every place in a colour group to <b>double the rent</b> and build up to ${RULES.maxUpgrades} <b>landmarks 🏛</b> on each, which raise rent a lot.</li>
        <li><b>NOLI</b> and <b>FILI</b> tiles draw a card based on Rizal's novels. Each card teaches a fact.</li>
        <li><b>Quiz Corner</b>: answer a Rizal question correctly to earn ${peso(RULES.quizReward)}.</li>
        <li><b>Dapitan Exile</b>: if a card or three doubles send you there, pay ${peso(RULES.exileFee)} or roll doubles to leave.</li>
        <li>Rolling doubles lets you roll again.</li>
        <li>If you cannot pay, your landmarks and places are sold to the bank at half price. If that is not enough, you are bankrupt.</li>
        <li>The game ends when only one player is left, or after the round limit. The player with the highest <b>net worth</b> wins.</li>
      </ol>`;
  }

  function aboutHtml() {
    return `<h2>About Rizolopy</h2>
      <p>Rizolopy is a Monopoly-style board game that follows the life of Dr. José Rizal (1861 to 1896), the national hero of the Philippines.</p>
      <p>The board traces his journey: his childhood in Calamba and Biñan, his schooling in Manila, his studies and writing in Spain, France and Germany, the printing of <i>Noli Me Tangere</i> in Berlin and <i>El Filibusterismo</i> in Ghent, his exile in Dapitan, and his final days at Fort Santiago and Bagumbayan.</p>
      <p>Every place, card and quiz question carries a short piece of history, so you learn about Rizal while you play.</p>`;
  }

  /* =========================================================
     Screens: landing and setup
     ========================================================= */
  function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.id === id));
    window.scrollTo(0, 0);
    if (id === "setup") renderSetup();
    if (id === "landing") $("#resumeBtn").classList.toggle("hidden", !hasResumable());
  }

  function hasResumable() { const s = loadSave(); return !!(s && s.phase !== "over"); }

  function renderLandingChars() {
    $("#landingChars").innerHTML = CHARACTERS.map(c => `
      <div class="char-card" data-char="${c.id}" tabindex="0" role="button" aria-label="Play as ${esc(c.name)}">
        <div class="avatar" style="background:${c.color}">${portrait(c)}</div>
        <h3>${esc(c.name)}</h3>
        <div class="char-kind">${esc(c.kind)}</div>
        <p>${esc(c.blurb)}</p>
      </div>`).join("");
    $("#landingChars").querySelectorAll(".char-card").forEach(el => {
      const pick = () => { setup.slots[0].char = el.dataset.char; dedupeChars(); showScreen("setup"); };
      el.addEventListener("click", pick);
      el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
    });
  }

  const setup = {
    count: 2,
    maxRounds: 20,
    slots: Array.from({ length: 6 }, (_, i) => ({ name: `Player ${i + 1}`, char: CHARACTERS[i].id })),
  };

  function dedupeChars() {
    const used = new Set();
    setup.slots.forEach((s, idx) => {
      if (idx >= setup.count) return;
      if (used.has(s.char)) s.char = CHARACTERS.find(c => !used.has(c.id) && !setup.slots.slice(idx + 1, setup.count).some(o => o.char === c.id))?.id
        || CHARACTERS.find(c => !used.has(c.id)).id;
      used.add(s.char);
    });
  }

  function renderSetup() {
    $("#playerCount").innerHTML = [2, 3, 4, 5, 6].map(n => `<button class="${n === setup.count ? "on" : ""}" data-n="${n}">${n}</button>`).join("");
    $("#roundLimit").innerHTML = [[10, "Short · 10 rounds"], [20, "Normal · 20 rounds"], [0, "No limit"]]
      .map(([n, l]) => `<button class="${n === setup.maxRounds ? "on" : ""}" data-r="${n}">${l}</button>`).join("");
    $("#playerCount").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
      setup.count = Number(b.dataset.n); dedupeChars(); renderSetup();
    }));
    $("#roundLimit").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
      setup.maxRounds = Number(b.dataset.r); renderSetup();
    }));

    const slots = setup.slots.slice(0, setup.count);
    $("#playerSlots").innerHTML = slots.map((s, idx) => {
      const c = charById(s.char);
      return `<div class="slot">
        <div class="slot-top">
          <div class="avatar" style="background:${c.color};width:44px;height:44px;font-size:1.4rem;margin:0;border-width:2px">${portrait(c)}</div>
          <input type="text" maxlength="16" value="${esc(s.name)}" data-slot="${idx}" aria-label="Player ${idx + 1} name">
        </div>
        <div class="slot-chars">${CHARACTERS.map(ch => {
          const taken = slots.some((o, j) => j !== idx && o.char === ch.id);
          return `<button class="mini-char ${ch.id === s.char ? "on" : ""}" style="background:${ch.color}" title="${esc(ch.name)}"
            data-slot="${idx}" data-char="${ch.id}" ${taken ? "disabled" : ""}>${portrait(ch)}</button>`;
        }).join("")}</div>
        <div class="chosen">${esc(c.name)} · ${esc(c.kind)}</div>
      </div>`;
    }).join("");
    $("#playerSlots").querySelectorAll("input").forEach(inp => inp.addEventListener("input", () => {
      setup.slots[Number(inp.dataset.slot)].name = inp.value;
    }));
    $("#playerSlots").querySelectorAll(".mini-char").forEach(b => b.addEventListener("click", () => {
      setup.slots[Number(b.dataset.slot)].char = b.dataset.char; renderSetup();
    }));
    $("#setupError").textContent = "";
  }

  function startFromSetup() {
    const players = setup.slots.slice(0, setup.count).map((s, i) => ({ name: s.name.trim() || `Player ${i + 1}`, char: s.char }));
    const names = players.map(p => p.name.toLowerCase());
    if (new Set(names).size !== names.length) { $("#setupError").textContent = "Each player needs a different name."; return; }
    newGame({ players, maxRounds: setup.maxRounds });
    enterGame();
  }

  async function enterGame() {
    busy = false;
    showScreen("game");
    if (!board) {
      // ignore canvas taps while a dialog is open or right after one closes (the same tap can reach the canvas)
      const guard = fn => (...a) => {
        if (!$("#modal").classList.contains("hidden") || !$("#splash").classList.contains("hidden")) return;
        if (Date.now() - lastOverlayClose < 400) return;
        fn(...a);
      };
      board = await createBoard($("#gameBoard"), {
        onRoll: guard(() => onRoll()),
        onEnd: guard(() => onEndTurn()),
        onTile: guard(i => showTileInfo(i)),
        onDeck: guard(kind => showTileInfo(TILES.findIndex(t => t.type === kind))),
      });
    }
    board.reset();
    lastMoney = null;
    refresh();
    FX.startMusic();
    (G.phase === "roll" ? showSplash() : Promise.resolve()).then(startTurnPrompt);
  }

  /* =========================================================
     Wiring
     ========================================================= */
  document.addEventListener("click", async e => {
    const a = e.target.closest("[data-action]");
    if (a) {
      const act = a.dataset.action;
      if (act === "play") {
        if (tutorialSeen()) { showScreen("setup"); return; }
        markSeen();
        const c = await modal({ body: `<h2>🎓 New to Rizalopoly?</h2><p>A two-minute practice game walks you through rolling, buying, rent, NOLI and FILI cards, Quiz Corner and Dapitan Exile. You can replay it any time from the home page.</p>`,
          buttons: [{ label: "Skip, set up a game", value: false, cls: "btn-outline" }, { label: "Play the tutorial", value: true }] });
        if (c) startTutorial(); else showScreen("setup");
      }
      else if (act === "tutorial") startTutorial();
      else if (act === "home") showScreen("landing");
      else if (act === "howto" || act === "rules") {
        const buttons = [{ label: "Got it", value: false }];
        if (!tut.active) buttons.unshift({ label: "🎓 Play the tutorial", value: true, cls: "btn-outline" });
        if (await modal({ body: rulesHtml(), buttons })) {
          if (act === "howto" || await modal({ body: `<h2>Start the tutorial?</h2><p>Your game is saved and you can resume it from the home page afterwards.</p>`,
            buttons: [{ label: "Cancel", value: false, cls: "btn-outline" }, { label: "Start tutorial", value: true }] })) startTutorial();
        }
      }
      else if (act === "about") alertModal(null, aboutHtml(), "Close");
      else if (act === "start") startFromSetup();
      else if (act === "mute") { FX.setMuted(!FX.isMuted()); updateMute(); }
      else if (act === "music") { FX.setMusic(!FX.isMusicOn()); updateMute(); }
      else if (act === "resume") { G = loadSave(); if (G) enterGame(); }
      else if (act === "quit" && tut.active) {
        if (busy) { toast("Wait for the move to finish."); return; }
        const c = await modal({ body: `<h2>Leave the tutorial?</h2><p>You can play it again any time from the home page.</p>`,
          buttons: [{ label: "Stay", value: false, cls: "btn-outline" }, { label: "Leave", value: true }] });
        if (c) { leaveTutorial(); showScreen("landing"); }
      }
      else if (act === "quit") {
        const c = await modal({ body: `<h2>Leave the game?</h2><p>Your game is saved on this device. You can resume it from the home page.</p>`,
          buttons: [{ label: "Stay", value: false, cls: "btn-outline" }, { label: "Leave", value: true }] });
        if (c) showScreen("landing");
      }
      return;
    }
    const b = e.target.closest("[data-build]");
    if (b) build(Number(b.dataset.build));
  });
  document.addEventListener("keydown", e => {
    if (!$("#modal").classList.contains("hidden") || !$("#splash").classList.contains("hidden")) return;
    if (!$("#game").classList.contains("active") || e.target.tagName === "INPUT") return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (G.phase === "roll") onRoll(); else if (G.phase === "end") onEndTurn();
    }
  });

  buildBoard($("#previewBoard"), false);
  updateMute();
  renderLandingChars();
  showScreen("landing");

  // expose a tiny hook for automated testing
  window.__rizalopoly = { get state() { return G; }, rentFor: i => rentFor(i) };
}
