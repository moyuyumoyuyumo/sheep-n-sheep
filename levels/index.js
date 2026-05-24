// levels/index.js
// 关卡注册中心：列出所有关卡 + 提供查找辅助函数。
// 新关卡只要在这里 import + push 进 allLevels 即可生效，
// 别处不需要改。

import { level01 } from './level-01.js';
import { level02 } from './level-02.js';
import { level03 } from './level-03.js';
import { level04 } from './level-04.js';
import { level05 } from './level-05.js';

export const allLevels = [level01, level02, level03, level04, level05];

/**
 * 按 id 找关卡。找不到就返回第一关（兜底 idle 状态保护）。
 */
export function getLevelById(id) {
  return allLevels.find(l => l.id === id) || allLevels[0];
}

/**
 * 按下标找关卡。越界返回 null。
 */
export function getLevelByIndex(idx) {
  return allLevels[idx] || null;
}

/**
 * 找下一关。当前是最后一关 / 找不到都返回 null。
 */
export function getNextLevel(currentId) {
  const idx = allLevels.findIndex(l => l.id === currentId);
  if (idx < 0 || idx >= allLevels.length - 1) return null;
  return allLevels[idx + 1];
}
