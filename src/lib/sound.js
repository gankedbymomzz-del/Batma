// Âm thanh kinh dị tổng hợp bằng Web Audio — không cần file mp3
let ctx = null;
let noiseBuf = null;
let bus = null;
let screamBuf = null;
const MUTE_KEY = 'san-ma-muted';
let muted = (() => { try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; } })();

export const getCtx = () => ctx;
export const getNoise = () => noiseBuf;
export const getBus = () => bus;
export const isMuted = () => muted;

export function setMuted(m) {
  muted = m;
  try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch { /* bỏ qua */ }
  if (bus && ctx) bus.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.05);
}

export function unlockAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
      bus = ctx.createGain();
      bus.gain.value = muted ? 0 : 1;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 5;
      bus.connect(comp).connect(ctx.destination);
      loadScream();
    }
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    ctx = null;
  }
}

// Tiếng hét thật (file mp3 tổng hợp sẵn) — nạp trước để phát ngay lúc hù
async function loadScream() {
  try {
    const r = await fetch('/sfx/scream.mp3');
    const ab = await r.arrayBuffer();
    screamBuf = await new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej));
  } catch { screamBuf = null; }
}

export function pauseAudio(hidden) {
  if (!ctx) return;
  try { if (hidden) ctx.suspend(); else ctx.resume(); } catch { /* bỏ qua */ }
}

// Thoát hẳn trang: giải phóng toàn bộ âm thanh
export function closeAudio() {
  try { ctx?.close(); } catch { /* bỏ qua */ }
}

function out(pan) {
  if (pan && ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    p.connect(bus);
    return p;
  }
  return bus;
}

export function tone(freq, dur, { type = 'sine', vol = 0.12, to = null, delay = 0, pan = 0, attack = 0.02 } = {}) {
  if (!ctx || document.hidden) return;
  try {
    const t0 = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(out(pan));
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  } catch { /* bỏ qua */ }
}

export function noise(dur, { vol = 0.2, freq = 1200, q = 1, type = 'bandpass', delay = 0, to = null, pan = 0, attack = 0.03 } = {}) {
  if (!ctx || !noiseBuf || document.hidden) return;
  try {
    const t0 = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t0);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(out(pan));
    src.start(t0, Math.random() * 1.5);
    src.stop(t0 + dur + 0.05);
  } catch { /* bỏ qua */ }
}

const side = () => (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.5);

