// src/progress.js
// 持久化"已通关哪些关卡"+ "上次玩到哪一关"。
//
// 设计：localStorage 里存一份 JSON。读写都失败静默（隐私模式 / 满了不要抛）。
// localStorage key: mok-progress

const KEY = 'mok-progress';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : empty();
  } catch {
    return empty();
  }
}

function write(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

function empty() {
  return { passedLevels: [], lastPlayedId: null };
}

/** 标记一关已通过 + 记下"上次玩到这关"。 */
export function markPassed(levelId) {
  const p = read();
  if (!p.passedLevels.includes(levelId)) {
    p.passedLevels.push(levelId);
  }
  p.lastPlayedId = levelId;
  write(p);
}

/** 只记录"上次玩到哪关"（不算通过）。 */
export function setLastPlayed(levelId) {
  const p = read();
  p.lastPlayedId = levelId;
  write(p);
}

export function getLastPlayedId() {
  return read().lastPlayedId;
}

export function getPassedSet() {
  return new Set(read().passedLevels);
}

/**
 * 这关是否解锁：第一关默认解锁，后续关需要前一关已通过。
 * @param {string} levelId
 * @param {string[]} allLevelIds - 按顺序的所有关卡 id
 */
export function isLevelUnlocked(levelId, allLevelIds) {
  const idx = allLevelIds.indexOf(levelId);
  if (idx <= 0) return true;
  return read().passedLevels.includes(allLevelIds[idx - 1]);
}

/** 调试用：清空所有进度。 */
export function clearProgress() {
  write(empty());
}
