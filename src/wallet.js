// src/wallet.js
// 道具"钱包"：账户级资源，跨关卡持久化。
// 与原来"每关重置 {undo:3, shuffle:2, remove:1}"不同——
// 现在道具是账号资源：消耗一次少一次，靠签到 / 看广告 / 后门 / 通关奖励补充。
//
// 设计：
//   - localStorage key: mok-wallet
//   - 第一次启动 → 拿默认初始 INITIAL（送新手 3+2+1）
//   - 读写失败静默（隐私模式 / 配额满不抛错）
//   - 所有数值有 MAX_PER_TOOL 上限避免数字越界 / 显示崩

const KEY = 'mok-wallet';

/** 新玩家首次打开游戏赠送的初始道具。 */
const INITIAL = { undo: 3, shuffle: 2, remove: 1 };

/** 单种道具上限（后门会触发，让显示不至于变 4 位数挤爆 UI）。 */
const MAX_PER_TOOL = 999;

function safeRead() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function safeWrite(w) {
  try { localStorage.setItem(KEY, JSON.stringify(w)); } catch {}
}

/** 拿到当前余额（确保所有道具字段都存在，缺的补 0）。 */
export function getBalance() {
  const stored = safeRead();
  if (!stored) {
    // 第一次访问 → 写入初始值
    const init = { ...INITIAL };
    safeWrite(init);
    return init;
  }
  return {
    undo:    Number(stored.undo    ?? 0),
    shuffle: Number(stored.shuffle ?? 0),
    remove:  Number(stored.remove  ?? 0),
  };
}

/**
 * 花一个道具（扣 1 次）。
 * @returns {boolean} false=余额不够
 */
export function spend(tool) {
  const w = getBalance();
  if ((w[tool] ?? 0) <= 0) return false;
  w[tool]--;
  safeWrite(w);
  return true;
}

/**
 * 增加道具（签到 / 看广告 / 通关奖励 / 后门 都走这里）。
 * @param {object} packet - 如 { undo: 2, shuffle: 1 }
 * @returns {object} 增加后的新余额
 */
export function grant(packet) {
  const w = getBalance();
  for (const k of Object.keys(packet)) {
    if (!(k in w)) continue;
    w[k] = Math.min(MAX_PER_TOOL, (w[k] || 0) + Number(packet[k] || 0));
  }
  safeWrite(w);
  return w;
}

/**
 * 一键设值（后门用："不管原来多少，直接给我满"）。
 * @param {object} packet - 如 { undo: 999, shuffle: 999, remove: 999 }
 */
export function setBalance(packet) {
  const w = getBalance();
  for (const k of Object.keys(packet)) {
    if (!(k in w)) continue;
    w[k] = Math.min(MAX_PER_TOOL, Math.max(0, Number(packet[k] || 0)));
  }
  safeWrite(w);
  return w;
}

/** 调试用：清空回新手初始。 */
export function resetWallet() {
  safeWrite({ ...INITIAL });
  return { ...INITIAL };
}
