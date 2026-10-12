import { Fragment, useEffect, useReducer, useRef, useState } from 'react';
import { TALISMANS, GHOSTS, BOSS } from './ghosts.js';
import { getNight, pickGhost, xpFor, RACE_CFG, seededRng } from './nights.js';
import { ITEMS, PACKS, coinsFor, nightCoins } from './items.js';
import { titleFor } from './titles.js';
import { getOmen, NO_OMEN } from './omen.js';
import { cameraDirection, wrap180, requestOrientationPermission } from './lib/orientation.js';
import { sfx, noise, unlockAudio, pauseAudio, closeAudio, isMuted, setMuted } from './lib/sound.js';
import { music } from './lib/music.js';
import {
  loadSave, writeSave, levelFromXp, loadPlayer, savePlayer, getToken, setToken, MAX_HP, loadLite, saveLite, nameKey,
} from './lib/storage.js';
import { api } from './lib/api.js';
import Ghost from './components/Ghost.jsx';
import Talisman from './components/Talisman.jsx';
import Dex from './components/Dex.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import StartScreen from './components/StartScreen.jsx';
import CaughtCard from './components/CaughtCard.jsx';
import NightCard from './components/NightCard.jsx';
import SealFX from './components/SealFX.jsx';
import Shop from './components/Shop.jsx';
import RoomPanel from './components/RoomPanel.jsx';
import RoomChat from './components/RoomChat.jsx';
import SafetyCard from './components/SafetyCard.jsx';
import CurseSheet from './components/CurseSheet.jsx';
import { CURSES, CURSE_CD_MS, DARK_MS } from './curses.js';
import { TWISTS } from './twists.js';
import { NIGHT_STORY, LORE, LORE_NEED } from './story.js';

// ====== THÔNG SỐ GAME ======
const FOV = 60;             // góc nhìn ngang (độ)
const RING_PERIOD = 1300;   // chu kỳ vòng tròn co lại (ms)
const GHOST_PX = 120;       // bề rộng ma chuẩn (px)
const HORIZON = 0.42;       // vị trí đường chân trời
const FRENZY_SEC = 5;       // tối đa 5 giây nổi điên cuối mỗi lần chạm trán
const SPAWN_MS = 3000;      // ma đầu tiên xuất hiện sau ~3 giây
const HIT_W = 0.42;         // vùng trúng theo bề rộng ma
const HIT_H = 0.38;         // vùng trúng theo chiều cao ma
const RUSH_MS = 900;        // thời gian ma lao tới
const SCARE_MS = 2100;      // thời gian hù doạ (khớp tiếng hét)
const SEAL_MS = 1700;       // thời gian hiệu ứng phong ấn
const STEALTH_SPEED = 20;   // xoay nhanh hơn (độ/giây) → Oan Hồn Tóc Rũ tàng hình
const HUNT = ['hunt', 'throw', 'shake'];
const ROOM_POLL_MS = 2000;   // phòng chơi: hỏi máy chủ mỗi 2 giây
const STUN_MS = 5000;        // phòng chơi: cạn dương khí thì bất tỉnh 5 giây
// Màn hướng dẫn: ma hiền, không giới hạn thời gian, ném trúng là bắt được
const TUT_CFG = {
  n: 1, quota: 2, catchSec: 999, rate: 1, speed: 0.55, tiers: ['common'], behaviors: false, multi: 1, decoys: false,
};
const TUT_TEXT = {
  find: 'Có ma ở gần. Xoay người theo mũi tên đỏ. Máy đo EMF bên phải càng nhiều vạch đỏ, ma càng gần.',
  throw: 'Thấy rồi! Đặt ngón tay lên lá bùa và vuốt mạnh lên phía con ma.',
  ring: 'Tốt lắm! Mẹo: vòng tròn quanh ma co lại liên tục. Ném lúc vòng chuyển xanh lá để tỷ lệ bắt cao nhất.',
};
// Camera 720p/30fps là đủ đẹp, nhẹ hơn nhiều so với để máy tự chọn 1080p–4K
const CAM = {
  video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } },
  audio: false,
};

