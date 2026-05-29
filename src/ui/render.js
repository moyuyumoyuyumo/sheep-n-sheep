// src/ui/render.js
// 渲染层：把全局 state 投影成 DOM。
//
// 设计原则：
//   1. render(state) 只读 state，绝不改 state
//   2. 不监听事件（事件由 controls.js 接管）
//   3. 每次 state 变化都"全清空 + 全重建"。9 张牌毫秒级，不必优化。
//
// DOM 锚点（来自 index.html）：
//   #board         牌堆容器（position: relative）
//   #slot          底部槽容器
//   #status-badge  状态徽章

import { TILE_SIZE, SLOT_CAPACITY } from '../config.js';
import { isCovered } from '../game/board.js';
import { allLevels, getNextLevel } from '../../levels/index.js';
import { getPassedSet, isLevelUnlocked } from '../progress.js';
import { getBalance } from '../wallet.js';
import { canClaimToday } from '../daily.js';

const STATUS_LABEL = {
  idle:    '准备中',
  playing: '游戏中',
  won:     '🎉 胜利',
  lost:    '💀 失败',
};

// 记上一帧 slot 里哪些 tile id，下一帧比对识别"新出现"的 cell 加动画
let prevSlotIds = new Set();

/**
 * 把 state 完整渲染到 DOM。
 * @param {object} state - 全局游戏状态
 */
export function render(state) {
  // 选关菜单 ↔ 游戏舞台 互斥显示
  document.querySelector('.game-stage')?.classList.toggle('hidden', state.status === 'menu');

  renderMenu(state);
  renderWalletBar();        // 菜单上的钱包栏（余额 + 签到状态）
  renderBoard(state);
  renderSlot(state);
  renderToolbar(state);
  renderStatus(state);
  renderModal(state);
}

/**
 * 菜单顶部钱包栏：同步 3 个数字 + 签到按钮文案。
 * 不需要依赖 state.toolUses——直接读 wallet，避免快照不同步。
 */
function renderWalletBar() {
  const w = getBalance();
  const u = document.getElementById('wallet-undo');
  const s = document.getElementById('wallet-shuffle');
  const r = document.getElementById('wallet-remove');
  if (u) u.textContent = w.undo;
  if (s) s.textContent = w.shuffle;
  if (r) r.textContent = w.remove;

  const dailyBtn  = document.getElementById('btn-daily');
  const dailyText = document.getElementById('btn-daily-text');
  if (dailyBtn && dailyText) {
    if (canClaimToday()) {
      dailyBtn.disabled = false;
      dailyBtn.classList.remove('claimed');
      dailyText.textContent = '今日签到';
    } else {
      dailyBtn.disabled = true;
      dailyBtn.classList.add('claimed');
      dailyText.textContent = '已领取';
    }
  }
}

/**
 * 渲染牌堆。容器大小贴合内容，牌用 absolute 定位。
 */
function renderBoard(state) {
  const board = document.getElementById('board');
  if (!board) return;

  // 清空旧的
  board.innerHTML = '';

  // 自动计算 board 尺寸：取所有牌右下角的最大值
  let maxX = 0;
  let maxY = 0;
  for (const tile of state.tiles) {
    if (tile.gridX + 1 > maxX) maxX = tile.gridX + 1;
    if (tile.gridY + 1 > maxY) maxY = tile.gridY + 1;
  }
  board.style.width  = (maxX * TILE_SIZE) + 'px';
  board.style.height = (maxY * TILE_SIZE) + 'px';

  // 渲染每张牌
  for (const tile of state.tiles) {
    if (tile.removed) continue;

    const el = document.createElement('div');
    el.className = 'tile';
    if (isCovered(tile, state.tiles)) {
      el.classList.add('covered');
    }
    el.dataset.tileId = tile.id;        // 1.6 controls 会用这个
    el.textContent    = tile.symbol;
    el.style.left     = (tile.gridX * TILE_SIZE) + 'px';
    el.style.top      = (tile.gridY * TILE_SIZE) + 'px';
    el.style.zIndex   = tile.z;          // 让上层 DOM 真正盖住下层

    board.appendChild(el);
  }

  // 板子永远以自然尺寸渲染；超宽时由 .board-viewport 横向滚动
  fitBoardViewport(board, maxX, maxY);
  ensureViewportDragBound();
}

