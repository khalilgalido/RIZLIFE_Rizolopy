/* Rizalopoly effects: 3D dice, sounds, confetti, floating money text. */
const FX = (function () {
  "use strict";

  /* ---------------- 3D dice ---------------- */
  // which pips are filled on a 3x3 grid for each value
  const PIPS = {
    1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
  };
  // rotation that brings each face to the front
  const SHOW = { 1: [0, 0], 2: [0, -90], 3: [-90, 0], 4: [90, 0], 5: [0, 90], 6: [0, 180] };
  const FACE_TF = {
    1: "rotateY(0deg)", 2: "rotateY(90deg)", 3: "rotateX(90deg)",
    4: "rotateX(-90deg)", 5: "rotateY(-90deg)", 6: "rotateY(180deg)",
  };
  const spins = [];

  function faceHtml(v) {
    let pips = "";
    for (let k = 0; k < 9; k++) pips += `<i class="${PIPS[v].includes(k) ? "on" : ""}"></i>`;
    return `<div class="face f${v}" style="--tf:${FACE_TF[v]}">${pips}</div>`;
  }

  function buildDice(container) {
    container.innerHTML = [0, 1].map(() =>
      `<div class="die-wrap"><div class="cube">${[1, 2, 3, 4, 5, 6].map(faceHtml).join("")}</div><div class="die-shadow"></div></div>`).join("");
    spins.length = 0;
    spins.push({ x: 0, y: 0 }, { x: 0, y: 0 });
  }

  function setDie(cube, idx, value, spin) {
    const s = spins[idx];
    if (spin) { s.x += 2 + Math.floor(Math.random() * 2); s.y += 2 + Math.floor(Math.random() * 2); }
    const [rx, ry] = SHOW[value];
    cube.style.transform = `rotateX(${s.x * 360 + rx}deg) rotateY(${s.y * 360 + ry}deg)`;
  }

  function showDice(container, values, spin) {
    const cubes = container.querySelectorAll(".cube");
    cubes.forEach((c, i) => setDie(c, i, values[i], spin));
    if (spin) {
      container.querySelectorAll(".die-wrap").forEach(w => {
        w.classList.remove("tossing"); void w.offsetWidth; w.classList.add("tossing");
      });
    }
  }

  /* ---------------- Sound (Web Audio, no files) ---------------- */
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem("rizalopoly-muted") === "1"; } catch (e) { /* ignore */ }

  function ac() {
    if (muted) return null;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch (e) { return null; }
  }

  function tone(freq, dur, { type = "sine", vol = 0.15, delay = 0, slide = 0 } = {}) {
    const a = ac(); if (!a) return;
    const t = a.currentTime + delay;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(dur, { vol = 0.12, delay = 0, freq = 1800 } = {}) {
    const a = ac(); if (!a) return;
    const t = a.currentTime + delay;
    const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = a.createBufferSource(); src.buffer = buf;
    const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq;
    const g = a.createGain(); g.gain.value = vol;
    src.connect(f).connect(g).connect(a.destination);
    src.start(t);
  }

  const sound = {
    dice() { for (let k = 0; k < 7; k++) noise(0.05, { delay: k * 0.07 + Math.random() * 0.03, freq: 1500 + Math.random() * 1500, vol: 0.18 }); },
    step() { tone(520 + Math.random() * 60, 0.06, { type: "triangle", vol: 0.08 }); },
    coin() { tone(988, 0.08, { type: "square", vol: 0.06 }); tone(1319, 0.25, { type: "square", vol: 0.06, delay: 0.08 }); },
    pay() { tone(392, 0.12, { type: "triangle", vol: 0.12 }); tone(262, 0.22, { type: "triangle", vol: 0.12, delay: 0.1 }); },
    card() { noise(0.25, { freq: 3500, vol: 0.09 }); tone(660, 0.12, { vol: 0.06, delay: 0.15 }); },
    right() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, { type: "triangle", vol: 0.12, delay: i * 0.08 })); },
    wrong() { tone(220, 0.35, { type: "sawtooth", vol: 0.07, slide: -80 }); },
    turn() { tone(587, 0.1, { type: "triangle", vol: 0.1 }); tone(880, 0.18, { type: "triangle", vol: 0.1, delay: 0.09 }); },
    exile() { [392, 349, 311, 262].forEach((f, i) => tone(f, 0.22, { type: "triangle", vol: 0.1, delay: i * 0.14 })); },
    fanfare() { [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, { type: "square", vol: 0.06, delay: i * 0.13 })); },
    build() { tone(330, 0.08, { type: "square", vol: 0.07 }); tone(494, 0.08, { type: "square", vol: 0.07, delay: 0.09 }); tone(659, 0.2, { type: "square", vol: 0.07, delay: 0.18 }); },
  };

  function setMuted(m) {
    muted = m;
    try { localStorage.setItem("rizalopoly-muted", m ? "1" : "0"); } catch (e) { /* ignore */ }
  }

  /* ---------------- Confetti ---------------- */
  function confetti(duration = 3500, count = 180) {
    const c = document.createElement("canvas");
    c.className = "confetti";
    document.body.appendChild(c);
    const x = c.getContext("2d");
    const resize = () => { c.width = innerWidth; c.height = innerHeight; };
    resize();
    const colors = ["#6e1a2c", "#1e4d3a", "#b8913a", "#f1c232", "#e78fb8", "#7fc3e3", "#e8843a", "#fff"];
    const parts = Array.from({ length: count }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.3,
      y: innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 16 - 4,
      w: 6 + Math.random() * 8, h: 4 + Math.random() * 6,
      r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      col: colors[Math.floor(Math.random() * colors.length)],
    }));
    const start = performance.now();
    (function frame(now) {
      const t = now - start;
      x.clearRect(0, 0, c.width, c.height);
      parts.forEach(p => {
        p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        x.save(); x.translate(p.x, p.y); x.rotate(p.r);
        x.globalAlpha = Math.max(0, 1 - t / duration);
        x.fillStyle = p.col; x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        x.restore();
      });
      if (t < duration) requestAnimationFrame(frame); else c.remove();
    })(start);
  }

  /* ---------------- Floating text ---------------- */
  function floatText(anchor, text, good) {
    if (!anchor) return;
    const r = anchor.getBoundingClientRect();
    const el = document.createElement("div");
    el.className = "float-text " + (good ? "good" : "bad");
    el.textContent = text;
    el.style.left = r.left + r.width / 2 + "px";
    el.style.top = r.top + r.height / 2 + "px";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }

  return { buildDice, showDice, sound, setMuted, isMuted: () => muted, confetti, floatText };
})();
