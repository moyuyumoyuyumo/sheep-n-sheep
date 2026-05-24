// src/ui/controls.js
// 交互层：把"用户点击"翻译成"修改 state"，然后请 render 重画一遍。
//
// 设计原则：
//   1. 改 state 的代码只能从这里出发；render 只读不改
//   2. 事件委托一次性挂在 #board，render 反复重建 DOM 不丢监听
//   3. 三消有动画延迟（320ms）：先渲染"消失中"，再真消除 + 判胜负
//   4. 动画期间锁住输入，避免乱点导致状态错乱
//
// 点击牌流程：
//   tile → 校验 → tile.removed + addToSlot → 渲染
//   匹配？  → 标 _matching → 渲染 → setTimeout → 真消 → 判胜负 → 渲染
//   不匹配？→ 判 isLose → 渲染

import { isCovered } from '../game/board.js';
import { addToSlot, isSlotFull } from '../game/slot.js';
import { findMatch, isWin, isLose } from '../game/rules.js';
import { DEBUG } from '../config.js';
import { playClick, playMatch, playWin, playLose, toggleMute, isMuted } from './audio.js';

const MATCH_ANIM_MS = 320;

// 三消动画期间锁住输入，避免乱点导致状态错乱
let isAnimating = false;

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
    if (isAnimating) return;                       // 动画期间忽略点击
    const tileEl = e.target.closest('.tile');
    if (!tileEl) return;

    // 点了被压住的牌 → 摇晃反馈，不入槽
    if (tileEl.classList.contains('covered')) {
      tileEl.classList.add('shake');
      setTimeout(() => tileEl.classList.remove('shake'), 320);
      return;
    }

    const tileId = Number(tileEl.dataset.tileId);
    if (!Number.isFinite(tileId)) return;

    handleTileClick(state, tileId, rerender);
  });

  // 重开：包一层强制清锁，让重开能打断动画
  const safeRestart = () => {
    isAnimating = false;
    restart();
  };
  document.getElementById('btn-restart')?.addEventListener('click', safeRestart);
  document.getElementById('btn-play-again')?.addEventListener('click', safeRestart);

  // 静音切换：图标随状态变，偏好持久化在 audio.js 里
  const muteBtn = document.getElementById('btn-mute');
  if (muteBtn) {
    muteBtn.textContent = isMuted() ? '🔇' : '🔊';
    muteBtn.addEventListener('click', () => {
      muteBtn.textContent = toggleMute() ? '🔇' : '🔊';
    });
  }
}

/**
 * 处理一次点击：校验 → 改 state → 渲染。
 * 触发三消时多走延迟流程：先渲染"消失动画"，等动画完再真消除 + 判胜负。
 */
function handleTileClick(state, tileId, rerender) {
  if (state.status !== 'playing') return;

  const tile = state.tiles.find(t => t.id === tileId);
  if (!tile || tile.removed) return;

  if (isCovered(tile, state.tiles)) {
    if (DEBUG) console.log(`  · 牌 #${tileId} ${tile.symbol} 被压住`);
    return;
  }
  if (isSlotFull(state.slot)) {
    if (DEBUG) console.log('  · 槽已满，无法再放牌');
    return;
  }

  // 改 state：牌进槽
  tile.removed = true;
  state.slot   = addToSlot(state.slot, tile);
  playClick();

  if (DEBUG) {
    console.log(`  · 入槽 #${tileId} ${tile.symbol}  →  [${state.slot.map(t => t.symbol).join(' ')}]`);
  }

  const matchIdxs = findMatch(state.slot);
  if (matchIdxs) {
    // 标记要消的牌 _matching → render 加 .matching class → 触发缩放消失动画
    const set = new Set(matchIdxs);
    state.slot.forEach((t, i) => { if (set.has(i)) t._matching = true; });
    rerender();                                  // 第一帧：消失动画进行中
    playMatch();

    // 等动画播完再真消除 + 判胜负
    isAnimating = true;
    setTimeout(() => {
      state.slot = state.slot.filter(t => !t._matching);
      if (DEBUG) console.log(`  · 三消 ✨ 剩 ${state.slot.length} 张`);

      if (isWin(state.tiles)) {
        state.status = 'won';
        playWin();
        if (DEBUG) console.log('%c🎉 胜利！', 'color:#16a34a;font-weight:bold;');
      } else if (isLose(state.slot)) {
        state.status = 'lost';
        playLose();
        if (DEBUG) console.log('%c💀 失败', 'color:#dc2626;font-weight:bold;');
      }

      isAnimating = false;
      rerender();                                // 第二帧：消失后 + 可能的弹窗
    }, MATCH_ANIM_MS);
  } else {
    // 没匹配：不会胜利，只可能因槽满失败
    if (isLose(state.slot)) {
      state.status = 'lost';
      playLose();
      if (DEBUG) console.log('%c💀 失败：槽满凑不齐', 'color:#dc2626;font-weight:bold;');
    }
    rerender();
  }
}
