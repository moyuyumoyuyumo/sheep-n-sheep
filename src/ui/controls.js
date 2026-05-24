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
import { getLevelById, getNextLevel } from '../../levels/index.js';
import { markPassed } from '../progress.js';
import { useUndo, useShuffle, useRemove } from '../game/tools.js';

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
export function bindControls(state, { rerender, startLevel, showMenu }) {
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

  // 顶部"返回选关"按钮
  document.getElementById('btn-back-to-menu')?.addEventListener('click', () => {
    isAnimating = false;
    showMenu();
  });

  // 选关卡片点击（事件委托在 #level-grid 上）
  document.getElementById('level-grid')?.addEventListener('click', (e) => {
    const card = e.target.closest('.level-card');
    if (!card) return;
    if (card.classList.contains('locked')) return;
    const level = getLevelById(card.dataset.levelId);
    if (level) startLevel(level);
  });

  // 弹窗按钮（事件委托在 .modal-actions）：按 dataset.action 分发
  document.querySelector('.modal-actions')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    isAnimating = false;
    const action = btn.dataset.action;
    if (action === 'next') {
      const next = getNextLevel(state.levelId);
      if (next) startLevel(next);
    } else if (action === 'menu') {
      showMenu();
    } else if (action === 'replay') {
      const cur = getLevelById(state.levelId);
      if (cur) startLevel(cur);
    }
  });

  // 静音切换：图标随状态变，偏好持久化在 audio.js 里
  const muteBtn = document.getElementById('btn-mute');
  if (muteBtn) {
    muteBtn.textContent = isMuted() ? '🔇' : '🔊';
    muteBtn.addEventListener('click', () => {
      muteBtn.textContent = toggleMute() ? '🔇' : '🔊';
    });
  }

  // 道具按钮：三个都走同一个模板（有次数 → 调用 useFn → 微改 state → 重渲）
  bindToolButton('btn-undo',    'undo',    useUndo);
  bindToolButton('btn-shuffle', 'shuffle', useShuffle);
  bindToolButton('btn-remove',  'remove',  useRemove);

  function bindToolButton(btnId, toolKey, useFn) {
    document.getElementById(btnId)?.addEventListener('click', () => {
      if (isAnimating) return;
      if (state.status !== 'playing') return;
      if ((state.toolUses?.[toolKey] ?? 0) <= 0) return;
      if (useFn(state)) {
        state.toolUses[toolKey]--;
        playClick();
        if (DEBUG) console.log(`  · 用了 ${toolKey}，剩 ${state.toolUses[toolKey]} 次`);
        rerender();
      }
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
  state.history.push(tile.id);                    // 记录入槽顺序（撤回 / 移除 道具用）
  playClick();

  if (DEBUG) {
    console.log(`  · 入槽 #${tileId} ${tile.symbol}  →  [${state.slot.map(t => t.symbol).join(' ')}]`);
  }

  const matchIdxs = findMatch(state.slot);
  if (matchIdxs) {
    // 标记要消的牌 _matching → render 加 .matching class → 触发缩放消失动画
    const set = new Set(matchIdxs);
    state.slot.forEach((t, i) => { if (set.has(i)) t._matching = true; });
    // 被消除的牌从 history 里拿掉（已不能被撤回）
    const matchedIds = new Set(state.slot.filter(t => t._matching).map(t => t.id));
    state.history = state.history.filter(id => !matchedIds.has(id));
    rerender();                                  // 第一帧：消失动画进行中
    playMatch();

    // 等动画播完再真消除 + 判胜负
    isAnimating = true;
    setTimeout(() => {
      state.slot = state.slot.filter(t => !t._matching);
      if (DEBUG) console.log(`  · 三消 ✨ 剩 ${state.slot.length} 张`);

      if (isWin(state.tiles)) {
        state.status = 'won';
        markPassed(state.levelId);
        playWin();
        if (DEBUG) console.log(`%c🎉 通关 ${state.levelId}`, 'color:#16a34a;font-weight:bold;');
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
