// levels/level-01.js
// 第一关的数据定义。
//
// 阶段 1 用 JS 而不是 JSON，是因为 JSON 必须 fetch 加载，
// 而 fetch 在 file:// 协议下会被浏览器禁止（即必须 Live Server）。
// 阶段 3 做正式关卡系统时会迁移到 JSON 格式。
//
// 设计：9 张牌，3 种图案各 3 张，2 层金字塔。
// 保证可一次通关，让玩家体验完整流程。

/**
 * 关卡数据结构：
 * - id     {string}   关卡唯一编号
 * - name   {string}   显示名
 * - tiles  {Array}    所有牌，每张牌的字段：
 *     - symbol {string}  图案（emoji）
 *     - gridX  {number}  网格坐标 X（单位 = TILE_SIZE）
 *     - gridY  {number}  网格坐标 Y
 *     - z      {number}  层级，越大越靠上
 *
 * 关于坐标：
 *   gridX/gridY 是"网格单位"而不是像素。一张牌占 1×1 个网格。
 *   渲染时由 board.js 把 gridX*TILE_SIZE 算成像素。
 *   用 0.5 这种小数能让上层错位盖住下层 2~4 张。
 */
export const level01 = {
  id: 'level-01',
  name: '热身关 · 9 张',
  symbols: ['🐑', '🐱', '🐶'],

  tiles: [
    // ─── 底层（z=0），6 张排成 2 行 3 列 ───
    { symbol: '🐑', gridX: 0, gridY: 0, z: 0 },
    { symbol: '🐱', gridX: 1, gridY: 0, z: 0 },
    { symbol: '🐶', gridX: 2, gridY: 0, z: 0 },
    { symbol: '🐱', gridX: 0, gridY: 1, z: 0 },
    { symbol: '🐶', gridX: 1, gridY: 1, z: 0 },
    { symbol: '🐑', gridX: 2, gridY: 1, z: 0 },

    // ─── 上层（z=1），3 张错位盖住底层 ───
    { symbol: '🐑', gridX: 0.5, gridY: 0.5, z: 1 },
    { symbol: '🐶', gridX: 1,   gridY: 0.5, z: 1 },
    { symbol: '🐱', gridX: 1.5, gridY: 0.5, z: 1 },
  ],
};
