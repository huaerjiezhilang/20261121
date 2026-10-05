import assert from 'node:assert/strict';
import {
  emptyPuzzles, attemptPuzzle, normalizePuzzles, isAscending, allCollected, collectedCount,
  PUZZLE_IDS, PUZZLE_REWARDS, BOOK_ORDER, RIBBON_NUMBERS, SORT_SLOTS,
  DECOR_RIBBONS, REWARD_START_SLOT, LINE_RIBBONS, BOOK_START_FIRST, BOOK_START_THIRD,
} from '../src/puzzles.js';
import { canStand, movePlayer, SPAWN } from '../src/walking.js';

// --- 墙上 8 条装饰彩带 + 中间 5 个位置 ---
assert.equal(DECOR_RIBBONS, 8);
assert.equal(SORT_SLOTS, 5);
assert.deepEqual(RIBBON_NUMBERS, [1, 2, 3, 4, 5]);
assert.deepEqual(LINE_RIBBONS, [2, 3]);
assert.deepEqual(Object.values(PUZZLE_REWARDS).slice().sort((a, b) => a - b), RIBBON_NUMBERS);
// 每个谜题彩带有一个互不相同的中间起始位置
assert.deepEqual(Object.values(REWARD_START_SLOT).slice().sort((a, b) => a - b), [0, 1, 2, 3, 4]);

let s = emptyPuzzles();
assert.deepEqual(s.order, [null, null, null, null, null]);
assert.equal(collectedCount(s), 0); assert.equal(allCollected(s), false);
assert.deepEqual(s.shelves, { first: BOOK_START_FIRST, third: BOOK_START_THIRD });

// --- 未满足前置条件时不能解开 ---
assert.equal(attemptPuzzle(s, 'drawer', '000').success, false);
assert.equal(attemptPuzzle(s, 'books', BOOK_START_FIRST).success, false);
assert.equal(attemptPuzzle(s, 'books', { first: BOOK_ORDER, third: BOOK_START_THIRD }).success, false, 'one shelf is not enough');
assert.equal(attemptPuzzle(s, 'books', { first: BOOK_START_FIRST, third: BOOK_ORDER }).success, false, 'one shelf is not enough');
assert.equal(attemptPuzzle(s, 'tablet', ['西瓜']).success, false);
assert.equal(attemptPuzzle(s, 'tablet', ['苹果', '061203']).success, false);
assert.equal(attemptPuzzle(s, 'tablet', ['西瓜', '000000']).success, false);
assert.equal(attemptPuzzle(s, 'plant').success, false);
assert.equal(attemptPuzzle(s, 'cat').success, false);
assert.equal(s.solved.length, 0);

// --- 线索与道具 ---
s = attemptPuzzle(s, 'clock').state; assert(s.clues.includes('clock'));
s = attemptPuzzle(s, 'wateringCan').state; assert(s.items.includes('wateringCan'));
s = attemptPuzzle(s, 'hat').state; assert(s.items.includes('hat'));

// --- 五个谜题不限顺序完成，各点亮一根 1~5 号彩带 ---
s = attemptPuzzle(s, 'drawer', '119').state; assert(s.solved.includes('drawer'));
s = attemptPuzzle(s, 'plant').state; assert(s.solved.includes('plant'));
s = attemptPuzzle(s, 'cat').state; assert(s.solved.includes('cat'));
s = attemptPuzzle(s, 'books', { first: BOOK_ORDER, third: BOOK_ORDER }).state; assert(s.solved.includes('books'));
s = attemptPuzzle(s, 'tablet', ['西瓜', '061203']).state; assert(s.solved.includes('tablet'));
assert.equal(collectedCount(s), 5); assert(allCollected(s));
assert.equal(new Set(s.order.filter(Boolean)).size, 5);
assert.deepEqual(s.order.filter(Boolean).sort((a, b) => a - b), RIBBON_NUMBERS);
assert.equal(isAscending(s.order), false, 'Scrambled ribbons are not yet sorted');

// --- 终局排序：只有 1..5 依次排列才算成功 ---
let r = attemptPuzzle(s, 'ribbons', s.order);
assert.equal(r.success, false); assert.equal(r.changed, true); assert.equal(r.state.sorted, false);
const swapped = s.order.slice(); [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
r = attemptPuzzle(s, 'ribbons', swapped); assert.equal(r.success, false);
assert.deepEqual(normalizePuzzles(JSON.parse(JSON.stringify(r.state))).order, swapped, 'Partial sorting is remembered');
s = attemptPuzzle(s, 'ribbons', [1, 2, 3, 4, 5]).state;
assert.equal(s.sorted, true); assert(isAscending(s.order));

// --- 奖励不重复、操作幂等 ---
assert.deepEqual(attemptPuzzle(s, 'plant').state, s);
assert.deepEqual(attemptPuzzle(s, 'drawer', '119').state, s);
assert.deepEqual(attemptPuzzle(s, 'clock').state, s);

// --- 存档：合法排列保留，非法或旧存档重建 ---
assert.deepEqual(normalizePuzzles(JSON.parse(JSON.stringify(s))), s);
assert.deepEqual(normalizePuzzles({ solved: ['sofa', 'music'], items: ['record', 'key'], clues: ['postcard'] }), emptyPuzzles());
assert.deepEqual(normalizePuzzles(null), emptyPuzzles());
assert.deepEqual(normalizePuzzles({ shelves: { first: BOOK_ORDER, third: BOOK_ORDER } }).shelves, { first: BOOK_ORDER, third: BOOK_ORDER });
assert.deepEqual(normalizePuzzles({ shelves: { first: ['nope'], third: [] } }).shelves, { first: BOOK_START_FIRST, third: BOOK_START_THIRD });
const bad = [1, 1, 2, 3, 4];
const rebuilt = normalizePuzzles({ solved: PUZZLE_IDS, order: bad, sorted: true });
assert.equal(rebuilt.sorted, false);
assert.deepEqual(rebuilt.order.filter(Boolean).sort((a, b) => a - b), RIBBON_NUMBERS);

// --- 移动与可达性（保留原有底层能力）---
assert(canStand(SPAWN.x, SPAWN.z)); assert(!canStand(-4.65, -1.25)); assert(!canStand(4.65, -1)); assert(!canStand(3.35, 4.65));
const wall = { x: 2, z: 0 }; movePlayer(wall, 20, 0); assert(wall.x <= 5.86);
const table = { x: .25, z: 2.7 }; movePlayer(table, 0, -7); assert(table.z >= 1.73);
const reachable = new Set(), queue = [[15, 44]];
while (queue.length) { const [x, z] = queue.pop(), key = `${x},${z}`; if (reachable.has(key) || !canStand(x / 10, z / 10)) continue; reachable.add(key); for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) queue.push([x + dx, z + dz]); }
for (const [x, z] of [[28, 35], [30, 2], [46, -33], [11, -32], [-25, -38], [-29, -10], [-29, 25], [-35, -9], [38, -18]])
  assert(reachable.has(`${x},${z}`), `Unreachable clue or puzzle: ${x},${z}`);
console.log('PASS: 8 fixed decorative ribbons + 5 sortable puzzle ribbons (1..5), order-free puzzles, item gates, ascending endgame sort, idempotence, persistence and rebuilt invalid saves, collision and enlarged-room reachability.');
