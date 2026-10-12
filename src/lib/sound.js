// Âm thanh kinh dị tổng hợp bằng Web Audio — không cần file mp3
let ctx = null;
let noiseBuf = null;

export function unlockAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    ctx = null;
  }
}

function tone(freq, dur, { type = 'sine', vol = 0.12, to = null, delay = 0 } = {}) {
  if (!ctx) return;
  try {
    const t0 = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  } catch { /* bỏ qua */ }
}

function noise(dur, { vol = 0.2, freq = 1200, q = 1, type = 'bandpass', delay = 0, to = null } = {}) {
  if (!ctx || !noiseBuf) return;
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
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  } catch { /* bỏ qua */ }
}

export const sfx = {
  spawn: () => {
    tone(55, 1.6, { vol: 0.18, to: 40 });
    tone(58, 1.6, { type: 'triangle', vol: 0.06, to: 43 });
    noise(1.4, { vol: 0.07, freq: 600, q: 6, to: 300 });
  },
  throw: () => noise(0.3, { vol: 0.12, freq: 2500, q: 2, to: 600 }),
  hit: () => tone(140, 0.25, { type: 'square', vol: 0.08, to: 60 }),
  miss: () => tone(200, 0.3, { vol: 0.08, to: 90 }),
  shake: () => tone(90, 0.12, { type: 'square', vol: 0.08 }),
  caught: () => [262, 330, 392, 523].forEach((f, i) => tone(f, 0.3, { type: 'triangle', vol: 0.09, delay: i * 0.12 })),
  escape: () => noise(0.8, { vol: 0.12, freq: 900, q: 4, to: 200 }),
  angry: () => { tone(80, 0.5, { type: 'sawtooth', vol: 0.08, to: 50 }); noise(0.5, { vol: 0.08, freq: 400, q: 3 }); },
  heartbeat: () => { tone(60, 0.14, { vol: 0.35, to: 40 }); tone(55, 0.14, { vol: 0.25, to: 38, delay: 0.18 }); },
  rush: () => { noise(0.9, { vol: 0.25, freq: 300, q: 1.5, to: 3000 }); tone(70, 0.9, { type: 'sawtooth', vol: 0.08, to: 300 }); },
  scream: () => {
    noise(1.1, { vol: 0.5, freq: 2200, q: 1.2, to: 900 });
    tone(900, 1.0, { type: 'sawtooth', vol: 0.18, to: 180 });
    tone(1240, 0.9, { type: 'square', vol: 0.08, to: 300 });
    tone(45, 1.2, { vol: 0.3, to: 30 });
  },
  revive: () => [196, 262, 330].forEach((f, i) => tone(f, 0.35, { vol: 0.09, delay: i * 0.15 })),
  refill: () => [392, 523].forEach((f, i) => tone(f, 0.2, { vol: 0.08, delay: i * 0.12 })),
};
