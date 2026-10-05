import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { House, Gift, SpeakerHigh, SpeakerSlash, Question, ArrowRight, ArrowCounterClockwise, X, Heart, BookOpen, Plant, MusicNotes, Sparkle, Check, Plus, Mouse, Hand, Cake, Sun, Footprints, Crown, DeviceMobile, LockSimple, Confetti } from '@phosphor-icons/react';
import { createRoom } from './room';
import { createAudio } from './audio';
import { LandscapeViewport, useRotatedLandscape } from './landscape';
import { MovementJoystick } from './MovementJoystick';
import { birthday, gifts, album } from './content';
import { PUZZLE_STORAGE, extraObjects, normalizePuzzles, emptyPuzzles, attemptPuzzle, PUZZLE_IDS, allCollected as isAllCollected } from './puzzles';
import { PuzzlePanel, CluePanel, RibbonSortPanel, BookSortPanel, AlbumPanel, RibbonGlyph } from './PuzzlePanel';
import './style.css';
import './first-person.css';
import './doodle.css';
import './handwriting.css';
import './mobile-landscape.css';
import './joystick.css';

const icons={crown:Crown,lock:LockSimple,device:DeviceMobile,plant:Plant,book:BookOpen};
const STORAGE=PUZZLE_STORAGE;
const offline=import.meta.env.MODE==='minitool';
const giftById=id=>gifts.find(g=>g.id===id);
const FW_COLORS=['#f7c873','#e88a8a','#8fc0e8','#a8d29a','#d9a6d0','#f0b46a'];
const FIREWORK_PARTICLES=[[16,32],[34,22],[52,38],[70,24],[84,40],[62,56],[44,52]].flatMap(([x,y],b)=>Array.from({length:14},(_,i)=>{const a=i/14*Math.PI*2,r=54+(i%3)*16;return {x,y,dx:Math.round(Math.cos(a)*r),dy:Math.round(Math.sin(a)*r),c:FW_COLORS[b%FW_COLORS.length],delay:+((i%14)*.015+b*.16).toFixed(3)};}));
function readProgress(){
  try {
    const p=JSON.parse(localStorage.getItem(STORAGE)||'{}')||{},puzzles=normalizePuzzles(p.puzzles);
    const done=isAllCollected(puzzles);
    return {wished:done&&!!p.wished,cakeOpened:done&&!!(p.cakeOpened||p.wished),puzzles};
  } catch { return {wished:false,cakeOpened:false,puzzles:emptyPuzzles()}; }
}

