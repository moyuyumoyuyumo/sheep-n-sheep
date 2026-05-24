// src/ui/controls.js
// 交互层：把"用户点击"翻译成"修改 state"，然后请 render 重画一遍。
//
// 设计原则：
//   1. 改 state 的代码只能从这里出发；render 只读不改
//   2. 用事件委托（一次性挂在 #board 上）：
//        - 永久生效，render 反复重建 DOM 也不会丢失监听
//        - 比给每张 .tile 单独绑节省内存
//   3. 每次成功操作后调 onChange()，通常是 () => render(state)
//
// 点击牌的处理流程：
//   找到 tile → 校验（playing? 没被压? 槽没满?）
//   → tile.removed = true → addToSlot
//   → findMatch 有就消除
//   → 判定胜负 → onChange()

import { isCovered } from '../game/board.js';
import { addToSlot, isSlotFull } from '../game/slot.js';
import { findMatch, isWin, isLose } from '../game/rules.js';
import { DEBUG } from '../config.js';

/**
 * 绑定所有交互事件。整个生命周期只调一次。
 * @param {object} state - 全局游戏状态（会被原地修改）
 * @param {object} handlers
 * @param {() => void} handlers.rerender - 重画一帧（点牌成功后）
 * @param {() => void} handlers.restart  - 开新局（点重开按钮时）
 */
export function bindControls(state, { rerender, restart }) {
  // 牌点击：事件委托在 #board 上
  const board = document.getElementById('board');
  if (!board) return;

  board.addEventListener('click', (e) => {
    // 事件委托：点的可能是 tile 内部任意位置，向上找 .tile
    const tileEl = e.target.closest('.tile');
    if (!tileEl) return;

    const tileId = Number(tileEl.dataset.tileId);
    if (!Number.isFinite(tileId)) return;

    const changed = handleTileClick(state, tileId);
    if (changed) rerender();
  });

  // 重开按钮：顶部、胜负弹窗里的都走同一个 restart
  document.getElementById('btn-restart')?.addEventListener('click', restart);
  document.getElementById('btn-play-again')?.addEventListener('click', restart);
}

/**
 * 处理点击一张牌的完整流程。
 * @returns {boolean} 是否对 state 产生了修改（true 才重画）
 */
function handleTileClick(state, tileId) {
  // 游戏没在进行 → 忽略
  if (state.status !== 'playing') return false;

  const tile = state.tiles.find(t => t.id === tileId);
  if (!tile || tile.removed) return false;

  // 被压住的牌不能点
  if (isCovered(tile, state.tiles)) {
    if (DEBUG) console.log(`  · 牌 #${tileId} ${tile.symbol} 被压住，无法点击`);
    return false;
  }

  // 槽满了不能加（防御性检查；理论上下面 isLose 会接管）
  if (isSlotFull(state.slot)) {
    if (DEBUG) console.log('  · 槽已满，无法再放牌');
    return false;
  }

  // ─── 修改 state ─────────────────────────────────
  tile.removed = true;
  state.slot   = addToSlot(state.slot, tile);

  if (DEBUG) {
    const slotStr = state.slot.map(t => t.symbol).join(' ');
    console.log(`  · 入槽 #${tileId} ${tile.symbol}  →  [${slotStr}]`);
  }

  // 三消：找连续 3 张同 symbol 就消掉
  const matchIdxs = findMatch(state.slot);
  if (matchIdxs) {
    const matched = matchIdxs.map(i => state.slot[i].symbol).join('');
    const set = new Set(matchIdxs);
    state.slot = state.slot.filter((_, i) => !set.has(i));
    if (DEBUG) console.log(`  · 三消 ✨ ${matched}  →  剩 ${state.slot.length} 张`);
  }

  // 判定胜负：先胜利、后失败
  if (isWin(state.tiles)) {
    state.status = 'won';
    if (DEBUG) console.log('%c🎉 胜利！全部牌已消除', 'color:#16a34a;font-weight:bold;');
  } else if (isLose(state.slot)) {
    state.status = 'lost';
    if (DEBUG) console.log('%c💀 失败：槽满且无可消', 'color:#dc2626;font-weight:bold;');
  }

  return true;
}
