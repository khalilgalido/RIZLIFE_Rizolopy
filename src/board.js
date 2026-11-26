/* Rizolopy board, dice and tokens rendered with Phaser 3. */
import Phaser from "phaser";
import { TILES, GROUPS, CHARACTERS } from "./data.js";
import { artKey, charKey, ALL_ART } from "./art.js";

const O = 34;                       // frame thickness (banig band)
const B = 1000;                     // board size inside frame
const SIZE = B + O * 2;
const C = (B * 1.35) / 9.7;         // corner tile size
const W = B / 9.7;                  // regular tile size
const CX = O + B / 2;

const COLORS = {
  maroon: 0x6e1a2c, maroonDark: 0x4a0f1c, gold: 0xb8913a, goldLight: 0xd9bf7a,
  cream: 0xf8ecd4, cream2: 0xf0dcb0, ink: 0x2b1d14, green: 0x1e4d3a, felt: 0x2f6b50, feltDark: 0x173a2a,
  fili: 0x2a1a20, filiLight: 0x4a2f3c,
};
const hex = s => parseInt(s.replace("#", ""), 16);
const charById = id => CHARACTERS.find(c => c.id === id);
const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "Lato, system-ui, sans-serif";

/* ---------- geometry ---------- */
function gridPos(i) {
  if (i <= 8) return { row: 9, col: 9 - i };
  if (i <= 16) return { row: 9 - (i - 8), col: 1 };
  if (i <= 24) return { row: 1, col: 1 + (i - 16) };
  return { row: 1 + (i - 24), col: 9 };
}
const lineStart = k => (k === 1 ? 0 : k === 9 ? C + 7 * W : C + (k - 2) * W);
const lineSize = k => (k === 1 || k === 9 ? C : W);
function tileRect(i) {
  const { row, col } = gridPos(i);
  return { x: O + lineStart(col), y: O + lineStart(row), w: lineSize(col), h: lineSize(row) };
}
function tileCenter(i) {
  const r = tileRect(i);
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}
const CLUSTER = [[0, 0], [-1, -0.8], [1, 0.8], [1, -0.8], [-1, 0.8], [0, 1.2]];

/* ---------- the scene ---------- */
class BoardScene extends Phaser.Scene {
  constructor(handlers) {
    super("board");
    this.handlers = handlers;
    this.tiles = [];
    this.tokens = [];
    this.ownerMarks = [];
  }

  preload() {
    ALL_ART.forEach(({ key, url, svg, size }) => (svg ? this.load.svg(key, url, { width: size, height: size }) : this.load.image(key, url)));
  }

  txt(x, y, s, style) {
    return this.add.text(x, y, s, { resolution: 2, ...style });
  }
  portrait(x, y, ch, size) {
    return this.add.image(x, y, charKey(ch.id)).setDisplaySize(size, size);
  }
  art(x, y, emoji, size) {
    const key = artKey(emoji);
    if (key && this.textures.exists(key)) return this.add.image(x, y, key).setDisplaySize(size, size);
    return this.txt(x, y, emoji, { fontSize: `${Math.round(size * 0.8)}px` }).setOrigin(0.5);
  }

  create() {
    // tiny textures for particles
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff).fillRect(0, 0, 10, 6).generateTexture("confetti", 10, 6).clear();
    g.fillStyle(0xffffff).fillCircle(4, 4, 4).generateTexture("dot", 8, 8).destroy();

    this.drawFrame();
    this.drawCenter();
    TILES.forEach((t, i) => this.drawTile(t, i));
    this.drawDecks();
    this.drawDiceTray();
    this.drawControls();

    this.tokenLayer = this.add.container(0, 0).setDepth(50);
    this.fxLayer = this.add.container(0, 0).setDepth(80);

    // drifting gold dust for atmosphere
    this.add.particles(0, 0, "dot", {
      x: { min: O + C, max: O + B - C }, y: { min: O + C, max: O + B - C },
      lifespan: 6000, speedY: { min: -8, max: -18 }, speedX: { min: -6, max: 6 },
      scale: { start: 0.5, end: 0 }, alpha: { start: 0.5, end: 0 }, tint: [0xd9bf7a, 0xffffff],
      frequency: 260, blendMode: "ADD",
    }).setDepth(5);

    this.confettiEmitter = this.add.particles(0, 0, "confetti", {
      speed: { min: 250, max: 650 }, angle: { min: 200, max: 340 }, gravityY: 900,
      rotate: { min: 0, max: 360 }, lifespan: 2200, scale: { min: 0.7, max: 1.3 },
      tint: [0x6e1a2c, 0x1e4d3a, 0xb8913a, 0xf1c232, 0xe78fb8, 0x7fc3e3, 0xe8843a, 0xffffff],
      emitting: false,
    }).setDepth(90);

