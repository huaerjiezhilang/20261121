import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, LockSimple, Plant, Crown, Key, Drop, Gift, Sparkle } from '@phosphor-icons/react';
import { clueTexts, PUZZLE_BOOKS, TABLET_QUESTIONS } from './puzzles';
import './puzzles.css';

// 数字隐喻：1、4、5 用圆点，2、3 用横线（线数=数字）。
const PIP_LAYOUT = {
  1: [[.5, .5]],
  4: [[.28, .28], [.72, .28], [.28, .72], [.72, .72]],
  5: [[.28, .28], [.72, .28], [.5, .5], [.28, .72], [.72, .72]],
};

export function RibbonGlyph({ n }) {
  if (n === 2 || n === 3) return <span className="ribbon-glyph glyph-bars">{Array.from({ length: n }, (_, i) => <i key={i} />)}</span>;
  const pips = PIP_LAYOUT[n] || [];
  return <span className="ribbon-glyph glyph-pips">{pips.map(([x, y], i) => <i key={i} style={{ left: `${x * 100}%`, top: `${y * 100}%` }} />)}</span>;
}

// 通用拖拽排序板：桌面鼠标拖动，手机手指拖动，轻点两次可交换。
function SortBoard({ order, onReorder, className = '', renderItem }) {
  const [drag, setDrag] = useState(-1);
  const [over, setOver] = useState(-1);
  const [picked, setPicked] = useState(-1);
  const refs = useRef([]);
  const start = useRef({ x: 0, y: 0 });
  const can = i => i >= 0 && i < order.length;
  function locate(e) {
    for (let i = 0; i < refs.current.length; i++) {
      const el = refs.current[i]; if (!el) continue;
      const r = el.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) return i;
    }
    return -1;
  }
  function down(i, e) {
    if (!can(i) || e.button > 0) return;
    e.preventDefault();
    start.current = { x: e.clientX, y: e.clientY };
    setDrag(i); setOver(i);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function move(e) {
    if (drag < 0) return;
    const i = locate(e);
    if (i >= 0 && can(i)) setOver(i);
  }
  function finish(e) {
    const d = drag, o = over;
    const dist = e ? Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) : 999;
    setDrag(-1); setOver(-1);
    if (d < 0) return;
    const swap = (a, b) => { const next = order.slice(); [next[a], next[b]] = [next[b], next[a]]; setPicked(-1); onReorder(next); };
    if (dist < 9) {
      if (picked < 0) setPicked(d);
      else if (picked === d) setPicked(-1);
      else if (can(picked) && can(d)) swap(picked, d);
      return;
    }
    if (o >= 0 && o !== d && can(o)) swap(d, o);
  }
  return <div className={`sort-board ${className}`} onPointerMove={move} onPointerUp={finish} onPointerCancel={() => { setDrag(-1); setOver(-1); }}>
    {order.map((value, i) => <div
      key={String(value)}
      ref={el => { refs.current[i] = el; }}
      className={`sort-item ${drag === i ? 'dragging' : ''} ${over === i && drag >= 0 ? 'over' : ''} ${picked === i ? 'picked' : ''}`}
      onPointerDown={e => down(i, e)}
      aria-label={`第 ${i + 1} 位`}
    >{renderItem(value, i)}</div>)}
  </div>;
}

