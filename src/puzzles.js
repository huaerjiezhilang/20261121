export const PUZZLE_STORAGE = 'birthday-little-room-v2';

// ---------------------------------------------------------------------------
// 生日彩带主题
// ---------------------------------------------------------------------------
// 墙上原本就挂着 8 条彩带：只做装饰，没有数字，也不能移动。
// 中间留出 5 个位置，放 5 个谜题解锁的彩带，编号 1~5。
// 1、4、5 号用圆点表示，2、3 号用横线表示。
// 集齐后，玩家在墙上直接拖动这 5 根彩带，把它们按 1~5 从小到大排好。
export const DECOR_RIBBONS = 8;
export const SORT_SLOTS = 5;
export const RIBBON_NUMBERS = [1, 2, 3, 4, 5];
export const LINE_RIBBONS = [2, 3];  // 用横线表示的数字
export const REWARD_START_SLOT = { 1: 3, 2: 0, 3: 4, 4: 1, 5: 2 }; // 彩带号 -> 中间位置 0..4
export const RIBBON_COLORS = { 1: '#c7957c', 2: '#b4bb8e', 3: '#e6c076', 4: '#a8bcb0', 5: '#d7a294' };
export const DECOR_COLORS = ['#e6c076', '#b4bb8e', '#d7a294', '#93ab88', '#c7957c', '#a8bcb0', '#d8b16b', '#d6b28a'];

export const PUZZLE_IDS = ['drawer', 'plant', 'cat', 'books', 'tablet'];
export const PUZZLE_REWARDS = { drawer: 1, plant: 2, cat: 3, books: 4, tablet: 5 };

export const extraObjects = [
  { id: 'clock', place: '停住的挂钟' },
  { id: 'wateringCan', place: '绿植角的水壶' },
  { id: 'hat', place: '沙发上的生日帽' },
];

export const clueTexts = {
  clock: {
    title: '留住的下午',
    text: '挂钟停在 1 点 19 分。这是什么特别的数字？',
  },
};

// 书架谜题：第一层和第三层各有 6 本可拖动的书，要从矮到高排好；
// 第二层保留原版的样子：三本同样高的书。
export const PUZZLE_BOOKS = [
  { id: 'b1', height: .42, color: '#d7a294' },
  { id: 'b2', height: .5, color: '#e6c495' },
  { id: 'b3', height: .58, color: '#93ab88' },
  { id: 'b4', height: .66, color: '#a4b39c' },
  { id: 'b5', height: .74, color: '#bd8871' },
  { id: 'b6', height: .82, color: '#d8b16b' },
];
export const BOOK_ORDER = PUZZLE_BOOKS.map(b => b.id); // 正确顺序：从矮到高
export const BOOK_START_FIRST = ['b4', 'b1', 'b6', 'b3', 'b5', 'b2']; // 第一层初始打乱
export const BOOK_START_THIRD = ['b5', 'b2', 'b3', 'b1', 'b6', 'b4']; // 第三层初始打乱
export const MIDDLE_BOOK_COLORS = ['#d7a294', '#93ab88', '#d8b16b'];
export const MIDDLE_BOOK_HEIGHT = .7;

// 平板谜题：两道题依次作答。
export const TABLET_QUESTIONS = [
  { id: 'fruit', prompt: '夏天最喜欢的水果是什么？', hint: '圆圆的、红瓤、多汁，还很解暑。', answer: '西瓜' },
  { id: 'birth', prompt: '生日？', answer: '061203' },
];

const BOOK_IDS = PUZZLE_BOOKS.map(b => b.id);

function validShelf(order) {
  return Array.isArray(order) && order.length === BOOK_IDS.length && BOOK_IDS.every(id => order.includes(id));
}

function shelvesSorted(shelves) {
  return !!shelves && validShelf(shelves.first) && validShelf(shelves.third)
    && JSON.stringify(shelves.first) === JSON.stringify(BOOK_ORDER)
    && JSON.stringify(shelves.third) === JSON.stringify(BOOK_ORDER);
}

export function emptyPuzzles() {
  return {
    solved: [], items: [], clues: [], order: Array(SORT_SLOTS).fill(null), sorted: false,
    shelves: { first: [...BOOK_START_FIRST], third: [...BOOK_START_THIRD] },
  };
}

function rebuildOrder(solved) {
  const order = Array(SORT_SLOTS).fill(null);
  for (const id of solved) {
    const n = PUZZLE_REWARDS[id];
    if (n != null) order[REWARD_START_SLOT[n]] = n;
  }
  return order;
}

function expectedNumbers(solved) {
  const set = new Set();
  for (const id of solved) if (PUZZLE_REWARDS[id] != null) set.add(PUZZLE_REWARDS[id]);
  return set;
}

function validArrangement(solved, order) {
  if (!Array.isArray(order) || order.length !== SORT_SLOTS) return false;
  const expected = expectedNumbers(solved);
  const seen = new Set();
  for (const v of order) {
    if (v == null) continue;
    if (!RIBBON_NUMBERS.includes(v) || seen.has(v) || !expected.has(v)) return false;
    seen.add(v);
  }
  return seen.size === expected.size;
}

export function isAscending(order) {
  return Array.isArray(order) && order.length === SORT_SLOTS && order.every((v, i) => v === i + 1);
}

export function collectedCount(state) {
  return Array.isArray(state?.solved) ? state.solved.filter(id => PUZZLE_IDS.includes(id)).length : 0;
}

export function allCollected(state) {
  return collectedCount(state) === PUZZLE_IDS.length;
}

