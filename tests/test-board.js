// tests/test-board.js
// 阶段 1.4 算法测试 —— 用 Node 跑（不需要浏览器）。
//
// 跑法（任选一种）：
//   node tests/test-board.js
//   npm test
//
// 验证两件事：
//   1. buildBoard 摆好第一关，牌数 = 9
//   2. isCovered 判定结果符合人工心算预期：3 张可点 / 6 张被压
//
// 测试用例失败时进程退出码为 1，可以用 echo $LASTEXITCODE 查看。

import { buildBoard, isCovered } from '../src/game/board.js';
import { level01 } from '../levels/level-01.js';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  阶段 1.4 算法测试 · level-01');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const tiles     = buildBoard(level01);
const clickable = tiles.filter(t => !isCovered(t, tiles));
const covered   = tiles.filter(t =>  isCovered(t, tiles));

let pass = 0;
let fail = 0;

function check(label, actual, expected) {
  const ok = actual === expected;
  if (ok) {
    console.log(`  \u2713 ${label}: ${actual}`);
    pass++;
  } else {
    console.log(`  \u2717 ${label}: ${actual}  (\u671f\u671b ${expected})`);
    fail++;
  }
}

// ─── 测试用例 ─────────────────────────────────────────
check('总牌数',        tiles.length,     9);
check('可点的牌数',    clickable.length, 3);
check('被压的牌数',    covered.length,   6);

// 每张牌的 id 都唯一（createTile 自动分配）
const idSet = new Set(tiles.map(t => t.id));
check('牌 id 全唯一',  idSet.size,       tiles.length);

// 上层（z=1）3 张都该可点
const topLayer       = tiles.filter(t => t.z === 1);
const topClickable   = topLayer.filter(t => !isCovered(t, tiles));
check('z=1 全部可点',  topClickable.length, topLayer.length);

// 底层（z=0）6 张都该被压
const bottomLayer    = tiles.filter(t => t.z === 0);
const bottomCovered  = bottomLayer.filter(t => isCovered(t, tiles));
check('z=0 全部被压',  bottomCovered.length, bottomLayer.length);

// ─── 输出可点的牌的详情（便于人工核对）───────────────
console.log('\n  当前可点的 3 张牌:');
clickable.forEach(t => {
  console.log(`    #${t.id} ${t.symbol}  (gridX=${t.gridX}, gridY=${t.gridY}, z=${t.z})`);
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  结果: ${pass} \u901a\u8fc7 / ${fail} \u5931\u8d25`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (fail > 0) {
  process.exit(1);
}