    this.ready && this.ready();
  }

  /* ---------- static drawing ---------- */
  /* Frame: lacquered wood with a banig (woven mat) band and gold rosettes at the corners. */
  drawFrame() {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25).fillRoundedRect(6, 12, SIZE - 12, SIZE - 8, 26);
    g.fillStyle(COLORS.maroonDark).fillRoundedRect(0, 0, SIZE, SIZE, 24);
    g.fillStyle(COLORS.maroon).fillRoundedRect(3, 3, SIZE - 6, SIZE - 6, 22);
    // banig weave: interlaced diamonds in two colours around the band
    const weave = this.add.graphics();
    const cell = 12, band0 = 8, band1 = O - 8;
    const cols = [0x8a2338, 0xb8913a, 0x5a1424, 0xd9bf7a];
    for (let y = band0; y < SIZE - band0; y += cell) {
      for (let x = band0; x < SIZE - band0; x += cell) {
        const inBand = x < band1 || y < band1 || x > SIZE - band1 - cell || y > SIZE - band1 - cell;
        if (!inBand) continue;
        const k = ((Math.floor(x / cell) + Math.floor(y / cell)) % 2) + ((Math.floor(x / cell / 3) + Math.floor(y / cell / 3)) % 2) * 2;
        weave.fillStyle(cols[k], 1).fillPoints([
          { x: x + cell / 2, y }, { x: x + cell, y: y + cell / 2 }, { x: x + cell / 2, y: y + cell }, { x, y: y + cell / 2 },
        ], true);
      }
    }
    weave.lineStyle(2, COLORS.gold).strokeRoundedRect(band0 - 1, band0 - 1, SIZE - 2 * band0 + 2, SIZE - 2 * band0 + 2, 16);
    g.lineStyle(3, COLORS.gold).strokeRect(O - 5, O - 5, B + 10, B + 10);
    g.fillStyle(COLORS.maroonDark).fillRect(O - 4, O - 4, B + 8, B + 8);
    g.setDepth(0); weave.setDepth(1);
    const inner = this.add.graphics().setDepth(2);
    inner.fillStyle(COLORS.cream2).fillRect(O, O, B, B);
    // corner rosettes (calado-style carving)
    [[O / 2, O / 2], [SIZE - O / 2, O / 2], [O / 2, SIZE - O / 2], [SIZE - O / 2, SIZE - O / 2]].forEach(([x, y]) => {
      const r = this.add.graphics().setDepth(3);
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        r.fillStyle(COLORS.gold).fillCircle(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 6);
      }
      r.fillStyle(COLORS.maroonDark).fillCircle(x, y, 8).fillStyle(COLORS.goldLight).fillCircle(x, y, 5);
    });
  }

  /* Centre: light through a capiz-shell window, with baybayin lettering under the logo. */
  drawCenter() {
    const x0 = O + C, y0 = O + C, s = B - 2 * C;
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0xf3e6c8).fillRect(x0, y0, s, s);
    // capiz panes: pearly squares set in a wooden lattice
    const pane = s / 12;
    for (let r = 0; r < 12; r++) {
      for (let c = 0; c < 12; c++) {
        const px = x0 + c * pane, py = y0 + r * pane;
        const tint = (r * 7 + c * 3) % 5;
        const top = [0xfbf6ee, 0xf6efe9, 0xf9f3ea, 0xf3ecef, 0xfaf4e6][tint];
        g.fillGradientStyle(top, 0xefe4ef, 0xf1e6d6, top, 1).fillRect(px + 2, py + 2, pane - 4, pane - 4);
        g.fillStyle(0xffffff, 0.45).fillEllipse(px + pane * 0.38, py + pane * 0.32, pane * 0.4, pane * 0.18);
      }
    }
    g.lineStyle(4, 0x8a5a2b, 0.4);
    for (let k = 0; k <= 12; k++) { g.lineBetween(x0 + k * pane, y0, x0 + k * pane, y0 + s); g.lineBetween(x0, y0 + k * pane, x0 + s, y0 + k * pane); }
    g.lineStyle(2, 0x8a5a2b, 0.12);
    for (let k = 0; k < 12; k += 3) {
      for (let j = 0; j < 12; j += 3) {
        const cx = x0 + (k + 1.5) * pane, cy = y0 + (j + 1.5) * pane;
        g.strokeCircle(cx, cy, pane * 1.3);
      }
    }
    // warm light falling through the window, strongest in the middle
    const glow = this.add.graphics().setDepth(3);
    for (let r = 380; r > 0; r -= 20) glow.fillStyle(0xfff3d6, 0.05).fillCircle(CX, CX + 20, r);
    const mask = this.make.graphics({}, false).fillRect(x0, y0, s, s).createGeometryMask();
    g.setMask(mask); glow.setMask(mask);
    const edge = this.add.graphics().setDepth(4);
    edge.lineStyle(6, 0x6b4423).strokeRect(x0 + 3, y0 + 3, s - 6, s - 6);
    edge.lineStyle(2, COLORS.gold).strokeRect(x0 + 9, y0 + 9, s - 18, s - 18);

    // logo banner
    const banner = this.add.graphics().setDepth(5);
    banner.fillStyle(0xfff8ea, 0.82).fillRoundedRect(CX - 300, O + 170, 600, 150, 28);
    banner.lineStyle(3, COLORS.gold, 0.9).strokeRoundedRect(CX - 300, O + 170, 600, 150, 28);
    this.logo = this.txt(CX, O + 225, "RIZOLOPY", {
      fontFamily: SERIF, fontStyle: "900", fontSize: "72px", color: "#6e1a2c",
    }).setOrigin(0.5).setAngle(-3).setShadow(0, 4, "rgba(110,26,44,0.25)", 10).setDepth(6);
    this.txt(CX, O + 280, "Travel Through History", {
      fontFamily: SERIF, fontStyle: "italic 600", fontSize: "24px", color: "#1e4d3a",
    }).setOrigin(0.5).setDepth(6);
    // "Rizal" in baybayin, between two gold rules
    this.txt(CX, O + 306, "ᜇᜒᜐᜎ᜔", {
      fontFamily: "'Noto Sans Tagalog', serif", fontSize: "24px", color: "#b8913a",
    }).setOrigin(0.5).setDepth(6);
    banner.lineStyle(2, COLORS.gold).lineBetween(CX - 150, O + 307, CX - 50, O + 307).lineBetween(CX + 50, O + 307, CX + 150, O + 307);
  }

  drawTile(t, i) {
    const r = tileRect(i);
    const c = this.add.container(r.x + r.w / 2, r.y + r.h / 2).setDepth(10);
    const g = this.add.graphics();
    const hw = r.w / 2, hh = r.h / 2;
    const isCorner = ["start", "exile", "cafe", "quiz"].includes(t.type);
    if (t.type === "fili") {
      g.fillGradientStyle(COLORS.filiLight, COLORS.filiLight, COLORS.fili, COLORS.fili, 1);
    } else if (t.type === "noli") {
      g.fillGradientStyle(0xfdf0d8, 0xfdf0d8, 0xeccc98, 0xeccc98, 1);
    } else if (isCorner) {
      g.fillGradientStyle(0xf9ebc6, 0xe7cd8f, 0xe3c482, 0xf6e4b8, 1);
    } else {
      g.fillGradientStyle(0xfdf5e2, 0xfdf5e2, 0xf3e3c0, 0xf3e3c0, 1);
    }
    g.fillRect(-hw, -hh, r.w, r.h);
    if (t.type === "property") {
      const col = hex(GROUPS[t.group].color);
      g.fillStyle(col).fillRect(-hw, -hh, r.w, 24);
      g.fillStyle(0xffffff, 0.25).fillRect(-hw, -hh, r.w, 5);
      g.fillStyle(0x000000, 0.15).fillRect(-hw, -hh + 21, r.w, 3);
    }
    g.lineStyle(1.5, COLORS.gold).strokeRect(-hw, -hh, r.w, r.h);
    c.add(g);

    if (t.type === "property") {
      c.add(this.art(0, -10, t.icon, 46));
      c.add(this.txt(0, 18, t.name, {
        fontFamily: SANS, fontStyle: "700", fontSize: "13px", color: "#2b1d14", align: "center",
        wordWrap: { width: r.w - 8 }, lineSpacing: -3,
      }).setOrigin(0.5));
      c.add(this.txt(0, hh - 12, "₱" + t.price, { fontFamily: SANS, fontSize: "12px", color: "#6b5a45" }).setOrigin(0.5));
    } else if (t.type === "noli" || t.type === "fili") {
      c.add(this.art(0, -12, t.icon, 58));
      c.add(this.txt(0, 26, t.name, {
        fontFamily: SERIF, fontStyle: "900", fontSize: "17px", color: t.type === "noli" ? "#6e1a2c" : "#f1d58a",
      }).setOrigin(0.5));
    } else {
      const icon = this.art(0, -14, t.icon, 84);
      c.add(icon);
      this.tweens.add({ targets: icon, y: -20, duration: 1600 + i * 40, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      c.add(this.txt(0, 38, t.name, {
        fontFamily: SERIF, fontStyle: "800", fontSize: "17px", color: "#6e1a2c", align: "center", wordWrap: { width: r.w - 10 },
      }).setOrigin(0.5));
    }

    // ownership overlay (border + marker), landmarks, highlight
    const own = this.add.graphics();
    const marks = this.add.container(0, 0);
    const hl = this.add.graphics().fillStyle(0xffd34d, 1).fillRect(-hw, -hh, r.w, r.h).setAlpha(0).setBlendMode("ADD");
    c.add([own, marks, hl]);

    c.setSize(r.w, r.h).setInteractive({ useHandCursor: true });
    c.on("pointerover", () => { c.setDepth(20); this.tweens.add({ targets: c, scale: 1.06, duration: 120 }); });
    c.on("pointerout", () => { c.setDepth(10); this.tweens.add({ targets: c, scale: 1, duration: 120 }); });
    c.on("pointerup", () => this.handlers.onTile && this.handlers.onTile(i));
    this.tiles[i] = { c, own, marks, hl, r };
  }

  makeCard(kind, w, h) {
    const c = this.add.container(0, 0);
    const g = this.add.graphics();
    if (kind === "noli") g.fillGradientStyle(0xfdf0d8, 0xfdf0d8, 0xecc993, 0xecc993, 1);
    else g.fillGradientStyle(COLORS.filiLight, COLORS.filiLight, 0x1d1116, 0x1d1116, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    g.lineStyle(3, kind === "noli" ? COLORS.maroon : COLORS.gold).strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    g.lineStyle(1, kind === "noli" ? COLORS.gold : COLORS.goldLight, 0.7).strokeRoundedRect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14, 8);
    c.add(g);
    c.add(this.art(0, -h * 0.13, kind === "noli" ? "📖" : "🗡️", w * 0.46));
    c.add(this.txt(0, h * 0.2, kind.toUpperCase(), {
      fontFamily: SERIF, fontStyle: "900", fontSize: `${Math.round(w * 0.22)}px`, color: kind === "noli" ? "#6e1a2c" : "#f1d58a",
    }).setOrigin(0.5));
    c.add(this.txt(0, h * 0.34, kind === "noli" ? "Me Tangere" : "Filibusterismo", {
      fontFamily: SERIF, fontStyle: "italic", fontSize: `${Math.round(w * 0.1)}px`, color: kind === "noli" ? "#6e1a2c" : "#f1d58a",
    }).setOrigin(0.5).setAlpha(0.85));
    return c;
  }

  drawDecks() {
    this.decks = {};
    [["noli", CX - 245, -9], ["fili", CX + 245, 9]].forEach(([kind, x, ang]) => {
      const deck = this.add.container(x, O + 430).setAngle(ang).setDepth(15);
      const sh = this.add.graphics();
      sh.fillStyle(0x000000, 0.22).fillRoundedRect(-55 + 8, -78 + 12, 110, 156, 12);
      sh.fillStyle(0xd9bf7a).fillRoundedRect(-55 + 6, -78 + 6, 110, 156, 12);
      sh.fillStyle(0xe8d29a).fillRoundedRect(-55 + 3, -78 + 3, 110, 156, 12);
      deck.add(sh);
      deck.add(this.makeCard(kind, 110, 156));
      deck.setSize(110, 156).setInteractive({ useHandCursor: true });
      deck.on("pointerover", () => this.tweens.add({ targets: deck, y: O + 420, duration: 150 }));
      deck.on("pointerout", () => this.tweens.add({ targets: deck, y: O + 430, duration: 150 }));
      deck.on("pointerup", () => this.handlers.onDeck && this.handlers.onDeck(kind));
      this.decks[kind] = deck;
    });
  }

  drawDiceTray() {
    const x = CX, y = O + 430, w = 280, h = 165;
    const g = this.add.graphics().setDepth(14);
    g.fillStyle(0x000000, 0.25).fillRoundedRect(x - w / 2 - 10, y - h / 2 - 4, w + 20, h + 22, 26);
    g.fillStyle(0x8a5a2b).fillRoundedRect(x - w / 2 - 12, y - h / 2 - 12, w + 24, h + 24, 26);
    g.lineStyle(3, COLORS.gold).strokeRoundedRect(x - w / 2 - 12, y - h / 2 - 12, w + 24, h + 24, 26);
    g.fillGradientStyle(COLORS.felt, COLORS.felt, COLORS.feltDark, COLORS.feltDark, 1);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 18);
    g.fillStyle(0x000000, 0.25).fillRoundedRect(x - w / 2, y - h / 2, w, 14, { tl: 18, tr: 18, bl: 0, br: 0 });
    this.tray = { x, y, w, h };
    this.dice = [this.makeDie(x - 50, y), this.makeDie(x + 50, y)];
    this.setDie(this.dice[0], 1); this.setDie(this.dice[1], 1);
  }

  makeDie(x, y) {
    const shadow = this.add.ellipse(x + 4, y + 34, 64, 16, 0x000000, 0.4).setDepth(16);
    const c = this.add.container(x, y).setDepth(17);
    const g = this.add.graphics();
    c.add(g);
    return { c, g, shadow, value: 1 };
  }

  setDie(d, v) {
    const s = 62, g = d.g;
    d.value = v;
    g.clear();
    g.fillStyle(0x000000, 0.15).fillRoundedRect(-s / 2 + 2, -s / 2 + 4, s, s, 14);
    g.fillGradientStyle(0xfffef8, 0xfffef8, 0xeadcb8, 0xeadcb8, 1).fillRoundedRect(-s / 2, -s / 2, s, s, 14);
    g.lineStyle(2, 0xd8c79c).strokeRoundedRect(-s / 2, -s / 2, s, s, 14);
    const P = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }[v];
    P.forEach(k => {
      const px = ((k % 3) - 1) * 17, py = (Math.floor(k / 3) - 1) * 17;
      const big = v === 1;
      g.fillStyle(big ? 0xa1162d : COLORS.maroon).fillCircle(px, py, big ? 9 : 6);
      g.fillStyle(0xffffff, 0.35).fillCircle(px - 2, py - 2, big ? 3 : 2);
    });
  }

  makeButton(x, y, label, color, onClick) {
    const w = 210, h = 62;
    const c = this.add.container(x, y).setDepth(30);
    const glow = this.add.graphics().fillStyle(0xffd34d, 0.55).fillRoundedRect(-w / 2 - 8, -h / 2 - 8, w + 16, h + 16, 22).setAlpha(0);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25).fillRoundedRect(-w / 2, -h / 2 + 5, w, h, 16);
    g.fillStyle(color).fillRoundedRect(-w / 2, -h / 2, w, h, 16);
    g.fillStyle(0xffffff, 0.14).fillRoundedRect(-w / 2 + 4, -h / 2 + 3, w - 8, h / 2 - 3, 12);
    g.lineStyle(2, 0x000000, 0.25).strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
    const t = this.txt(0, 0, label, { fontFamily: SANS, fontStyle: "900", fontSize: "24px", color: "#ffffff" }).setOrigin(0.5);
    c.add([glow, g, t]);
    c.setSize(w, h).setInteractive({ useHandCursor: true });
    c.on("pointerover", () => c.enabled && this.tweens.add({ targets: c, scale: 1.06, duration: 100 }));
    c.on("pointerout", () => this.tweens.add({ targets: c, scale: 1, duration: 100 }));
    c.on("pointerdown", () => c.enabled && this.tweens.add({ targets: c, scale: 0.95, duration: 60, yoyo: true }));
    c.on("pointerup", () => c.enabled && onClick());
    c.enabled = true;
    c.glow = glow;
    c.glowTween = this.tweens.add({ targets: glow, alpha: 0.9, duration: 800, yoyo: true, repeat: -1, paused: true });
    return c;
  }

  drawControls() {
    // current player plate
    const y = O + 588;
    this.plate = this.add.container(CX, y).setDepth(30);
    this.plateBg = this.add.graphics();
    this.plateAvatarBg = this.add.graphics();
    this.plateArt = this.add.image(-118, 0, "__DEFAULT").setVisible(false);
    this.plateName = this.txt(-72, -14, "", { fontFamily: SERIF, fontStyle: "900", fontSize: "30px", color: "#2b1d14" }).setOrigin(0, 0.5);
    this.plateSub = this.txt(-72, 18, "", { fontFamily: SANS, fontStyle: "700", fontSize: "17px", color: "#6b5a45" }).setOrigin(0, 0.5);
    this.plate.add([this.plateBg, this.plateAvatarBg, this.plateArt, this.plateName, this.plateSub]);

    this.msg = this.txt(CX, O + 665, "", {
      fontFamily: SANS, fontStyle: "700", fontSize: "22px", color: "#2b1d14", align: "center", wordWrap: { width: 560 },
    }).setOrigin(0.5).setDepth(30);

    this.rollBtn = this.makeButton(CX - 118, O + 745, "🎲  Roll Dice", COLORS.maroon, () => this.handlers.onRoll());
    this.endBtn = this.makeButton(CX + 118, O + 745, "End Turn  ➜", COLORS.green, () => this.handlers.onEnd());
  }

  setButton(btn, enabled, glow) {
    btn.enabled = enabled;
    btn.setAlpha(enabled ? 1 : 0.4);
    if (enabled && glow) { btn.glowTween.resume(); } else { btn.glowTween.pause(); btn.glow.setAlpha(0); }
  }

  /* ---------- state sync ---------- */
  sync(G, { busy, msg, canAct = true }) {
    const p = G.players[G.turn];
    const ch = charById(p.char);
    // plate
    const name = G.phase === "over" ? "Game over" : p.name;
    this.plateName.setText(name);
    this.plateSub.setText(G.phase === "over" ? "" : `${ch.name} · ₱${p.money.toLocaleString("en-PH")}`);
    const w = Math.max(this.plateName.width, this.plateSub.width) + 120 + 30;
    const shift = -w / 2;
    this.plateBg.clear()
      .fillStyle(0x000000, 0.15).fillRoundedRect(shift + 3, -40 + 6, w, 80, 40)
      .fillStyle(0xfffaf0).fillRoundedRect(shift, -40, w, 80, 40)
      .lineStyle(4, hex(ch.color)).strokeRoundedRect(shift, -40, w, 80, 40);
    this.plateAvatarBg.clear()
      .fillStyle(0xffd34d, 0.5).fillCircle(shift + 42, 0, 36)
      .fillStyle(hex(ch.color)).fillCircle(shift + 42, 0, 30)
      .lineStyle(3, COLORS.gold).strokeCircle(shift + 42, 0, 30);
    this.plateArt.setTexture(charKey(ch.id)).setDisplaySize(58, 58).setPosition(shift + 42, 0).setVisible(true);
    this.plateName.setX(shift + 86); this.plateSub.setX(shift + 86);
    if (this.lastTurn !== G.turn) {
      this.lastTurn = G.turn;
      this.plate.setScale(0.6);
      this.tweens.add({ targets: this.plate, scale: 1, duration: 450, ease: "Back.out" });
    }

    this.msg.setText(msg || "");
    this.setButton(this.rollBtn, canAct && !busy && G.phase === "roll", true);
    this.setButton(this.endBtn, canAct && !busy && G.phase === "end", false);

    // ownership
    TILES.forEach((t, i) => {
      const tile = this.tiles[i];
      const own = G.owned[i];
      const key = own ? `${own.owner}:${own.level}` : "";
      if (tile.ownKey === key) return;
      tile.ownKey = key;
      tile.own.clear();
      tile.marks.removeAll(true);
      if (!own) return;
      const oc = charById(G.players[own.owner].char);
      const { w: tw, h: th } = tile.r;
      tile.own.lineStyle(5, hex(oc.color)).strokeRect(-tw / 2 + 2.5, -th / 2 + 2.5, tw - 5, th - 5);
      const mx = tw / 2 - 14, my = -th / 2 + 12;
      const mg = this.add.graphics().fillStyle(0xffffff).fillCircle(mx, my, 13).fillStyle(hex(oc.color)).fillCircle(mx, my, 10.5);
      tile.marks.add(mg);
      tile.marks.add(this.portrait(mx, my, oc, 21));
      for (let k = 0; k < own.level; k++) tile.marks.add(this.art(-tw / 2 + 12 + k * 15, -th / 2 + 12, "🏛️", 18));
    });

    // tokens
    G.players.forEach((pl, pi) => {
      if (!this.tokens[pi]) this.tokens[pi] = this.makeToken(pl);
      const tk = this.tokens[pi];
      tk.c.setVisible(!pl.bankrupt);
      tk.setActive(pi === G.turn && G.phase !== "over");
      if (!tk.moving) {
        const pos = this.tokenPos(G, pi, pl.pos);
        tk.c.setPosition(pos.x, pos.y);
      }
    });
  }

  tokenPos(G, pi, tileIndex) {
    const same = G.players.map((q, qi) => qi).filter(qi => !G.players[qi].bankrupt && G.players[qi].pos === tileIndex);
    const k = Math.max(0, same.indexOf(pi));
    const off = same.length > 1 ? CLUSTER[k % CLUSTER.length] : [0, 0];
    const c = tileCenter(tileIndex);
    return { x: c.x + off[0] * 20, y: c.y + 10 + off[1] * 20 };
  }

  makeToken(pl) {
    const ch = charById(pl.char);
    const c = this.add.container(0, 0);
    this.tokenLayer.add(c);
    const shadow = this.add.ellipse(0, 24, 40, 12, 0x000000, 0.35);
    const ring = this.add.circle(0, 0, 30, 0xffd34d, 0.6).setVisible(false);
    const body = this.add.container(0, 0);
    const g = this.add.graphics()
      .fillStyle(0x000000, 0.3).fillCircle(1, 3, 23)
      .fillStyle(0xffffff).fillCircle(0, 0, 23)
      .fillStyle(hex(ch.color)).fillCircle(0, 0, 19.5)
      .fillStyle(0xffffff, 0.22).fillCircle(-6, -7, 9);
    body.add([g, this.portrait(0, 0, ch, 40)]);
    const arrow = this.txt(0, -46, "▼", { fontSize: "22px", color: "#ffd34d", stroke: "#4a0f1c", strokeThickness: 4 }).setOrigin(0.5).setVisible(false);
    c.add([shadow, ring, body, arrow]);
    const ringTw = this.tweens.add({ targets: ring, scale: 1.25, alpha: 0.1, duration: 800, repeat: -1, paused: true });
    const arrowTw = this.tweens.add({ targets: arrow, y: -54, duration: 420, yoyo: true, repeat: -1, ease: "Sine.inOut", paused: true });
    return {
      c, body, shadow,
      setActive(on) {
        ring.setVisible(on); arrow.setVisible(on);
        if (on) { ringTw.resume(); arrowTw.resume(); c.setDepth(5); } else { ringTw.pause(); arrowTw.pause(); c.setDepth(1); }
        c.parentContainer && c.parentContainer.sort("depth");
      },
    };
  }

  /* ---------- animations (all return promises) ---------- */
  reset() {
    this.clearBubbles();
    this.tokens.forEach(t => t && t.c.destroy());
    this.tokens = [];
    this.lastTurn = null;
    this.tiles.forEach(t => { t.ownKey = null; });
  }

  hop(G, pi, toIndex, fast) {
    const tk = this.tokens[pi];
    const to = this.tokenPos(G, pi, toIndex);
    tk.moving = true;
    return new Promise(res => {
      const fromX = tk.c.x, fromY = tk.c.y;
      this.tweens.addCounter({
        from: 0, to: 1, duration: fast ? 120 : 230, ease: "Sine.inOut",
        onUpdate: tw => {
          const t = tw.getValue();
          tk.c.setPosition(fromX + (to.x - fromX) * t, fromY + (to.y - fromY) * t);
          const lift = Math.sin(t * Math.PI) * 30;
          tk.body.y = -lift;
          tk.shadow.setScale(1 - lift / 60);
        },
        onComplete: () => {
          tk.body.y = 0; tk.shadow.setScale(1);
          this.tweens.add({ targets: tk.body, scaleY: 0.85, scaleX: 1.12, duration: 60, yoyo: true });
          tk.moving = false; res();
        },
      });
    });
  }

  teleport(G, pi, toIndex) {
    const tk = this.tokens[pi];
    const to = this.tokenPos(G, pi, toIndex);
    tk.moving = true;
    return new Promise(res => {
      this.tweens.add({
        targets: tk.c, scale: 0, angle: 360, duration: 350, ease: "Back.in",
        onComplete: () => {
          tk.c.setPosition(to.x, to.y).setAngle(0);
          this.puff(to.x, to.y);
          this.tweens.add({ targets: tk.c, scale: 1, duration: 400, ease: "Back.out", onComplete: () => { tk.moving = false; res(); } });
        },
      });
    });
  }

  puff(x, y) {
    const e = this.add.particles(x, y, "dot", {
      speed: { min: 60, max: 180 }, lifespan: 600, scale: { start: 1.6, end: 0 }, alpha: { start: 0.8, end: 0 },
      tint: [0xffffff, 0xd9bf7a], emitting: false,
    }).setDepth(85);
    e.explode(24);
    this.time.delayedCall(800, () => e.destroy());
  }

  rollDice(d1, d2) {
    const { x, y, w } = this.tray;
    const finals = [[x - 50 + Phaser.Math.Between(-12, 12), y + Phaser.Math.Between(-12, 12)], [x + 50 + Phaser.Math.Between(-12, 12), y + Phaser.Math.Between(-12, 12)]];
    const vals = [d1, d2];
    return new Promise(res => {
      let flips = this.time.addEvent({
        delay: 70, loop: true,
        callback: () => this.dice.forEach(d => this.setDie(d, Phaser.Math.Between(1, 6))),
      });
      this.dice.forEach((d, k) => {
        const startX = x - w / 2 + 30 + k * 20, startY = y - 60;
        d.c.setPosition(startX, startY).setAngle(Phaser.Math.Between(-180, 180)).setScale(1.3);
        d.shadow.setPosition(startX + 4, startY + 34);
        this.tweens.add({ targets: d.c, x: finals[k][0], duration: 900, ease: "Cubic.out" });
        this.tweens.add({ targets: d.c, y: finals[k][1], duration: 900, ease: "Bounce.out" });
        this.tweens.add({ targets: d.c, angle: Phaser.Math.Between(-15, 15) + (k ? 720 : -720), scale: 1, duration: 900, ease: "Cubic.out" });
        this.tweens.add({ targets: d.shadow, x: finals[k][0] + 4, y: finals[k][1] + 34, duration: 900, ease: "Cubic.out" });
      });
      this.time.delayedCall(820, () => {
        flips.remove(); flips = null;
        this.dice.forEach((d, k) => this.setDie(d, vals[k]));
      });
      this.time.delayedCall(950, () => {
        this.cameras.main.shake(120, 0.003);
        this.badge(d1 === d2 ? `${d1 + d2} · Doubles!` : String(d1 + d2), d1 === d2);
        res();
      });
    });
  }

  badge(text, special) {
    const { x, y, h } = this.tray;
    const t = this.txt(0, 0, text, { fontFamily: SERIF, fontStyle: "900", fontSize: "30px", color: special ? "#2b1d14" : "#ffffff" }).setOrigin(0.5);
    const bw = t.width + 40;
    const g = this.add.graphics()
      .fillStyle(special ? 0xf1c232 : COLORS.maroon).fillRoundedRect(-bw / 2, -24, bw, 48, 24)
      .lineStyle(3, COLORS.gold).strokeRoundedRect(-bw / 2, -24, bw, 48, 24);
    const c = this.add.container(x, y - h / 2 - 18, [g, t]).setDepth(60).setScale(0.2);
    this.tweens.chain({
      targets: c,
      tweens: [
        { scale: 1.15, duration: 220, ease: "Back.out" },
        { scale: 1, duration: 120 },
        { y: c.y - 30, alpha: 0, delay: 900, duration: 400, onComplete: () => c.destroy() },
      ],
    });
  }

  drawCardFly(kind) {
    const deck = this.decks[kind];
    const card = this.makeCard(kind, 110, 156).setPosition(deck.x, deck.y).setAngle(deck.angle).setDepth(95);
    return new Promise(res => {
      this.tweens.chain({
        targets: card,
        tweens: [
          { y: deck.y - 40, duration: 160, ease: "Sine.out" },
          { x: CX, y: O + 420, angle: 0, scale: 2.2, duration: 420, ease: "Cubic.inOut" },
          { scaleX: 0, duration: 160, ease: "Sine.in" },
        ],
        onComplete: () => { card.destroy(); res(); },
      });
    });
  }

  stamp(i) {
    const tile = this.tiles[i];
    tile.c.setDepth(40);
    this.tweens.chain({
      targets: tile.c,
      tweens: [{ scale: 1.3, angle: -4, duration: 180, ease: "Back.out" }, { scale: 1, angle: 0, duration: 260, ease: "Sine.out" }],
      onComplete: () => tile.c.setDepth(10),
    });
    const { x, y } = tileCenter(i);
    this.puff(x, y);
  }

  highlight(i) {
    const hl = this.tiles[i].hl;
    this.tweens.add({ targets: hl, alpha: { from: 0.55, to: 0 }, duration: 1400, ease: "Sine.out" });
  }

  floatAtTile(i, text, good) {
    const { x, y } = tileCenter(i);
    const t = this.txt(x, y - 20, text, {
      fontFamily: SERIF, fontStyle: "900", fontSize: "30px", color: good ? "#1f7a45" : "#b3261e", stroke: "#fffaf0", strokeThickness: 6,
    }).setOrigin(0.5).setDepth(96);
    this.tweens.add({ targets: t, y: y - 90, alpha: { from: 1, to: 0 }, duration: 1500, ease: "Cubic.out", onComplete: () => t.destroy() });
  }

  /* ---------- chat speech bubbles over tokens ---------- */
  /** pi = seat (or -1 for a host with no seat, shown at the top of the board) */
  say(pi, text, color, name) {
    this.bubbles ||= new Map();
    const old = this.bubbles.get(pi);
    if (old) { old.tw && old.tw.stop(); old.c.destroy(); this.bubbles.delete(pi); }
    const c = this.add.container(0, 0).setDepth(88);
    const label = pi < 0 ? this.txt(0, 0, name || "Host", {
      fontFamily: SANS, fontStyle: "900", fontSize: "18px", color: "#6e1a2c",
    }).setOrigin(0.5, 0) : null;
    const t = this.txt(0, 0, text, {
      fontFamily: SANS, fontStyle: "700", fontSize: "25px", color: "#2b1d14", align: "center",
      wordWrap: { width: 300, useAdvancedWrap: true },
    }).setOrigin(0.5, 0);
    const padX = 18, padY = 12, gap = label ? 2 : 0;
    const w = Math.max(t.width, label ? label.width : 0) + padX * 2;
    const h = t.height + (label ? label.height + gap : 0) + padY * 2;
    const g = this.add.graphics();
    const draw = flip => {
      g.clear();
      const top = flip ? 14 : -h - 14;
      g.fillStyle(0x000000, 0.25).fillRoundedRect(-w / 2 + 2, top + 4, w, h, 16);
      g.fillStyle(0xfffaf0).fillRoundedRect(-w / 2, top, w, h, 16);
      g.lineStyle(4, hex(color || "#b8913a")).strokeRoundedRect(-w / 2, top, w, h, 16);
      // the tail pointing at the token
      const ty = flip ? top : top + h;
      const dir = flip ? -1 : 1;
      g.fillStyle(0xfffaf0).fillTriangle(-11, ty - dir * 2, 11, ty - dir * 2, 0, ty + dir * 16);
      g.lineStyle(4, hex(color || "#b8913a")).lineBetween(-11, ty, 0, ty + dir * 16).lineBetween(11, ty, 0, ty + dir * 16);
      if (label) label.setY(top + padY);
      t.setY(top + padY + (label ? label.height + gap : 0));
    };
    c.add([g, ...(label ? [label] : []), t]);
    const b = { c, w, h, draw, flip: null, pi };
    this.bubbles.set(pi, b);
    this.placeBubble(b);
    c.setScale(0.2).setAlpha(0);
    this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 260, ease: "Back.out" });
    const life = Math.min(7000, 3200 + text.length * 55);
    b.tw = this.tweens.add({
      targets: c, alpha: 0, scale: 0.85, delay: life, duration: 350,
      onComplete: () => { c.destroy(); if (this.bubbles.get(pi) === b) this.bubbles.delete(pi); },
    });
  }

  placeBubble(b) {
    let x, y, flip;
    if (b.pi < 0) { x = CX; y = O + C + 40; flip = true; }
    else {
      const tk = this.tokens[b.pi];
      if (!tk || !tk.c.visible) { b.c.setVisible(false); return; }
      b.c.setVisible(true);
      x = tk.c.x; y = tk.c.y + tk.body.y - 30;
      flip = y - b.h - 20 < 4;           // near the top edge: hang the bubble below the token
      if (flip) y = tk.c.y + 26;
    }
    if (flip !== b.flip) { b.flip = flip; b.draw(flip); }
    const half = b.w / 2 + 6;
    b.c.setPosition(Math.max(half, Math.min(SIZE - half, x)), y);
  }

  clearBubbles() {
    if (!this.bubbles) return;
    this.bubbles.forEach(b => { b.tw && b.tw.stop(); b.c.destroy(); });
    this.bubbles.clear();
  }

  update() {
    if (!this.bubbles || !this.bubbles.size) return;
    const list = [...this.bubbles.values()];
    list.forEach(b => this.placeBubble(b));
    // tokens often share a tile: stack older bubbles above (or below) newer ones instead of overlapping
    const box = b => {
      const top = b.flip ? b.c.y + 14 : b.c.y - b.h - 14;
      return { l: b.c.x - b.w / 2, r: b.c.x + b.w / 2, t: top, btm: top + b.h };
    };
    for (let i = list.length - 2; i >= 0; i--) {
      const older = list[i];
      if (!older.c.visible) continue;
      for (let j = list.length - 1; j > i; j--) {
        const a = box(older), n = box(list[j]);
        if (!list[j].c.visible || a.r <= n.l || a.l >= n.r || a.btm <= n.t || a.t >= n.btm) continue;
        older.c.y += older.flip ? n.btm + 6 - a.t : n.t - 6 - a.btm;
      }
    }
  }

  confetti(n = 120) {
    this.confettiEmitter.explode(Math.round(n / 2), CX - 200, O + 420);
    this.confettiEmitter.explode(Math.round(n / 2), CX + 200, O + 420);
  }
}

/* ---------- public API ---------- */
export function createBoard(parent, handlers) {
  return new Promise(resolve => {
    const scene = new BoardScene(handlers);
    scene.ready = () => resolve(scene);
    new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: SIZE,
      height: SIZE,
      transparent: true,
      scene,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
      render: { antialias: true, roundPixels: false },
      banner: false,
    });
  });
}
