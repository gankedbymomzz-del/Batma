// Nhạc nền rùng rợn tổng hợp thời gian thực, 3 cấp độ: calm → tense → frenzy
import { getCtx, getNoise, getBus, tone, noise, sfx } from './sound.js';

let N = null;              // các node âm thanh
let mode = 'off';
let beatTimer = null;
let eventTimer = null;
let nextBeat = 0;
let beatCount = 0;
let frenzyAt = 0;
let riser = null;

const LEVELS = {
  off: { drone: 0, wind: 0, cluster: 0 },
  silent: { drone: 0.05, wind: 0.05, cluster: 0 },
  calm: { drone: 0.55, wind: 0.35, cluster: 0 },
  tense: { drone: 0.75, wind: 0.3, cluster: 0.035 },
  frenzy: { drone: 0.95, wind: 0.5, cluster: 0.1 },
};

function build(ctx) {
  const master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(getBus());

  // Lớp 1: tiếng ù trầm như dưới lòng đất
  const droneGain = ctx.createGain(); droneGain.gain.value = 0;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 150; lp.Q.value = 5;
  [41.2, 41.9, 61.7].forEach((f, i) => {
    const o = ctx.createOscillator(); o.type = i < 2 ? 'sawtooth' : 'sine'; o.frequency.value = f;
    o.connect(lp); o.start();
  });
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
  const lfoG = ctx.createGain(); lfoG.gain.value = 80;
  lfo.connect(lfoG).connect(lp.frequency); lfo.start();
  lp.connect(droneGain).connect(master);

  // Lớp 2: gió rít qua khe cửa
  const windGain = ctx.createGain(); windGain.gain.value = 0;
  const ns = ctx.createBufferSource(); ns.buffer = getNoise(); ns.loop = true;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 1.2;
  const wl = ctx.createOscillator(); wl.frequency.value = 0.11;
  const wlg = ctx.createGain(); wlg.gain.value = 320;
  wl.connect(wlg).connect(bp.frequency); wl.start();
  ns.connect(bp).connect(windGain).connect(master); ns.start();

  // Lớp 3: dây đàn chói tai (cụm nốt nghịch tai) cho lúc căng thẳng
  const clusterGain = ctx.createGain(); clusterGain.gain.value = 0;
  const cbp = ctx.createBiquadFilter(); cbp.type = 'bandpass'; cbp.frequency.value = 1100; cbp.Q.value = 2;
  const trem = ctx.createGain(); trem.gain.value = 0.6;
  const tl = ctx.createOscillator(); tl.frequency.value = 7;
  const tlg = ctx.createGain(); tlg.gain.value = 0.4;
  tl.connect(tlg).connect(trem.gain); tl.start();
  [987.8, 1046.5, 1108.7].forEach((f) => {
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
    o.detune.value = (Math.random() - 0.5) * 24;
    o.connect(cbp); o.start();
  });
  cbp.connect(trem).connect(clusterGain).connect(master);

  return { master, droneGain, windGain, clusterGain, tremLfo: tl };
}

const kick = (t, vol = 0.5) => {
  const ctx = getCtx();
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(32, t + 0.22);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o.connect(g).connect(N.master); o.start(t); o.stop(t + 0.35);
};

const hat = (t, vol = 0.08) => {
  const ctx = getCtx();
  const s = ctx.createBufferSource(); s.buffer = getNoise();
  const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 5000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  s.connect(f).connect(g).connect(N.master); s.start(t, Math.random()); s.stop(t + 0.08);
};

// Nhịp: tense = tim đập chậm, frenzy = trống dồn dập tăng tốc
function scheduler() {
  const ctx = getCtx();
  if (!ctx || !N) return;
  while (nextBeat < ctx.currentTime + 0.25) {
    if (mode === 'tense') {
      kick(nextBeat, 0.45); kick(nextBeat + 0.2, 0.3);
      nextBeat += 1.15;
    } else if (mode === 'frenzy') {
      const el = (performance.now() - frenzyAt) / 1000;
      const period = Math.max(0.13, 0.42 - el * 0.06);
      kick(nextBeat, 0.6);
      if (beatCount % 2 === 1) hat(nextBeat, 0.12);
      hat(nextBeat + period / 2, 0.06);
      beatCount += 1;
      nextBeat += period;
    } else {
      nextBeat = ctx.currentTime + 0.1;
      break;
    }
  }
}

