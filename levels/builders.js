// levels/builders.js
// 关卡构建辅助：从"层模板"展开成 tiles 数组。
//
// 设计意图：
//   - 关卡数据以 grid 字符串写（'#' 放牌、其他字符跳过），可视化好看
//   - symbol 自动按池子均分 + 洗牌，所以每次开局位置都不同
//   - 强制总牌数为 3 的倍数（不然必不可解）
//
// 用法（在 level-XX.js 里）：
//   import { fromLayers } from './builders.js';
//   export const level02 = {
//     id: 'level-02', ...,
//     buildTiles: () => fromLayers({ symbolPool: [...], layers: [...] }),
//   };
//
// buildBoard 会调 level.buildTiles() 拿到 tiles，每次开新局都重新随机。

/**
 * 把层模板展开成 tiles 数组。
 *
 * @param {object} opts
 * @param {string[]} opts.symbolPool - 候选 symbol 池（数量必须能让分配是 3 倍数）
 * @param {Array<{z, offsetX?, offsetY?, grid: string[]}>} opts.layers - 层模板
 *   grid 每行是字符串：字符 '#' 表示放一张牌；其他字符（如 '.' 或 ' '）跳过。
 *   offsetX / offsetY 默认 0，用来做层间错位（典型值 0.5）。
 * @returns {Array<{symbol, gridX, gridY, z}>}
 */
export function fromLayers({ symbolPool, layers }) {
  // 1. 收集所有 # 位置
  const positions = [];
  for (const layer of layers) {
    const ox = layer.offsetX ?? 0;
    const oy = layer.offsetY ?? 0;
    const z  = layer.z;
    for (let y = 0; y < layer.grid.length; y++) {
      const row = layer.grid[y];
      for (let x = 0; x < row.length; x++) {
        if (row[x] === '#') {
          positions.push({ gridX: x + ox, gridY: y + oy, z });
        }
      }
    }
  }

  const total = positions.length;
  if (total === 0) {
    throw new Error('fromLayers: 总牌数为 0，检查 grid 是否全是空格');
  }
  if (total % 3 !== 0) {
    throw new Error(`fromLayers: 总牌数 ${total} 不是 3 的倍数，必不可解`);
  }

  // 2. 算每个 symbol 分多少张（每个都得是 3 的倍数）
  // 先平均分套数，余数给前面的 symbol 多分一套
  const totalSets = total / 3;
  const poolSize = symbolPool.length;
  if (poolSize === 0) throw new Error('fromLayers: symbolPool 为空');

  const setsPerSymbol = Math.floor(totalSets / poolSize);
  const extraSets = totalSets % poolSize;

  const bag = [];
  for (let i = 0; i < poolSize; i++) {
    const sets = setsPerSymbol + (i < extraSets ? 1 : 0);
    for (let s = 0; s < sets; s++) {
      bag.push(symbolPool[i], symbolPool[i], symbolPool[i]);
    }
  }

  // 3. Fisher-Yates 打乱 symbol → 每次调用位置都不同
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }

  // 4. 把 symbol 一一分给 position
  return positions.map((pos, i) => ({
    symbol: bag[i],
    gridX:  pos.gridX,
    gridY:  pos.gridY,
    z:      pos.z,
  }));
}
