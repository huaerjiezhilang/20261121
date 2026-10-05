// 在这里修改彩带祝福和生日寄语。
export const birthday = {
  recipient: '软软宝宝',
  final: '希望20岁的你，\n能够勇敢地去做你认为正确的事，\n享受过程 永远自由。\n我会一直陪在你身边，\n和你一起去看音乐祭，一起去看世界。',
};

// 唱片机点开看到的专辑。
export const album = {
  title: '一起去看音乐祭',
  artist: '庸俗救星',
  artistEn: 'VulgarSavior',
  ip: '中国台湾',
};

// 五根彩带，分别藏在五个小机关后面。id 与 puzzles.js 中的谜题 id 对应。
export const gifts = [
  {
    id: 'cat', ribbon: 3, name: '彩带 3 · 戴上一点可爱', color: '#e6c076', icon: 'crown',
    place: '熟睡的小猫 熙熙',
    message: '给熙熙戴上帽子的瞬间，\n它眯起眼睛喵了一声。',
    detail: '一根印着三条横线的蜂蜜色彩带。',
  },
  {
    id: 'drawer', ribbon: 1, name: '彩带 1 · 时间的心意', color: '#c7957c', icon: 'lock',
    place: '矮柜的小抽屉',
    message: '抽屉里放着一小段停住的时间。',
    detail: '一根印着一个小圆点的陶土色彩带。',
  },
  {
    id: 'tablet', ribbon: 5, name: '彩带 5 · 关于JYY', color: '#d7a294', icon: 'device',
    place: '阅读桌上的平板',
    message: '你答对了全部，也答应要一起过下一个夏天，下一个生日。',
    detail: '一根印着五颗圆点的粉色彩带。',
  },
  {
    id: 'plant', ribbon: 2, name: '彩带 2 · 慢慢长大', color: '#b4bb8e', icon: 'plant',
    place: '窗边的绿植',
    message: '浇过水的叶子舒展开来。\n愿你也按自己的速度生长，\n不必着急开花。',
    detail: '一根印着两条横线的鼠尾草色彩带。',
  },
  {
    id: 'books', ribbon: 4, name: '彩带 4 · 从矮到高', color: '#a8bcb0', icon: 'book',
    place: '书架里的书',
    message: '书按高矮站好队，\n像把心里的话也理顺了。',
    detail: '一根印着四颗圆点的湖蓝色彩带。',
  },
];