export function PuzzlePanel({ id, state, onAttempt, onGift }) {
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState('');
  const [step, setStep] = useState(0);
  const [value, setValue] = useState('');
  const [answers, setAnswers] = useState([]);
  const solved = state.solved.includes(id);

  function attempt(input) {
    const result = onAttempt(id, input);
    setFeedback(result.message);
    return result;
  }
  function submitTablet(e) {
    e.preventDefault();
    const q = TABLET_QUESTIONS[step];
    if (value.trim() !== q.answer) { setFeedback('再想想，答案也许就在你身边。'); return; }
    const next = [...answers, value.trim()];
    setAnswers(next); setValue('');
    if (step + 1 < TABLET_QUESTIONS.length) { setStep(step + 1); setFeedback('答对了，还有一题。'); return; }
    attempt(next);
  }

  if (solved) return <>
    <span className="dialog-icon"><Gift size={44} /></span>
    <h2>彩带已经挂上墙了。</h2>
    <p className="puzzle-feedback" role="status">{feedback || '这根彩带一直在等你来发现。'}</p>
    <button className="primary" onClick={onGift}>看看这根彩带 <Sparkle size={18} /></button>
  </>;

  return <>
    <span className="dialog-eyebrow">小屋里的小机关</span>
    {id === 'drawer' && <>
      <span className="puzzle-emblem"><LockSimple size={38} /></span>
      <h2>约好的那个时间</h2>
      <p>抽屉上是一把三位数字锁。<br/>纸条写着：“时针在前，分钟在后。”</p>
      <form onSubmit={e => { e.preventDefault(); attempt(code); }}>
        <label className="code-label" htmlFor="drawer-code">三位密码</label>
        <input id="drawer-code" className="code-input" type="text" inputMode="numeric" autoComplete="off" pattern="[0-9]{3}" maxLength={3} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} placeholder="···" required />
        <button className="primary" type="submit">试着打开 <Key size={18} /></button>
      </form>
      <p className="puzzle-caption">{state.clues.includes('clock') ? '挂钟停在 1:19。' : '房间里那只停住的挂钟，也许留下了时间。'}</p>
    </>}
    {id === 'plant' && <>
      <span className="puzzle-emblem"><Plant size={40} /></span>
      <h2>它在等一小口水。</h2>
      <p>窗边的植物垂着叶子。<br/>花盆上写着：“请先照顾好我，再看叶子下面。”</p>
      <div className="item-requirement"><Drop size={20} />{state.items.includes('wateringCan') ? '口袋里有水壶，可以浇水。' : '需要一只水壶 · 到入口右侧的绿植角找找'}</div>
      <button className="primary" onClick={() => attempt()}>{state.items.includes('wateringCan') ? '轻轻浇一点水' : '试着照料它'} <Drop size={18} /></button>
    </>}
    {id === 'cat' && <>
      <span className="puzzle-emblem"><Crown size={40} /></span>
      <h2>给熙熙戴顶生日帽</h2>
      <p>{state.items.includes('hat') ? '你把生日帽举到熙熙头顶。' : '熙熙靠着墙睡在沙发旁。'}<br/>{state.items.includes('hat') ? '它眯着眼睛，好像在等你把帽子放下来。' : '它好像还缺一顶生日帽，帽子和它很配。'}</p>
      <div className="item-requirement"><Crown size={20} />{state.items.includes('hat') ? '生日帽已经在手里，可以给它戴上。' : '还没有帽子 · 到沙发上找找'}</div>
      <button className="primary" onClick={() => attempt()}>{state.items.includes('hat') ? '轻轻戴上帽子' : '摸摸熙熙'} <Crown size={18} /></button>
    </>}
    {id === 'tablet' && <>
      <span className="puzzle-emblem"><BookOpen size={38} /></span>
      <h2>平板上的两道题</h2>
      <p className="tablet-progress">{TABLET_QUESTIONS.map((q, i) => <span key={q.id} className={i < step ? 'done' : i === step ? 'now' : ''}>{i + 1}</span>)}</p>
      <p>{TABLET_QUESTIONS[step].prompt}<br/><small>{TABLET_QUESTIONS[step].hint}</small></p>
      <form onSubmit={submitTablet}>
        <label className="code-label" htmlFor="tablet-answer">你的答案</label>
        <input id="tablet-answer" className="text-input" type="text" autoComplete="off" value={value} onChange={e => setValue(e.target.value)} placeholder={step === 0 ? '夏天的水果…' : '六位数字…'} required />
        <button className="primary" type="submit">下一题 <Sparkle size={18} /></button>
      </form>
    </>}
    {feedback && <p className="puzzle-feedback" role="status">{feedback}</p>}
  </>;
}

