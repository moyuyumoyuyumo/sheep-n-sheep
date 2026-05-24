# 开发进度

> 短期记忆。每次写代码前看一眼，写完之后更新一下。
> 下次和 Cascade 开新会话时，让它先看这个文件就秒进入状态。

---

## 当前阶段

**阶段 5 · 高难度关卡扩展 完成（本地打 tag v0.5）**
阶段 1–5 全部代码到位，Node 单测 **88/88** 过（board 6 + slot 22 + tools 24 + builders 36）。等浏览器人工验证 → 网络恢复后 `git push --tags`。

## 项目关键信息

- 中文名：咩了个咩
- 仓库名：`sheep-n-sheep`
- GitHub 用户名：`moyuyumoyuyumo`
- 仓库地址：<https://github.com/moyuyumoyuyumo/sheep-n-sheep>
- Pages 网址：<https://moyuyumoyuyumo.github.io/sheep-n-sheep/>
- 默认分支：`main`
- noreply 邮箱：`287223318+moyuyumoyuyumo@users.noreply.github.com`
- 本地开发：`npm start` → <http://localhost:5500>（不依赖 Live Server 扩展）
- 单元测试：`npm test`（Node 跑 board / slot-rules / tools / builders 4 套）

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

### 阶段 2 · 视觉打磨
- [x] 2.1 入槽 pop 动画 + 三消消失动画（`isAnimating` 锁输入，320ms 延迟消除）
- [x] 2.2 点 covered 牌 → wiggle；槽接近满≥ 5/7 → 红色呼吸预警
- [x] 2.3 4 种音效（click / match / win / lose）— Web Audio API 纯代码生成
- [x] 2.3b 静音切换按钮 🔊/🔇，偏好存 `localStorage[mok-muted]`
- [x] 2.4 卡面渐变 + 多层阴影（外阴影 + 内高光 + 底部深色边）
- [x] 2.5 移动适配：`@media (max-width: 480px)` + `@media (hover: hover)` 避免触屏粘 hover
- [x] 2.6 progress 更新 + commit + tag `v0.2`

### 阶段 3 · 关卡系统
- [x] 3.1 关卡数据加 `description` / `difficulty` 字段；new `levels/index.js` 注册中心（`allLevels` / `getLevelById` / `getNextLevel`）
- [x] 3.2 新关卡：level-02（18 张 6 symbol 2 层）、level-03（27 张 9 symbol 3 层）
- [x] 3.3 选关菜单：status `'menu'` 加入状态机，关卡卡片 + 难度星级 + 状态标签
- [x] 3.4 进度持久化 `src/progress.js`：localStorage `mok-progress` 存 `passedLevels` + `lastPlayedId`；前一关未过 → 后面关 .locked
- [x] 3.5 胜负弹窗双按钮（`dataset.action='next'/'menu'/'replay'`）；won 不同文案（下一关 vs 全通关）
- [x] 3.6 progress 更新 + commit + tag `v0.3`

### 阶段 4 · 道具系统
- [x] 4.1 撤回道具：`useUndo(state)` pop history → 恢复那张 tile.removed=false + 从 slot 移除
- [x] 4.2 洗牌道具：`useShuffle(state)` 按 z 分层 Fisher-Yates 重排 (gridX, gridY)，差不变层结构
- [x] 4.3 移除道具：`useRemove(state)` 抽 slot 前 3 张回牌堆 + history filter 掉
- [x] 4.4 道具栏 UI：3 个按钮 + 右上角红点计数；耗尽 disabled；only playing 状态可见
- [x] 4.5 `tests/test-tools.js` 道具单测 24/24 过
- [x] 4.6 progress 更新 + commit + tag `v0.4`

### 阶段 5 · 高难度关卡扩展
- [x] 5.1 `levels/builders.js` 抽离 `fromLayers({ symbolPool, layers })` 工厂：grid 字符串 `'#'` 摆位 + Fisher-Yates 随机分配 symbol，每开新局位置都不同
- [x] 5.2 `src/game/board.js` 兼容动态工厂：`buildBoard` 优先调 `level.buildTiles()`，否则回退静态 `level.tiles`
- [x] 5.3 重写 level-02 为 **错层迷宫**（36 张 / 6 symbol / 3 层全错位 0.5+1.0）
- [x] 5.4 重写 level-03 为 **金字塔**（60 张 / 10 symbol / 4 层 6×5→5×4→3×2→2×2）
- [x] 5.5 新增 level-04 **高塔**（90 张 / 10 symbol / 5 层双底层堆叠）
- [x] 5.6 新增 level-05 **深渊**（144 张 / 12 symbol / 6 层瀑布形，参考真"羊了个羊"二关）
- [x] 5.7 `levels/index.js` 注册 04 / 05
- [x] 5.8 `tests/test-builders.js` 36/36 过（基础展开 / `.` 跳过 / 错误抛 / 随机性 / 4 关数据完整性）
- [x] 5.9 `package.json` test script 串联 4 套
- [x] 5.10 progress 更新 + commit + tag `v0.5`

