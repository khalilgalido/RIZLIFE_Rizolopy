/* Rizolopy effects: sound (Howler with synth fallback), music, confetti, floating money text. */
import { Howl, Howler } from "howler";

/* Drop audio files named after a sound (dice.mp3, coin.ogg, music.mp3 ...) into src/assets/audio
   and Howler plays them instead of the built-in synthesised sounds. */
const audioFiles = import.meta.glob("./assets/audio/*.{mp3,ogg,wav,m4a}", { eager: true, query: "?url", import: "default" });
const howls = {};
for (const [path, url] of Object.entries(audioFiles)) {
  const name = path.split("/").pop().replace(/\.[^.]+$/, "");
  howls[name] = new Howl({ src: [url], volume: name === "music" ? 0.35 : 0.8, loop: name === "music", preload: true });
}

export const FX = (function () {

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

  const synth = {
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
    chat() { tone(880, 0.06, { type: "sine", vol: 0.05 }); tone(1175, 0.08, { type: "sine", vol: 0.05, delay: 0.06 }); },
    build() { tone(330, 0.08, { type: "square", vol: 0.07 }); tone(494, 0.08, { type: "square", vol: 0.07, delay: 0.09 }); tone(659, 0.2, { type: "square", vol: 0.07, delay: 0.18 }); },
  };

  // every sound: use a Howler file when one exists, otherwise the synth version
  const sound = {};
  Object.keys(synth).forEach(name => {
    sound[name] = () => {
      if (muted) return;
      if (howls[name]) howls[name].play(); else synth[name]();
    };
  });

  /* ---------------- Background music ----------------
     A gentle 3/4 loop in A minor (a nod to the kundiman), scheduled with Web Audio.
     Replaced by src/assets/audio/music.* through Howler when that file exists. */
  let musicOn = true;
  try { musicOn = localStorage.getItem("rizalopoly-music") !== "0"; } catch (e) { /* ignore */ }
  let musicTimer = null, musicGain = null, step = 0;
  const N = f => 440 * Math.pow(2, (f - 69) / 12);
  // chords (midi) per bar, melody (midi or 0) per beat
  const BARS = [
    { chord: [57, 60, 64], mel: [76, 74, 72] }, { chord: [53, 57, 60], mel: [72, 0, 69] },
    { chord: [55, 59, 62], mel: [71, 72, 74] }, { chord: [52, 56, 59], mel: [76, 0, 0] },
    { chord: [57, 60, 64], mel: [72, 74, 76] }, { chord: [50, 53, 57], mel: [77, 76, 74] },
    { chord: [52, 56, 59], mel: [72, 71, 68] }, { chord: [57, 60, 64], mel: [69, 0, 0] },
  ];
  const BEAT = 0.62;
  function pluck(a, freq, t, vol, dur) {
    const o = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter();
    o.type = "triangle"; o.frequency.value = freq;
    f.type = "lowpass"; f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(500, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f).connect(g).connect(musicGain); o.start(t); o.stop(t + dur + 0.05);
  }
  function scheduleBar(a, t) {
    const bar = BARS[step % BARS.length];
    // guitar-like: bass on 1, chord on 2 and 3
    pluck(a, N(bar.chord[0] - 12), t, 0.22, BEAT * 2.5);
    [1, 2].forEach(b => bar.chord.forEach((n, k) => pluck(a, N(n), t + b * BEAT + k * 0.02, 0.06, BEAT * 1.2)));
    bar.mel.forEach((n, b) => { if (n) pluck(a, N(n), t + b * BEAT, 0.1, BEAT * (bar.mel[b + 1] === 0 ? 2.6 : 1.1)); });
    step++;
  }
  function startMusic() {
    if (!musicOn || muted || musicTimer) return;
    if (howls.music) { if (!howls.music.playing()) howls.music.play(); musicTimer = "howl"; return; }
    const a = ac(); if (!a) return;
    musicGain = a.createGain(); musicGain.gain.value = 0.5; musicGain.connect(a.destination);
    let next = a.currentTime + 0.1;
    const tick = () => { while (next < a.currentTime + 1.5) { scheduleBar(a, next); next += BEAT * 3; } };
    tick();
    musicTimer = setInterval(tick, 400);
  }
  function stopMusic() {
    if (musicTimer === "howl") howls.music.stop();
    else if (musicTimer) { clearInterval(musicTimer); if (musicGain) { musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.2); } }
    musicTimer = null;
  }
  function setMusic(on) {
    musicOn = on;
    try { localStorage.setItem("rizalopoly-music", on ? "1" : "0"); } catch (e) { /* ignore */ }
    if (on) startMusic(); else stopMusic();
  }

  function setMuted(m) {
    muted = m;
    Howler.mute(m);
    if (m) stopMusic(); else startMusic();
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

  return { sound, setMuted, isMuted: () => muted, setMusic, isMusicOn: () => musicOn, startMusic, confetti, floatText };
})();
