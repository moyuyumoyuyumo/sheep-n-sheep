// levels/level-02.js
// 进阶关：18 张牌，6 种动物，2 层错位。
// 每种 symbol 恰好 3 张 → 必可通关。

export const level02 = {
  id: 'level-02',
  name: '进阶关',
  description: '18 张牌 · 6 种动物 · 2 层错位',
  difficulty: 2,
  symbols: ['🐑', '🐱', '🐶', '🐰', '🐼', '🦊'],

  tiles: [
    // ─── 底层 z=0：12 张 4×3 ───
    { symbol: '🐑', gridX: 0, gridY: 0, z: 0 },
    { symbol: '🐱', gridX: 1, gridY: 0, z: 0 },
    { symbol: '🐶', gridX: 2, gridY: 0, z: 0 },
    { symbol: '🐰', gridX: 3, gridY: 0, z: 0 },

    { symbol: '🐼', gridX: 0, gridY: 1, z: 0 },
    { symbol: '🦊', gridX: 1, gridY: 1, z: 0 },
    { symbol: '🐑', gridX: 2, gridY: 1, z: 0 },
    { symbol: '🐱', gridX: 3, gridY: 1, z: 0 },

    { symbol: '🐶', gridX: 0, gridY: 2, z: 0 },
    { symbol: '🐰', gridX: 1, gridY: 2, z: 0 },
    { symbol: '🐼', gridX: 2, gridY: 2, z: 0 },
    { symbol: '🦊', gridX: 3, gridY: 2, z: 0 },

    // ─── 上层 z=1：6 张错位 3×2 ───
    { symbol: '🐑', gridX: 0.5, gridY: 0.5, z: 1 },
    { symbol: '🐱', gridX: 1.5, gridY: 0.5, z: 1 },
    { symbol: '🐶', gridX: 2.5, gridY: 0.5, z: 1 },

    { symbol: '🐰', gridX: 0.5, gridY: 1.5, z: 1 },
    { symbol: '🐼', gridX: 1.5, gridY: 1.5, z: 1 },
    { symbol: '🦊', gridX: 2.5, gridY: 1.5, z: 1 },
  ],
};
