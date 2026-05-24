// src/game/board.js
// "牌堆"逻辑：
//   1. 根据关卡数据"摆牌"（buildBoard）
//   2. 判断一张牌是否被压住、不能点（isCovered）

import { createTile } from './tile.js';

/**
 * 根据关卡数据生成完整牌堆。
 * 把关卡里的简单 { symbol, gridX, gridY, z } 喂给 createTile，
 * 得到带 id、带 removed 字段的真正牌对象。
 *
 * 关卡有两种数据形式：
 *   1) 静态 tiles 数组：level.tiles
 *   2) 工厂函数：level.buildTiles()（每次返回不同 symbol 分布）
 * 优先使用工厂函数，没有则 fallback 静态。
 *
 * @param {object} level
 * @returns {Array} 牌对象数组
 */
export function buildBoard(level) {
  const rawTiles = typeof level.buildTiles === 'function'
    ? level.buildTiles()
    : level.tiles;

  return rawTiles.map(t => createTile({
    symbol: t.symbol,
    gridX:  t.gridX,
    gridY:  t.gridY,
    z:      t.z,
  }));
}

/**
 * 两张牌的网格矩形是否重叠（AABB）。
 * 每张牌占 1×1，覆盖区域 [gridX, gridX+1) × [gridY, gridY+1)。
 *
 * @param {object} a
 * @param {object} b
 * @returns {boolean}
 */
function isOverlapping(a, b) {
  return a.gridX < b.gridX + 1 &&
         b.gridX < a.gridX + 1 &&
         a.gridY < b.gridY + 1 &&
         b.gridY < a.gridY + 1;
}

/**
 * 判断一张牌是否被压住（不能点）。
 * 规则：另有一张牌 z 比它高、未消除、矩形重叠 → 被压。
 *
 * @param {object} tile     - 要判断的牌
 * @param {Array} allTiles  - 牌堆里所有牌（含 tile 自己）
 * @returns {boolean}
 */
export function isCovered(tile, allTiles) {
  if (tile.removed) return false;

  for (const other of allTiles) {
    if (other === tile) continue;
    if (other.removed) continue;
    if (other.z <= tile.z) continue;
    if (isOverlapping(tile, other)) return true;
  }
  return false;
}
