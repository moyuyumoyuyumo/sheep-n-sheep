// tests/test-daily.js
// 阶段 6 测试 · daily 每日签到。
//
// 同 test-wallet：先注入 localStorage polyfill 再动态 import。

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

const { canClaimToday, claimToday, resetDaily, DAILY_PACKET } = await import('../src/daily.js');
const { getBalance, resetWallet } = await import('../src/wallet.js');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  阶段 6 测试 · daily 每日签到');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

let pass = 0, fail = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  (ok ? pass++ : fail++);
  console.log(`  ${ok ? '\u2713' : '\u2717'} ${label}: ${actual}${ok ? '' : `  (期望 ${expected})`}`);
}

// ─── 第一次能领 ──────────────────────────────────
console.log('\n[首次签到]');
{
  store.clear();
  resetWallet();
  check('首次能领',           canClaimToday(), true);
  const w0 = getBalance();
  const w1 = claimToday();
  check('claim 返回新余额',    w1 !== null, true);
  check('undo +2',            w1.undo,    w0.undo + DAILY_PACKET.undo);
  check('shuffle +1',         w1.shuffle, w0.shuffle + DAILY_PACKET.shuffle);
  check('remove +1',          w1.remove,  w0.remove + DAILY_PACKET.remove);
}

// ─── 同一天重复领无效 ────────────────────────────
console.log('\n[同日重复领]');
{
  check('再次 canClaim',     canClaimToday(), false);
  const r = claimToday();
  check('重复 claim 返回 null', r, null);
}

// ─── resetDaily 后又能领 ─────────────────────────
console.log('\n[resetDaily]');
{
  resetDaily();
  check('reset 后 canClaim', canClaimToday(), true);
}

// ─── DAILY_PACKET 是 3 个 key 都存在的对象 ───────
console.log('\n[礼包配置完整性]');
{
  check('packet.undo 数字',    typeof DAILY_PACKET.undo,    'number');
  check('packet.shuffle 数字', typeof DAILY_PACKET.shuffle, 'number');
  check('packet.remove 数字',  typeof DAILY_PACKET.remove,  'number');
  check('总数 > 0',            (DAILY_PACKET.undo + DAILY_PACKET.shuffle + DAILY_PACKET.remove) > 0, true);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  结果: ${pass} 通过 / ${fail} 失败`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (fail > 0) process.exit(1);