// Âm thanh ngẫu nhiên: hộp nhạc lạc tông, tiếng thì thầm, cửa kẽo kẹt, gõ cửa
const MUSIC_BOX = [659.3, 698.5, 784, 830.6, 987.8, 1046.5, 1108.7];
function creepyEvent() {
  if (document.hidden) return;
  const r = Math.random();
  if (r < 0.32) {
    const n = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i += 1) {
      const f = MUSIC_BOX[Math.floor(Math.random() * MUSIC_BOX.length)] * 0.985;
      tone(f, 1.8, { type: 'sine', vol: 0.05, delay: i * 0.55, attack: 0.005, pan: -0.4 + Math.random() * 0.8 });
      tone(f * 2.01, 0.9, { type: 'triangle', vol: 0.015, delay: i * 0.55, attack: 0.005 });
    }
  } else if (r < 0.58) {
    sfx.whisper();
  } else if (r < 0.8) {
    noise(1.2, { vol: 0.06, freq: 700, q: 14, to: 450, pan: Math.random() * 2 - 1 });
    tone(95, 1.0, { type: 'sawtooth', vol: 0.025, to: 70 });
  } else {
    sfx.knock();
  }
}

function scheduleEvents() {
  clearTimeout(eventTimer);
  const wait = mode === 'tense' ? 3000 + Math.random() * 4000 : 6000 + Math.random() * 8000;
  eventTimer = setTimeout(() => {
    if (mode === 'calm' || mode === 'tense') creepyEvent();
    scheduleEvents();
  }, wait);
}

function stopRiser() {
  if (!riser) return;
  try {
    const t = getCtx().currentTime;
    riser.g.gain.cancelScheduledValues(t);
    riser.g.gain.setTargetAtTime(0.0001, t, 0.08);
    riser.o.stop(t + 0.4); riser.o2.stop(t + 0.4);
  } catch { /* bỏ qua */ }
  riser = null;
}

function startRiser(sec) {
  const ctx = getCtx();
  stopRiser();
  const t = ctx.currentTime;
  const o = ctx.createOscillator(); const o2 = ctx.createOscillator(); const g = ctx.createGain();
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 6;
  o.type = 'sawtooth'; o2.type = 'sawtooth';
  o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(880, t + sec);
  o2.frequency.setValueAtTime(116, t); o2.frequency.exponentialRampToValueAtTime(932, t + sec);
  f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(5000, t + sec);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + sec);
  o.connect(f); o2.connect(f); f.connect(g).connect(N.master);
  o.start(t); o2.start(t);
  riser = { o, o2, g };
}

export const music = {
  start() {
    const ctx = getCtx();
    if (!ctx || N) return;
    N = build(ctx);
    beatTimer = setInterval(scheduler, 50);
    scheduleEvents();
    this.setMode('calm');
  },

  setMode(m, { riserSec = 5 } = {}) {
    const ctx = getCtx();
    if (!ctx || !N || m === mode) return;
    const prev = mode;
    mode = m;
    const L = LEVELS[m] || LEVELS.calm;
    const t = ctx.currentTime;
    const tc = m === 'silent' ? 0.05 : 0.6;
    N.droneGain.gain.setTargetAtTime(L.drone, t, tc);
    N.windGain.gain.setTargetAtTime(L.wind, t, tc);
    N.clusterGain.gain.setTargetAtTime(L.cluster, t, m === 'frenzy' ? 0.3 : tc);
    N.tremLfo.frequency.setTargetAtTime(m === 'frenzy' ? 14 : 7, t, 0.5);
    if (m === 'frenzy') {
      frenzyAt = performance.now();
      beatCount = 0;
      nextBeat = t + 0.05;
      startRiser(riserSec);
    } else {
      stopRiser();
    }
    if (prev !== 'tense' && m === 'tense') nextBeat = t + 0.4;
    scheduleEvents();
  },

  stop() {
    clearInterval(beatTimer);
    clearTimeout(eventTimer);
    stopRiser();
    if (N) N.master.gain.setTargetAtTime(0, getCtx().currentTime, 0.2);
  },
};
