// src/game/rules.js
// 游戏规则：三消、胜负判定。
// 阶段 1.7 / 1.8 实现。

import { MATCH_COUNT } from '../config.js';

/**
 * 扫描槽，找出可以消除的三张相同牌，返回它们的索引数组。
 * 找不到返回 null。
 * @param {Array} slot
 * @returns {number[]|null}  例如 [0,1,2]
 */
export function findMatch(slot) {
  // TODO 阶段 1.7
  return null;
}

/**
 * 是否胜利：牌堆所有牌都消除了。
 * @param {Array} tiles
 * @returns {boolean}
 */
export function isWin(tiles) {
  // TODO 阶段 1.8
  return false;
}

/**
 * 是否失败：槽满。
 * @param {Array} slot
 * @returns {boolean}
 */
export function isLose(slot) {
  // TODO 阶段 1.8
  return false;
}
