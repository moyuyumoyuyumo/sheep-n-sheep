// src/ui/audio.js
// 用 Web Audio API 编程合成短音效，无需外部音频文件。
//
// 设计原则：
//   1. 零外部资源 — 全部用 oscillator 合成，加载即可用
//   2. lazy 初始化 — 首次播音时才 new AudioContext()，避免浏览器警告
//   3. 失败静默 — 浏览器不支持或 ctx 创建失败就当作静音
//   4. 静音偏好持久化到 localStorage（key: mok-muted）

const STORAGE_KEY = 'mok-muted';

let ctx = null;
let muted = readMuted();

function readMuted() {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; }
  catch { return false; }
}

function writeMuted(v) {
  try { localStorage.setItem(STORAGE_KEY, v ? '1' : '0'); }
  catch {}
}

function ensureCtx() {
  if (ctx) return ctx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  try { ctx = new Ctx(); } catch { ctx = null; }
  return ctx;
}

/**
 * 串行播放一组音符。
 * @param {Array<{freq:number, duration:number, type?:string, gain?:number}>} notes
 */
function playSequence(notes) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume();

  let t = c.currentTime;
  for (const n of notes) {
    const osc  = c.createOscillator();
    const gain = c.createGain();
    osc.type = n.type || 'sine';
    osc.frequency.value = n.freq;

    const peak = n.gain ?? 0.15;
    // 用 exponentialRampToValueAtTime 做柔和的 attack/release
    // exp ramp 不能到 0，所以用 0.0001 当作"几乎静音"
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak,    t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + n.duration);

    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + n.duration + 0.02);

    t += n.duration;
  }
}

// ─── 对外 API ────────────────────────────────────────

export function playClick() {
  playSequence([{ freq: 660, duration: 0.06, type: 'square', gain: 0.08 }]);
}

export function playMatch() {
  playSequence([
    { freq: 523.25, duration: 0.08 },  // C5
    { freq: 659.25, duration: 0.08 },  // E5
    { freq: 783.99, duration: 0.18 },  // G5
  ]);
}

export function playWin() {
  playSequence([
    { freq: 523.25, duration: 0.10 },  // C5
    { freq: 659.25, duration: 0.10 },  // E5
    { freq: 783.99, duration: 0.10 },  // G5
    { freq: 1046.5, duration: 0.26 },  // C6
  ]);
}

export function playLose() {
  playSequence([
    { freq: 392, duration: 0.16 },                        // G4
    { freq: 311, duration: 0.16 },                        // Eb4
    { freq: 247, duration: 0.34, type: 'sawtooth' },      // B3
  ]);
}

export function toggleMute() {
  muted = !muted;
  writeMuted(muted);
  return muted;
}

export function isMuted() {
  return muted;
}