export const sfx = {
  spawn: () => {
    tone(48, 2, { vol: 0.22, to: 36 });
    tone(50.5, 2, { type: 'triangle', vol: 0.08, to: 38 });
    noise(1.8, { vol: 0.08, freq: 700, q: 7, to: 250, pan: side() });
  },
  throw: () => noise(0.35, { vol: 0.14, freq: 2600, q: 2, to: 500 }),
  hit: () => { tone(120, 0.3, { type: 'square', vol: 0.08, to: 50 }); noise(0.2, { vol: 0.12, freq: 900, q: 1 }); },
  miss: () => tone(200, 0.35, { vol: 0.08, to: 80 }),
  shake: () => { tone(85, 0.14, { type: 'square', vol: 0.09 }); noise(0.1, { vol: 0.08, freq: 3000, q: 3 }); },
  // Phong ấn thành công: tiếng chiêng + chuông ngân
  gong: () => {
    [[98, 0.32], [196.5, 0.16], [262.7, 0.1], [331, 0.08], [419, 0.05]].forEach(([f, v]) =>
      tone(f, 4.2, { vol: v, to: f * 0.985, attack: 0.005 }));
    noise(0.5, { vol: 0.12, freq: 4000, q: 0.7, type: 'highpass' });
    [1568, 2093, 2637, 3136].forEach((f, i) => tone(f, 1.6, { type: 'triangle', vol: 0.05, delay: 0.25 + i * 0.09 }));
  },
  burn: () => {
    for (let i = 0; i < 9; i += 1) noise(0.06, { vol: 0.12, freq: 2500 + Math.random() * 3000, q: 4, delay: i * 0.06 + Math.random() * 0.04 });
    noise(0.8, { vol: 0.1, freq: 600, q: 1, to: 200 });
  },
  angry: () => {
    tone(70, 0.9, { type: 'sawtooth', vol: 0.12, to: 45 });
    tone(73, 0.9, { type: 'sawtooth', vol: 0.08, to: 47 });
    noise(0.9, { vol: 0.16, freq: 500, q: 2, to: 1800 });
  },
  heartbeat: (vol = 0.35) => { tone(60, 0.15, { vol, to: 40 }); tone(55, 0.15, { vol: vol * 0.7, to: 38, delay: 0.19 }); },
  rush: () => {
    noise(0.9, { vol: 0.3, freq: 250, q: 1.5, to: 3500 });
    tone(65, 0.9, { type: 'sawtooth', vol: 0.1, to: 380 });
  },
  scream: () => {
    if (screamBuf && ctx && !muted) {
      try {
        const src = ctx.createBufferSource();
        src.buffer = screamBuf;
        const g = ctx.createGain();
        g.gain.value = 1.25;
        src.connect(g).connect(ctx.destination); // đi thẳng ra loa, không qua bộ nén cho to nhất
        src.start();
        tone(40, 1.6, { vol: 0.45, to: 26, attack: 0.005 });
        return;
      } catch { /* dùng tiếng hét tổng hợp bên dưới */ }
    }
    noise(1.2, { vol: 0.6, freq: 2400, q: 1.1, to: 800, attack: 0.005 });
    tone(880, 1.1, { type: 'sawtooth', vol: 0.22, to: 160, attack: 0.005 });
    tone(1180, 1.0, { type: 'square', vol: 0.1, to: 260, attack: 0.005 });
    tone(42, 1.4, { vol: 0.4, to: 28, attack: 0.005 });
  },
  whisper: () => {
    const p = side();
    for (let i = 0; i < 4; i += 1) {
      const f = 1500 + Math.random() * 1600;
      noise(0.18 + Math.random() * 0.15, { vol: 0.07, freq: f, q: 9, to: f * 1.4, delay: i * 0.22, pan: p });
    }
  },
  breath: () => {
    const p = side();
    noise(1.1, { vol: 0.09, freq: 500, q: 0.8, type: 'lowpass', attack: 0.6, pan: p });
    noise(1.3, { vol: 0.07, freq: 380, q: 0.8, type: 'lowpass', attack: 0.7, delay: 1.4, pan: p });
  },
  knock: () => {
    const p = side();
    [0, 0.22, 0.44].forEach((d) => { tone(170, 0.09, { type: 'triangle', vol: 0.18, delay: d, pan: p, attack: 0.003 }); noise(0.05, { vol: 0.1, freq: 900, q: 3, delay: d, pan: p }); });
  },
  bell: () => {
    [[1046, 0.16], [1568, 0.1], [2093, 0.07], [2794, 0.05], [3520, 0.03]].forEach(([f, v]) =>
      tone(f, 2.6, { vol: v, to: f * 0.995, attack: 0.003 }));
    tone(523, 2.8, { vol: 0.08, attack: 0.003 });
  },
  mirror: () => [1319, 1568, 1976, 2637, 3136].forEach((f, i) => tone(f, 0.9, { type: 'triangle', vol: 0.05, delay: i * 0.07 })),
  lamp: () => { noise(0.25, { vol: 0.18, freq: 3000, q: 1.5, to: 800 }); noise(1.2, { vol: 0.05, freq: 900, q: 0.7, type: 'lowpass', delay: 0.15 }); },
  wail: () => {
    noise(1.1, { vol: 0.22, freq: 2600, q: 3, to: 1500, attack: 0.05, pan: (Math.random() - 0.5) });
    tone(1250, 1.0, { type: 'sawtooth', vol: 0.06, to: 900, attack: 0.05 });
    tone(1330, 1.0, { type: 'sawtooth', vol: 0.05, to: 950, attack: 0.05 });
  },
  lunge: () => { noise(0.5, { vol: 0.3, freq: 300, q: 1.2, to: 2500 }); tone(90, 0.5, { type: 'sawtooth', vol: 0.1, to: 300 }); },
  fog: () => noise(1.4, { vol: 0.06, freq: 500, q: 0.6, type: 'lowpass', attack: 0.5 }),
  chat: () => tone(1200, 0.08, { type: 'triangle', vol: 0.04, attack: 0.003 }),
  coin: () => { tone(1568, 0.12, { type: 'triangle', vol: 0.08, attack: 0.003 }); tone(2349, 0.25, { type: 'triangle', vol: 0.07, delay: 0.07, attack: 0.003 }); },
  revive: () => [196, 262, 330].forEach((f, i) => tone(f, 0.5, { vol: 0.09, delay: i * 0.18 })),
  refill: () => [392, 523].forEach((f, i) => tone(f, 0.25, { vol: 0.08, delay: i * 0.12 })),
};
