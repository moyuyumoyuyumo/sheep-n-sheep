// src/ui/audio.js
// 用 Web Audio API 编程合成短音效 + 循环 BGM，无需外部音频文件。
//
// 设计原则：
//   1. 零外部资源 — 全部用 oscillator 合成，加载即可用
//   2. lazy 初始化 — 首次播音时才 new AudioContext()，避免浏览器警告
//   3. 失败静默 — 浏览器不支持或 ctx 创建失败就当作静音
//   4. 偏好持久化（key: mok-muted 控制音效, mok-bgm 控制 BGM）

const SFX_KEY = 'mok-muted';      // 音效（点击/三消/胜负）开关
const BGM_KEY = 'mok-bgm';        // BGM 开关（默认开）

let ctx = null;
let muted   = readKey(SFX_KEY, false);   // 默认有音效
let bgmOn   = readKey(BGM_KEY, true);    // 默认开 BGM

function readKey(k, defaultBool) {
  try {
    const v = localStorage.getItem(k);
    if (v === null) return defaultBool;
    return v === '1';
  } catch { return defaultBool; }
}

function writeKey(k, v) {
  try { localStorage.setItem(k, v ? '1' : '0'); } catch {}
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

// ─── 音效开关 ─────────────────────────────────────
export function toggleMute() {
  muted = !muted;
  writeKey(SFX_KEY, muted);
  return muted;
}

export function isMuted() {
  return muted;
}

// ─── BGM 循环 ─────────────────────────────────────
// 简单 C 大调 8 拍循环（参考"羊了个羊"那种 Q 萌轻快感）
// 每个音 0.4s，整曲 4.2s 一个循环，sine 波 + 低音量 0.04 不抢戏
const BGM_NOTES = [
  { freq: 523.25, dur: 0.40 },  // C5
  { freq: 659.25, dur: 0.40 },  // E5
  { freq: 783.99, dur: 0.40 },  // G5
  { freq: 659.25, dur: 0.40 },  // E5
  { freq: 587.33, dur: 0.40 },  // D5
  { freq: 698.46, dur: 0.40 },  // F5
  { freq: 587.33, dur: 0.40 },  // D5
  { freq: 523.25, dur: 0.80 },  // C5（长尾收）
  { freq:   0.00, dur: 0.20 },  // 半拍休止
];

let bgmTimer    = null;
let bgmActive   = false;     // 当前是否在播（受用户开关 + 是否启动控制）

/**
 * 调度一个完整 cycle 的所有音符到 audioContext.currentTime 之后；
 * cycle 结束前用 setTimeout 触发下一轮。
 */
function scheduleBgmCycle() {
  if (!bgmActive) return;
  const c = ensureCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume();

  let t = c.currentTime + 0.05;
  let total = 0;
  for (const n of BGM_NOTES) {
    if (n.freq > 0) {
      const osc  = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = n.freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.04,    t + 0.02);  // BGM 音量低
      gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur - 0.02);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + n.dur);
    }
    t     += n.dur;
    total += n.dur;
  }

  // 在 cycle 结束前 100ms 触发下一轮，保证连续不断
  bgmTimer = setTimeout(scheduleBgmCycle, (total - 0.1) * 1000);
}

/** 开始 BGM 循环。如果用户偏好关 BGM，这个函数静默无效。 */
export function startBgm() {
  if (!bgmOn || bgmActive) return;
  bgmActive = true;
  scheduleBgmCycle();
}

/** 停止 BGM。 */
export function stopBgm() {
  bgmActive = false;
  if (bgmTimer) { clearTimeout(bgmTimer); bgmTimer = null; }
}

/** 切换 BGM 开关。返回新状态（true=开）。 */
export function toggleBgm() {
  bgmOn = !bgmOn;
  writeKey(BGM_KEY, bgmOn);
  if (bgmOn) startBgm();
  else       stopBgm();
  return bgmOn;
}

/** 当前 BGM 开关偏好。 */
export function isBgmOn() {
  return bgmOn;
}
