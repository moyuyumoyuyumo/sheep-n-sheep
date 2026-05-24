// levels/level-03.js
// 困难关：27 张牌，9 种动物，3 层。
// 每种 symbol 恰好 3 张 → 必可通关，但叠层让顺序变难选。

export const level03 = {
  id: 'level-03',
  name: '困难关',
  description: '27 张牌 · 9 种动物 · 3 层叠',
  difficulty: 4,
  symbols: ['🐑', '🐱', '🐶', '🐰', '🐼', '🦊', '🐻', '🐯', '🦁'],

  tiles: [
    // ─── 底层 z=0：16 张 4×4 ───
    { symbol: '🐑', gridX: 0, gridY: 0, z: 0 },
    { symbol: '🐱', gridX: 1, gridY: 0, z: 0 },
    { symbol: '🐶', gridX: 2, gridY: 0, z: 0 },
    { symbol: '🐰', gridX: 3, gridY: 0, z: 0 },

    { symbol: '🐼', gridX: 0, gridY: 1, z: 0 },
    { symbol: '🦊', gridX: 1, gridY: 1, z: 0 },
    { symbol: '🐻', gridX: 2, gridY: 1, z: 0 },
    { symbol: '🐯', gridX: 3, gridY: 1, z: 0 },

    { symbol: '🦁', gridX: 0, gridY: 2, z: 0 },
    { symbol: '🐑', gridX: 1, gridY: 2, z: 0 },
    { symbol: '🐱', gridX: 2, gridY: 2, z: 0 },
    { symbol: '🐶', gridX: 3, gridY: 2, z: 0 },

    { symbol: '🐰', gridX: 0, gridY: 3, z: 0 },
    { symbol: '🐼', gridX: 1, gridY: 3, z: 0 },
    { symbol: '🦊', gridX: 2, gridY: 3, z: 0 },
    { symbol: '🐻', gridX: 3, gridY: 3, z: 0 },

    // ─── 中层 z=1：9 张 3×3 错位 ───
    { symbol: '🐑', gridX: 0.5, gridY: 0.5, z: 1 },
    { symbol: '🐱', gridX: 1.5, gridY: 0.5, z: 1 },
    { symbol: '🐶', gridX: 2.5, gridY: 0.5, z: 1 },

    { symbol: '🐰', gridX: 0.5, gridY: 1.5, z: 1 },
    { symbol: '🐼', gridX: 1.5, gridY: 1.5, z: 1 },
    { symbol: '🦊', gridX: 2.5, gridY: 1.5, z: 1 },

    { symbol: '🐻', gridX: 0.5, gridY: 2.5, z: 1 },
    { symbol: '🐯', gridX: 1.5, gridY: 2.5, z: 1 },
    { symbol: '🦁', gridX: 2.5, gridY: 2.5, z: 1 },

    // ─── 顶层 z=2：2 张 ───
    { symbol: '🐯', gridX: 1, gridY: 1, z: 2 },
    { symbol: '🦁', gridX: 2, gridY: 2, z: 2 },
  ],
};
