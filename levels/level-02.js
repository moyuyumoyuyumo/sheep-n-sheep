// levels/level-02.js
// 错层关：36 张牌 · 6 种动物 · 3 层全错位。
// 三层完全堆叠（每层 4×3），层间错位 0.5 / 1.0，
// 让每张顶层牌都覆盖下层 4 张 → 玩家必须计算消哪些才能露出关键 symbol。
// 每次开局 symbol 重新随机分布。

import { fromLayers } from './builders.js';

export const level02 = {
  id: 'level-02',
  name: '错层迷宫',
  description: '36 张 · 6 种 · 3 层全错位',
  difficulty: 3,

  buildTiles: () => fromLayers({
    symbolPool: ['🐑', '🐱', '🐶', '🐰', '🐼', '🦊'],
    layers: [
      { z: 0,                       grid: ['####', '####', '####'] },  // 底层 4×3
      { z: 1, offsetX: 0.5, offsetY: 0.5, grid: ['####', '####', '####'] },  // 中层错位
      { z: 2, offsetX: 1.0, offsetY: 1.0, grid: ['####', '####', '####'] },  // 顶层错位
    ],
  }),
};
