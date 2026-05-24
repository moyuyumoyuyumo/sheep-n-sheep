// src/game/tile.js
// "牌"的数据结构与工厂函数。
// 牌永远通过 createTile() 创建，不要手写 { id: ..., symbol: ... }。
//
// 字段约定：
//   id       自动生成的唯一编号，方便从数组里查找
//   symbol   显示的图案（emoji 或字符）
//   gridX    网格坐标 X（单位 = TILE_SIZE 像素）
//   gridY    网格坐标 Y
//   z        层级，越大越靠上
//   removed  是否已经消除 / 进了槽（render 时跳过它）

import { TILE_SIZE } from '../config.js';

// 模块级 id 计数器。重开关卡时由 resetTileIds() 重置。
let nextId = 1;

/**
 * 创建一张牌。id 由模块内部自动分配。
 * @param {object} props
 * @param {string} props.symbol  - 图案
 * @param {number} props.gridX   - 网格 X
 * @param {number} props.gridY   - 网格 Y
 * @param {number} props.z       - 层级
 * @returns {object} 牌对象
 */
export function createTile({ symbol, gridX, gridY, z }) {
  return {
    id: nextId++,
    symbol,
    gridX,
    gridY,
    z,
    removed: false,
  };
}

/**
 * 把网格坐标转成像素坐标。在 ui/render.js 里画牌时用。
 * @param {object} tile
 * @returns {{x: number, y: number}}
 */
export function tileToPixels(tile) {
  return {
    x: tile.gridX * TILE_SIZE,
    y: tile.gridY * TILE_SIZE,
  };
}

/**
 * 重置 id 计数器。由 resetState() 在重开关卡时调用。
 */
export function resetTileIds() {
  nextId = 1;
}