// Lightweight/offline fallback only: in 3D the ribbons are dragged directly on the wall.
export function RibbonSortPanel({ state, onAttempt }) {
  const [order, setOrder] = useState(state.order);
  const [feedback, setFeedback] = useState('');
  const done = state.sorted;
  useEffect(() => { if (done) setOrder(state.order); }, [done, state.order]);
  function reorder(next) {
    setOrder(next);
    const result = onAttempt('ribbons', next);
    setFeedback(result.message);
  }
  return <>
    <span className="dialog-eyebrow">终局 · 把彩带排成一列</span>
    <h2>让数字从小到大</h2>
    <p>中间的五根彩带是 1、2、3、4、5 号。<br/>拖动它们，让整排读起来是从 1 到 5。</p>
    <SortBoard
      order={order}
      onReorder={reorder}
      className="ribbon-sort"
      renderItem={n => <span className="sort-ribbon" style={{ '--ribbon': `var(--ribbon-${n})` }}><RibbonGlyph n={n} /><small>{n}</small></span>}
    />
    <p className="puzzle-caption">{done ? '排好啦，礼盒已经解锁。' : '前后拖动交换位置；也可以先点一根，再点它想去的空位。'}</p>
    {feedback && <p className="puzzle-feedback" role="status">{feedback}</p>}
  </>;
}

// Lightweight/offline fallback only: in 3D the books are dragged on the shelves.
export function BookSortPanel({ state, onAttempt }) {
  const [shelves, setShelves] = useState(state.shelves);
  const [feedback, setFeedback] = useState('');
  function reorder(key, next) {
    const s = { ...shelves, [key]: next };
    setShelves(s);
    setFeedback(onAttempt('books', s).message);
  }
  const renderBook = id => {
    const b = PUZZLE_BOOKS.find(x => x.id === id);
    return <span className="sort-book" style={{ '--book': b.color, '--book-h': `${Math.round(30 + b.height * 80)}px` }}><span className="sort-book-spine" /></span>;
  };
  return <>
    <span className="dialog-eyebrow">书架 · 两层都要排好</span>
    <h2>让书从矮到高</h2>
    <p>第一层和第三层各拖动一次，让最矮的书站在最左边。</p>
    {[['first', '第一层'], ['third', '第三层']].map(([key, label]) => <div key={key} className="book-shelf-row"><small>{label}</small>
      <SortBoard order={shelves[key]} onReorder={n => reorder(key, n)} className="book-sort" renderItem={renderBook} />
    </div>)}
    {feedback && <p className="puzzle-feedback" role="status">{feedback}</p>}
  </>;
}

export function AlbumPanel({ album }) {
  return <>
    <span className="dialog-eyebrow">唱片机 · 一张专辑</span>
    <div className="album-card">
      <div className="album-cover"><span className="album-vinyl" /><b>一起去看<br/>音乐祭</b></div>
      <div className="album-meta">
        <h2>《{album.title}》</h2>
        <p className="album-artist">{album.artist} <span>{album.artistEn}</span></p>
        <p className="album-ip">IP 属地：{album.ip}</p>
      </div>
    </div>
  </>;
}

export function CluePanel({ id, onTake, taken }) {
  if (id === 'wateringCan') return <><span className="puzzle-emblem"><Drop size={42} /></span><h2>一只装好水的小水壶</h2><p>绿植架上留着一只水壶。<br/>吊牌上写着：“给窗边的绿植送一点水。”</p><button className="primary" onClick={onTake}>{taken ? '水壶已在口袋里' : '拿起水壶'} <Drop size={18} /></button></>;
  if (id === 'hat') return <><span className="puzzle-emblem"><Crown size={42} /></span><h2>沙发上的生日帽</h2><p>沙发角落落着一顶小小的生日帽。<br/>帽檐里写着：“给最爱睡觉的那位。”</p><button className="primary" onClick={onTake}>{taken ? '帽子已在口袋里' : '收起生日帽'} <Crown size={18} /></button></>;
  const clue = clueTexts[id];
  if (!clue) return null;
  return <><span className="dialog-eyebrow">你发现了一条线索</span><h2>{clue.title}</h2>{id === 'clock' && <div className="clock-reading">1 : 19</div>}<p className="clue-copy">{clue.text}</p></>;
}
