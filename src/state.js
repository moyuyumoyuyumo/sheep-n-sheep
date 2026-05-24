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
//   toolUses { undo, shuffle, remove }  道具余额快照（真实数据源在 wallet.js）
//
// 道具余额设计变更（阶段 6）：
//   - 不再每关重置为固定 {3,2,1}。道具是跨关卡资源，持久化在 wallet.js
//   - state.toolUses 只是余额快照，供 render.js 读；startLevel 和充值后同步刷新
//   - 读取、修改 wallet 的业务逻辑都在 controls.js / main.js

import { resetTileIds } from './game/tile.js';

export const state = {
  tiles: [],
  slot: [],
  status: 'idle',
  levelId: null,
  history: [],
  toolUses: { undo: 0, shuffle: 0, remove: 0 },
};

/**
 * 把游戏状态清空到"未开局"。
 * 不会自动加载关卡——关卡填充由 board.js 的 buildBoard() 负责。
 * 道具余额不重置（wallet 独立持久化）。
 */
export function resetState() {
  state.tiles = [];
  state.slot = [];
  state.status = 'idle';
  state.levelId = null;
  state.history = [];
  // toolUses 不重置：startLevel 会从 wallet 重新拼一份快照进来
  resetTileIds();
}
