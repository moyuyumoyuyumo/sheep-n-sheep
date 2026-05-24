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
  renderBoard(state);
  renderSlot(state);
  renderStatus(state);
  renderModal(state);
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
  const overlay  = document.getElementById('modal-overlay');
  if (!overlay) return;

  const icon     = document.getElementById('modal-icon');
  const title    = document.getElementById('modal-title');
  const subtitle = document.getElementById('modal-subtitle');

  if (state.status === 'won') {
    overlay.classList.remove('hidden');
    icon.textContent     = '🎉';
    title.textContent    = '胜利！';
    subtitle.textContent = '所有牌都被你消光了';
  } else if (state.status === 'lost') {
    overlay.classList.remove('hidden');
    icon.textContent     = '💀';
    title.textContent    = '失败';
    subtitle.textContent = '槽满了又凑不齐三张';
  } else {
    overlay.classList.add('hidden');
  }
}

/**
 * 重开新局时调用：清空"上一帧"缓存，让新局的 slot 也能 pop 入场。
 */
export function resetRenderCache() {
  prevSlotIds = new Set();
}
