// src/game/tools.js
// 三个道具，每个都直接修改 state，成功返回 true，无可操作返回 false。
//
//   useUndo    撤回最后一次入槽（按 history 栈弹）
//   useShuffle 洗牌：每个 z 层内的 tile 位置随机重排
//   useRemove  移除：把 slot 前 3 张（最先入的）抽回牌堆，恢复 removed=false
//
// 设计：道具不消耗"次数"——次数管理在 controls.js 里调用前后处理。
// 这样 tools.js 只关心状态变换，纯函数化方便单测。

/**
 * 撤回：把上一次入槽的牌恢复到牌堆。
 * 同时把它从 slot 移除。
 *
 * @param {object} state
 * @returns {boolean} true=成功
 */
export function useUndo(state) {
  if (!state.history || state.history.length === 0) return false;

  const lastId = state.history.pop();
  const tile = state.tiles.find(t => t.id === lastId);
  if (!tile) return false;

  tile.removed = false;
  state.slot = state.slot.filter(t => t.id !== lastId);
  return true;
}

/**
 * 洗牌：每个 z 层内的 (gridX, gridY) 用 Fisher-Yates 重排。
 * 已消除的牌（removed=true）不参与。
 * 保持 z 不变，因此牌堆"层数结构"不会乱。
 *
 * @param {object} state
 * @returns {boolean} true=至少有一层被洗了
 */
export function useShuffle(state) {
  const byZ = new Map();
  for (const t of state.tiles) {
    if (t.removed) continue;
    if (!byZ.has(t.z)) byZ.set(t.z, []);
    byZ.get(t.z).push(t);
  }

  let shuffled = false;
  for (const tiles of byZ.values()) {
    if (tiles.length < 2) continue;
    const positions = tiles.map(t => ({ gridX: t.gridX, gridY: t.gridY }));

    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    tiles.forEach((t, i) => {
      t.gridX = positions[i].gridX;
      t.gridY = positions[i].gridY;
    });
    shuffled = true;
  }
  return shuffled;
}

/**
 * 移除：把 slot 前 3 张抽回牌堆（恢复 removed=false）。
 * 不足 3 张时把全部抽回。
 * 同步从 history 里清掉这些 id（因为它们重新可点了，不算"入槽过"）。
 *
 * @param {object} state
 * @returns {boolean} true=至少抽回 1 张
 */
export function useRemove(state) {
  if (!state.slot || state.slot.length === 0) return false;

  const takeCount = Math.min(3, state.slot.length);
  const taken = state.slot.slice(0, takeCount);
  state.slot = state.slot.slice(takeCount);

  for (const t of taken) {
    const tile = state.tiles.find(x => x.id === t.id);
    if (tile) tile.removed = false;
  }

  const takenIds = new Set(taken.map(t => t.id));
  state.history = (state.history || []).filter(id => !takenIds.has(id));
  return true;
}
