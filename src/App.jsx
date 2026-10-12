import { useEffect, useRef, useState } from 'react';
import { RARITY, TALISMANS, GHOSTS, pickGhost } from './ghosts.js';
import { cameraDirection, wrap180, requestOrientationPermission } from './lib/orientation.js';
import { sfx, unlockAudio, pauseAudio, isMuted, setMuted } from './lib/sound.js';
import { music } from './lib/music.js';
import {
  loadSave, writeSave, levelFromXp, loadPlayer, savePlayer, getToken, setToken, MAX_HP,
} from './lib/storage.js';
import { api } from './lib/api.js';
import Ghost from './components/Ghost.jsx';
import Talisman from './components/Talisman.jsx';
import Dex from './components/Dex.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import StartScreen from './components/StartScreen.jsx';
import CaughtCard from './components/CaughtCard.jsx';
import DeadCard from './components/DeadCard.jsx';
import SealFX from './components/SealFX.jsx';

// ====== THÔNG SỐ GAME ======
const FOV = 60;             // góc nhìn ngang (độ)
const RING_PERIOD = 1800;   // chu kỳ vòng tròn co lại (ms)
const GHOST_PX = 120;       // bề rộng ma chuẩn (px)
const HORIZON = 0.42;       // vị trí đường chân trời
const FRENZY_SEC = 5;       // bắt hụt → chỉ còn 5 giây
const RUSH_MS = 900;        // thời gian ma lao tới
const SCARE_MS = 1400;      // thời gian hù doạ
const SEAL_MS = 1700;       // thời gian hiệu ứng phong ấn
const DEATH_XP = 100;       // XP bị trừ khi cạn dương khí

const ZONE = {
  great: { mult: 1.8, label: 'Tuyệt vời!' },
  good: { mult: 1.35, label: 'Tốt lắm!' },
  ok: { mult: 1, label: 'Trúng rồi!' },
};
const ringZone = (s) => (s < 0.45 ? 'great' : s < 0.7 ? 'good' : 'ok');

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const vibrate = (p) => { try { navigator.vibrate?.(p); } catch { /* bỏ qua */ } };