function Dialog({children,onClose,label,className=''}) {
  const ref=useRef(),backdropPress=useRef(false),rotated=useRotatedLandscape(),onCloseRef=useRef(onClose);onCloseRef.current=onClose;
  useEffect(()=>{
    const previous=document.activeElement,dialog=ref.current;
    if(!rotated)dialog.showModal();else{dialog.setAttribute('open','');dialog.querySelector('button,input')?.focus();}
    const key=e=>{if(!rotated)return;if(e.key==='Escape'){e.preventDefault();onCloseRef.current();}if(e.key==='Tab'){const items=Array.from(dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),[tabindex="0"]')),first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};
    document.addEventListener('keydown',key);
    return ()=>{document.removeEventListener('keydown',key);dialog.close();previous?.focus?.();};
  },[rotated]);
  return <>{rotated&&<div className="landscape-modal-backdrop" onPointerDown={()=>{backdropPress.current=true;}} onClick={()=>{if(backdropPress.current)onClose();backdropPress.current=false;}}/>}
    <dialog ref={ref} role="dialog" aria-modal="true" className={`dialog ${rotated?'landscape-modal':''} ${className}`} aria-label={label} onCancel={e=>{e.preventDefault();onClose();}} onPointerDown={e=>{backdropPress.current=e.target===e.currentTarget;}} onClick={e=>{if(backdropPress.current&&e.target===e.currentTarget){backdropPress.current=false;const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose();}}}>
      <button className="close-button icon-button" aria-label="关闭" onClick={onClose}><X size={20}/></button>{children}
    </dialog></>;
}


function App(){
  const [flatMode,setFlatMode]=useState(false);
  const [saved]=useState(readProgress);
  const [wished,setWished]=useState(saved.wished),[cakeOpened,setCakeOpened]=useState(saved.cakeOpened);
  const [puzzles,setPuzzles]=useState(saved.puzzles),[clueId,setClueId]=useState('clock');
  const [modal,setModal]=useState(null),[activeGift,setActiveGift]=useState(null);
  const [mode,setMode]=useState({active:false,locked:false}),[focus,setFocus]=useState('');
  const [sound,setSound]=useState(false),[ready,setReady]=useState(false),[error,setError]=useState('');
  const [fireworks,setFireworks]=useState(false);
  const [musicTrack,setMusicTrack]=useState('ambient');
  const [lightsOn,setLightsOn]=useState(true),[revealing,setRevealing]=useState(false);
  const revealingRef=useRef(false);
  const roomHost=useRef(),room=useRef(),markers=useRef({}),audio=useRef(),selectRef=useRef(),ribbonsRef=useRef(),booksRef=useRef(),fwTimer=useRef();
  const reduced=useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const found=PUZZLE_IDS.filter(id=>puzzles.solved.includes(id));
  const allCollected=found.length===gifts.length,unlocked=puzzles.sorted;
  function select(id){
    if(revealingRef.current)return;
    if(id==='lightSwitch'){if(flatMode)setLightsOn(value=>!value);else room.current?.toggleLights();return;}
    if(id==='ribbons'){
      if(!allCollected)return;
      if(flatMode){setModal('ribbons');return;}
      return;
    }
    if(id==='cake'){
      if(!allCollected)return;
      if(!unlocked)return;
      revealingRef.current=true;setRevealing(true);room.current?.setPaused(true);
      audio.current?.playBirthday().catch(()=>{});
      if(flatMode)setLightsOn(false);
      (room.current?room.current.revealCake():Promise.resolve(true)).then(done=>{revealingRef.current=false;setRevealing(false);if(done){setCakeOpened(true);setModal(wished?'final':'wish');}});
      return;
    }
    if(id==='books'){
      if(puzzles.solved.includes('books')){setActiveGift(giftById('books'));setModal('gift');return;}
      if(flatMode){setActiveGift(giftById('books'));setModal('books');return;}
      return;
    }
    if(id==='cat'){
      if(puzzles.solved.includes('cat')){setActiveGift(giftById('cat'));setModal('gift');return;}
      if(!puzzles.items.includes('hat'))return; // 没拿生日帽之前，不能和猫交互
      setActiveGift(giftById('cat'));setModal('puzzle');return;
    }
    if(id==='plant'){
      if(puzzles.solved.includes('plant')){setActiveGift(giftById('plant'));setModal('gift');return;}
      if(!puzzles.items.includes('wateringCan'))return; // 没拿浇水壶之前，不能和窗边植物交互
      setActiveGift(giftById('plant'));setModal('puzzle');return;
    }
    if(id==='music'){setModal('album');return;}
    if(extraObjects.some(o=>o.id===id)){setClueId(id);if(id==='clock')handleAttempt('clock');setModal('clue');return;}
    if(PUZZLE_IDS.includes(id)){const g=giftById(id);if(!g)return;setActiveGift(g);setModal(puzzles.solved.includes(id)?'gift':'puzzle');return;}
  }
  selectRef.current=select;
  ribbonsRef.current=order=>handleAttempt('ribbons',order);
  booksRef.current=shelves=>handleAttempt('books',shelves);
  useEffect(()=>{
    audio.current=createAudio({onState:state=>{setSound(state.playing);setMusicTrack(state.track);room.current?.setRecordPlaying(state.playing&&state.track==='birthday');}});
    const sceneError=message=>{setError(message);if(offline){setFlatMode(true);setReady(true);setMode({active:true,locked:false});}};
    try{if(offline){const probe=document.createElement('canvas'),gl=probe.getContext('webgl2');if(!gl)throw new Error('WebGL2 unavailable');gl.getExtension('WEBGL_lose_context')?.loseContext();}room.current=createRoom(roomHost.current,{onSelect:id=>selectRef.current(id),onReady:()=>setReady(true),onError:sceneError,onMode:setMode,onFocus:setFocus,onLights:setLightsOn,onRibbonsChange:order=>ribbonsRef.current?.(order),onBooksChange:shelves=>booksRef.current?.(shelves),markerElements:markers.current,reducedMotion:reduced.current});}
    catch(e){if(!offline)console.error(e);sceneError('这台设备暂时无法显示 3D 小屋。');}
    return ()=>{room.current?.dispose();audio.current?.dispose();};
  },[]);
  useEffect(()=>{if(flatMode){room.current?.dispose();room.current=null;revealingRef.current=false;setRevealing(false);}},[flatMode]);
  useEffect(()=>{try{localStorage.setItem(STORAGE,JSON.stringify({found,wished,cakeOpened,puzzles}));}catch{}room.current?.setPuzzleState(puzzles);},[found,wished,cakeOpened,puzzles]);
  useEffect(()=>{room.current?.restoreCake(cakeOpened,wished);},[cakeOpened,wished]);
  useEffect(()=>{room.current?.setPaused(!!modal||revealing);},[modal,revealing]);
  useEffect(()=>()=>clearTimeout(fwTimer.current),[]);
  async function toggleSound(){try{if(sound){audio.current.stop();}else{await audio.current.start();}}catch{}}
  function handleAttempt(id,input){
    const result=attemptPuzzle(puzzles,id,input);
    if(result.changed)setPuzzles(result.state);
    if(result.success){
      audio.current?.chime();
      // 解开一个新机关：自动弹出"获得彩带"的弹窗
      if(result.ribbon!=null&&PUZZLE_IDS.includes(id)&&!puzzles.solved.includes(id)){const g=giftById(id);if(g){setActiveGift(g);setModal('gift');}}
      // 所有彩带排好：放烟花
      if(result.sorted){setFireworks(true);clearTimeout(fwTimer.current);fwTimer.current=setTimeout(()=>setFireworks(false),4600);}
    }
    return result;
  }
  function restart(){audio.current?.reset();setWished(false);setCakeOpened(false);setRevealing(false);setLightsOn(true);revealingRef.current=false;setPuzzles(emptyPuzzles());setModal(null);room.current?.reset();}
  const GiftIcon=activeGift?icons[activeGift.icon]:Gift;
  const birthdayPlayer=<div className="birthday-player" role="group" aria-label="生日唱片播放控制"><MusicNotes size={25}/><span>祝你生日快乐<small>八音盒纯音乐 · 身旁的唱片机</small></span><button onClick={toggleSound} aria-label={sound?'暂停生日音乐':'播放生日音乐'}>{sound?'暂停':'播放'}</button></div>;
  return <main data-lights-on={String(lightsOn)} data-revealing={String(revealing)} data-cake-opened={String(cakeOpened)} data-music-track={musicTrack} data-music-playing={String(sound)} className={`app-shell immersive ${flatMode?'flat-exploration':''} ${mode.active?'is-exploring':''} ${mode.locked?'mouse-locked':''} ${revealing?'is-revealing':''} ${!lightsOn?'candle-night':''}`}>
    <section className="first-person-world" aria-label="第一人称房间探索">
      <div className="room-stage" ref={roomHost}>
        {gifts.map(g=>{const locked=!puzzles.solved.includes(g.id)&&((g.id==='cat'&&!puzzles.items.includes('hat'))||(g.id==='plant'&&!puzzles.items.includes('wateringCan')));return <button key={g.id} ref={el=>{if(el)markers.current[g.id]=el;}} className={`hotspot ${found.includes(g.id)?'discovered':''}`} aria-label={`探索${g.place}`} data-gift={g.id} disabled={!ready || !!error || locked} onClick={()=>room.current?.selectMarker(g.id)} style={{display:locked?'none':undefined,visibility:'hidden',opacity:mode.active&&ready&&!error?1:0}}><span className="hotspot-core">{found.includes(g.id)?<Check size={12} weight="bold"/>:<Plus size={13} weight="bold"/>}</span></button>;})}
        {extraObjects.map(o=><button key={o.id} ref={el=>{if(el)markers.current[o.id]=el;}} className="hotspot" data-object={o.id} aria-label={`探索${o.place}`} disabled={!ready||!!error} onClick={()=>room.current?.selectMarker(o.id)} style={{visibility:'hidden',opacity:mode.active&&ready&&!error?1:0}}><span className="hotspot-core"><Sparkle size={14}/></span></button>)}
        <button ref={el=>{if(el)markers.current.ribbons=el;}} className={`hotspot ribbons-hotspot ${allCollected?'ribbons-ready':''}`} data-object="ribbons" style={{visibility:'hidden',opacity:mode.active&&ready&&!error?1:0}} aria-label={unlocked?'墙上的彩带已排好':'墙上的生日彩带'} disabled={!ready || !!error} onClick={()=>room.current?.selectMarker('ribbons')}><span className="hotspot-core"><Confetti size={14}/></span></button>
        <button ref={el=>{if(el)markers.current.cake=el;}} className={`hotspot cake-hotspot ${unlocked?'cake-ready':''}`} style={{visibility:'hidden',opacity:mode.active&&ready&&!error?1:0}} aria-label={cakeOpened?'生日蛋糕':unlocked?'生日惊喜礼盒':'锁住的礼盒'} disabled={!ready || !!error} onClick={()=>room.current?.selectMarker('cake')}><span className="hotspot-core"><Cake size={15}/></span></button>
        <button ref={el=>{if(el)markers.current.lightSwitch=el;}} className="hotspot" data-object="lightSwitch" aria-label={lightsOn?'关闭室内灯光':'打开室内灯光'} aria-pressed={lightsOn} style={{visibility:'hidden',opacity:mode.active&&ready&&!error?1:0}} onClick={()=>room.current?.selectMarker('lightSwitch')}><span className="hotspot-core"><Sun size={15}/></span></button>
        <button ref={el=>{if(el)markers.current.music=el;}} className="hotspot" data-object="music" aria-label="探索唱片机" style={{visibility:'hidden',opacity:mode.active&&ready&&!error?1:0}} onClick={()=>room.current?.selectMarker('music')}><span className="hotspot-core"><MusicNotes size={14}/></span></button>
        {!ready&&!error&&<div className="loading"><House size={34} weight="duotone"/><span>正在把阳光装进小屋…</span></div>}
        {error&&!flatMode&&<div className="scene-error"><House size={36}/><h2>小屋还没能打开</h2><p>{error}</p><button className="primary" onClick={()=>location.reload()}>重新加载</button></div>}
      </div>
      <div className="view-shade" aria-hidden="true"/>
      {mode.active&&!modal&&!revealing&&<div className={`crosshair ${focus?'has-target':''}`} aria-hidden="true"/>}
      {mode.active&&!modal&&!revealing&&focus==='cake'&&<div className="interaction-prompt" aria-live="polite"><span>{unlocked?'打开生日惊喜礼盒':'礼盒还锁着 · 先排好彩带'}</span></div>}
    </section>
    {flatMode&&<section className="flat-room" aria-label="轻量探索"><h2>小屋里的心意，都还在。</h2><p>已切换为轻量探索。点击物品寻找线索，解开机关。</p><div className="flat-room-grid">{[...extraObjects,...gifts,{id:'ribbons',place:unlocked?'排好的彩带':'墙上的生日彩带'},{id:'lightSwitch',place:lightsOn?'关闭灯光':'打开灯光'},{id:'cake',place:cakeOpened?'生日蛋糕':unlocked?'生日惊喜礼盒':'锁住的礼盒'}].map(object=><button key={object.id} onClick={()=>select(object.id)}>{found.includes(object.id)?'✓ ':''}{object.place}</button>)}</div></section>}

    <header className="header fps-header" inert={revealing?true:undefined}>
      <a className="brand" href="#" onClick={e=>{e.preventDefault();room.current?.resetView();}} aria-label="回到房间门口"><span className="brand-mark"><House weight="duotone" size={25}/><Heart weight="fill" size={10}/></span><span>软软的生日小屋<small>A LITTLE ROOM FOR TRAVIS</small></span></a>
      <div className="header-note"><Sun size={17}/>{lightsOn?'午后 · 客厅':'月光入窗 · 小屋依然温柔'}</div>
      <nav aria-label="小屋工具"><button className="top-button sound-toggle" onClick={toggleSound} aria-pressed={sound}>{sound?<SpeakerHigh size={19}/>:<SpeakerSlash size={19}/>}<span>{sound?'音乐已开启':'开启音乐'}</span></button><button className="icon-button help-button" aria-label="玩法说明" onClick={()=>setModal('help')}><Question size={23}/></button></nav>
    </header>

    {!mode.active&&<section className="entry-card" aria-label="进入小屋">
      <span className="entry-eyebrow"><Footprints size={17}/> 第一人称 · 自由探索</span>
      <h1>门开着，<br/>就等你了。</h1>
      <p>房间大了一点，秘密也多了一点。<br/>解开机关，收下藏在小屋里的祝福。</p>
      <button className="primary" disabled={!ready||!!error} onClick={()=>room.current?.enter()}>走进小屋 <ArrowRight size={19}/></button>
      <div className="entry-help"><span>W A S D 行走 · 鼠标转头</span><span>手机：拖动轮盘行走 · 滑动转头</span></div>
    </section>}

    {mode.active&&<>
      <aside className="explore-status"><span className="room-pill"><span/> 生日寻宝进行中</span><p>已解开 {puzzles.solved.length} / 5 个小机关 · 彩带 {found.length} / 5</p></aside>
      <div className="walk-guide"><span><kbd>W A S D</kbd> 行走</span><span><Mouse size={16}/> {mode.locked?'移动鼠标转头':'按住画面拖动转头'}</span><span><kbd>E</kbd> 互动</span><span><kbd>Esc</kbd> 释放鼠标</span></div>
      <MovementJoystick disabled={revealing||!!modal} onMove={(x,z)=>room.current?.setMove(x,z)}/>
      <button className="touch-interact" disabled={!focus} aria-label="与面前的物品互动" onClick={()=>room.current?.interact()}><Hand size={22}/><span>互动</span></button>
    </>}
    <div className="fps-toolbar" inert={revealing?true:undefined}>
      <button className="top-button collection-toggle" onClick={()=>setModal('collection')}><Gift size={19}/><span>生日彩带</span><b>{found.length} / 5</b></button>
      <button className="icon-button" aria-label="回到门口" onClick={()=>room.current?.resetView()}><ArrowCounterClockwise size={19}/></button>
      {mode.active&&!mode.locked&&<button className="top-button capture-button" onClick={()=>room.current?.enter()}><Mouse size={18}/><span>鼠标跟随</span></button>}
    </div>

    {revealing&&<div className="cake-reveal-caption" role="status"><span>最后一份惊喜，正在打开</span><p>把灯光留给烛火，把今天留给你。</p></div>}
    {modal==='puzzle'&&activeGift&&<Dialog label={`${activeGift.place}的机关`} className="puzzle-dialog" onClose={()=>setModal(null)}><PuzzlePanel key={activeGift.id} id={activeGift.id} state={puzzles} onAttempt={handleAttempt} onGift={()=>setModal('gift')}/></Dialog>}
    {modal==='ribbons'&&<Dialog label="彩带排序" className="puzzle-dialog" onClose={()=>setModal(null)}><RibbonSortPanel state={puzzles} onAttempt={handleAttempt}/></Dialog>}
    {modal==='books'&&<Dialog label="书架排序" className="puzzle-dialog" onClose={()=>setModal(null)}><BookSortPanel state={puzzles} onAttempt={handleAttempt}/></Dialog>}
    {modal==='clue'&&<Dialog label="发现线索" className="puzzle-dialog" onClose={()=>setModal(null)}><CluePanel id={clueId} taken={clueId==='wateringCan'?puzzles.items.includes('wateringCan'):puzzles.items.includes('hat')} onTake={()=>{handleAttempt(clueId);setModal(null);}}/></Dialog>}
    {modal==='album'&&<Dialog label="唱片专辑" className="puzzle-dialog album-dialog" onClose={()=>setModal(null)}><AlbumPanel album={album}/></Dialog>}

    {modal==='collection'&&<Dialog label="生日彩带" onClose={()=>setModal(null)} className="pocket-dialog"><span className="dialog-icon"><Gift size={36}/></span><h2>生日彩带</h2><p className="progress-number"><b>{found.length}</b> / 5</p><div className="pocket-list">{gifts.map(g=>{const has=found.includes(g.id);return <button key={g.id} disabled={!has} onClick={()=>select(g.id)} aria-label={has?`查看${g.name}`:`还没找到的${g.name}`}><span className="pocket-icon">{has?<span className="pocket-ribbon" style={{'--ribbon':g.color}}><RibbonGlyph n={g.ribbon}/></span>:<Gift size={24}/>}</span><span><b>{has?g.name:'还没有找到的彩带'}</b><small>{has?'已收好':'解开对应的机关就会亮起'}</small></span>{has?<Check size={17}/>:<ArrowRight size={17}/>}</button>;})}</div><button className="secondary" onClick={()=>setModal('reset')}>重新探索</button></Dialog>}
    {modal==='gift'&&activeGift&&<Dialog label={activeGift.name} onClose={()=>setModal(null)} className="gift-dialog">
      <span className="dialog-eyebrow">一根被你找到的生日彩带</span>
      <div className="gift-art is-open" style={{'--gift-color':activeGift.color}}><span className="gift-ribbon-big" style={{'--ribbon':activeGift.color}}><RibbonGlyph n={activeGift.ribbon}/><small>{activeGift.ribbon}</small></span></div>
      <h2>{activeGift.name}</h2>
      <p className="gift-message">{activeGift.message}</p>
      <p className="gift-detail">{activeGift.detail}</p>
      <button className="primary" onClick={()=>setModal(null)}>收好这根彩带 <Check size={17}/></button>
    </Dialog>}
    {modal==='help'&&<Dialog label="怎么玩" onClose={()=>setModal(null)}><span className="dialog-icon"><House size={34} weight="duotone"/></span><h2>在小屋里，慢慢逛。</h2><div className="help-list"><p><Hand size={24}/><span><b>换个角度看看</b>WASD 行走，鼠标转头；Esc 释放鼠标。也可拖动画面转头，用方向键前后行走、左右转头。</span></p><p><Gift size={24}/><span><b>探索机关</b>走近家具，用准星对准后按 E，或点击出现的小圆点。手机拖动轮盘走动，滑动右侧画面转头，点「互动」探索面前物品。</span></p><p><LockSimple size={24}/><span><b>找到彩带并排序</b>伴随着烟花绽放，中央礼盒就会解锁。</span></p><p><Cake size={24}/><span><b>许个愿吧</b>门旁的小开关可以开关室内灯光。彩带排好后打开茶几上的礼盒，欣赏蛋糕出场、在月光与烛光中许愿。吹灭蜡烛后，室内灯会重新亮起。进度自动保存在当前浏览器。</span></p></div><button className="primary" onClick={()=>setModal(null)}>知道啦，去逛逛 <ArrowRight size={18}/></button></Dialog>}
    {modal==='wish'&&<Dialog className="candle-wish" label="许一个生日愿望" onClose={()=>setModal(null)}><span className="dialog-icon cake-icon"><Cake size={64} weight="duotone"/></span><span className="dialog-eyebrow">五根彩带，和好多好多的喜欢</span><h2>现在，把时间留给你。</h2><p className="wish-copy">闭上眼睛，悄悄许一个愿望。<br/>不用说出来，我们也会陪它慢慢实现。</p>{birthdayPlayer}<button className="primary" onClick={()=>{setWished(true);setLightsOn(true);room.current?.celebrate();setModal('final');}}>许好啦，吹灭蜡烛 <Sparkle size={19}/></button></Dialog>}
    {modal==='final'&&<Dialog label="生日快乐" onClose={()=>setModal(null)} className="final-dialog"><div className="confetti" aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} style={{'--i':i,'--x':`${(i*43)%100}%`,'--c':['#b3c29d','#d6a485','#e6c277','#b3b9cf'][i%4]}}/>)}</div><span className="dialog-icon"><Heart size={50} weight="duotone"/></span><span className="dialog-eyebrow">HAPPY BIRTHDAY TO YOU</span><h2>{birthday.recipient}，生日快乐。</h2><p className="gift-message">{birthday.final}</p>{birthdayPlayer}<button className="primary" onClick={()=>setModal(null)}>再在小屋待一会儿 <House size={18}/></button></Dialog>}
    {modal==='reset'&&<Dialog label="重新探索" onClose={()=>setModal(null)}><span className="dialog-icon"><ArrowCounterClockwise size={32}/></span><h2>再收一次生日惊喜？</h2><p>这会清空当前浏览器的彩带进度。<br/>小屋里的祝福，会回到原来的地方等你。</p><div className="dialog-actions"><button className="secondary" onClick={()=>setModal(null)}>保留进度</button><button className="primary" onClick={restart}>重新开始</button></div></Dialog>}
    {fireworks&&<div className="fireworks" aria-hidden="true">{FIREWORK_PARTICLES.map((p,i)=><i key={i} style={{'--x':`${p.x}%`,'--y':`${p.y}%`,'--dx':`${p.dx}px`,'--dy':`${p.dy}px`,'--c':p.c,animationDelay:`${p.delay}s`}}/>)}</div>}
  </main>;
}

createRoot(document.getElementById('root')).render(<LandscapeViewport><App/></LandscapeViewport>);
