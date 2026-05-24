// src/game/rules.js
// 游戏规则：三消、胜负判定。
// 阶段 1.7 / 1.8 实现。

import { MATCH_COUNT, SLOT_CAPACITY } from '../config.js';

/**
 * 扫描槽，找出可以消除的三张相同牌，返回它们的索引数组。
 * 找不到返回 null。
 * @param {Array} slot
 * @returns {number[]|null}  例如 [0,1,2]
 */
export function findMatch(slot) {
  // 找连续 MATCH_COUNT 张相同 symbol 的牌。
  // addToSlot 已经保证同种 symbol 贴在一起，所以只扫一遍即可。
  for (let i = 0; i <= slot.length - MATCH_COUNT; i++) {
    const sym = slot[i].symbol;
    let allSame = true;
    for (let j = 1; j < MATCH_COUNT; j++) {
      if (slot[i + j].symbol !== sym) {
        allSame = false;
        break;
      }
    }
    if (allSame) {
      // 返回连续 MATCH_COUNT 个索引：[i, i+1, ..., i+MATCH_COUNT-1]
      return Array.from({ length: MATCH_COUNT }, (_, k) => i + k);
    }
  }
  return null;
}

/**
 * 是否胜利：牌堆所有牌都消除了。
 * @param {Array} tiles
 * @returns {boolean}
 */
export function isWin(tiles) {
  // 牌堆里还有牌 + 全部被 removed = 胜利。
  // 注意 tiles.every 在空数组上返回 true（vacuous truth），所以要排除空数组。
  return tiles.length > 0 && tiles.every(t => t.removed);
}

/**
 * 是否失败：槽满。
 * @param {Array} slot
 * @returns {boolean}
 */
export function isLose(slot) {
  // 槽已满 + 没法消除 = 失败。
  // 槽满但能消的话不算失败（下一帧会消掉）。
  return slot.length >= SLOT_CAPACITY && findMatch(slot) === null;
}