/**
 * 配置板子视口：
 *   1. 清掉历史 transform/scale（避免上次缩放残留）
 *   2. 始终用自然尺寸，让左端的牌从屏幕左边显示
 *   3. 板子比视口宽 → 给视口加 .scrollable 类（CSS 显示「←左右滑动→」提示）
 *   4. 滚动位置归零，确保进场看到最左端
 */
function fitBoardViewport(board, maxX, maxY) {
  const naturalW = maxX * TILE_SIZE;
  const naturalH = maxY * TILE_SIZE;

  // 清掉旧 fitBoardScale 留下的 transform（旧版关卡可能有残留）
  board.style.transform       = '';
  board.style.transformOrigin = '';
  board.style.marginLeft      = '';
  board.style.width  = naturalW + 'px';
  board.style.height = naturalH + 'px';

  const viewport = board.parentElement;     // .board-viewport
  if (!viewport) return;

  const viewportW = viewport.clientWidth;
  const isWide = naturalW > viewportW + 2;
  viewport.classList.toggle('scrollable', isWide);

  // 进场归零：让用户先看到最左端的牌
  viewport.scrollLeft = 0;
}

// ─── 鼠标拖拽 pan-scroll：桌面用户也能拖动板子 ─────────────
// 手机的 touch 由 overflow-x:auto + touch-action:pan-x 原生处理，
// 这里只补桌面鼠标。tile 上点击仍走原 controls.js 流程。
let _viewportDragBound = false;
function ensureViewportDragBound() {
  if (_viewportDragBound) return;
  const viewport = document.querySelector('.board-viewport');
  if (!viewport) return;

  let isDown = false;
  let startClientX = 0;
  let startScroll = 0;
  let dragged = false;
  const DRAG_THRESHOLD = 4;   // 移动超过此像素才算拖动（小幅抖动当点击）

  viewport.addEventListener('pointerdown', (e) => {
    // 仅鼠标走拖拽（触摸交给原生 overflow 滚动）
    if (e.pointerType !== 'mouse') return;
    isDown = true;
    dragged = false;
    startClientX = e.clientX;
    startScroll = viewport.scrollLeft;
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    const dx = e.clientX - startClientX;
    if (!dragged && Math.abs(dx) > DRAG_THRESHOLD) {
      dragged = true;
      viewport.classList.add('dragging');
      try { viewport.setPointerCapture(e.pointerId); } catch {}
    }
    if (dragged) {
      viewport.scrollLeft = startScroll - dx;
      e.preventDefault();
    }
  });

  const endDrag = (e) => {
    if (!isDown) return;
    isDown = false;
    if (dragged) {
      viewport.classList.remove('dragging');
      try { viewport.releasePointerCapture(e.pointerId); } catch {}
      // 抑制即将到来的 click（拖完手松开浏览器会派 click 到 tile 上）
      const blockClick = (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        viewport.removeEventListener('click', blockClick, true);
      };
      viewport.addEventListener('click', blockClick, true);
      // 防御：若 click 一直不来，下一帧清掉拦截
      setTimeout(() => viewport.removeEventListener('click', blockClick, true), 50);
    }
  };
  viewport.addEventListener('pointerup',     endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('pointerleave',  endDrag);

  _viewportDragBound = true;
}

/**
 * 渲染底部槽：已有的牌 + 空格子凑满 SLOT_CAPACITY。
 */
function renderSlot(state) {
  const slotEl = document.getElementById('slot');
  if (!slotEl) return;

  slotEl.innerHTML = '';

  // 已有的牌
  for (const tile of state.slot) {
    const cell = document.createElement('div');
    cell.className   = 'slot-cell';
    cell.textContent = tile.symbol;
    cell.dataset.tileId = tile.id;

    // 上一帧没这张 id → 新出现 → pop 入场动画
    if (!prevSlotIds.has(tile.id)) cell.classList.add('just-added');
    // controls.js 给要消的牌打了 _matching → 消失动画
    if (tile._matching)            cell.classList.add('matching');

    slotEl.appendChild(cell);
  }

  // 用空格子填到 SLOT_CAPACITY
  for (let i = state.slot.length; i < SLOT_CAPACITY; i++) {
    const empty = document.createElement('div');
    empty.className = 'slot-cell empty';
    slotEl.appendChild(empty);
  }

  // 槽接近满时呼吸红光（≥ SLOT_CAPACITY - 2）
  slotEl.classList.toggle('warning', state.slot.length >= SLOT_CAPACITY - 2);

  // 记下这一帧的 id，下一帧比对用
  prevSlotIds = new Set(state.slot.map(t => t.id));
}

/**
 * 渲染状态徽章（idle / playing / won / lost）。
 */
function renderStatus(state) {
  const el = document.getElementById('status-badge');
  if (!el) return;

  el.textContent     = STATUS_LABEL[state.status] || state.status;
  el.dataset.status  = state.status;     // CSS 用属性选择器变色
}

/**
 * 渲染胜负弹窗。只在 status 为 won / lost 时显示。
 */
function renderModal(state) {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;

  if (state.status !== 'won' && state.status !== 'lost') {
    overlay.classList.add('hidden');
    return;
  }
  overlay.classList.remove('hidden');

  const icon      = document.getElementById('modal-icon');
  const title     = document.getElementById('modal-title');
  const subtitle  = document.getElementById('modal-subtitle');
  const primary   = document.getElementById('btn-modal-primary');
  const secondary = document.getElementById('btn-modal-secondary');

  if (state.status === 'won') {
    icon.textContent  = '🎉';
    title.textContent = '通关！';
    const next = getNextLevel(state.levelId);
    if (next) {
      subtitle.textContent   = `下一关：${next.name}`;
      primary.textContent    = '下一关 →';
      primary.dataset.action = 'next';
    } else {
      subtitle.textContent   = '🎊 已通过全部关卡！';
      primary.textContent    = '回到选关';
      primary.dataset.action = 'menu';
    }
    secondary.textContent    = '再来一次';
    secondary.dataset.action = 'replay';
  } else {
    icon.textContent         = '💀';
    title.textContent        = '失败';
    subtitle.textContent     = '槽满了又凑不齐三张';
    primary.textContent      = '再来一次';
    primary.dataset.action   = 'replay';
    secondary.textContent    = '回到选关';
    secondary.dataset.action = 'menu';
  }
}

/**
 * 重开新局时调用：清空"上一帧"缓存，让新局的 slot 也能 pop 入场。
 */
export function resetRenderCache() {
  prevSlotIds = new Set();
}

/**
 * 渲染选关菜单。仅在 status === 'menu' 时可见。
 */
function renderMenu(state) {
  const menuEl = document.getElementById('menu');
  if (!menuEl) return;

  if (state.status !== 'menu') {
    menuEl.classList.add('hidden');
    return;
  }
  menuEl.classList.remove('hidden');

  const grid = document.getElementById('level-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const passed = getPassedSet();
  const allIds = allLevels.map(l => l.id);

  for (const level of allLevels) {
    const passedThis = passed.has(level.id);
    const unlocked   = isLevelUnlocked(level.id, allIds);

    const card = document.createElement('div');
    card.className = 'level-card';
    card.dataset.levelId = level.id;
    if (passedThis) card.classList.add('passed');
    if (!unlocked)  card.classList.add('locked');

    const stars  = '★'.repeat(level.difficulty) + '☆'.repeat(Math.max(0, 5 - level.difficulty));
    const status = !unlocked ? '🔒 未解锁' : (passedThis ? '✓ 已通关' : '待挑战');

    card.innerHTML = `
      <div class="level-card-name">${level.name}</div>
      <div class="level-card-desc">${level.description}</div>
      <div class="level-card-meta">
        <span class="level-card-difficulty" title="难度 ${level.difficulty}/5">${stars}</span>
        <span class="level-card-status">${status}</span>
      </div>
    `;
    grid.appendChild(card);
  }
}

/**
 * 道具栏：只在 status === 'playing' 时显示。
 * 次数推到按钮右上角红点；耗尽 → button.disabled。
 */
function renderToolbar(state) {
  const toolbar = document.getElementById('toolbar');
  if (!toolbar) return;

  toolbar.classList.toggle('hidden', state.status !== 'playing');

  const setCount = (toolKey, btnId, countId) => {
    const count = state.toolUses?.[toolKey] ?? 0;
    const countEl = document.getElementById(countId);
    const btnEl = document.getElementById(btnId);
    if (countEl) countEl.textContent = count;
    if (btnEl) btnEl.disabled = count <= 0;
  };

  setCount('undo',    'btn-undo',    'tool-count-undo');
  setCount('shuffle', 'btn-shuffle', 'tool-count-shuffle');
  setCount('remove',  'btn-remove',  'tool-count-remove');
}
