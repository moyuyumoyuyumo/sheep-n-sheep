// src/game/slot.js
// 底部"槽"的逻辑：放牌、整理、查满。
// 阶段 1.6 / 1.7 实现。

import { SLOT_CAPACITY } from '../config.js';

/**
 * 往槽里添加一张牌。
 * 添加规则：相同 symbol 的牌要"挤"到一起，方便检查三消。
 * @param {Array} slot   - 当前槽数组（长度 ≤ SLOT_CAPACITY）
 * @param {object} tile  - 要加入的牌
 * @returns {Array} 新的 slot
 */
export function addToSlot(slot, tile) {
  // TODO 阶段 1.6
  return slot;
}

/**
 * 槽是否已满。
 * @param {Array} slot
 * @returns {boolean}
 */
export function isSlotFull(slot) {
  return slot.length >= SLOT_CAPACITY;
}
