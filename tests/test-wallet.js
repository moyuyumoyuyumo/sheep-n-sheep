// tests/test-wallet.js
// 阶段 6 测试 · wallet 道具余额持久化。
//
// Node 没有 localStorage，所以先注入一个 in-memory polyfill。
// 然后动态 import wallet.js 用我们的 polyfill。

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

const { getBalance, spend, grant, setBalance, resetWallet } = await import('../src/wallet.js');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  阶段 6 测试 · wallet 道具钱包');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

let pass = 0, fail = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  (ok ? pass++ : fail++);
  console.log(`  ${ok ? '\u2713' : '\u2717'} ${label}: ${actual}${ok ? '' : `  (期望 ${expected})`}`);
}

// ─── 初始化：第一次访问应得 INITIAL ──────────────────
console.log('\n[初始化]');
store.clear();
{
  const w = getBalance();
  check('首次 undo',    w.undo,    3);
  check('首次 shuffle', w.shuffle, 2);
  check('首次 remove',  w.remove,  1);
  // 写回了 localStorage
  check('已落盘 localStorage', store.has('mok-wallet'), true);
}

// ─── spend：扣 1 个 ────────────────────────────────
console.log('\n[spend]');
{
  resetWallet();
  check('spend undo 成功',    spend('undo'),    true);
  check('spend 后 undo=2',    getBalance().undo, 2);
  check('spend shuffle 成功', spend('shuffle'), true);
  check('spend shuffle 成功', spend('shuffle'), true);
  check('shuffle 用光后 false', spend('shuffle'), false);
  check('shuffle=0',          getBalance().shuffle, 0);
}

// ─── grant：加道具 ─────────────────────────────────
console.log('\n[grant]');
{
  resetWallet();
  const w = grant({ undo: 5, shuffle: 3, remove: 2 });
  check('grant 后 undo',    w.undo,    8);    // 3+5
  check('grant 后 shuffle', w.shuffle, 5);    // 2+3
  check('grant 后 remove',  w.remove,  3);    // 1+2

  // 跨函数读取后应仍为 grant 后的值（持久化）
  const re = getBalance();
  check('再读 undo',    re.undo,    8);
  check('再读 shuffle', re.shuffle, 5);
}

// ─── grant 上限保护 ───────────────────────────────
console.log('\n[grant 上限]');
{
  resetWallet();
  grant({ undo: 5000 });   // 超过 999
  check('上限 999', getBalance().undo, 999);
}

// ─── setBalance：直接覆盖（后门用） ─────────────────
console.log('\n[setBalance]');
{
  resetWallet();
  const w = setBalance({ undo: 999, shuffle: 999, remove: 999 });
  check('setBalance undo',    w.undo,    999);
  check('setBalance shuffle', w.shuffle, 999);
  check('setBalance remove',  w.remove,  999);

  // setBalance 不会破坏其它字段，给负数会被夹到 0
  setBalance({ undo: -10 });
  check('负数夹到 0', getBalance().undo, 0);
}

// ─── 损坏的 localStorage 恢复成初始 ─────────────────
console.log('\n[损坏数据恢复]');
{
  store.clear();
  store.set('mok-wallet', 'this is not json');
  const w = getBalance();
  check('坏数据 → 回 INITIAL undo',    w.undo,    3);
  check('坏数据 → 回 INITIAL shuffle', w.shuffle, 2);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  结果: ${pass} 通过 / ${fail} 失败`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (fail > 0) process.exit(1);