export function normalizePuzzles(value = {}) {
  const list = (key, allow) => Array.isArray(value?.[key]) ? [...new Set(value[key].filter(v => allow.includes(v)))] : [];
  const solved = list('solved', PUZZLE_IDS);
  const items = list('items', ['wateringCan', 'hat']);
  const clues = list('clues', Object.keys(clueTexts));
  const rawOrder = Array.isArray(value?.order) ? value.order : null;
  const order = rawOrder && validArrangement(solved, rawOrder) ? rawOrder.slice() : rebuildOrder(solved);
  const sorted = value?.sorted === true && isAscending(order);
  const rawShelves = value?.shelves;
  const shelves = {
    first: validShelf(rawShelves?.first) ? rawShelves.first.slice() : [...BOOK_START_FIRST],
    third: validShelf(rawShelves?.third) ? rawShelves.third.slice() : [...BOOK_START_THIRD],
  };
  return { solved, items, clues, order, sorted, shelves };
}

function placeReward(state, id) {
  const n = PUZZLE_REWARDS[id];
  if (n == null || state.order.includes(n)) return;
  const slot = REWARD_START_SLOT[n];
  if (slot != null && state.order[slot] == null) state.order[slot] = n;
  else {
    const free = state.order.indexOf(null);
    if (free >= 0) state.order[free] = n;
  }
}

export function attemptPuzzle(state, id, input) {
  const next = {
    solved: [...state.solved],
    items: [...state.items],
    clues: [...state.clues],
    order: Array.isArray(state.order) && state.order.length === SORT_SLOTS ? [...state.order] : rebuildOrder(state.solved),
    sorted: !!state.sorted,
    shelves: validShelf(state.shelves?.first) && validShelf(state.shelves?.third)
      ? { first: [...state.shelves.first], third: [...state.shelves.third] }
      : { first: [...BOOK_START_FIRST], third: [...BOOK_START_THIRD] },
  };
  const add = (key, value) => { if (!next[key].includes(value)) next[key].push(value); };
  const done = (message, extra = {}) => ({ state: next, changed: true, success: true, message, ...extra });
  const fail = message => ({ state, changed: false, success: false, message });
  const progress = message => ({ state: next, changed: true, success: false, message });

  if (id === 'clock') { add('clues', 'clock'); return done('线索已经记下：挂钟停在 1:19。'); }
  if (id === 'wateringCan') { add('items', 'wateringCan'); return done('拿到水壶了。去后窗边给那盆垂着叶子的植物浇一点水吧。'); }
  if (id === 'hat') { add('items', 'hat'); return done('拿到生日帽了。给靠墙熟睡的熙熙戴上试试。'); }

  if (PUZZLE_IDS.includes(id) && next.solved.includes(id)) return done('这根彩带已经亮起来了。', { ribbon: PUZZLE_REWARDS[id] });

  if (id === 'drawer') {
    if (String(input).trim() !== '119') return fail('锁扣没有弹开。看看挂钟停在几点几分，时针在前，分钟在后。');
    add('solved', 'drawer'); placeReward(next, 'drawer');
    return done('咔哒。抽屉弹开，第 1 根彩带亮了起来。', { ribbon: 1 });
  }
  if (id === 'plant') {
    if (!next.items.includes('wateringCan')) return fail('手边还没有水壶。入口右侧的绿植角有一只。');
    add('solved', 'plant'); placeReward(next, 'plant');
    return done('叶子舒展开了，第 2 根彩带从叶间掉出。', { ribbon: 2 });
  }
  if (id === 'cat') {
    if (!next.items.includes('hat')) return fail('熙熙还在打呼噜。先找到生日帽，再轻轻给它戴上。');
    add('solved', 'cat'); placeReward(next, 'cat');
    return done('熙熙戴上帽子，满意地喵了一声，露出大屁屁后的第 3 根彩带。', { ribbon: 3 });
  }
  if (id === 'books') {
    const first = input?.first, third = input?.third;
    if (!validShelf(first) || !validShelf(third)) return fail('书架还理不清。');
    next.shelves = { first: [...first], third: [...third] };
    if (!shelvesSorted(next.shelves)) return progress('还差一点：第一层和第三层都要从矮到高排好。');
    add('solved', 'books'); placeReward(next, 'books');
    return done('两层的书都从矮到高排好了，第 4 根彩带从书脊后滑出。', { ribbon: 4 });
  }
  if (id === 'tablet') {
    const answers = Array.isArray(input) ? input : [];
    if (!answers.length) return fail('两道题都答对，平板才会亮起来。');
    if (String(answers[0]).trim() !== TABLET_QUESTIONS[0].answer) return fail('第一题不对哦。再想想。');
    if (String(answers[1]).trim() !== TABLET_QUESTIONS[1].answer) return fail('第二题不对哦。再想想，是六位数字。');
    add('solved', 'tablet'); placeReward(next, 'tablet');
    return done('两道题都答对了，第 5 根彩带藏在平板后面，被你发现啦~', { ribbon: 5 });
  }
  if (id === 'ribbons') {
    if (!validArrangement(next.solved, input)) return fail('这些彩带还理不清。');
    next.order = input.slice();
    if (isAscending(next.order)) { next.sorted = true; return done('彩带按 1 到 5 排好了！中央的礼盒轻轻解锁。', { sorted: true }); }
    return progress('顺序还不对。让数字从左到右一点点变大。');
  }
  return fail('这里暂时没有可以操作的机关。');
}
