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
