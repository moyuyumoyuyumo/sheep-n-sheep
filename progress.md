# 开发进度

> 短期记忆。每次写代码前看一眼，写完之后更新一下。
> 下次和 Cascade 开新会话时，让它先看这个文件就秒进入状态。

---

## 当前阶段

**阶段 1 · 最小可玩原型 完成（本地打 tag v0.1）**
等浏览器手动验证 → 网络恢复后 `git push` → 阶段 2 视觉打磨。

## 项目关键信息

- 中文名：咩了个咩
- 仓库名：`sheep-n-sheep`
- GitHub 用户名：`moyuyumoyuyumo`
- 仓库地址：<https://github.com/moyuyumoyuyumo/sheep-n-sheep>
- Pages 网址：<https://moyuyumoyuyumo.github.io/sheep-n-sheep/>
- 默认分支：`main`
- noreply 邮箱：`287223318+moyuyumoyuyumo@users.noreply.github.com`
- 本地开发：`npm start` → <http://localhost:5500>（不依赖 Live Server 扩展）
- 单元测试：`npm test`（Node 跑 `tests/test-board.js` + `tests/test-slot-rules.js`）

## 已完成

### 阶段 0 · 准备
- [x] 0.1~0.7 Git / 账号 / 仓库 / 起步文件
- [x] 0.8 首次 push（`e57bd6b chore: 项目初始化`）

### 阶段 1 · 最小可玩
- [x] 1.1 文件骨架（src/game、src/ui、levels、styles）
- [x] 1.2 关卡 `level-01.js`（9 张牌，3 symbol × 3）
- [x] 1.3 牌数据 + 全局 state
- [x] 1.4 `buildBoard` + `isCovered`（AABB） — Node 6/6 ✓
- [x] 1.5 `render.js` 数据→DOM — 浏览器验证 ✓
- [x] 1.6 `controls.js` 点击→入槽→三消（事件委托）
- [x] 1.7 `slot.addToSlot` + `rules.findMatch` — Node 22/22 ✓
- [x] 1.8a `isWin` / `isLose`
- [x] 1.8b 胜负弹窗 + 顶部"重开"按钮 + 弹窗"再来一局"
- [x] 1.1b 本地 `dev-server.js`（30 行零依赖 Node 静态服务）替代 Live Server
- [x] 1.9 progress 更新 + commit + tag `v0.1`

## 进行中 / 待办

- [ ] 0.9 网络恢复后 `git push` + 在 GitHub Settings 开 Pages
- [ ] 阶段 1 浏览器手动验证（1.6 + 1.8b 流程没人工跑过）
- [ ] 阶段 2 视觉打磨：动画、音效、更好看的卡面

## 笔记 / 待澄清的问题

- `level-01` 是 3×3 = 9 张牌的极简关卡，理论上必赢，验证三消主流程足够
- dev-server 早期 bug：`fileURLToPath` 在 Windows 上路径末尾自带 `\`，需用 `path.resolve` 规范化
- `addToSlot` 设计是"同 symbol 自动挤一起"，`findMatch` 只查连续 3 张
- tile id 用模块级计数器分配，`resetState()` 会同时调 `resetTileIds()` 防 id 累加

## 历史会话

| 日期 | 主题 | 备注 |
|---|---|---|
| 2026-05-23 | 项目启动 + 四份文档 + 阶段 0 全部步骤 | 一气呵成 |
| 2026-05-24 | 阶段 1 全程：数据层 → UI → 弹窗，本地 tag v0.1 | 1.6/1.8b 未手动验证 |
