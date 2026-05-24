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
  if (slot.length >= SLOT_CAPACITY) return slot;     // 已满，不动

  // 找最后一个相同 symbol 的位置，插到它的右边。
  // 这样所有相同 symbol 的牌都"挤"到一起，三消判定只需要找连续。
  let insertIdx = slot.length;
  for (let i = slot.length - 1; i >= 0; i--) {
    if (slot[i].symbol === tile.symbol) {
      insertIdx = i + 1;
      break;
    }
  }

  return [...slot.slice(0, insertIdx), tile, ...slot.slice(insertIdx)];
}

/**
 * 槽是否已满。
 * @param {Array} slot
 * @returns {boolean}
 */
export function isSlotFull(slot) {
  return slot.length >= SLOT_CAPACITY;
}
