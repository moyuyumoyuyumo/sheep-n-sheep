// tests/test-builders.js
// 阶段 5 测试 —— fromLayers 工厂 + 实际关卡 02/03/04/05 数据完整性。
//
// 跑法：
//   node tests/test-builders.js
//   npm test
//
// 验证：
//   1. # 总数 = 返回 tiles.length，每张 tile 有合法字段
//   2. 总牌数是 3 的倍数（必要条件）
//   3. 每个 symbol 出现次数都是 3 的倍数（必要条件）
//   4. 非 3 倍数 / 空池子会抛错
//   5. 多次调用 symbol 排列不同（洗牌生效，概率性）

import { fromLayers } from '../levels/builders.js';
import { level02 } from '../levels/level-02.js';
import { level03 } from '../levels/level-03.js';
import { level04 } from '../levels/level-04.js';
import { level05 } from '../levels/level-05.js';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  阶段 5 测试 · 关卡构建器 fromLayers');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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

function checkThrows(label, fn) {
  let threw = false;
  try { fn(); } catch { threw = true; }
  check(label, threw, true);
}

// ─── 基础用例 ─────────────────────────────────────────
console.log('\n[基础] 简单 2 层模板');
{
  const tiles = fromLayers({
    symbolPool: ['A', 'B', 'C'],
    layers: [
      { z: 0, grid: ['###', '###'] },                                // 6 张
      { z: 1, offsetX: 0.5, offsetY: 0.5, grid: ['###'] },           // 3 张
    ],
  });
  check('总牌数 = 9',           tiles.length, 9);
  check('全部 tile 有 symbol',   tiles.every(t => typeof t.symbol === 'string'), true);
  check('全部 tile 有数字 gridX', tiles.every(t => typeof t.gridX === 'number'), true);
  check('全部 tile 有数字 gridY', tiles.every(t => typeof t.gridY === 'number'), true);
  check('z 都是 0 或 1',         tiles.every(t => t.z === 0 || t.z === 1), true);

  // 每个 symbol 各 3 张
  const counts = {};
  for (const t of tiles) counts[t.symbol] = (counts[t.symbol] || 0) + 1;
  check('symbol A 出现 3 次',    counts['A'], 3);
  check('symbol B 出现 3 次',    counts['B'], 3);
  check('symbol C 出现 3 次',    counts['C'], 3);

  // offset 生效
  const z1 = tiles.filter(t => t.z === 1);
  check('z=1 第一张 gridX = 0.5', z1[0].gridX, 0.5);
  check('z=1 第一张 gridY = 0.5', z1[0].gridY, 0.5);
}

// ─── 边界：跳过 '.' ─────────────────────────────────────
console.log('\n[基础] grid 中 . 跳过');
{
  const tiles = fromLayers({
    symbolPool: ['X'],
    layers: [{ z: 0, grid: ['#.#', '.#.'] }],   // 3 张
  });
  check('总牌数 = 3',     tiles.length, 3);
  check('全部 X',         tiles.every(t => t.symbol === 'X'), true);
}

// ─── 错误用例 ─────────────────────────────────────────
console.log('\n[错误] 非法输入抛错');
checkThrows('总数 0 抛错',     () => fromLayers({ symbolPool: ['A'], layers: [{ z: 0, grid: ['...'] }] }));
checkThrows('非 3 倍数抛错',   () => fromLayers({ symbolPool: ['A'], layers: [{ z: 0, grid: ['##'] }] }));
checkThrows('空池子抛错',      () => fromLayers({ symbolPool: [],    layers: [{ z: 0, grid: ['###'] }] }));

// ─── 洗牌生效（概率性，不会 100% 失败但可作为 sanity）─────────
console.log('\n[随机] 两次调用 symbol 序列不一致');
{
  const opts = {
    symbolPool: ['A', 'B', 'C', 'D'],
    layers: [{ z: 0, grid: ['####', '####', '####'] }],  // 12 张
  };
  const seq1 = fromLayers(opts).map(t => t.symbol).join('');
  const seq2 = fromLayers(opts).map(t => t.symbol).join('');
  check('两次序列不同', seq1 !== seq2, true);
}

// ─── 实际关卡数据 ─────────────────────────────────────
function checkLevel(level, expectedTotal, expectedSymbols) {
  console.log(`\n[关卡] ${level.id} · ${level.name}`);
  const tiles = level.buildTiles();
  check('总牌数', tiles.length, expectedTotal);
  check('3 的倍数', tiles.length % 3, 0);

  const counts = {};
  for (const t of tiles) counts[t.symbol] = (counts[t.symbol] || 0) + 1;
  const symbolKeys = Object.keys(counts);
  check('symbol 种类数', symbolKeys.length, expectedSymbols);
  check('每种都是 3 倍数', symbolKeys.every(k => counts[k] % 3 === 0), true);
  check('每种数量相等',   new Set(Object.values(counts)).size, 1);
}

checkLevel(level02,  36,  6);
checkLevel(level03,  60, 10);
checkLevel(level04,  90, 10);
checkLevel(level05, 144, 12);

// ─── 汇总 ───────────────────────────────────────────
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  结果: ${pass} 通过 / ${fail} 失败`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (fail > 0) process.exit(1);
