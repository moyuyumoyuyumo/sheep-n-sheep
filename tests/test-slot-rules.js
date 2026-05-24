// tests/test-slot-rules.js
// 阶段 1.7 三消逻辑测试。
// 跑：node tests/test-slot-rules.js

import { addToSlot, isSlotFull } from '../src/game/slot.js';
import { findMatch, isWin, isLose } from '../src/game/rules.js';
import { SLOT_CAPACITY } from '../src/config.js';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  阶段 1.7 三消逻辑测试');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

let pass = 0;
let fail = 0;

function check(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  \u2713 ${label}`);
    pass++;
  } else {
    console.log(`  \u2717 ${label}`);
    console.log(`     \u5b9e\u9645: ${a}`);
    console.log(`     \u671f\u671b: ${e}`);
    fail++;
  }
}

// 测试用的牌工厂（不走 createTile，避免 id 计数器互相干扰）
const t = (symbol) => ({ symbol, gridX: 0, gridY: 0, z: 0, removed: false });

// 把牌数组缩成 symbol 数组，断言时清晰
const syms = arr => arr.map(x => x.symbol);

// ─── addToSlot ────────────────────────────────────────
console.log('\n【addToSlot：插入时同 symbol 挤一起】');
check('空槽加一张',                  syms(addToSlot([], t('🐑'))),                                  ['🐑']);
check('两张不同时 push 到末尾',      syms(addToSlot([t('🐑')], t('🐱'))),                          ['🐑', '🐱']);
check('遇到相同 symbol → 挤到一起',  syms(addToSlot([t('🐑'), t('🐱')], t('🐑'))),                 ['🐑', '🐑', '🐱']);
check('再来一只 🐑 → 仍紧贴',        syms(addToSlot([t('🐑'), t('🐑'), t('🐱')], t('🐑'))),         ['🐑', '🐑', '🐑', '🐱']);
check('多种符号穿插插入 🐑',         syms(addToSlot([t('🐑'), t('🐱'), t('🐶'), t('🐱')], t('🐑'))), ['🐑', '🐑', '🐱', '🐶', '🐱']);
check('插入新 symbol 到末尾',        syms(addToSlot([t('🐑'), t('🐱')], t('🐶'))),                  ['🐑', '🐱', '🐶']);

// ─── isSlotFull ───────────────────────────────────────
console.log('\n【isSlotFull】');
check('空槽不满',                    isSlotFull([]),                                                false);
check(`${SLOT_CAPACITY} 张时算满`,   isSlotFull(Array.from({length: SLOT_CAPACITY}, () => t('A'))), true);

// ─── findMatch ────────────────────────────────────────
console.log('\n【findMatch：找连续 3 个相同】');
check('空槽 → null',                 findMatch([]),                                                  null);
check('1 张 → null',                 findMatch([t('🐑')]),                                          null);
check('2 张相同 → null（不够 3）',   findMatch([t('🐑'), t('🐑')]),                                 null);
check('3 张相同 → [0,1,2]',          findMatch([t('🐑'), t('🐑'), t('🐑')]),                        [0, 1, 2]);
check('开头 3 张相同',               findMatch([t('🐑'), t('🐑'), t('🐑'), t('🐱')]),               [0, 1, 2]);
check('中间 3 张相同',               findMatch([t('🐱'), t('🐑'), t('🐑'), t('🐑'), t('🐶')]),      [1, 2, 3]);
check('前 2 + 后 1 → 不连续 → null', findMatch([t('🐑'), t('🐑'), t('🐱'), t('🐑')]),               null);

// ─── isWin ────────────────────────────────────────────
console.log('\n【isWin：所有牌 removed = 赢】');
check('空牌堆 → 不算赢',             isWin([]),                                                      false);
check('全 removed → 赢',             isWin([{removed: true}, {removed: true}]),                      true);
check('有未消 → 没赢',               isWin([{removed: true}, {removed: false}]),                     false);

// ─── isLose ───────────────────────────────────────────
console.log('\n【isLose：槽满 + 无法消 = 输】');
check('空槽 → 不输',                 isLose([]),                                                     false);
check('未满 → 不输',                 isLose([t('A'), t('B')]),                                       false);

// 槽满 + 全不同 symbol → 输
const fullDiff = Array.from({length: SLOT_CAPACITY}, (_, i) => t(`S${i}`));
check(`${SLOT_CAPACITY} 张全不同 → 输`, isLose(fullDiff),                                            true);

// 槽满 + 前 3 张相同 → 不算输（下一帧会消）
const fullWithMatch = Array.from({length: SLOT_CAPACITY}, (_, i) => t(i < 3 ? 'A' : `B${i}`));
check(`${SLOT_CAPACITY} 张含 3 连 → 不输`, isLose(fullWithMatch),                                    false);

// ─── 流程 demo（直观看 addToSlot 怎么挤）─────────────
console.log('\n【流程 demo：连续 addToSlot 演示挤压】');
let slot = [];
slot = addToSlot(slot, t('🐑')); console.log('  +🐑 →', syms(slot).join(' '));
slot = addToSlot(slot, t('🐱')); console.log('  +🐱 →', syms(slot).join(' '));
slot = addToSlot(slot, t('🐶')); console.log('  +🐶 →', syms(slot).join(' '));
slot = addToSlot(slot, t('🐑')); console.log('  +🐑 →', syms(slot).join(' '), '← 🐑 挤到 0 号 🐑 旁边');
slot = addToSlot(slot, t('🐑')); console.log('  +🐑 →', syms(slot).join(' '), '← 又一只 🐑 挤过来');
const match = findMatch(slot);
console.log('  findMatch →', match, match ? '（发现 3 连，可以消除）' : '');

// ─── 总结 ─────────────────────────────────────────────
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  结果: ${pass} \u901a\u8fc7 / ${fail} \u5931\u8d25`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (fail > 0) {
  process.exit(1);
}
