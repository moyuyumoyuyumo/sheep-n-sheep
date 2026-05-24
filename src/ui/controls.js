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
import { playClick, playMatch, playWin, playLose, toggleMute, isMuted,
         startBgm, toggleBgm, isBgmOn } from './audio.js';
import { getLevelById, getNextLevel } from '../../levels/index.js';
import { markPassed } from '../progress.js';
import { useUndo, useShuffle, useRemove } from '../game/tools.js';
import { spend as walletSpend, getBalance } from '../wallet.js';
import { canClaimToday, claimToday, DAILY_PACKET } from '../daily.js';
import { showRewardAd, AD_REWARD } from '../ads.js';

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
export function bindControls(state, { rerender, startLevel, showMenu, syncToolUses }) {
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

  // BGM 切换：🎵 = 开 / 🎵̸ 灰 = 关
  const bgmBtn = document.getElementById('btn-bgm');
  if (bgmBtn) {
    const refresh = () => {
      bgmBtn.textContent = isBgmOn() ? '🎵' : '🎵';
      bgmBtn.classList.toggle('btn-bgm-off', !isBgmOn());
      bgmBtn.title = isBgmOn() ? '关闭背景音乐' : '打开背景音乐';
    };
    refresh();
    bgmBtn.addEventListener('click', () => {
      toggleBgm();
      refresh();
    });
  }

  // 浏览器 autoplay 限制：必须等用户首次手势后才能 startBgm
  // 用 capture 阶段 + once 监听 document 上的第一次 pointerdown
  document.addEventListener('pointerdown', () => {
    if (isBgmOn()) startBgm();
  }, { once: true, capture: true });

  // 道具按钮：验证余额 → 调 useFn 改 state → wallet.spend() 扣财 → 同步快照重渲
  bindToolButton('btn-undo',    'undo',    useUndo);
  bindToolButton('btn-shuffle', 'shuffle', useShuffle);
  bindToolButton('btn-remove',  'remove',  useRemove);

  function bindToolButton(btnId, toolKey, useFn) {
    document.getElementById(btnId)?.addEventListener('click', () => {
      if (isAnimating) return;
      if (state.status !== 'playing') return;
      if ((getBalance()[toolKey] ?? 0) <= 0) return;       // 实时查 wallet
      if (useFn(state)) {
        walletSpend(toolKey);                              // 扣 1 个
        if (typeof syncToolUses === 'function') syncToolUses();
        playClick();
        if (DEBUG) console.log(`  · 用了 ${toolKey}，剩 ${getBalance()[toolKey]} 次`);
        rerender();
      }
    });
  }

  // 菜单上的 "今日签到" 按钮
  document.getElementById('btn-daily')?.addEventListener('click', () => {
    if (!canClaimToday()) {
      showFlyMsg('今日已领取，明天再来 ⏰', 'info');
      return;
    }
    claimToday();
    if (typeof syncToolUses === 'function') syncToolUses();
    playMatch();
    showFlyMsg(formatPacket('领到', DAILY_PACKET), 'success');
    rerender();
  });

  // 菜单上的 "看广告" 按钮 + 道具栏内的同名按钮
  const onWatchAd = async (e) => {
    const btn = e.currentTarget;
    if (btn.dataset.busy === '1') return;
    btn.dataset.busy = '1';
    btn.classList.add('loading');
    try {
      const res = await showRewardAd();
      if (res.rewarded) {
        if (typeof syncToolUses === 'function') syncToolUses();
        playMatch();
        showFlyMsg(formatPacket('广告奖励', AD_REWARD), 'success');
        rerender();
      } else {
        showFlyMsg('广告未完成，未领取奖励', 'info');
      }
    } finally {
      btn.dataset.busy = '0';
      btn.classList.remove('loading');
    }
  };
  document.getElementById('btn-watch-ad')?.addEventListener('click', onWatchAd);
  document.getElementById('btn-watch-ad-toolbar')?.addEventListener('click', onWatchAd);
}

/** 道具礼包 → 人话字符串，例如 "领到 +2撒回 +1洗牌 +1移除"。 */
function formatPacket(prefix, packet) {
  const labels = { undo: '撤回', shuffle: '洗牌', remove: '移除' };
  const parts = [];
  for (const k of Object.keys(packet)) {
    if (packet[k] > 0) parts.push(`+${packet[k]} ${labels[k] || k}`);
  }
  return `${prefix} ${parts.join(' ')}`;
}

/** 中心浮一行小提示，1.5s 后消失。 */
function showFlyMsg(text, kind = 'info') {
  const old = document.getElementById('fly-msg');
  if (old) old.remove();
  const el = document.createElement('div');
  el.id = 'fly-msg';
  el.className = `fly-msg fly-msg-${kind}`;
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
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
