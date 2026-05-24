// src/state.js
// 全局游戏状态。整个项目唯一的"世界真相"。
// 任何模块都不允许散落地保存游戏状态，必须读写这里。
//
// 字段约定：
//   tiles    Array<Tile>            所有牌（不管消没消、压没压）
//   slot     Array<Tile>            底部槽（长度 ≤ SLOT_CAPACITY）
//   status   'idle' | 'menu' | 'playing' | 'won' | 'lost'   当前阶段
//   levelId  string | null          当前关卡 id
//   history  Array<number>          入槽 tileId 顺序（撤回 / 移除 道具用）
//   toolUses { undo, shuffle, remove }  剩余道具次数

import { resetTileIds } from './game/tile.js';

const TOOL_INITIAL = { undo: 3, shuffle: 2, remove: 1 };

export const state = {
  tiles: [],
  slot: [],
  status: 'idle',
  levelId: null,
  history: [],
  toolUses: { ...TOOL_INITIAL },
};

/**
 * 把游戏状态清空到"未开局"。
 * 不会自动加载关卡——关卡填充由 board.js 的 buildBoard() 负责。
 */
export function resetState() {
  state.tiles = [];
  state.slot = [];
  state.status = 'idle';
  state.levelId = null;
  state.history = [];
  state.toolUses = { ...TOOL_INITIAL };
  resetTileIds();
}
