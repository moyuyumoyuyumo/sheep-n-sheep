// levels/level-03.js
// 金字塔关：60 张 · 10 种动物 · 4 层渐缩。
// 底层 6×5 大方阵 → 中层 5×4 → 上层 3×2 → 顶层 2×2。
// 顶部小、底部大，必须从顶层往下层层消除。

import { fromLayers } from './builders.js';

export const level03 = {
  id: 'level-03',
  name: '金字塔',
  description: '60 张 · 10 种 · 4 层金字塔',
  difficulty: 4,

  buildTiles: () => fromLayers({
    symbolPool: ['🐑', '🐱', '🐶', '🐰', '🐼', '🦊', '🐻', '🐯', '🦁', '🐨'],
    layers: [
      { z: 0,                             grid: ['######', '######', '######', '######', '######'] },  // 6×5 = 30
      { z: 1, offsetX: 0.5, offsetY: 0.5, grid: ['#####', '#####', '#####', '#####'] },                // 5×4 = 20
      { z: 2, offsetX: 1.5, offsetY: 1.5, grid: ['###', '###'] },                                       // 3×2 = 6
      { z: 3, offsetX: 2.0, offsetY: 2.0, grid: ['##', '##'] },                                         // 2×2 = 4
    ],
  }),
};
