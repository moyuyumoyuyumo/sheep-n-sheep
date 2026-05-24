// src/daily.js
// 每日签到送道具。模仿真"羊了个羊"，每天 0 点后第一次进游戏弹礼包。
//
// 设计：
//   - localStorage key: mok-daily（存 "YYYY-MM-DD"）
//   - canClaimToday() 当天没领过 → true
//   - claimToday()    扣完日期戳 + 调 wallet.grant 加道具
//   - 用本地时区，玩家凌晨改设备时钟可绕过——这是单机游戏不防作弊
//
// 礼包配置：每天固定 +2 撤回 / +1 洗牌 / +1 移除，可后续做"连签 X 天加倍"

import { grant } from './wallet.js';

const KEY = 'mok-daily';

/** 当天的礼包内容。 */
export const DAILY_PACKET = { undo: 2, shuffle: 1, remove: 1 };

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function readLast() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

function writeLast(s) {
  try { localStorage.setItem(KEY, s); } catch {}
}

/** 今天还能不能领？（没领过 → true） */
export function canClaimToday() {
  return readLast() !== todayStr();
}

/**
 * 领今天的礼包。重复调用同一天只第一次生效。
 * @returns {object|null} 加完后的余额；已领过则返回 null
 */
export function claimToday() {
  if (!canClaimToday()) return null;
  const w = grant(DAILY_PACKET);
  writeLast(todayStr());
  return w;
}

/** 调试用：清掉今天的签到记录，让 canClaim 重新为 true。 */
export function resetDaily() {
  try { localStorage.removeItem(KEY); } catch {}
}
