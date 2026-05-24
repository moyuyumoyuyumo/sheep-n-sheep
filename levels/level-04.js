// levels/level-04.js
// 高塔关：90 张 · 10 种动物 · 5 层堆叠。
// 底层 + 错位中层（同尺寸）→ 缩到 5×4 → 4×2 → 顶 2 张。
// 双底层让早期消除"陷得很深才露出关键"。

import { fromLayers } from './builders.js';

export const level04 = {
  id: 'level-04',
  name: '高塔',
  description: '90 张 · 10 种 · 5 层堆叠',
  difficulty: 5,

  buildTiles: () => fromLayers({
    symbolPool: ['🐑', '🐱', '🐶', '🐰', '🐼', '🦊', '🐻', '🐯', '🦁', '🐨'],
    layers: [
      { z: 0,                             grid: ['######', '######', '######', '######', '######'] },  // 6×5 = 30
      { z: 1, offsetX: 0.5, offsetY: 0.5, grid: ['######', '######', '######', '######', '######'] },  // 6×5 = 30
      { z: 2, offsetX: 1.0, offsetY: 1.0, grid: ['#####', '#####', '#####', '#####'] },                // 5×4 = 20
      { z: 3, offsetX: 1.5, offsetY: 2.0, grid: ['####', '####'] },                                     // 4×2 = 8
      { z: 4, offsetX: 3.0, offsetY: 3.5, grid: ['##'] },                                               // 2×1 = 2
    ],
  }),
};
