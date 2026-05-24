// src/ui/render.js
// 渲染层：把全局 state 投影成 DOM。
// 阶段 1.5 实现。
// 核心原则：render() 只读 state，不改 state；不监听事件（事件交给 controls.js）。

/**
 * 完整重绘整个游戏界面。
 * 每次 state 改动后调用。
 * @param {HTMLElement} rootEl - 渲染目标容器（一般是 #app）
 */
export function render(rootEl) {
  // TODO 阶段 1.5
  rootEl.textContent = '[render 占位] 阶段 1.5 才有内容';
}
