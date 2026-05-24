// src/main.js
// 程序入口：浏览器最先执行的 JS，负责"启动"整个游戏。
// 阶段 3：关卡系统 — 选关菜单 / 多关卡 / 进度持久化 / 通关跳关。

import { SLOT_CAPACITY, MATCH_COUNT, DEBUG } from './config.js';
import { state, resetState } from './state.js';
import { buildBoard } from './game/board.js';
import { render, resetRenderCache } from './ui/render.js';
import { bindControls } from './ui/controls.js';
import { allLevels } from '../levels/index.js';
import { setLastPlayed } from './progress.js';

// ─── 启动 / 切关 / 回菜单 ─────────────────────────────
// startLevel(level) 进关卡（首次启动 / 选关 / 再来一次 / 下一关 都走这里）
// showMenu()        回选关菜单
function startLevel(level) {
  resetRenderCache();
  resetState();
  state.tiles   = buildBoard(level);
  state.levelId = level.id;
  state.status  = 'playing';
  setLastPlayed(level.id);
  render(state);
  if (DEBUG) console.log(`%c  · 进入关卡 ${level.name}（${state.tiles.length} 张牌）`, 'color:#16a34a;');
}

function showMenu() {
  resetRenderCache();
  resetState();
  state.status = 'menu';
  render(state);
  if (DEBUG) console.log('  · 回到选关菜单');
}

// 一次性绑事件（事件委托，永久生效）
bindControls(state, {
  rerender: () => render(state),
  startLevel,
  showMenu,
});

// 启动 → 选关菜单
showMenu();

if (DEBUG) {
  console.log('%c[咩了个咩] 阶段 3 关卡系统 · 选关菜单', 'color:#92400e;font-weight:bold;');
  console.log('  · 槽位数量:', SLOT_CAPACITY, '/ 凑齐消除:', MATCH_COUNT);
  console.log(`  · 共 ${allLevels.length} 个关卡:`, allLevels.map(l => l.name).join(' / '));

  // 暴露到 window：控制台调试用
  window.state      = state;
  window.resetState = resetState;
  window.rerender   = () => render(state);
  window.startLevel = startLevel;
  window.showMenu   = showMenu;
  console.log('%c  · 已暴露：state, resetState(), rerender(), startLevel(level), showMenu()', 'color:#78716c;');
}
