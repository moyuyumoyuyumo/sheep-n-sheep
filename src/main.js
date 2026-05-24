// src/main.js
// 程序入口：浏览器最先执行的 JS，负责"启动"整个游戏。
// 阶段 1.8b：点击 / 三消 / 胜负弹窗 / 重开都在位。

import { SLOT_CAPACITY, MATCH_COUNT, DEBUG } from './config.js';
import { level01 } from '../levels/level-01.js';
import { state, resetState } from './state.js';
import { buildBoard, isCovered } from './game/board.js';
import { render, resetRenderCache } from './ui/render.js';
import { bindControls } from './ui/controls.js';

// ─── 启动 / 重开 ─────────────────────────────────────
// 一个函数管"开局"：清 state、摆牌、设状态、重画。
// 首次启动 和 用户点"再来一局" 都走这里。
function startGame() {
  resetRenderCache();
  resetState();
  state.tiles   = buildBoard(level01);
  state.levelId = level01.id;
  state.status  = 'playing';
  render(state);
  if (DEBUG) console.log(`%c  · 新一局开始（${state.tiles.length} 张牌）`, 'color:#16a34a;');
}

// 一次性绑事件（事件委托，永久生效）
bindControls(state, {
  rerender: () => render(state),
  restart:  startGame,
});

// 开始首局
startGame();

if (DEBUG) {
  console.log('%c[咩了个咩] 阶段 1 完成 · 点击 / 三消 / 胜负 / 重开', 'color:#92400e;font-weight:bold;');
  console.log('  · 槽位数量:', SLOT_CAPACITY, '/ 凑齐消除:', MATCH_COUNT);
  console.log('  · 当前关卡:', level01.name, `(${state.tiles.length} 张牌)`);

  const clickable = state.tiles.filter(t => !isCovered(t, state.tiles));
  console.log(`  · 当前可点 ${clickable.length} 张，被压 ${state.tiles.length - clickable.length} 张`);

  // 暴露到 window：方便控制台敲 state、手动 rerender()、手动 reset。
  window.state      = state;
  window.resetState = resetState;
  window.rerender   = () => render(state);
  console.log('%c  · 已暴露：state、resetState()、rerender()', 'color:#78716c;');
}
