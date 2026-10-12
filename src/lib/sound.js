// Âm thanh tổng hợp bằng Web Audio — không cần file mp3
let ctx = null;

export function unlockAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
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

export const sfx = {
  spawn: () => { tone(160, 0.7, { vol: 0.14, to: 90 }); tone(240, 0.7, { type: 'triangle', vol: 0.05, to: 120, delay: 0.1 }); },
  throw: () => tone(900, 0.3, { type: 'triangle', vol: 0.08, to: 250 }),
  hit: () => tone(220, 0.18, { type: 'square', vol: 0.07, to: 110 }),
  miss: () => tone(300, 0.25, { vol: 0.08, to: 150 }),
  shake: () => tone(340, 0.09, { type: 'square', vol: 0.06 }),
  caught: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, { type: 'triangle', vol: 0.1, delay: i * 0.11 })),
  escape: () => tone(500, 0.6, { type: 'sawtooth', vol: 0.05, to: 70 }),
  refill: () => [392, 523].forEach((f, i) => tone(f, 0.2, { vol: 0.08, delay: i * 0.12 })),
};