export default function App() {
  const [player, setPlayer] = useState(loadPlayer);
  const [save, setSave] = useState(() => loadSave(loadPlayer()?.name || '_guest'));
  const [rank, setRank] = useState(null);
  const [started, setStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [camOk, setCamOk] = useState(false);
  const [dragHint, setDragHint] = useState(false);
  const [phase, setPhaseState] = useState('scan'); // scan | hunt | throw | shake | seal | attack | caught | dead
  const [ghost, setGhost] = useState(null);
  const [sucked, setSucked] = useState(false);
  const [frenzy, setFrenzy] = useState(false);
  const [talisman, setTalisman] = useState('paper');
  const [toast, setToast] = useState(null);
  const [panel, setPanel] = useState(null);
  const [caught, setCaught] = useState(null);
  const [dead, setDead] = useState(null);
  const [scare, setScare] = useState(null);
  const [sealFx, setSealFx] = useState(null);
  const [flash, setFlash] = useState(null);
  const [hurt, setHurt] = useState(0);
  const [muted, setMutedState] = useState(isMuted);

  const appRef = useRef(null);
  const phaseRef = useRef('scan');
  const saveRef = useRef(save);
  const ghostRef = useRef(null);
  const view = useRef({ sensorH: 0, sensorP: 0, dragH: 0, dragP: 0, h: 0, p: 0 });
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const ghostElRef = useRef(null);
  const ringRef = useRef(null);
  const arrowRef = useRef(null);
  const emfRef = useRef(null);
  const timerRef = useRef(null);
  const timerTextRef = useRef(null);
  const countRef = useRef(null);
  const talRef = useRef(null);
  const talInnerRef = useRef(null);
  const throwRef = useRef(null);
  const stageDrag = useRef(null);
  const attackRef = useRef(null);
  const frenzyRef = useRef(null);
  const timers = useRef([]);
  const toastTimer = useRef(null);

  const setPhase = (p) => { phaseRef.current = p; setPhaseState(p); };
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); return t; };
  const showToast = (text, ms = 1700) => {
    clearTimeout(toastTimer.current);
    setToast({ text, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), ms);
  };
  const speciesCount = (s) => GHOSTS.filter((g) => s.caught[g.id]).length;

  useEffect(() => {
    saveRef.current = save;
    writeSave(player?.name || '_guest', save);
  }, [save, player]);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    music.stop();
  }, []);

  // Tạm dừng âm thanh khi chuyển tab
  useEffect(() => {
    const onVis = () => pauseAudio(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // ====== GHI DANH ======
  const applyPlayer = (p) => {
    savePlayer(p);
    setPlayer(p);
    setSave(loadSave(p.name));
    setRank(null);
  };

  const login = async (name) => {
    try {
      const r = await api.register(name, getToken(name));
      setToken(r.name, r.token);
      applyPlayer({ name: r.name, token: r.token });
    } catch (e) {
      if (e.status === 400 || e.status === 409) throw e;
      applyPlayer({ name, token: null, offline: true });
    }
  };

  const logout = () => { savePlayer(null); setPlayer(null); };

  useEffect(() => {
    if (!player?.token) return undefined;
    const t = setTimeout(async () => {
      try {
        const r = await api.score({
          name: player.name, token: player.token,
          xp: save.xp, total: save.total, species: speciesCount(save),
        });
        setRank(r.rank);
        if (r.clamped) setSave((s) => ({ ...s, xp: r.xp }));
      } catch { /* mất mạng: lần sau gửi lại */ }
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [save.xp, save.total, player]);

  // ====== BẮT ĐẦU ======
  const start = async () => {
    setStarting(true);
    unlockAudio();
    await requestOrientationPermission();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      const v = videoRef.current;
      v.srcObject = stream;
      await v.play().catch(() => {});
      setCamOk(true);
    } catch {
      setCamOk(false);
      showToast('Không mở được camera, chuyển sang chế độ đêm', 2600);
    }
    music.start();
    setStarting(false);
    setStarted(true);
    if (saveRef.current.hp <= 0) setSave((s) => ({ ...s, hp: MAX_HP }));
  };

  const toggleMute = () => { const m = !muted; setMuted(m); setMutedState(m); };

  // Nhạc nền theo tình huống
  useEffect(() => {
    if (!started) return;
    let m = 'calm';
    if (phase === 'hunt' || phase === 'throw' || phase === 'shake') m = frenzy ? 'frenzy' : 'tense';
    if (phase === 'attack' || phase === 'seal') m = 'silent';
    const riserSec = Math.max(1, ghostRef.current?.timeLeft || FRENZY_SEC);
    music.setMode(m, { riserSec });
  }, [started, phase, frenzy]);

  // ====== CẢM BIẾN XOAY ======
  useEffect(() => {
    if (!started) return undefined;
    let got = false;
    const onOri = (e) => {
      if (e.alpha == null) return;
      got = true;
      const { heading, pitch } = cameraDirection(e.alpha, e.beta ?? 0, e.gamma ?? 0);
      view.current.sensorH = heading;
      view.current.sensorP = pitch;
    };
    window.addEventListener('deviceorientation', onOri);
    const t = setTimeout(() => { if (!got) setDragHint(true); }, 1500);
    return () => { window.removeEventListener('deviceorientation', onOri); clearTimeout(t); };
  }, [started]);

  useEffect(() => {
    if (!started) return undefined;
    const onKey = (e) => {
      const v = view.current;
      if (e.key === 'ArrowLeft') v.dragH -= 6;
      if (e.key === 'ArrowRight') v.dragH += 6;
      if (e.key === 'ArrowUp') v.dragP = clamp(v.dragP + 4, -60, 60);
      if (e.key === 'ArrowDown') v.dragP = clamp(v.dragP - 4, -60, 60);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started]);

  // ====== ÁM ẢNH NGẪU NHIÊN: bóng ma loé lên, tiếng thở sau lưng ======
  useEffect(() => {
    if (!started) return undefined;
    let t;
    const tick = () => {
      t = setTimeout(() => {
        const ph = phaseRef.current;
        if ((ph === 'scan' || (ph === 'hunt' && !ghostRef.current?.frenzy)) && !document.hidden) {
          if (Math.random() < 0.6) {
            const g = GHOSTS[Math.floor(Math.random() * GHOSTS.length)];
            setFlash({ img: g.img, side: Math.random() < 0.5 ? 'left' : 'right', id: Date.now() });
            sfx.whisper();
            vibrate(25);
            setTimeout(() => setFlash(null), 160);
          } else {
            sfx.breath();
            if (ph === 'scan') setTimeout(() => showToast('…có tiếng thở ngay sau lưng bạn', 2200), 900);
          }
        }
        tick();
      }, rand(16000, 38000));
    };
    tick();
    return () => clearTimeout(t);
  }, [started]);

  // ====== VÒNG LẶP 60fps ======
  useEffect(() => {
    if (!started) return undefined;
    let raf;
    const loop = (now) => {
      const v = view.current;
      const tH = v.sensorH + v.dragH;
      const tP = clamp(v.sensorP + v.dragP, -80, 80);
      v.h = (v.h + wrap180(tH - v.h) * 0.25 + 360) % 360;
      v.p += (tP - v.p) * 0.25;

      const W = window.innerWidth;
      const H = window.innerHeight;
      const ppd = W / FOV;
      const cy = H * HORIZON;
      const g = ghostRef.current;
      const ph = phaseRef.current;
      let emf = 0.05 + Math.random() * 0.12;
      let arrowOn = false;

      if (g) {
        const dt = g.lastT ? Math.min(0.1, (now - g.lastT) / 1000) : 0;
        g.lastT = now;
        const m = g.def.move * (g.frenzy ? 1.9 : 1);

        if (ph === 'hunt' || ph === 'throw') {
          const t = (now - g.born) / 1000;
          if (ph === 'hunt' && Math.random() < (g.frenzy ? 0.01 : 0.004) * m) g.baseYaw += rand(-7, 7);
          g.yaw = g.baseYaw + Math.sin(t * 0.7) * m * 8 + Math.sin(t * 1.9) * m * 3;
          g.pitch = g.basePitch + Math.sin(t * 1.3) * m * 4;
        }

        if (ph === 'hunt') {
          g.timeLeft -= dt;
          const sec = Math.ceil(g.timeLeft);
          if (!g.frenzy && g.timeLeft <= FRENZY_SEC) frenzyRef.current?.('time');
          if (timerRef.current) timerRef.current.style.setProperty('--t', clamp(g.timeLeft / g.def.patience, 0, 1));
          if (timerTextRef.current) timerTextRef.current.textContent = `${Math.max(0, sec)}s`;
          if (countRef.current) countRef.current.textContent = Math.max(0, sec);
          if (g.frenzy && sec > 0 && sec !== g.beat) { g.beat = sec; sfx.heartbeat(0.45); vibrate(60); }
          if (g.timeLeft <= 0 && !g.attacking) { g.attacking = true; attackRef.current?.(); }
        }

        // Nổi điên: ma tiến dần lại gần
        g.scale = g.frenzy ? 1 + (1 - clamp(g.timeLeft / FRENZY_SEC, 0, 1)) * 0.6 : 1;
        if (ph === 'attack') {
          const p = clamp((now - g.attackStart) / RUSH_MS, 0, 1);
          g.yaw += wrap180(v.h - g.yaw) * 0.15;
          g.pitch += (v.p - g.pitch) * 0.15;
          g.scale = 1.4 + p * p * 7;
        }

        const dx = wrap180(g.yaw - v.h) * ppd;
        const dy = -(g.pitch - v.p) * ppd;
        g.sx = W / 2 + dx;
        g.sy = cy + dy;
        if (ghostElRef.current) {
          ghostElRef.current.style.transform = `translate3d(${g.sx}px, ${g.sy}px, 0) translate(-50%, -50%) scale(${g.scale})`;
        }

        g.ring = 1 - ((now % RING_PERIOD) / RING_PERIOD) * 0.7;
        if (ringRef.current) {
          ringRef.current.style.transform = `translate(-50%, -50%) scale(${g.ring})`;
          ringRef.current.dataset.zone = ringZone(g.ring);
        }

        emf = Math.max(emf, 1 - Math.abs(wrap180(g.yaw - v.h)) / 150);

        const off = g.sx < 30 || g.sx > W - 30 || g.sy < 90 || g.sy > H - 230;
        if (off && ph === 'hunt' && arrowRef.current) {
          arrowOn = true;
          const ang = Math.atan2(dy, dx);
          const ex = W / 2 + Math.cos(ang) * (W / 2 - 36);
          const ey = cy + Math.sin(ang) * Math.max(60, Math.min(cy - 90, H * 0.3));
          arrowRef.current.style.transform = `translate(${ex}px, ${ey}px) translate(-50%, -50%) rotate(${ang}rad)`;
        }
      }

      // Camera nhiễu sóng khi ma ở rất gần
      appRef.current?.classList.toggle('near', emf > 0.82 && (ph === 'hunt' || ph === 'attack'));
      if (arrowRef.current) arrowRef.current.style.opacity = arrowOn ? '1' : '0';
      if (emfRef.current) {
        const lit = Math.ceil(clamp(emf, 0, 1) * 5);
        emfRef.current.querySelectorAll('.bar').forEach((b, i) => b.classList.toggle('on', i < lit));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [started]);

  // ====== MA XUẤT HIỆN ======
  const spawn = () => {
    const def = pickGhost(levelFromXp(saveRef.current.xp).level);
    const side = Math.random() < 0.5 ? -1 : 1;
    const baseYaw = (view.current.h + side * rand(35, 140) + 360) % 360;
    ghostRef.current = {
      def, baseYaw, basePitch: rand(-4, 10), yaw: baseYaw, pitch: 0,
      born: performance.now(), sx: -999, sy: -999, ring: 1, scale: 1,
      timeLeft: def.patience, beat: null, attacking: false, frenzy: false, lastT: 0,
    };
    setSucked(false);
    setFrenzy(false);
    setGhost(def);
    setPhase('hunt');
    sfx.spawn();
    vibrate(80);
    const msg = {
      common: 'Có thứ gì đó đang nhìn bạn…',
      rare: 'Lạnh sống lưng. Nó đang ở rất gần',
      legendary: 'Đừng quay lại. Nó đã thấy bạn rồi',
    };
    showToast(msg[def.rarity], 2200);
  };

  useEffect(() => {
    if (!started || phase !== 'scan') return undefined;
    const t = setTimeout(spawn, rand(2500, 5000));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, phase]);

  // ====== NỔI ĐIÊN: chỉ còn 5 giây ======
  const enterFrenzy = (reason) => {
    const g = ghostRef.current;
    if (!g) return;
    if (g.frenzy) {
      g.timeLeft = Math.max(1, g.timeLeft - 1); // đã điên rồi, hụt tiếp → bớt 1 giây
      return;
    }
    g.frenzy = true;
    g.timeLeft = reason === 'fail' ? FRENZY_SEC : Math.min(g.timeLeft, FRENZY_SEC);
    g.beat = null;
    setFrenzy(true);
    sfx.angry();
    vibrate([120, 60, 120]);
    showToast(reason === 'fail' ? 'Nó nổi điên rồi! Phong ấn ngay!' : 'Hết kiên nhẫn. Nó sắp lao tới!', 1600);
  };
  frenzyRef.current = enterFrenzy;

  // ====== MA TẤN CÔNG ======
  const startAttack = () => {
    const g = ghostRef.current;
    if (!g) return;
    g.attackStart = performance.now();
    setPhase('attack');
    sfx.rush();
    vibrate(250);

    later(() => {
      setScare(g.def);
      sfx.scream();
      vibrate([300, 80, 500]);

      later(() => {
        setScare(null);
        ghostRef.current = null;
        setGhost(null);
        setFrenzy(false);
        const hp = saveRef.current.hp - 1;
        setHurt((n) => n + 1);
        if (hp <= 0) {
          const lost = Math.min(DEATH_XP, saveRef.current.xp);
          setSave((s) => ({ ...s, hp: 0, xp: s.xp - lost }));
          setDead({ def: g.def, lost });
          setPhase('dead');
        } else {
          setSave((s) => ({ ...s, hp }));
          showToast(`Bị ${g.def.name} tấn công, mất 1 dương khí`, 2200);
          setPhase('scan');
        }
      }, SCARE_MS);
    }, RUSH_MS);
  };
  attackRef.current = startAttack;

  const revive = () => {
    sfx.revive();
    setSave((s) => ({ ...s, hp: MAX_HP }));
    setDead(null);
    setPhase('scan');
  };

  // ====== BÙA ======
  const resetTalisman = () => {
    const el = talRef.current;
    if (!el) return;
    el.style.transition = 'transform .3s ease-out';
    el.style.transform = '';
  };

  const popTalisman = () => {
    const el = talRef.current;
    const inner = talInnerRef.current;
    if (!el || !inner) return;
    el.style.transition = 'none';
    el.style.transform = '';
    inner.classList.remove('wobble', 'pop', 'burn', 'glow');
    void inner.offsetWidth;
    inner.classList.add('pop');
  };

  const onTalDown = (e) => {
    if (phaseRef.current !== 'hunt') return;
    const kind = talisman;
    if (save.talismans[kind] <= 0) {
      const other = kind === 'paper' ? 'gold' : 'paper';
      if (save.talismans[other] > 0) {
        setTalisman(other);
        showToast(`Hết ${TALISMANS[kind].label}, đã chuyển sang ${TALISMANS[other].label}`);
      } else {
        showToast('Hết bùa rồi, bấm Thắp nhang để nhận thêm');
      }
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    const r = talRef.current.getBoundingClientRect();
    throwRef.current = {
      id: e.pointerId, kind, x0: e.clientX, y0: e.clientY,
      cx: r.left + r.width / 2, cy: r.top + r.height / 2,
      pts: [{ x: e.clientX, y: e.clientY, t: performance.now() }],
    };
    talRef.current.style.transition = 'none';
  };

  const onTalMove = (e) => {
    const d = throwRef.current;
    if (!d || d.id !== e.pointerId) return;
    talRef.current.style.transform = `translate(${e.clientX - d.x0}px, ${e.clientY - d.y0}px)`;
    d.pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (d.pts.length > 6) d.pts.shift();
  };

  const onTalUp = (e) => {
    const d = throwRef.current;
    if (!d || d.id !== e.pointerId) return;
    throwRef.current = null;
    if (phaseRef.current !== 'hunt') { resetTalisman(); return; }
    const first = d.pts[0];
    const dt = Math.max(16, performance.now() - first.t);
    const vx = (e.clientX - first.x) / dt;
    const vy = (e.clientY - first.y) / dt;
    if (d.y0 - e.clientY < 50 || vy > -0.35) { resetTalisman(); return; }
    throwTalisman(e.clientX, e.clientY, vx, vy, d);
  };

  const throwTalisman = (ux, uy, vx, vy, d) => {
    const g = ghostRef.current;
    if (!g) { resetTalisman(); return; }
    const { kind } = d;
    const ringAt = g.ring;
    setPhase('throw');
    setSave((s) => ({ ...s, talismans: { ...s.talismans, [kind]: Math.max(0, s.talismans[kind] - 1) } }));
    sfx.throw();

    const W = window.innerWidth;
    const H = window.innerHeight;
    const power = -vy / 1.1;
    const landY = power >= 0.55 ? Math.min(g.sy, uy - 40) : uy - power * H * 0.55;
    const t = (uy - landY) / Math.max(0.2, -vy);
    const landX = clamp(ux + vx * t, -80, W + 80);

    const el = talRef.current;
    el.style.transition = 'transform .42s cubic-bezier(.2,.7,.3,1)';
    el.style.transform = `translate(${landX - d.cx}px, ${landY - d.cy}px) scale(.5) rotate(540deg)`;

    later(() => {
      const gg = ghostRef.current;
      if (!gg) return;
      const w = GHOST_PX * gg.def.size * gg.scale;
      const h = w * gg.def.ratio;
      const nx = (landX - gg.sx) / (w * 0.55);
      const ny = (landY - gg.sy) / (h * 0.5);
      if (nx * nx + ny * ny >= 1) {
        sfx.miss();
        showToast('Trượt rồi!', 1000);
        popTalisman();
        setPhase('hunt');
        return;
      }
      const zone = ZONE[ringZone(ringAt)];
      const p = clamp(gg.def.catch * TALISMANS[kind].mult * zone.mult, 0.02, 0.97);
      const success = Math.random() < p;
      gg.landX = landX;
      gg.landY = landY;
      sfx.hit();
      vibrate(50);
      showToast(zone.label, 1000);
      setSucked(true);
      setPhase('shake');
      talInnerRef.current?.classList.add('glow');
      runShakes(success, success ? 3 : 1 + Math.floor(Math.random() * 2), gg.def);
    }, 440);
  };

  const runShakes = (success, n, def) => {
    let i = 0;
    const step = () => {
      const inner = talInnerRef.current;
      if (i < n) {
        if (inner) { inner.classList.remove('wobble', 'pop'); void inner.offsetWidth; inner.classList.add('wobble'); }
        sfx.shake();
        vibrate(30);
        i += 1;
        later(step, 750);
      } else {
        inner?.classList.remove('wobble');
        if (success) onSealed(def); else onBreakFree();
      }
    };
    later(step, 450);
  };

  // Phong ấn thành công → hiệu ứng → thẻ phần thưởng
  const onSealed = (def) => {
    const g = ghostRef.current;
    const x = g?.landX ?? window.innerWidth / 2;
    const y = g?.landY ?? window.innerHeight * HORIZON;
    setPhase('seal');
    setFrenzy(false);
    setSealFx({ x, y, id: Date.now() });
    sfx.gong();
    vibrate([60, 40, 60, 40, 200]);
    ghostRef.current = null;
    setGhost(null);
    later(() => { setSealFx(null); onCaught(def); }, SEAL_MS);
  };

  const onCaught = (def) => {
    const prev = saveRef.current;
    const before = levelFromXp(prev.xp).level;
    const after = levelFromXp(prev.xp + def.xp).level;
    const levelUp = after > before;
    const bonusPaper = Math.random() < 0.5 ? 2 : 1;
    const hpGain = prev.hp < MAX_HP;
    setSave((s) => ({
      ...s,
      xp: s.xp + def.xp,
      total: s.total + 1,
      hp: Math.min(MAX_HP, s.hp + 1),
      caught: { ...s.caught, [def.id]: (s.caught[def.id] || 0) + 1 },
      talismans: { paper: s.talismans.paper + bonusPaper, gold: s.talismans.gold + (levelUp ? 3 : 0) },
    }));
    setCaught({ def, xp: def.xp, levelUp, level: after, isNew: !prev.caught[def.id], bonusPaper, hpGain });
    setSucked(false);
    popTalisman();
    setPhase('caught');
  };

  // Bắt hụt → bùa cháy rụi, ma thoát ra và nổi điên
  const onBreakFree = () => {
    const inner = talInnerRef.current;
    if (inner) { inner.classList.remove('glow', 'wobble'); void inner.offsetWidth; inner.classList.add('burn'); }
    sfx.burn();
    const g = ghostRef.current;
    if (g) g.born = performance.now();
    setSucked(false);
    setPhase('hunt');
    enterFrenzy('fail');
    later(popTalisman, 750);
  };

  const closeCaught = () => { setCaught(null); setPhase('scan'); };

  const refill = () => {
    sfx.refill();
    setSave((s) => ({ ...s, talismans: { ...s.talismans, paper: s.talismans.paper + 10 } }));
    setTalisman('paper');
    showToast('Nhận 10 Bùa Giấy');
  };

  // ====== KÉO MÀN HÌNH ĐỂ NHÌN QUANH ======
  const onStageDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    stageDrag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, h: view.current.dragH, p: view.current.dragP };
  };
  const onStageMove = (e) => {
    const s = stageDrag.current;
    if (!s || s.id !== e.pointerId) return;
    const k = FOV / window.innerWidth;
    view.current.dragH = s.h - (e.clientX - s.x) * k;
    view.current.dragP = clamp(s.p + (e.clientY - s.y) * k, -60, 60);
  };
  const onStageUp = (e) => { if (stageDrag.current?.id === e.pointerId) stageDrag.current = null; };

  // ====== GIAO DIỆN ======
  const { level, progress } = levelFromXp(save.xp);
  const empty = save.talismans.paper + save.talismans.gold === 0;
  const canThrow = phase === 'hunt' && !empty;
  const ghostW = ghost ? GHOST_PX * ghost.size : 0;
  const ghostH = ghost ? ghostW * ghost.ratio : 0;
  const huntLike = phase === 'hunt' || phase === 'throw' || phase === 'shake';

  let status = 'Đang dò âm khí…';
  if (phase === 'throw') status = 'Bùa đang bay…';
  if (phase === 'shake') status = 'Đang phong ấn…';
  if (phase === 'seal') status = 'Phong ấn thành công';
  if (phase === 'attack') status = 'Nó đang lao tới!';

  const appClass = ['app', scare && 'shaking', frenzy && huntLike && 'frenzy'].filter(Boolean).join(' ');

  return (
    <div ref={appRef} className={appClass}>
      <video ref={videoRef} className={`cam ${camOk ? 'on' : ''}`} playsInline muted autoPlay />
      {(!started || !camOk) && (
        <div className="night">
          <div className="fog f1" />
          <div className="fog f2" />
        </div>
      )}
      <div className="grain" />
      <div className={`vignette ${save.hp <= 1 && started ? 'danger' : ''}`} />
      {hurt > 0 && <div key={hurt} className="hurt-flash" />}

      {!started && (
        <StartScreen player={player} onLogin={login} onLogout={logout} onStart={start} starting={starting} />
      )}

      {started && (
        <>
          <div
            className="stage"
            onPointerDown={onStageDown}
            onPointerMove={onStageMove}
            onPointerUp={onStageUp}
            onPointerCancel={onStageUp}
          >
            {ghost && (
              <div
                ref={ghostElRef}
                className={`ghost-wrap ${phase === 'attack' ? 'rushing' : ''} ${frenzy ? 'mad' : ''}`}
                style={{ width: ghostW, height: ghostH }}
              >
                {phase === 'hunt' && !frenzy && (
                  <div className="ghost-tag" style={{ '--rc': RARITY[ghost.rarity].color }}>
                    {ghost.name}<em>{RARITY[ghost.rarity].label}</em>
                  </div>
                )}
                <div
                  ref={ringRef}
                  className="ring"
                  style={{ width: ghostW * 1.4, height: ghostW * 1.4, display: phase === 'hunt' ? 'block' : 'none' }}
                />
                <div className={`ghost-body ${sucked ? 'sucked' : ''}`}>
                  <div className="ghost-haunt"><Ghost def={ghost} size={ghostW} /></div>
                </div>
              </div>
            )}
            <div ref={arrowRef} className="arrow" aria-hidden="true">➤</div>
            <div className="reticle" />
          </div>

          {frenzy && huntLike && (
            <div className="frenzy-count" aria-live="assertive">
              <b ref={countRef}>{FRENZY_SEC}</b>
              <span>Phong ấn ngay!</span>
            </div>
          )}

          {flash && (
            <div key={flash.id} className={`subliminal ${flash.side}`} aria-hidden="true">
              <img src={flash.img} alt="" />
            </div>
          )}

          <header className="hud-top">
            <div className="hud-left">
              <div className="lv">
                <span className="lv-num">Cấp {level}</span>
                <span className="xp"><i style={{ width: `${progress * 100}%` }} /></span>
              </div>
              <div className="hp" aria-label={`Dương khí ${save.hp}/${MAX_HP}`}>
                {Array.from({ length: MAX_HP }, (_, i) => (
                  <span key={i} className={i < save.hp ? 'on' : ''} />
                ))}
                <small>Dương khí</small>
              </div>
            </div>
            <div className="hud-right">
              <div className="hud-row">
                <button className="hud-btn icon" onClick={toggleMute} aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}>
                  {muted ? '🔇' : '🔊'}
                </button>
                <button className="hud-btn" onClick={() => setPanel('board')}>
                  {rank ? `Hạng ${rank}` : 'Xếp hạng'}
                </button>
              </div>
              <button className="hud-btn" onClick={() => setPanel('dex')}>
                Sổ Ma <b>{speciesCount(save)}/{GHOSTS.length}</b>
              </button>
            </div>
          </header>

          <div className="emf" ref={emfRef} aria-label="Máy đo âm khí">
            {[0, 1, 2, 3, 4].map((i) => <span key={i} className="bar" />)}
            <small>EMF</small>
          </div>

          <footer className="hud-bottom">
            {phase === 'hunt' && ghost && !frenzy ? (
              <div className="timer" ref={timerRef}>
                <span className="timer-label">Tấn công sau</span>
                <span className="timer-bar"><i /></span>
                <b ref={timerTextRef}>{ghost.patience}s</b>
              </div>
            ) : (
              <div className={`status ${phase}`}>{frenzy && huntLike ? 'Nó đang tiến lại gần…' : status}</div>
            )}

            <div className={`tal-slot ${canThrow ? '' : 'disabled'}`}>
              <div
                ref={talRef}
                className="tal"
                onPointerDown={onTalDown}
                onPointerMove={onTalMove}
                onPointerUp={onTalUp}
                onPointerCancel={onTalUp}
                style={{ visibility: ['caught', 'dead', 'seal'].includes(phase) ? 'hidden' : 'visible' }}
              >
                <div ref={talInnerRef} className={`tal-inner ${talisman}`}>
                  <Talisman kind={talisman} />
                </div>
              </div>
            </div>

            <div className="picker">
              {Object.entries(TALISMANS).map(([k, t]) => (
                <button
                  key={k}
                  className={`pick ${talisman === k ? 'active' : ''} ${k}`}
                  onClick={() => setTalisman(k)}
                  disabled={save.talismans[k] <= 0}
                >
                  <span className="pick-icon"><Talisman kind={k} /></span>
                  {t.label} <b>{save.talismans[k]}</b>
                </button>
              ))}
            </div>

            {empty ? (
              <button className="btn-primary small" onClick={refill}>Thắp nhang nhận 10 bùa</button>
            ) : (
              <p className="hint">
                {phase === 'hunt'
                  ? 'Vuốt bùa lên phía ma, ném lúc vòng tròn xanh'
                  : dragHint ? 'Kéo màn hình để nhìn xung quanh' : 'Xoay người chậm để dò âm khí'}
              </p>
            )}
          </footer>

          {toast && <div key={toast.id} className="toast">{toast.text}</div>}
          {sealFx && <SealFX key={sealFx.id} x={sealFx.x} y={sealFx.y} />}

          {scare && (
            <div className="jumpscare" aria-hidden="true">
              <img src={scare.img} alt="" />
              <div className="scare-glitch" style={{ backgroundImage: `url(${scare.img})` }} />
            </div>
          )}

          {caught && <CaughtCard data={caught} onClose={closeCaught} />}
          {dead && <DeadCard data={dead} onRevive={revive} />}
          {panel === 'dex' && <Dex save={save} onClose={() => setPanel(null)} />}
          {panel === 'board' && <Leaderboard player={player} onClose={() => setPanel(null)} />}
        </>
      )}

      <div className="rotate-hint">Hãy cầm điện thoại dọc để săn ma</div>
    </div>
  );
}
