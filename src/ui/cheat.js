// src/ui/cheat.js
// 隐藏后门：输入 Konami code 触发"满道具"。
//
// 输入序列（键盘）：↑ ↑ ↓ ↓ ← → ← → B A
// 移动端用户可在控制台敲 window.cheat() 同样有效。
//
// 触发后：
//   - wallet 三种道具直接拉到 999
//   - 当前 state.toolUses 也立刻刷新（如果在游戏中）
//   - 弹个浮层提示一下，免得用户以为没生效
//
// 为什么留这个？
//   - 测试：跳过攒道具的环节直接试满道具流程
//   - 救场：玩家死活过不去 + 不想看广告 → 控制台敲一下
//   - 演示：给朋友看游戏时一键解锁所有道具

import { setBalance, getBalance } from '../wallet.js';

const KONAMI = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a',
];

/**
 * 绑定后门。整个生命周期调一次即可。
 * @param {() => void} onTrigger - 触发后回调（UI 层用来同步 state.toolUses + 重渲）
 */
export function setupCheat(onTrigger) {
  let buf = [];

  window.addEventListener('keydown', (e) => {
    // 不在 input/textarea 里时才收集
    if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;

    buf.push(e.key);
    if (buf.length > KONAMI.length) buf.shift();

    // 严格匹配（大小写无关）
    if (buf.length === KONAMI.length && KONAMI.every((k, i) => k.toLowerCase() === buf[i].toLowerCase())) {
      buf = [];
      triggerCheat(onTrigger);
    }
  });

  // 控制台兜底入口：手机用户 / 不想敲 Konami 的用 window.cheat()
  window.cheat = () => triggerCheat(onTrigger);
}

function triggerCheat(onTrigger) {
  setBalance({ undo: 999, shuffle: 999, remove: 999 });
  showCheatToast();
  if (typeof onTrigger === 'function') onTrigger();
  console.log('%c[CHEAT] 道具已全部拉满 999', 'color:#fb923c;font-weight:bold;', getBalance());
}

/** 触发后右上角浮一行字，2 秒消失。 */
function showCheatToast() {
  const old = document.getElementById('cheat-toast');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.id = 'cheat-toast';
  toast.textContent = '🎰 道具拉满！';
  toast.style.cssText = `
    position: fixed; top: 16px; right: 16px; z-index: 9999;
    padding: 10px 18px; border-radius: 999px;
    background: linear-gradient(135deg, #f59e0b, #ef4444);
    color: white; font-weight: 700; font-size: 14px;
    box-shadow: 0 8px 24px rgba(239,68,68,.45);
    animation: cheat-toast-pop .25s ease-out;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}