const ZONE = {
  great: { mult: 1.6, label: 'Tuyệt vời!' },
  good: { mult: 1.25, label: 'Tốt lắm!' },
  ok: { mult: 1, label: 'Trúng rồi!' },
};
const ringZone = (s) => (s < 0.4 ? 'great' : s < 0.6 ? 'good' : 'ok');
const ringNow = (now) => 1 - ((now % RING_PERIOD) / RING_PERIOD) * 0.7;

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
  const [phase, setPhaseState] = useState('intro'); // intro | scan | hunt | throw | shake | seal | attack | caught | clear | failed
  const [run, setRunState] = useState({ night: 1, caught: 0, bossPhase: 1, omen: NO_OMEN });
  const [streak, setStreakState] = useState(0);
  const [frenzy, setFrenzy] = useState(false);
  const [talisman, setTalisman] = useState('paper');
  const [toast, setToast] = useState(null);
  const [panel, setPanel] = useState(null);
  const [caught, setCaught] = useState(null);
  const [nightCard, setNightCard] = useState(null);
  const [scare, setScare] = useState(null);
  const [sealFx, setSealFx] = useState(null);
  const [flash, setFlash] = useState(null);
  const [hurt, setHurt] = useState(0);
  const [muted, setMutedState] = useState(isMuted);
  const [fx, setFx] = useState({ bell: false, mirror: false, lamp: false });
  const [lite, setLiteState] = useState(loadLite);
  const [mode, setModeState] = useState('solo');      // solo | room
  const [room, setRoom] = useState(null);             // trạng thái phòng từ máy chủ
  const [roomCode, setRoomCode] = useState(null);
  const [roomBusy, setRoomBusy] = useState(false);
  const [roomErr, setRoomErr] = useState('');
  const [racing, setRacingState] = useState(false);
  const [chat, setChat] = useState([]);
  const [unread, setUnread] = useState(0);
  const [chatSheet, setChatSheet] = useState(false);
  const [bubbles, setBubbles] = useState([]);
  const [floaters, setFloaters] = useState([]);
  const [safety, setSafety] = useState(null);         // 'solo' | 'room' khi đang hiện cảnh báo an toàn
  const [tut, setTutState] = useState(null);          // find | throw | ring
  const [curseSheet, setCurseSheet] = useState(false);
  const [cursed, setCursed] = useState(null);         // lời nguyền đang dính
  const [curseCdUntil, setCurseCdUntil] = useState(0);
  const [, force] = useReducer((x) => x + 1, 0);

  const appRef = useRef(null);
  const phaseRef = useRef('intro');
  const saveRef = useRef(save);
  const runRef = useRef(run);
  const ghostsRef = useRef([]);      // danh sách ma đang có mặt
  const elMap = useRef({});          // phần tử DOM của từng ma / bản giả
  const idSeq = useRef(0);
  const spawnAt = useRef(null);
  const view = useRef({ sensorH: 0, sensorP: 0, dragH: 0, dragP: 0, h: 0, p: 0, speed: 0 });
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const arrowRef = useRef(null);
  const emfRef = useRef(null);
  const timerRef = useRef(null);
  const timerTextRef = useRef(null);
  const countRef = useRef(null);
  const talRef = useRef(null);
  const talInnerRef = useRef(null);
  const throwRef = useRef(null);
  const stageDrag = useRef(null);
  const streakRef = useRef(0);
  const startedRef = useRef(false);
  const modeRef = useRef('solo');
  const racingRef = useRef(false);
  const roomRef = useRef(null);
  const offsetRef = useRef(0);       // lệch giờ máy ↔ máy chủ
  const raceTimer = useRef(null);
  const raceRng = useRef(null);
  const raceCfgRef = useRef(RACE_CFG);
  const twistRef = useRef(null);
  const sectorYaw = useRef(0);
  const chatSince = useRef(0);
  const chatSheetRef = useRef(false);
  const tutRef = useRef(null);
  const camWanted = useRef(false);
  const liteRef = useRef(lite);
  const emfBars = useRef(null);
  const fxRef = useRef({ bell: 0, mirror: 0, lamp: 0 }); // thời điểm hết hiệu lực pháp khí
  const loopApi = useRef({});        // hàm mới nhất cho vòng lặp (tránh closure cũ)
  const timers = useRef([]);
  const toastTimer = useRef(null);

  const setPhase = (p) => { phaseRef.current = p; setPhaseState(p); };
  const setRun = (r) => { runRef.current = r; setRunState(r); };
  const setStreak = (n) => { streakRef.current = n; setStreakState(n); };
  const streakMult = (n) => 1 + 0.1 * Math.min(Math.max(n - 1, 0), 10);
  const bumpStreak = () => {
    const n = streakRef.current + 1;
    setStreak(n);
    setSave((s) => (n > (s.bestStreak || 0) ? { ...s, bestStreak: n } : s));
    return n;
  };
  const breakStreak = () => { if (streakRef.current) setStreak(0); };
  const later = (fn, ms) => {
    const t = setTimeout(() => { timers.current = timers.current.filter((x) => x !== t); fn(); }, ms);
    timers.current.push(t);
    return t;
  };
  const setLite = (v) => { liteRef.current = v; setLiteState(v); saveLite(v); };
  const setMode = (m) => { modeRef.current = m; setModeState(m); };
  const setRacing = (v) => { racingRef.current = v; setRacingState(v); };
  const setTut = (t) => { tutRef.current = t; setTutState(t); };
  const cfgNow = () => {
    if (tutRef.current) return TUT_CFG;
    return modeRef.current === 'room' ? raceCfgRef.current : getNight(runRef.current.night);
  };
  const showToast = (text, ms = 1700) => {
    clearTimeout(toastTimer.current);
    setToast({ text, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), ms);
  };
  const speciesCount = (s) => GHOSTS.filter((g) => s.caught[g.id]).length;
  const setEl = (key, part, el) => {
    if (!el && !elMap.current[key]) return;
    if (!elMap.current[key]) elMap.current[key] = {};
    elMap.current[key][part] = el;
  };
  const refreshFrenzy = () => setFrenzy(ghostsRef.current.some((g) => g.frenzy));
  const forgetEls = (g) => {
    delete elMap.current[g.id];
    g.decoys.forEach((_, i) => delete elMap.current[`${g.id}-d${i}`]);
  };
  const removeGhost = (g) => {
    forgetEls(g);
    ghostsRef.current = ghostsRef.current.filter((x) => x !== g);
    force();
    refreshFrenzy();
  };
  const clearGhosts = () => { ghostsRef.current.forEach(forgetEls); ghostsRef.current = []; spawnAt.current = null; force(); setFrenzy(false); };

  // ====== CAMERA ======
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(CAM);
      streamRef.current = stream;
      const v = videoRef.current;
      v.srcObject = stream;
      await v.play().catch(() => {});
      setCamOk(true);
      return true;
    } catch {
      setCamOk(false);
      return false;
    }
  };
  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    saveRef.current = save;
    writeSave(player?.name || '_guest', save);
  }, [save, player]);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    music.stop();
  }, []);

  useEffect(() => {
    const onVis = () => {
      const hidden = document.hidden;
      pauseAudio(hidden);
      if (!startedRef.current) return;
      if (hidden) closeCamera();
      else if (camWanted.current && !streamRef.current) openCamera();
    };
    const onLeave = () => { closeCamera(); music.stop(); closeAudio(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onLeave);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          name: player.name, token: player.token, xp: save.xp, total: save.total,
          species: speciesCount(save), nights: save.nightsCleared || 0,
        });
        setRank(r.rank);
        if (r.clamped) setSave((s) => ({ ...s, xp: r.xp }));
      } catch { /* mất mạng: lần sau gửi lại */ }
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [save.xp, save.total, save.nightsCleared, player]);

  // ====== BẮT ĐẦU ======
  const start = async (target = 'solo') => {
    setStarting(true);
    unlockAudio();
    await requestOrientationPermission();
    camWanted.current = await openCamera();
    if (!camWanted.current) showToast('Không mở được camera, chuyển sang chế độ đêm', 2600);
    music.start();
    setStarting(false);
    startedRef.current = true;
    setStarted(true);
    if (target === 'room') { setMode('room'); setPhase('room'); } else openIntro();
  };

  // ====== CHU KỲ ĐÊM ======
  const openIntro = () => {
    const n = (saveRef.current.nightsCleared || 0) + 1;
    clearGhosts();
    const omen = getOmen(new Date());
    setRun({ night: n, caught: 0, bossPhase: 1, omen });
    if (!saveRef.current.prologueSeen) setNightCard({ type: 'prologue', night: getNight(n), omen });
    else if (!saveRef.current.tutorialDone) startTutorial();
    else setNightCard({ type: 'intro', night: getNight(n), omen });
    setPhase('intro');
  };

  const beginNight = () => {
    sfx.knock();
    setNightCard(null);
    setSave((s) => ({ ...s, hp: MAX_HP }));
    spawnAt.current = null;
    setPhase('scan');
  };

  const nightClear = () => {
    const { night, omen } = runRef.current;
    const cfg = getNight(night);
    const bonusXp = Math.round(50 * night * omen.xpMult) + (cfg.boss ? 500 : 0);
    const bonusCoins = Math.round(nightCoins(night) * omen.coinMult) + (cfg.boss ? 200 : 0);
    const prevNights = saveRef.current.nightsCleared || 0;
    const newTitle = night > prevNights && titleFor(night) !== titleFor(prevNights) ? titleFor(night) : null;
    clearGhosts();
    setSave((s) => ({
      ...s,
      bossBeaten: s.bossBeaten || !!cfg.boss,
      journal: NIGHT_STORY[night] && !(s.journal || []).includes(night) ? [...(s.journal || []), night] : (s.journal || []),
      nightsCleared: Math.max(s.nightsCleared || 0, night),
      xp: s.xp + bonusXp,
      coins: (s.coins || 0) + bonusCoins,
      talismans: { paper: s.talismans.paper + 5, gold: s.talismans.gold + 2 },
    }));
    setNightCard({ type: 'clear', night: cfg, bonusXp, bonusCoins, newTitle, page: NIGHT_STORY[night]?.journal || null });
    setPhase('clear');
    sfx.revive();
  };

  const onNightCard = () => {
    if (nightCard?.type === 'prologue') {
      setSave((s) => ({ ...s, prologueSeen: true }));
      sfx.knock();
      if (!saveRef.current.tutorialDone) startTutorial();
      else setNightCard({ ...nightCard, type: 'intro' });
    } else if (nightCard?.type === 'tutdone') {
      setNightCard(null);
      openIntro();
    } else if (nightCard?.type === 'intro') beginNight();
    else openIntro(); // clear → đêm kế tiếp | failed → chơi lại đêm này
  };

  // ====== HƯỚNG DẪN TƯƠNG TÁC ======
  const startTutorial = () => {
    clearGhosts();
    setNightCard(null);
    setTut('find');
    setRun({ night: 1, caught: 0, bossPhase: 1, omen: NO_OMEN });
    setSave((s) => ({ ...s, hp: MAX_HP }));
    spawnAt.current = null;
    setPhase('scan');
  };
  const finishTutorial = (skipped) => {
    setTut(null);
    clearGhosts();
    setSave((s) => ({ ...s, tutorialDone: true }));
    saveRef.current = { ...saveRef.current, tutorialDone: true };
    if (skipped) openIntro();
    else { setNightCard({ type: 'tutdone', night: getNight(1) }); setPhase('intro'); sfx.revive(); }
  };

  const toggleMute = () => { const m = !muted; setMuted(m); setMutedState(m); };

  // Nhạc nền theo tình huống
  useEffect(() => {
    if (!started) return;
    let m = 'calm';
    if (HUNT.includes(phase)) m = frenzy ? 'frenzy' : 'tense';
    if (phase === 'stunned') m = 'silent';
    if (phase === 'attack' || phase === 'seal') m = 'silent';
    const left = Math.min(...ghostsRef.current.map((g) => g.timeLeft), FRENZY_SEC);
    music.setMode(m, { riserSec: Math.max(1, left) });
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

  // ====== ÁM ẢNH NGẪU NHIÊN ======
  useEffect(() => {
    if (!started) return undefined;
    let t;
    const tick = () => {
      t = setTimeout(() => {
        const ph = phaseRef.current;
        const calm = ph === 'scan' || (ph === 'hunt' && !ghostsRef.current.some((g) => g.frenzy));
        if (calm && !document.hidden) {
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
    let last = 0;
    const perf = { frames: 0, sum: 0, low: 0 };
    const loop = (now) => {
      const v = view.current;
      const fdt = last ? Math.min(0.5, (now - last) / 1000) : 0.016;
      last = now;

      // Máy yếu (dưới 40 khung hình/giây, 2 lần đo liên tiếp) → tự bật chế độ nhẹ
      if (!liteRef.current && phaseRef.current !== 'attack') {
        perf.frames += 1; perf.sum += fdt;
        if (perf.sum >= 3) {
          const fps = perf.frames / perf.sum;
          perf.low = fps < 40 ? perf.low + 1 : 0;
          perf.frames = 0; perf.sum = 0;
          if (perf.low >= 2) { setLite(true); showToast('Đã bật chế độ nhẹ cho máy chạy mượt hơn', 2400); }
        }
      }
      const prevH = v.h;
      const prevP = v.p;
      const tH = v.sensorH + v.dragH;
      const tP = clamp(v.sensorP + v.dragP, -80, 80);
      v.h = (v.h + wrap180(tH - v.h) * 0.25 + 360) % 360;
      v.p += (tP - v.p) * 0.25;
      const inst = (Math.abs(wrap180(v.h - prevH)) + Math.abs(v.p - prevP)) / Math.max(fdt, 0.001);
      v.speed += (inst - v.speed) * 0.12;

      const W = window.innerWidth;
      const H = window.innerHeight;
      const ppd = W / FOV;
      const cy = H * HORIZON;
      const cfg = cfgNow();
      const ring = ringNow(now);
      const zone = ringZone(ring);
      const L = loopApi.current;
      const bellOn = now < fxRef.current.bell;
      const omenSpeed = (runRef.current.omen || NO_OMEN).speedMult;
      const streakSpeed = (1 + 0.04 * Math.min(streakRef.current, 10)) // chuỗi càng dài, ma càng hung
        * (modeRef.current === 'room' && twistRef.current?.stepUp ? 1 + twistRef.current.stepUp * runRef.current.caught : 1);
      const lampOn = now < fxRef.current.lamp;
      const toScreen = (yaw, pitch) => {
        const dx = wrap180(yaw - v.h) * ppd;
        const dy = -(pitch - v.p) * ppd;
        return [W / 2 + dx, cy + dy, dx, dy];
      };
      const place = (els, x, y, scale) => {
        if (els?.wrap) els.wrap.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
        if (els?.ring) { els.ring.style.transform = `translate(-50%, -50%) scale(${ring})`; els.ring.dataset.zone = zone; }
      };

      let emf = 0.05 + Math.random() * 0.12;
      let arrowG = null;
      let barG = null;
      let frenzyLeft = Infinity;
      let wailingAny = false;

      for (const g of ghostsRef.current) {
        const ph = phaseRef.current;
        const els = elMap.current[g.id];
        const m = g.def.move * cfg.speed * omenSpeed * streakSpeed * (g.frenzy ? 2.1 : 1.3);
        const onScreen = g.sx > -30 && g.sx < W + 30 && g.sy > -30 && g.sy < H + 30;

        // --- Di chuyển + chiêu riêng ---
        if ((ph === 'hunt' || ph === 'throw') && !g.sucked && !bellOn) {
          const frozen = g.behavior === 'creep' && onScreen; // Bóng Trắng: đứng im khi bị nhìn
          if (!frozen) {
            g.mt += fdt;
            const jump = (g.frenzy ? 0.012 : 0.006) * m * (g.behavior === 'creep' ? 0.3 : 1);
            if (ph === 'hunt' && Math.random() < jump) g.baseYaw += rand(-8, 8);
          }
          const ya = g.behavior === 'crawl' ? 13 : 8;
          const pa = g.behavior === 'crawl' ? 1.2 : 4;
          g.yaw = g.baseYaw + Math.sin(g.mt * 0.7) * m * ya + Math.sin(g.mt * 1.9) * m * 3;
          g.pitch = g.basePitch + Math.sin(g.mt * 1.3) * m * pa;
          if (g.behavior === 'creep' && !onScreen && ph === 'hunt') g.near = Math.min(1, g.near + fdt * 0.12);
        }

        // --- Chiêu: Bé Gái thét (wail), Quỷ Nanh vồ (lunge), Mặt Quỷ tan trong sương (fog) ---
        if ((ph === 'hunt' || ph === 'throw') && !g.sucked && !bellOn) {
          g.bt = (g.bt || 0) + fdt;
          if (g.behavior === 'wail' || g.behavior === 'lunge') {
            if (g.nextEv == null) g.nextEv = g.bt + rand(2.5, 4);
            if (g.evStart == null && g.bt >= g.nextEv) {
              g.evStart = g.bt;
              g.evHit = false;
              if (g.behavior === 'wail') { sfx.wail(); vibrate([40, 30, 40, 30, 40]); } else sfx.lunge();
            }
            const dur = g.behavior === 'wail' ? 1.3 : 1.4;
            if (g.evStart != null) {
              const p = (g.bt - g.evStart) / dur;
              if (p >= 1) {
                g.evStart = null; g.ev = 0;
                g.nextEv = g.bt + rand(3.5, 5.5) / (g.frenzy ? 1.6 : 1);
              } else {
                g.ev = Math.sin(Math.PI * p);
                if (g.behavior === 'lunge' && p >= 0.5 && !g.evHit) {
                  g.evHit = true;
                  if (ph === 'hunt') { g.timeLeft = Math.max(0.5, g.timeLeft - 1.5); L.lungeHit(g); }
                }
              }
            }
          }
          if (g.behavior === 'fog') {
            const c = g.bt % 4.2;
            const fv = c < 2.4 ? 1 : c < 2.9 ? 1 - (c - 2.4) / 0.5 * 0.94 : c < 3.7 ? 0.06 : 0.06 + (c - 3.7) / 0.5 * 0.94;
            if (c >= 3.7 && (g.lastFog ?? 0) < 3.7) sfx.fog();
            g.lastFog = c;
            g.vis = lampOn ? 1 : fv;
          }
        }
        g.wailing = g.behavior === 'wail' && g.evStart != null;
        if (g.wailing) wailingAny = true;

        // --- Đồng hồ ---
        if (HUNT.includes(ph) && !bellOn) {
          const drain = g.behavior === 'creep' && !onScreen && ph === 'hunt' ? 2 : 1;
          g.timeLeft = Math.max(0, g.timeLeft - fdt * drain);
          if (!g.frenzy && g.timeLeft <= g.frenzyAt) L.frenzy(g, 'time');
          if (g.frenzy) {
            const sec = Math.ceil(g.timeLeft);
            if (sec > 0 && sec !== g.beat) { g.beat = sec; sfx.heartbeat(0.45); vibrate(60); }
            frenzyLeft = Math.min(frenzyLeft, g.timeLeft);
          } else if (!barG || g.timeLeft / g.catchSec < barG.timeLeft / barG.catchSec) {
            barG = g;
          }
          if (phaseRef.current === 'hunt' && g.timeLeft <= 0 && !g.attacking) {
            g.attacking = true;
            L.attack(g);
          }
        }

        // --- Kích thước: Bóng Trắng tiến gần, nổi điên tiến gần, lao tới ---
        let sc = 1 + g.near * 0.8;
        if (g.frenzy) sc *= 1 + (1 - clamp(g.timeLeft / g.frenzyAt, 0, 1)) * 0.6;
        if (phaseRef.current === 'attack' && g.rushing) {
          const p = clamp((now - g.attackStart) / RUSH_MS, 0, 1);
          g.yaw += wrap180(v.h - g.yaw - g.realOff) * 0.15;
          g.pitch += (v.p - g.pitch - g.realPOff) * 0.15;
          sc = 1.4 + p * p * 7;
        }
        if (g.behavior === 'wail') sc *= 1 + (g.ev || 0) * 0.12;
        if (g.behavior === 'lunge') sc *= 1 + (g.ev || 0) * 0.9;
        g.scale = sc;

        // --- Bản giả đổi chỗ với con thật ---
        if (g.decoys.length && (ph === 'hunt' || ph === 'throw') && !g.sucked && !bellOn && now > g.nextSwap) {
          const alive = g.decoys.filter((d) => d.alive);
          if (alive.length) {
            const d = alive[Math.floor(Math.random() * alive.length)];
            [g.realOff, d.off] = [d.off, g.realOff];
            [g.realPOff, d.poff] = [d.poff, g.realPOff];
            g.flickerUntil = now + 220;
          }
          g.nextSwap = now + rand(2200, 3600);
        }
        const flick = now < g.flickerUntil;

        // --- Vẽ con thật ---
        let yawNow = g.yaw + g.realOff;
        let pitchNow = g.pitch + g.realPOff;
        if (g.behavior === 'lunge' && g.ev) {
          yawNow += wrap180(v.h - yawNow) * g.ev * 0.7;
          pitchNow += (v.p - pitchNow) * g.ev * 0.7;
        }
        const [sx, sy, dx, dy] = toScreen(yawNow, pitchNow);
        g.sx = sx; g.sy = sy;
        place(els, sx, sy, sc);
        let op = 1;
        if (g.behavior === 'stealth' && phaseRef.current !== 'attack') {
          const target = v.speed > STEALTH_SPEED && !lampOn ? 0.03 : 1; // Tóc Rũ: xoay máy là tàng hình
          g.vis += (target - g.vis) * Math.min(1, fdt * (target > g.vis ? 1.6 : 7));
          op = g.vis;
        }
        if (g.behavior === 'fog' && phaseRef.current !== 'attack') op = g.vis;
        if (flick) op *= 0.12;
        if (els?.body) els.body.style.opacity = g.sucked ? '' : String(op);

        // --- Vẽ bản giả ---
        g.decoys.forEach((d, i) => {
          if (!d.alive) return;
          const de = elMap.current[`${g.id}-d${i}`];
          const [x, y] = toScreen(g.yaw + d.off, g.pitch + d.poff);
          d.sx = x; d.sy = y;
          place(de, x, y, sc);
          if (de?.body) de.body.style.opacity = g.sucked ? '0' : String(flick ? 0.1 : 0.8);
        });

        emf = Math.max(emf, 1 - Math.abs(wrap180(g.yaw + g.realOff - v.h)) / 150);
        const off = sx < 30 || sx > W - 30 || sy < 90 || sy > H - 230;
        if (off && ph === 'hunt' && (!arrowG || g.timeLeft < arrowG.g.timeLeft)) arrowG = { g, dx, dy };
      }

      // --- Mũi tên chỉ con ma gấp nhất ---
      if (arrowRef.current) {
        if (arrowG) {
          const ang = Math.atan2(arrowG.dy, arrowG.dx);
          const ex = W / 2 + Math.cos(ang) * (W / 2 - 36);
          const ey = cy + Math.sin(ang) * Math.max(60, Math.min(cy - 90, H * 0.3));
          arrowRef.current.style.transform = `translate(${ex}px, ${ey}px) translate(-50%, -50%) rotate(${ang}rad)`;
          arrowRef.current.style.opacity = '1';
        } else {
          arrowRef.current.style.opacity = '0';
        }
      }
      if (tutRef.current === 'find' && ghostsRef.current.some((g) => Math.abs(g.sx - W / 2) < W * 0.32 && g.sy > 60 && g.sy < H - 240)) {
        L.tutSeen();
      }
      if (countRef.current && frenzyLeft < Infinity) countRef.current.textContent = Math.ceil(frenzyLeft);
      if (barG) {
        timerRef.current?.style.setProperty('--t', clamp(barG.timeLeft / barG.catchSec, 0, 1));
        if (timerTextRef.current) timerTextRef.current.textContent = `${Math.ceil(barG.timeLeft)}s`;
      }

      const ph = phaseRef.current;
      appRef.current?.classList.toggle('wailing', wailingAny);
      appRef.current?.classList.toggle('near', emf > 0.82 && (ph === 'hunt' || ph === 'attack'));
      if (emfRef.current) {
        if (!emfBars.current) emfBars.current = emfRef.current.querySelectorAll('.bar');
        const lit = Math.ceil(clamp(emf, 0, 1) * 5);
        emfBars.current.forEach((b, i) => b.classList.toggle('on', i < lit));
      }

      L.spawnTick(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [started]);

  // ====== MA XUẤT HIỆN ======
  const spawnTick = (now) => {
    const ph = phaseRef.current;
    const r = runRef.current;
    const cfg = cfgNow();
    const gs = ghostsRef.current;
    const need = r.caught + gs.length < cfg.quota;
    const can = need && ((ph === 'scan' && gs.length === 0) || (ph === 'hunt' && gs.length < cfg.multi));
    if (!can) { spawnAt.current = null; return; }
    if (spawnAt.current == null) {
      spawnAt.current = now + (gs.length === 0 ? rand(SPAWN_MS - 300, SPAWN_MS + 300) : rand(2500, 4500));
    } else if (now >= spawnAt.current) {
      spawnAt.current = null;
      spawn();
    }
  };

  const makeDecoys = (behavior, cfg, def) => {
    if (behavior === 'decoy') {
      return [{ off: -16, poff: rand(-3, 3), alive: true }, { off: 16, poff: rand(-3, 3), alive: true }];
    }
    const decoyAll = modeRef.current === 'room' && twistRef.current?.decoyAll;
    if (cfg.decoys && (def.rarity !== 'common' || decoyAll) && !def.boss) {
      return [{ off: (Math.random() < 0.5 ? -1 : 1) * rand(13, 18), poff: rand(-3, 3), alive: true }];
    }
    return [];
  };

  const spawn = () => {
    const r = runRef.current;
    const cfg = cfgNow();
    const isBoss = !!cfg.boss;
    // Phòng chơi: dùng chung hạt giống để mọi người gặp cùng chuỗi ma
    const rnd = modeRef.current === 'room' && raceRng.current ? raceRng.current : Math.random;
    const rr = (a, b) => a + rnd() * (b - a);
    const tw = modeRef.current === 'room' ? twistRef.current : null;
    let def = isBoss ? BOSS : pickGhost(cfg, r.omen || NO_OMEN, rnd);
    if (tw?.prefer && rnd() < 0.7) def = GHOSTS.find((x) => x.behavior === tw.prefer) || def;
    if (tutRef.current) def = GHOSTS.find((x) => x.id === 'bong-trang-hanh-lang');
    const bossPhase = r.bossPhase || 1;
    const behavior = isBoss ? BOSS.phases[bossPhase - 1] : (cfg.behaviors ? def.behavior : null);
    const catchSec = isBoss ? BOSS.times[bossPhase - 1] : cfg.catchSec;
    const first = ghostsRef.current.length === 0;
    const side = rnd() < 0.5 ? -1 : 1;
    let yaw0 = view.current.h + side * rr(35, 140);
    if (tw?.spawn === 'behind') yaw0 = view.current.h + 180 + rr(-30, 30);
    if (tw?.spawn === 'sector') yaw0 = sectorYaw.current + rr(-25, 25);
    if (tutRef.current) yaw0 = view.current.h + side * rr(45, 75);
    const baseYaw = (yaw0 + 720) % 360;
    const basePitch = behavior === 'crawl' || tw?.spawn === 'low' ? rr(-30, -18) : rr(-4, 10);
    ghostsRef.current = [...ghostsRef.current, {
      id: ++idSeq.current, def, behavior, boss: isBoss, bossPhase,
      baseYaw, basePitch, yaw: baseYaw, pitch: basePitch, mt: 0,
      sx: -999, sy: -999, scale: 1, catchSec, timeLeft: catchSec,
      frenzyAt: Math.min(FRENZY_SEC, catchSec * 0.6), frenzy: false, beat: null, attacking: false,
      near: 0, vis: behavior === 'stealth' ? 0 : 1, decoys: makeDecoys(behavior, cfg, def), realOff: 0, realPOff: 0,
      nextSwap: performance.now() + rand(2000, 3000), flickerUntil: 0, sucked: false, rushing: false,
    }];
    force();
    if (phaseRef.current === 'scan') setPhase('hunt');
    sfx.spawn();
    vibrate(80);
    if (isBoss) {
      sfx.angry();
      vibrate([200, 100, 400]);
      showToast(bossPhase === 1 ? 'Mặt đất rung chuyển… Nó đến rồi' : 'Nó quay lại rồi…', 2400);
      return;
    }
    if (!first) { showToast('Còn một con nữa…', 1800); return; }
    const msg = {
      common: 'Có thứ gì đó đang nhìn bạn…',
      rare: 'Lạnh sống lưng. Nó đang ở rất gần',
      legendary: 'Đừng quay lại. Nó đã thấy bạn rồi',
    };
    showToast(msg[def.rarity], 2200);
  };

  // Trùm bị phong ấn 1 lần → lột xác sang giai đoạn sau
  const bossNextPhase = (g, x, y) => {
    setPhase('seal');
    setSealFx({ x, y, id: Date.now() });
    sfx.gong();
    vibrate([60, 40, 60, 40, 200]);
    const cfg = getNight(runRef.current.night);
    const next = g.bossPhase + 1;
    const beh = BOSS.phases[next - 1];
    const side = Math.random() < 0.5 ? -1 : 1;
    Object.assign(g, {
      bossPhase: next, behavior: beh, catchSec: BOSS.times[next - 1], timeLeft: BOSS.times[next - 1],
      frenzy: false, beat: null, attacking: false, near: 0, vis: beh === 'stealth' ? 0 : 1, mt: 0,
      decoys: makeDecoys(beh, cfg, BOSS), realOff: 0, realPOff: 0, sucked: true,
      baseYaw: (view.current.h + side * rand(70, 150) + 360) % 360,
      basePitch: beh === 'crawl' ? rand(-30, -20) : rand(-4, 10),
    });
    g.frenzyAt = Math.min(FRENZY_SEC, g.catchSec * 0.6);
    setRun({ ...runRef.current, bossPhase: next });
    force();
    refreshFrenzy();
    popTalisman();
    later(() => {
      setSealFx(null);
      g.sucked = false;
      force();
      setPhase('hunt');
      sfx.angry();
      sfx.rush();
      vibrate(250);
      showToast(`Phong ấn ${next - 1}/3. Nó lột xác…`, 2200);
    }, SEAL_MS);
  };

  // ====== NỔI ĐIÊN ======
  const enterFrenzy = (g, reason) => {
    if (g.frenzy) {
      g.timeLeft = Math.max(0.5, g.timeLeft - 1); // đã điên rồi, hụt tiếp → bớt 1 giây
      return;
    }
    g.frenzy = true;
    g.timeLeft = Math.min(g.timeLeft, g.frenzyAt); // không bao giờ cộng thêm giờ
    g.beat = null;
    setFrenzy(true);
    sfx.angry();
    vibrate([120, 60, 120]);
    showToast(reason === 'fail' ? 'Nó nổi điên rồi! Phong ấn ngay!' : 'Hết kiên nhẫn. Nó sắp lao tới!', 1600);
  };

  // ====== MA TẤN CÔNG ======
  const startAttack = (g) => {
    g.rushing = true;
    g.attackStart = performance.now();
    force();
    setPhase('attack');
    sfx.rush();
    vibrate(250);

    later(() => {
      setScare(g.def);
      sfx.scream();
      vibrate([300, 80, 500]);

      later(() => {
        setScare(null);
        clearGhosts();
        breakStreak();
        const hp = saveRef.current.hp - 1;
        setHurt((n) => n + 1);
        if (hp <= 0 && modeRef.current === 'room') {
          setSave((s) => ({ ...s, hp: 0 }));
          setPhase('stunned');
          later(() => {
            if (!racingRef.current) return;
            setSave((s) => ({ ...s, hp: MAX_HP }));
            setPhase('scan');
          }, STUN_MS);
        } else if (hp <= 0) {
          setSave((s) => ({ ...s, hp: 0 }));
          const r = runRef.current;
          setNightCard({ type: 'failed', night: getNight(r.night), caught: r.caught });
          setPhase('failed');
        } else {
          setSave((s) => ({ ...s, hp }));
          showToast('Bạn bị tấn công, mất 1 dương khí', 2200);
          setPhase('scan');
        }
      }, SCARE_MS);
    }, RUSH_MS);
  };

  const lungeHit = () => {
    vibrate([150, 50, 150]);
    setHurt((n) => n + 1);
    showToast('Nó vồ trúng bạn! Mất 1,5 giây', 1400);
  };
  loopApi.current = { attack: startAttack, frenzy: enterFrenzy, spawnTick, lungeHit, tutSeen: () => { setTut('throw'); vibrate(60); } };

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
    if (!ghostsRef.current.length) { resetTalisman(); return; }
    const { kind } = d;
    const ringAt = ringNow(performance.now());
    setPhase('throw');
    setSave((s) => ({ ...s, talismans: { ...s.talismans, [kind]: Math.max(0, s.talismans[kind] - 1) } }));
    sfx.throw();

    // nhắm theo con ma gần đường bay nhất
    const W = window.innerWidth;
    const H = window.innerHeight;
    const power = -vy / 1.1;
    const targetY = Math.min(...ghostsRef.current.map((g) => g.sy));
    const landY = power >= 0.55 ? Math.min(targetY, uy - 40) : uy - power * H * 0.55;
    let best = null;
    for (const g of ghostsRef.current) {
      const ly = power >= 0.55 ? Math.min(g.sy, uy - 40) : landY;
      const t = (uy - ly) / Math.max(0.2, -vy);
      const lx = clamp(ux + vx * t, -80, W + 80);
      const dist = Math.hypot(lx - g.sx, ly - g.sy);
      if (!best || dist < best.dist) best = { lx, ly, dist };
    }
    const landX = best.lx;
    const landY2 = best.ly;

    const el = talRef.current;
    el.style.transition = 'transform .42s cubic-bezier(.2,.7,.3,1)';
    el.style.transform = `translate(${landX - d.cx}px, ${landY2 - d.cy}px) scale(.5) rotate(540deg)`;

    later(() => {
      let hit = null;
      for (const g of ghostsRef.current) {
        if (g.sucked) continue;
        const w = GHOST_PX * g.def.size * g.scale;
        const h = w * g.def.ratio;
        const test = (x, y) => {
          const nx = (landX - x) / (w * HIT_W);
          const ny = (landY2 - y) / (h * HIT_H);
          return nx * nx + ny * ny;
        };
        if (!((g.behavior === 'stealth' || g.behavior === 'fog') && g.vis < 0.5)) {
          const dd = test(g.sx, g.sy);
          if (dd < 1 && (!hit || dd < hit.dd)) hit = { g, dd, decoy: null };
        }
        g.decoys.forEach((dc) => {
          if (!dc.alive) return;
          const dd = test(dc.sx, dc.sy);
          if (dd < 1 && (!hit || dd < hit.dd)) hit = { g, dd, decoy: dc };
        });
      }

      if (!hit) {
        sfx.miss();
        breakStreak();
        showToast('Trượt rồi!', 1000);
        popTalisman();
        setPhase('hunt');
        return;
      }
      if (!hit.decoy && hit.g.wailing) {
        sfx.miss();
        breakStreak();
        showToast('Tiếng thét hất văng lá bùa!', 1300);
        popTalisman();
        setPhase('hunt');
        return;
      }
      if (hit.decoy) {
        hit.decoy.alive = false;
        breakStreak();
        force();
        noise(0.5, { vol: 0.2, freq: 1500, q: 1, to: 300 });
        hit.g.timeLeft = Math.max(0.5, hit.g.timeLeft - 1);
        showToast('Bản giả! Mất bùa và 1 giây', 1400);
        popTalisman();
        setPhase('hunt');
        return;
      }

      const g = hit.g;
      const cfg = cfgNow();
      const zone = ZONE[ringZone(ringAt)];
      const p = clamp(g.def.catch * cfg.rate * TALISMANS[kind].mult * zone.mult, 0.02, 0.95);
      const success = tutRef.current ? true : Math.random() < p;
      g.landX = landX;
      g.landY = landY2;
      g.sucked = true;
      force();
      sfx.hit();
      vibrate(50);
      showToast(zone.label, 1000);
      setPhase('shake');
      talInnerRef.current?.classList.add('glow');
      runShakes(success, success ? 3 : 1 + Math.floor(Math.random() * 2), g);
    }, 440);
  };

  const runShakes = (success, n, g) => {
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
        if (success) onSealed(g); else onBreakFree(g);
      }
    };
    later(step, 450);
  };

  // Phong ấn thành công → hiệu ứng → thẻ phần thưởng
  const onSealed = (g) => {
    const x = g.landX ?? window.innerWidth / 2;
    const y = g.landY ?? window.innerHeight * HORIZON;
    const n = bumpStreak();
    if ([3, 5, 10].includes(n)) later(() => showToast(`Chuỗi ${n}! Thưởng tăng, ma cũng hung hơn`, 2000), 400);
    if (g.boss && g.bossPhase < BOSS.phases.length) { bossNextPhase(g, x, y); return; }
    removeGhost(g);
    setRun({ ...runRef.current, caught: runRef.current.caught + 1 });
    setPhase('seal');
    setSealFx({ x, y, id: Date.now() });
    sfx.gong();
    vibrate([60, 40, 60, 40, 200]);
    later(() => { setSealFx(null); onCaught(g.def); }, SEAL_MS);
  };

  const onCaught = (def) => {
    if (tutRef.current) {
      popTalisman();
      if (runRef.current.caught >= TUT_CFG.quota) { finishTutorial(false); return; }
      setTut('ring');
      setPhase('scan');
      return;
    }
    const cfg = cfgNow();
    const omen = runRef.current.omen || NO_OMEN;
    const sm = streakMult(streakRef.current);
    const xp = def.boss ? Math.round(def.xp * omen.xpMult) : Math.round(xpFor(def, cfg) * sm * omen.xpMult);
    const coins = def.boss ? Math.round(150 * omen.coinMult) : Math.round(coinsFor(def, cfg) * sm * omen.coinMult);
    const prev = saveRef.current;
    const before = levelFromXp(prev.xp).level;
    const after = levelFromXp(prev.xp + xp).level;
    const levelUp = after > before;
    const bonusPaper = Math.random() < 0.5 ? 2 : 1;
    const hpGain = prev.hp < MAX_HP;
    const loreUnlocked = !def.boss && !!LORE[def.id] && (prev.caught[def.id] || 0) + 1 === LORE_NEED;
    if (loreUnlocked && modeRef.current === 'room') later(() => showToast('Mở khoá lai lịch mới trong Sổ Ma', 2000), 1300);
    setSave((s) => ({
      ...s,
      xp: s.xp + xp,
      coins: (s.coins || 0) + coins,
      total: s.total + 1,
      hp: Math.min(MAX_HP, s.hp + 1),
      caught: def.boss ? s.caught : { ...s.caught, [def.id]: (s.caught[def.id] || 0) + 1 },
      talismans: { paper: s.talismans.paper + bonusPaper, gold: s.talismans.gold + (levelUp ? 3 : 0) },
    }));
    popTalisman();
    if (modeRef.current === 'room') {
      const c = runRef.current.caught;
      sendProgress(c);
      showToast(`Đã phong ấn ${c}/${RACE_CFG.quota}`, 1200);
      if (c >= RACE_CFG.quota) { clearGhosts(); setPhase('roomwait'); }
      else setPhase(ghostsRef.current.length ? 'hunt' : 'scan');
      return;
    }
    setCaught({ def, xp, coins, levelUp, level: after, isNew: !def.boss && !prev.caught[def.id], bonusPaper, hpGain, loreUnlocked, streak: def.boss ? 1 : sm });
    setPhase('caught');
  };

  // ====== PHÒNG CHƠI CHUNG ======
  const roomCall = async (action, extra = {}) => {
    const r = await api.room(action, {
      name: player?.name, token: player?.token, code: roomRef.current?.code, since: chatSince.current, ...extra,
    });
    if (r.room) {
      offsetRef.current = r.room.now - Date.now();
      roomRef.current = r.room;
      setRoom(r.room);
      mergeChat(r.room.chat || [], action === 'join' || action === 'create');
    }
    return r;
  };

  // ====== CHAT ======
  const mergeChat = (msgs, backlog = false) => {
    const fresh = msgs.filter((m) => m.id > chatSince.current);
    if (!fresh.length) return;
    chatSince.current = Math.max(...fresh.map((m) => m.id));
    const myKey = nameKey(player?.name);
    const tagged = fresh.map((m) => ({ ...m, me: m.k === myKey }));
    setChat((c) => [...c, ...tagged].slice(-80));
    if (backlog) return;
    tagged.forEach((m) => {
      if (m.y === 'emote') {
        const id = `${m.id}`;
        setFloaters((f) => [...f, { id, e: m.t, n: m.me ? 'Bạn' : m.n, x: 15 + Math.random() * 70 }]);
        setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 2600);
      }
      if (m.y === 'fx' && m.to === myKey) applyCurse(m);
      if (m.me) return;
      if (!chatSheetRef.current) setUnread((u) => u + 1);
      if (m.y !== 'emote') sfx.chat?.();
      if (racingRef.current && !chatSheetRef.current) {
        setBubbles((b) => [...b.slice(-2), m]);
        setTimeout(() => setBubbles((b) => b.filter((x) => x.id !== m.id)), 5000);
      }
    });
  };

  // ====== LỜI NGUYỀN ======
  const applyCurse = (m) => {
    const c = CURSES[m.fx];
    if (!c) return;
    if (m.fx === 'gift') {
      sfx.coin();
      setSave((s) => ({ ...s, talismans: { ...s.talismans, gold: s.talismans.gold + 1 } }));
      showToast(`${m.n} tặng bạn 1 Bùa Vàng`, 2000);
      return;
    }
    if (!racingRef.current) return;
    setCursed({ kind: m.fx, from: m.n, id: m.id });
    later(() => setCursed((x) => (x?.id === m.id ? null : x)), m.fx === 'dark' ? DARK_MS : 1800);
    if (m.fx === 'dark') { sfx.fog(); vibrate(200); }
    if (m.fx === 'knock') {
      sfx.knock(); later(() => sfx.knock(), 650); later(() => sfx.knock(), 1300);
      sfx.whisper();
      vibrate([80, 60, 80, 60, 80, 300, 80, 60, 80]);
    }
    showToast(`${m.n} nguyền bạn: ${c.name}!`, 1800);
  };

  const castCurse = async (target, kind) => {
    const c = CURSES[kind];
    if ((saveRef.current.coins || 0) < c.cost) { showToast('Không đủ vàng mã', 1400); return; }
    try {
      const r = await roomCall('curse', { target: target.key, kind });
      if (r?.ok) {
        setSave((s) => ({ ...s, coins: (s.coins || 0) - c.cost }));
        setCurseCdUntil(Date.now() + CURSE_CD_MS);
        setCurseSheet(false);
        sfx.angry();
        showToast(`Đã ${kind === 'gift' ? 'tặng bùa cho' : `ném ${c.name} vào`} ${target.name}`, 1600);
      }
    } catch (e) { showToast(e.message, 1800); }
  };

  const sendChat = async (text) => {
    try { await roomCall('chat', { text }); } catch (e) { showToast(e.message, 1400); }
  };

  const openChatSheet = (v) => { chatSheetRef.current = v; setChatSheet(v); if (v) { setUnread(0); setBubbles([]); } };
  const resetChat = () => { chatSince.current = 0; setChat([]); setUnread(0); setBubbles([]); setFloaters([]); openChatSheet(false); };

  const roomAct = async (action, extra) => {
    setRoomBusy(true);
    setRoomErr('');
    if (action === 'create' || action === 'join') resetChat();
    try {
      const r = await roomCall(action, extra);
      if (action === 'create' || action === 'join') setRoomCode(r.room.code);
      return r;
    } catch (e) {
      setRoomErr(e.message);
      return null;
    } finally {
      setRoomBusy(false);
    }
  };

  const sendProgress = async (caught, tries = 3) => {
    try { await roomCall('progress', { caught }); } catch {
      if (tries > 1) later(() => sendProgress(caught, tries - 1), 1500);
    }
  };

  const answerPuzzle = async (answer) => {
    const r = await roomAct('answer', { answer });
    if (r?.ok) { sfx.gong(); vibrate([60, 40, 200]); }
    return r ? r.ok : null;
  };

  const leaveRoom = async () => {
    try { if (roomRef.current) await api.room('leave', { name: player?.name, token: player?.token, code: roomRef.current.code }); } catch { /* bỏ qua */ }
    clearTimeout(raceTimer.current);
    roomRef.current = null;
    setRoom(null);
    setRoomCode(null);
    setRacing(false);
    resetChat();
    clearGhosts();
    setPhase('room');
  };

  const backToSolo = () => { setMode('solo'); setRoomErr(''); openIntro(); };

  const beginRace = () => {
    const rm = roomRef.current;
    if (!rm || racingRef.current) return;
    clearGhosts();
    raceRng.current = seededRng(rm.seed);
    const tw = TWISTS[rm.puzzle?.twist] || null;
    twistRef.current = tw;
    raceCfgRef.current = { ...RACE_CFG, ...(tw?.cfg || {}) };
    sectorYaw.current = view.current.h + 100 + raceRng.current() * 160;
    const omen = tw?.omen ? { ...NO_OMEN, ...tw.omen, tags: [] } : NO_OMEN;
    setRun({ night: 0, caught: 0, bossPhase: 1, omen });
    setStreak(0);
    const solver = rm.puzzle?.solvedBy && rm.puzzle.solvedBy === player?.name;
    setSave((s) => {
      const items = { ...s.items };
      if (tw?.gift) items[tw.gift] = Math.min(ITEMS[tw.gift].max, (items[tw.gift] || 0) + 1);
      if (solver) items.bell = Math.min(ITEMS.bell.max, (items.bell || 0) + 1);
      return { ...s, hp: MAX_HP, items };
    });
    if (solver) later(() => showToast('Thưởng người giải mật thư: +1 Chuông trấn hồn', 2200), 600);
    setRacing(true);
    sfx.knock();
    setPhase('scan');
  };

  const endRace = () => {
    clearTimeout(raceTimer.current);
    setRacing(false);
    clearGhosts();
    setPhase('room');
  };

  // Hỏi máy chủ định kỳ khi đang ở trong phòng
  useEffect(() => {
    if (!roomCode) return undefined;
    let alive = true;
    const poll = async () => {
      if (document.hidden) return;
      try { await roomCall('state'); } catch (e) {
        if (alive && (e.status === 404 || e.status === 403)) {
          setRoomErr('Phòng đã đóng hoặc bạn đã rời phòng');
          roomRef.current = null; setRoom(null); setRoomCode(null); endRace();
        }
      }
    };
    const t = setInterval(poll, ROOM_POLL_MS);
    return () => { alive = false; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  // Phản ứng theo trạng thái phòng: đếm ngược → vào đua, có người thắng → dừng
  useEffect(() => {
    if (!room || modeRef.current !== 'room') return;
    if (room.status === 'race' && !racingRef.current) {
      clearTimeout(raceTimer.current);
      const wait = Math.max(0, room.raceStart - (Date.now() + offsetRef.current));
      raceTimer.current = setTimeout(beginRace, wait);
    }
    if ((room.status === 'done' || room.status === 'lobby') && racingRef.current) {
      if (room.status === 'done') {
        const won = room.winner && room.players.find((p) => p.me)?.key === room.winner;
        if (won) { sfx.gong(); vibrate([80, 40, 80, 40, 300]); } else sfx.angry();
      }
      endRace();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status, room?.raceStart, room?.round]);

  // Bắt hụt → bùa cháy rụi, ma thoát ra và nổi điên
  const onBreakFree = (g) => {
    const inner = talInnerRef.current;
    if (inner) { inner.classList.remove('glow', 'wobble'); void inner.offsetWidth; inner.classList.add('burn'); }
    sfx.burn();
    breakStreak();
    g.sucked = false;
    force();
    setPhase('hunt');
    enterFrenzy(g, 'fail');
    later(popTalisman, 750);
  };

  const closeCaught = () => {
    setCaught(null);
    const r = runRef.current;
    if (r.caught >= getNight(r.night).quota) nightClear();
    else setPhase(ghostsRef.current.length ? 'hunt' : 'scan');
  };

  const refill = () => {
    sfx.refill();
    setSave((s) => ({ ...s, talismans: { ...s.talismans, paper: s.talismans.paper + 5 } }));
    setTalisman('paper');
    showToast('Nhận 5 Bùa Giấy');
  };

  // ====== PHÁP KHÍ ======
  const activateItem = (id) => {
    const it = ITEMS[id];
    if ((save.items[id] || 0) <= 0) { showToast(`Hết ${it.name}, mua thêm ở tiệm trước mỗi đêm`); return; }
    if (id === 'incense') {
      if (save.hp >= MAX_HP) { showToast('Dương khí đang đầy'); return; }
      sfx.revive();
      setSave((s) => ({ ...s, hp: Math.min(MAX_HP, s.hp + 1), items: { ...s.items, incense: s.items.incense - 1 } }));
      showToast('Hồi 1 dương khí');
      return;
    }
    if (phaseRef.current !== 'hunt' || !ghostsRef.current.length) { showToast('Chỉ dùng được khi đang đối mặt với ma'); return; }
    if (performance.now() < fxRef.current[id]) return; // đang có hiệu lực
    fxRef.current[id] = performance.now() + it.sec * 1000;
    setFx((f) => ({ ...f, [id]: true }));
    later(() => setFx((f) => ({ ...f, [id]: false })), it.sec * 1000);
    setSave((s) => ({ ...s, items: { ...s.items, [id]: s.items[id] - 1 } }));
    sfx[id]?.();
    vibrate(40);
  };

  const buy = (kind, id) => {
    const s0 = saveRef.current;
    const price = kind === 'item' ? ITEMS[id].price : PACKS[id].price;
    if ((s0.coins || 0) < price) return;
    if (kind === 'item' && (s0.items[id] || 0) >= ITEMS[id].max) return;
    sfx.coin();
    setSave((s) => {
      const next = { ...s, coins: s.coins - price };
      if (kind === 'item') next.items = { ...s.items, [id]: (s.items[id] || 0) + 1 };
      else {
        const give = PACKS[id].give;
        next.talismans = { paper: s.talismans.paper + (give.paper || 0), gold: s.talismans.gold + (give.gold || 0) };
      }
      return next;
    });
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
  const cfg = mode === 'room' ? raceCfgRef.current : getNight(run.night);
  const rivals = mode === 'room' && room ? room.players.filter((p) => !p.me).slice(0, 3) : [];
  const empty = save.talismans.paper + save.talismans.gold === 0;
  const canThrow = phase === 'hunt' && !empty;
  const huntLike = HUNT.includes(phase);
  const ghosts = ghostsRef.current;

  let status = 'Đang dò âm khí…';
  if (phase === 'throw') status = 'Bùa đang bay…';
  if (phase === 'shake') status = 'Đang phong ấn…';
  if (phase === 'seal') status = 'Phong ấn thành công';
  if (phase === 'attack') status = 'Nó đang lao tới!';
  if (tut && phase === 'hunt') status = 'Con ma đang đứng chờ, cứ bình tĩnh';

  const appClass = ['app', lite && 'lite', scare && 'shaking', frenzy && huntLike && 'frenzy',
    fx.bell && 'fx-bell', fx.mirror && 'fx-mirror', fx.lamp && 'fx-lamp',
    ...(run.omen?.tags || []).map((t) => `omen-${t.id}`),
    mode === 'room' && racing && twistRef.current?.dark && 'twist-dark',
    cursed?.kind === 'knock' && 'cursed-knock'].filter(Boolean).join(' ');
  const boss = ghosts.find((g) => g.boss);

  const renderGhost = (g, key, decoy) => {
    const w = GHOST_PX * g.def.size;
    const showRing = phase === 'hunt' && !g.sucked;
    const cls = ['ghost-wrap', decoy ? 'decoy' : 'real', g.boss && 'boss', g.rushing && !decoy && 'rushing', g.frenzy && 'mad']
      .filter(Boolean).join(' ');
    return (
      <div key={key} ref={(el) => setEl(key, 'wrap', el)} className={cls} style={{ width: w, height: w * g.def.ratio }}>
        <div
          ref={(el) => setEl(key, 'ring', el)}
          className="ring"
          style={{ width: w * 1.4, height: w * 1.4, display: showRing ? 'block' : 'none' }}
        />
        <div ref={(el) => setEl(key, 'body', el)} className={`ghost-body ${!decoy && g.sucked ? 'sucked' : ''}`}>
          <div className="ghost-haunt"><Ghost def={g.def} size={w} /></div>
        </div>
      </div>
    );
  };

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
        <StartScreen
          player={player}
          nightsCleared={save.nightsCleared || 0}
          lite={lite}
          onToggleLite={() => setLite(!lite)}
          onLogin={login}
          onLogout={logout}
          onStart={() => setSafety('solo')}
          onStartRoom={() => setSafety('room')}
          onReplayTutorial={() => { setSave((s) => ({ ...s, tutorialDone: false })); setSafety('solo'); }}
          starting={starting}
        />
      )}

      {!started && safety && (
        <SafetyCard
          onOk={() => { const t = safety; setSafety(null); start(t); }}
          onCancel={() => setSafety(null)}
        />
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
            {ghosts.map((g) => (
              <Fragment key={g.id}>
                {g.decoys.map((d, i) => d.alive && renderGhost(g, `${g.id}-d${i}`, true))}
                {renderGhost(g, g.id, false)}
              </Fragment>
            ))}
            <div ref={arrowRef} className="arrow" aria-hidden="true">➤</div>
            <div className="reticle" />
          </div>

          {boss && (
            <div className="boss-bar" aria-label={`Trùm: đã phong ấn ${boss.bossPhase - 1}/3`}>
              {BOSS.phases.map((_, i) => <i key={i} className={i < boss.bossPhase - 1 ? 'done' : i === boss.bossPhase - 1 ? 'now' : ''} />)}
            </div>
          )}

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
              <div className="night-pill">
                <span className="night-num">{tut ? 'Hướng dẫn' : mode === 'room' ? 'Đua' : `Đêm ${run.night}`}</span>
                <span className="pips" aria-label={`Đã phong ấn ${run.caught}/${cfg.quota}`}>
                  {Array.from({ length: cfg.quota }, (_, i) => <i key={i} className={i < run.caught ? 'on' : ''} />)}
                </span>
              </div>
              <div className="hp" aria-label={`Dương khí ${save.hp}/${MAX_HP}`}>
                {Array.from({ length: MAX_HP }, (_, i) => (
                  <span key={i} className={i < save.hp ? 'on' : ''} />
                ))}
                <small>Dương khí</small>
              </div>
              {mode === 'room' && racing && twistRef.current && (
                <div className="omen-pill witching">{twistRef.current.label}</div>
              )}
              {streak >= 2 && <div className="streak-pill">Chuỗi {streak} <b>×{streakMult(streak).toFixed(1)}</b></div>}
              {run.omen?.tags.map((t) => <div key={t.id} className={`omen-pill ${t.id}`}>{t.label}</div>)}
            </div>
            <div className="hud-right">
              <div className="hud-row">
                <button className="hud-btn icon" onClick={toggleMute} aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}>
                  {muted ? '🔇' : '🔊'}
                </button>
                {mode === 'room' && racing ? (
                  <>
                    <button className="hud-btn icon" onClick={() => setCurseSheet(true)} aria-label="Lời nguyền">💀</button>
                    <button className="hud-btn chat-btn" onClick={() => openChatSheet(true)} aria-label="Trò chuyện">
                      💬 {unread > 0 && <i className="badge">{unread}</i>}
                    </button>
                  </>
                ) : (
                  <button className="hud-btn" onClick={() => setPanel('board')}>
                    {rank ? `Hạng ${rank}` : 'Xếp hạng'}
                  </button>
                )}
              </div>
              <button className="hud-btn" onClick={() => setPanel('dex')}>
                Sổ Ma <b>{speciesCount(save)}/{GHOSTS.length}</b>
              </button>
            </div>
          </header>

          <div className="item-bar" aria-label="Pháp khí">
            {Object.entries(ITEMS).map(([id, it]) => (
              <button
                key={id}
                className={`item-btn ${fx[id] ? 'active' : ''}`}
                onClick={() => activateItem(id)}
                disabled={(save.items[id] || 0) <= 0}
                aria-label={`${it.name}, còn ${save.items[id] || 0}`}
                title={it.name}
              >
                <span>{it.icon}</span>
                <b>{save.items[id] || 0}</b>
              </button>
            ))}
          </div>

          <div className="emf" ref={emfRef} aria-label="Máy đo âm khí">
            {[0, 1, 2, 3, 4].map((i) => <span key={i} className="bar" />)}
            <small>EMF</small>
          </div>

          <footer className="hud-bottom">
            {phase === 'hunt' && ghosts.length > 0 && !frenzy && !tut ? (
              <div className="timer" ref={timerRef}>
                <span className="timer-label">Tấn công sau</span>
                <span className="timer-bar"><i /></span>
                <b ref={timerTextRef}>{cfg.catchSec}s</b>
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
                style={{ visibility: ['caught', 'seal', 'intro', 'clear', 'failed'].includes(phase) ? 'hidden' : 'visible' }}
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
              <button className="btn-primary small" onClick={refill}>Thắp nhang nhận 5 bùa</button>
            ) : (
              <p className="hint">
                {phase === 'hunt'
                  ? 'Vuốt bùa lên phía ma, ném lúc vòng tròn xanh'
                  : dragHint ? 'Kéo màn hình để nhìn xung quanh' : 'Xoay người chậm để dò âm khí'}
              </p>
            )}
          </footer>

          {mode === 'room' && racing && (
            <div className="race-board" aria-label="Đối thủ">
              {rivals.map((p) => (
                <div key={p.key} className="rival">
                  <span>{p.name}</span>
                  <span className="pips">{Array.from({ length: room.quota }, (_, i) => <i key={i} className={i < p.caught ? 'on' : ''} />)}</span>
                </div>
              ))}
              <button className="link-btn" onClick={leaveRoom}>Rời phòng</button>
            </div>
          )}

          {phase === 'stunned' && (
            <div className="stun-overlay"><h2>Bất tỉnh…</h2><p>Hồi lại sau vài giây. Đối thủ vẫn đang săn!</p></div>
          )}
          {phase === 'roomwait' && (
            <div className="stun-overlay done"><h2>Đã phong ấn đủ!</h2><p>Đang chờ máy chủ xác nhận người về nhất…</p></div>
          )}

          {mode === 'room' && !racing && phase !== 'roomwait' && (
            <RoomPanel
              room={room}
              offset={offsetRef.current}
              busy={roomBusy}
              error={roomErr}
              onCreate={() => roomAct('create')}
              onJoin={(c) => roomAct('join', { code: c })}
              onStart={() => roomAct('start')}
              onAnswer={answerPuzzle}
              onReset={() => roomAct('reset')}
              chat={chat}
              unread={unread}
              onChat={sendChat}
              onReadChat={() => setUnread(0)}
              onLeave={leaveRoom}
              onSolo={backToSolo}
            />
          )}

          {mode === 'room' && racing && bubbles.length > 0 && (
            <div className="chat-bubbles" onClick={() => openChatSheet(true)}>
              {bubbles.map((m) => (
                <div key={m.id} className={`bubble ${m.y}`}>
                  {m.y === 'fx' ? `${m.n} ${CURSES[m.fx]?.icon} ${m.toName}` : m.y === 'sys' ? m.t : <><b>{m.n}:</b> {m.t}</>}
                </div>
              ))}
            </div>
          )}
          {chatSheet && (
            <div className="modal" onClick={() => openChatSheet(false)}>
              <div className="sheet chat-sheet" onClick={(e) => e.stopPropagation()}>
                <div className="sheet-head">
                  <h2>Trò chuyện</h2>
                  <button className="icon-btn" onClick={() => openChatSheet(false)} aria-label="Đóng">✕</button>
                </div>
                <RoomChat messages={chat} onSend={sendChat} />
              </div>
            </div>
          )}
          {floaters.map((f) => (
            <div key={f.id} className="floater" style={{ left: `${f.x}%` }} aria-hidden="true">
              <span>{f.e}</span><small>{f.n}</small>
            </div>
          ))}

          {tut && (
            <div className="coach" role="status">
              <p>{tut === 'find' && dragHint ? TUT_TEXT.find.replace('Xoay người', 'Kéo màn hình') : TUT_TEXT[tut]}</p>
              <button className="link-btn" onClick={() => finishTutorial(true)}>Bỏ qua hướng dẫn</button>
            </div>
          )}
          {tut && tut !== 'find' && phase === 'hunt' && <div className="finger-hint" aria-hidden="true">👆</div>}

          {cursed?.kind === 'dark' && (
            <div className="curse-dark" aria-hidden="true"><span>🌑 {cursed.from} phủ màn đêm lên bạn</span></div>
          )}
          {curseSheet && (
            <CurseSheet
              rivals={room ? room.players.filter((p) => !p.me).map((p) => ({ ...p, quota: room.quota })) : []}
              coins={save.coins || 0}
              cdLeft={Math.max(0, curseCdUntil - Date.now())}
              onCurse={castCurse}
              onClose={() => setCurseSheet(false)}
            />
          )}

          {toast && <div key={toast.id} className="toast">{toast.text}</div>}
          {sealFx && <SealFX key={sealFx.id} x={sealFx.x} y={sealFx.y} />}

          {scare && (
            <div className="jumpscare" aria-hidden="true">
              <img src={scare.img} alt="" />
              <div className="scare-glitch" style={{ backgroundImage: `url(${scare.img})` }} />
            </div>
          )}

          {caught && <CaughtCard data={caught} onClose={closeCaught} />}
          {nightCard && (
            <NightCard data={nightCard} coins={save.coins || 0} onAction={onNightCard} onShop={() => setPanel('shop')} />
          )}
          {panel === 'shop' && <Shop save={save} onBuy={buy} onClose={() => setPanel(null)} />}
          {panel === 'dex' && <Dex save={save} onClose={() => setPanel(null)} />}
          {panel === 'board' && <Leaderboard player={player} onClose={() => setPanel(null)} />}
        </>
      )}

      <div className="rotate-hint">Hãy cầm điện thoại dọc để săn ma</div>
    </div>
  );
}