## 进行中 / 待办

- [ ] 0.9 网络恢复后 `git push --tags` + 在 GitHub Settings 开 Pages
- [ ] 阶段 1–5 浏览器手动验证（点击 / 三消 / 弹窗 / 动画 / 音效 / 选关 / 进度 / 道具 / 新关卡可玩性）
- [ ] level-04 / level-05 手动试通关，观察难度曲线是否合理（太难就给道具加额度，太简单就再加层）

## 笔记 / 待澄清的问题

- `level-01` 是 3×3 = 9 张牌的极简关卡，理论上必赢，验证三消主流程足够
- dev-server Windows 路径 bug：`fileURLToPath` 末尾自带 `\`，用 `path.resolve` 规范化
- `addToSlot` 设计是"同 symbol 自动挤一起"，`findMatch` 只查连续 3 张
- tile id 用模块级计数器，`resetState()` 会同时调 `resetTileIds()` 防累加
- 2.1 三消动画用临时标记 `tile._matching`：render 看到就加 .matching class，controls.js setTimeout 320ms 后才真 filter 掉
- 2.1 `prevSlotIds` 缓存上一帧 slot 里哪些 id，用于识别"新出现"的 cell 给 .just-added；startGame 清空它
- 2.3 audio.js 用 `OscillatorNode`，首次手势后 lazy 创建的 AudioContext，避免浏览器警告
- 3.1 `levels/index.js` 是中央注册表，加新关卡只要 import + push 这里即生效
- 3.4 `progress.js` 所有读写都 `try/catch` 静默失败（隐私模式 / 配额满不抛）
- 3.5 弹窗按钮用 `dataset.action`，render.js 负责设置，controls.js 委托事件按 action 分发
- 3.5 won 状态会同时调 `markPassed(levelId)` 创建下次进入菜单时下一关的解锁状态
- 4.1 入槽时 `controls.js` 调 `state.history.push(tile.id)`；三消后立刻从 history 里拿掉那 3 个 id（不能撤回已消除的）
- 4.2 `useShuffle` 按 z 分层 — 不跨层交换位置，避免底层跨到顶层导致拓扑崩
- 4.3 `useRemove` 抽的是 slot “头 3 张”，不是尾，因为头部才是最难凑齐的（同 symbol 被 addToSlot 挤到头后部那些怎么都凑不齐）
- 4.4 道具械次数存在 `state.toolUses`，resetState 刷回 `{undo:3, shuffle:2, remove:1}`；每关开始都重置（没持久化）
- 5.1 关卡现在有两种数据形式：静态 `tiles[]` 数组（level-01 保留作为最简单 sanity）+ 动态 `buildTiles()` 函数（level-02~05），后者每次开局重洗 symbol
- 5.1 `fromLayers` 强校验：总牌数必须是 3 的倍数 + symbol 池不能空 → 关卡设计时少摆漏摆会立即抛错而不是开局后才发现
- 5.1 每个 symbol 一定刚好分到 `(总牌数 / 3 / 池大小)` 套，余数按池顺序前缀多分 1 套；上面 4 关都设计成整除关系所以每种 symbol 数量完全相等
- 5.6 level-05 的 6×4=24 张顶部 4 层都从 (1, *) 起，故意让底层第 0 列和第 7 列变成只露一行/两行的"易点位"诱导玩家先吃掉底两边，但牌池被洗过去就埋雷了

## 历史会话

| 日期 | 主题 | 备注 |
|---|---|---|
| 2026-05-23 | 项目启动 + 四份文档 + 阶段 0 全部步骤 | 一气呵成 |
| 2026-05-24 | 阶段 1 全程：数据层 → UI → 弹窗，本地 tag v0.1 | 1.6/1.8b 未手动验证 |
| 2026-05-24 | 阶段 2 视觉打磨：动画 / 反馈 / 音效 / 美化 / 移动适配，tag v0.2 | 未人工验证 |
| 2026-05-24 | 阶段 3 关卡系统：多关多层 / 选关界面 / localStorage 进度，tag v0.3 | 未人工验证 |
| 2026-05-24 | 阶段 4 道具系统：撤回 / 洗牌 / 移除 + 24 个道具单测，tag v0.4 | 一口气从阶段 2 做到 4 |
| 2026-05-24 | 阶段 5 高难度关卡：fromLayers 工厂 + 4 关动态化（36/60/90/144 张）+ 36 个 builders 单测，tag v0.5 | 用户反馈"后面关卡太简单"后立刻补 |
