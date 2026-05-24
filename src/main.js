// src/main.js
// 程序入口：浏览器最先执行的 JS，负责"启动"整个游戏。
// 阶段 1.4：摆牌 + 压住判定。1.5 才会画到屏幕。

import { SLOT_CAPACITY, MATCH_COUNT, DEBUG } from './config.js';
import { level01 } from '../levels/level-01.js';
import { state, resetState } from './state.js';
import { buildBoard, isCovered } from './game/board.js';

// ─── 启动游戏 ────────────────────────────────────────
// 摆牌：把关卡数据生成完整牌堆，塞进 state.tiles
state.tiles = buildBoard(level01);
state.levelId = level01.id;
state.status = 'playing';

if (DEBUG) {
  console.log('%c[咩了个咩] 阶段 1.4 摆牌 + 压住判定', 'color:#92400e;font-weight:bold;');
  console.log('  · 槽位数量:', SLOT_CAPACITY);
  console.log('  · 几张相同消除:', MATCH_COUNT);
  console.log('  · 当前关卡:', level01.name);
  console.log('  · 摆好的牌堆:', state.tiles);

  // 算一下当前可点的牌（没被压的）
  const clickable = state.tiles.filter(t => !isCovered(t, state.tiles));
  const covered   = state.tiles.filter(t =>  isCovered(t, state.tiles));
  console.log(`  · 可点的牌 (${clickable.length} 张):`, clickable);
  console.log(`  · 被压的牌 (${covered.length} 张):`, covered);

  // 把 state 挂到 window，方便控制台调试。
  window.state = state;
  window.resetState = resetState;
  console.log('%c  · 已暴露到 window：state、resetState()', 'color:#78716c;');
}
