// tests/test-tools.js
// 阶段 4 道具单测：撤回 / 洗牌 / 移除
//
// 跑法：node tests/test-tools.js  或  npm test

import { useUndo, useShuffle, useRemove } from '../src/game/tools.js';

console.log('\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
console.log('  阶段 4 道具单测');
console.log('\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');

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

// 工厂：构造测试用 state
function makeState() {
  return {
    tiles: [
      { id: 1, symbol: '🐑', gridX: 0,   gridY: 0,   z: 0, removed: false },
      { id: 2, symbol: '🐱', gridX: 1,   gridY: 0,   z: 0, removed: false },
      { id: 3, symbol: '🐶', gridX: 2,   gridY: 0,   z: 0, removed: false },
      { id: 4, symbol: '🐰', gridX: 0,   gridY: 1,   z: 0, removed: false },
      { id: 5, symbol: '🐼', gridX: 0.5, gridY: 0.5, z: 1, removed: false },
      { id: 6, symbol: '🦊', gridX: 1.5, gridY: 0.5, z: 1, removed: false },
    ],
    slot: [],
    history: [],
  };
}

// ─── useUndo ──────────────────────────────────────────
console.log('\n  [useUndo]');
{
  const s = makeState();
  // 模拟入槽 3 张
  s.tiles[0].removed = true; s.slot.push(s.tiles[0]); s.history.push(1);
  s.tiles[1].removed = true; s.slot.push(s.tiles[1]); s.history.push(2);
  s.tiles[2].removed = true; s.slot.push(s.tiles[2]); s.history.push(3);

  const ok = useUndo(s);
  check('返回值',                 ok, true);
  check('history 减 1',           s.history.length, 2);
  check('slot 减 1',              s.slot.length, 2);
  check('被撤的 tile.removed',    s.tiles[2].removed, false);
  check('slot 不含撤的 tile',    s.slot.find(t => t.id === 3) === undefined, true);
}

{
  const s = makeState();  // 空 history
  const ok = useUndo(s);
  check('空 history 返回 false', ok, false);
}

// ─── useShuffle ───────────────────────────────────────
console.log('\n  [useShuffle]');
{
  const s = makeState();
  const beforeIds = new Set(s.tiles.map(t => t.id));
  const beforeZ0Positions = s.tiles
    .filter(t => t.z === 0)
    .map(t => `${t.gridX},${t.gridY}`)
    .sort();
  const beforeZ1Positions = s.tiles
    .filter(t => t.z === 1)
    .map(t => `${t.gridX},${t.gridY}`)
    .sort();

  const ok = useShuffle(s);
  check('返回值',                 ok, true);

  const afterIds = new Set(s.tiles.map(t => t.id));
  const idsUnchanged = afterIds.size === beforeIds.size && [...afterIds].every(id => beforeIds.has(id));
  check('id 集合不变',            idsUnchanged, true);

  const afterZ0Positions = s.tiles
    .filter(t => t.z === 0)
    .map(t => `${t.gridX},${t.gridY}`)
    .sort();
  const afterZ1Positions = s.tiles
    .filter(t => t.z === 1)
    .map(t => `${t.gridX},${t.gridY}`)
    .sort();
  check('z=0 位置集合不变（仅重排）', JSON.stringify(afterZ0Positions) === JSON.stringify(beforeZ0Positions), true);
  check('z=1 位置集合不变（仅重排）', JSON.stringify(afterZ1Positions) === JSON.stringify(beforeZ1Positions), true);
}

// 单层只有 1 张时不能洗牌
{
  const s = {
    tiles: [
      { id: 1, symbol: '🐑', gridX: 0, gridY: 0, z: 0, removed: false },
    ],
    slot: [],
    history: [],
  };
  const ok = useShuffle(s);
  check('单张牌返回 false',       ok, false);
}

// ─── useRemove ────────────────────────────────────────
console.log('\n  [useRemove]');
{
  const s = makeState();
  // 入槽 5 张
  for (let i = 0; i < 5; i++) {
    s.tiles[i].removed = true;
    s.slot.push(s.tiles[i]);
    s.history.push(s.tiles[i].id);
  }
  const ok = useRemove(s);
  check('返回值',                  ok, true);
  check('slot 剩下 2 张',          s.slot.length, 2);
  check('被抽回的 #1 removed',     s.tiles[0].removed, false);
  check('被抽回的 #2 removed',     s.tiles[1].removed, false);
  check('被抽回的 #3 removed',     s.tiles[2].removed, false);
  check('未抽的 #4 仍 removed',    s.tiles[3].removed, true);
  check('history 不含 1',          s.history.includes(1), false);
  check('history 不含 2',          s.history.includes(2), false);
  check('history 不含 3',          s.history.includes(3), false);
}

{
  const s = makeState();
  const ok = useRemove(s);
  check('空 slot 返回 false',      ok, false);
}

// 不足 3 张：抽全部
{
  const s = makeState();
  s.tiles[0].removed = true; s.slot.push(s.tiles[0]); s.history.push(1);
  s.tiles[1].removed = true; s.slot.push(s.tiles[1]); s.history.push(2);
  const ok = useRemove(s);
  check('只 2 张时返回 true',      ok, true);
  check('slot 清空',               s.slot.length, 0);
  check('history 清空',            s.history.length, 0);
}

console.log('\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
console.log(`  结果: ${pass} 通过 / ${fail} 失败`);
console.log('\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');

if (fail > 0) process.exit(1);
