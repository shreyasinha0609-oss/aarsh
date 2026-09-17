import { useEffect, useMemo, useRef, useState } from 'react';
import './calibration.css';

const W = 1067;
const H = 1600;
const BACKEND_URL = 'https://aarsh.onrender.com';
const CLOUD_NAME = 'httsesgq';
const CLOUDINARY_BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

const RANKS = [
  'Rank 1: Bronze','Rank 2: Silver','Rank 3: Gold','Rank 4: Platinum',
  'Rank 5: Emerald','Rank 6: Topaz','Rank 7: Ruby Star','Rank 8: Sapphire',
  'Rank 9: Star Sapphire','Rank 10: Diamond','Rank 11: Blue Diamond',
  'Rank 12: Black Diamond','Rank 13: Royal Diamond','Rank 14: Crown Diamond',
  'Rank 15: Ambassador','Rank 16: Royal Ambassador','Rank 17: Crown Ambassador',
  'Rank 18: Brand Ambassador'
];

const ICONS = ['🏆','🛡️','🏅','👑','🌿','⭐','💎','🌾','🔥','🎯','🪷','☀️','🦋','✷','🔷'];

const slug = (rank) => {
  const s = (rank.split(':')[1] || rank).trim().toLowerCase().replace(/\s+/g, '_');
  return ({ diamond:'daimond', blue_diamond:'blue_daimond', black_diamond:'black_daimond', royal_diamond:'royal_daimond', crown_diamond:'crown_daimond' })[s] || s;
};

const FONT_OPTIONS = [
  { name:'Frasa Display', value:"'FrasaDisplay-Bold', Arial, sans-serif" },
  { name:'Garat', value:"'Garat', Arial, sans-serif" },
  { name:'ALICE', value:"'ALICE', Georgia, serif" },
  { name:'Canva Sans', value:"'CanvaSans', Arial, sans-serif" },
  { name:'Poppins', value:"'Poppins', Arial, sans-serif" },
  { name:'Montserrat', value:"'Montserrat', Arial, sans-serif" },
  { name:'Bebas Neue', value:"'Bebas Neue', Impact, sans-serif" },
  { name:'Oswald', value:"'Oswald', Arial Narrow, sans-serif" },
  { name:'Roboto', value:"'Roboto', Arial, sans-serif" },
  { name:'Lato', value:"'Lato', Arial, sans-serif" },
  { name:'Raleway', value:"'Raleway', Arial, sans-serif" },
  { name:'Playfair Display', value:"'Playfair Display', Georgia, serif" },
  { name:'Cinzel', value:"'Cinzel', Georgia, serif" },
  { name:'Anton', value:"'Anton', Impact, sans-serif" },
  { name:'Archivo Black', value:"'Archivo Black', Arial Black, sans-serif" },
  { name:'Libre Baskerville', value:"'Libre Baskerville', Georgia, serif" },
  { name:'Merriweather', value:"'Merriweather', Georgia, serif" },
  { name:'League Spartan', value:"'League Spartan', Arial Black, sans-serif" },
  { name:'Abril Fatface', value:"'Abril Fatface', Georgia, serif" },
  { name:'DM Serif Display', value:"'DM Serif Display', Georgia, serif" },
];

const STYLE_PRESETS = {
  Classic: { fontSize:23, font:FONT_OPTIONS[0].value, weight:700, italic:false, underline:false, fillMode:'solid', fillColor:'#ffffff', strokeColor:'#000000', strokeWidth:0, shadow:true, shadowBlur:5, shadowX:2, shadowY:2 },
  Bold: { fontSize:25, font:FONT_OPTIONS[5].value, weight:900, italic:false, underline:false, fillMode:'solid', fillColor:'#ffffff', strokeColor:'#000000', strokeWidth:1, shadow:true, shadowBlur:5, shadowX:2, shadowY:2 },
  Elegant: { fontSize:24, font:FONT_OPTIONS[11].value, weight:700, italic:false, underline:false, fillMode:'solid', fillColor:'#ffffff', strokeColor:'#111111', strokeWidth:0, shadow:true, shadowBlur:4, shadowX:1, shadowY:2 },
  Premium: { fontSize:24, font:FONT_OPTIONS[12].value, weight:700, italic:false, underline:false, fillMode:'gradient', gradientA:'#fff7b2', gradientB:'#d9a441', gradientC:'#ffffff', gradientAngle:90, strokeColor:'#000000', strokeWidth:1, shadow:true, shadowBlur:6, shadowX:2, shadowY:2 },
  Gold: { fontSize:24, font:FONT_OPTIONS[4].value, weight:800, italic:false, underline:false, fillMode:'gradient', gradientA:'#fff3a1', gradientB:'#e2a52e', gradientC:'#fff8cf', gradientAngle:90, strokeColor:'#4a2d00', strokeWidth:1, shadow:true, shadowBlur:5, shadowX:2, shadowY:2 },
  Neon: { fontSize:24, font:FONT_OPTIONS[6].value, weight:800, italic:false, underline:false, fillMode:'solid', fillColor:'#ffffff', strokeColor:'#ff3df2', strokeWidth:2, shadow:true, shadowBlur:12, shadowX:0, shadowY:0 },
  Outline: { fontSize:24, font:FONT_OPTIONS[5].value, weight:800, italic:false, underline:false, fillMode:'solid', fillColor:'#ffffff', strokeColor:'#000000', strokeWidth:2, shadow:false, shadowBlur:0, shadowX:0, shadowY:0 },
  Shadow: { fontSize:23, font:FONT_OPTIONS[8].value, weight:700, italic:false, underline:false, fillMode:'solid', fillColor:'#ffffff', strokeColor:'#000000', strokeWidth:0, shadow:true, shadowBlur:10, shadowX:4, shadowY:4 },
  Modern: { fontSize:23, font:FONT_OPTIONS[9].value, weight:700, italic:false, underline:false, fillMode:'solid', fillColor:'#ffffff', strokeColor:'#000000', strokeWidth:0, shadow:true, shadowBlur:3, shadowX:1, shadowY:2 },
  Cinematic: { fontSize:24, font:FONT_OPTIONS[19].value, weight:700, italic:false, underline:false, fillMode:'solid', fillColor:'#ffffff', strokeColor:'#000000', strokeWidth:1, shadow:true, shadowBlur:7, shadowX:2, shadowY:3 },
};

const baseText = {
  leaderNameBox: { x: 690.3, y: 560.4, w: 372.2, h: 42.8, size:23, font:"'FrasaDisplay-Bold', Arial, sans-serif" },
  leaderCityBox: { x: 699.3, y: 640.4, w: 359.2, h: 42.8, size:27, font:"'Garat', Arial, sans-serif" },
  achieverNameBox: { x: 376.5, y: 1285, w: 379, h: 42.8, size:24, font:"'FrasaDisplay-Bold', Arial, sans-serif" },
  achieverRankBox: { x: 460.1, y: 1330, w: 359.2, h: 35.9, size:11, font:"'FrasaDisplay-Bold', Arial, sans-serif" },
  phoneBox: { x: 144.2, y: 1445.4, w: 205.6, h: 29.9, size:11, font:"'ALICE', Georgia, serif" }
};

const photoDefaults = {
  leaderCircle: { x: 46.4, y: 243.4, w: 359.2, h: 391.2 },
  achieverCircle: { x: 776.5, y: 1115.75, w: 247, h: 304.5 }
};
const photoByTemplate = {
  1: { leaderCircle: { x:46.4,y:243.4,w:359.2,h:391.2 }, achieverCircle:{ x:776.5,y:1115.75,w:247,h:304.5 } },
  2: { leaderCircle: { x:46.4,y:239.4,w:359.2,h:391.2 }, achieverCircle:{ x:775.5,y:1112.75,w:247,h:304.5 } },
  3: { leaderCircle: { x:46.4,y:225.4,w:359.2,h:391.2 }, achieverCircle:{ x:774.5,y:1097.75,w:247,h:304.5 } }
};

const defaultStyle = (box) => ({
  fontSize: box.size || 23,
  font: box.font || FONT_OPTIONS[0].value,
  weight: 700,
  italic: false,
  underline: false,
  fillMode: 'solid',
  fillColor: '#ffffff',
  gradientA: '#ffffff',
  gradientB: '#e7e7e7',
  gradientC: '#ffffff',
  gradientAngle: 90,
  strokeColor: '#000000',
  strokeWidth: 0,
  shadow: true,
  shadowBlur: 5,
  shadowX: 2,
  shadowY: 2
});

const freshLayout = (tpl) => {
  const text = Object.fromEntries(Object.entries(baseText).map(([k,v]) => [k,{...v, style:defaultStyle(v)}]));
  return { photo: { ...(photoByTemplate[tpl] || photoDefaults) }, text, version: 3 };
};

const storageKeys = (rank, tpl) => [
  `aarsh-calibration-v2:${slug(rank)}:${tpl}`,
  `aarsh-calibration-v2:rank_${slug(rank)}:${tpl}`,
  `aarsh-template-calibration-v1:${slug(rank)}:${tpl}`
];

const loadLayout = (rank, tpl) => {
  const fallback = freshLayout(tpl);
  try {
    const raw = storageKeys(rank,tpl).map(k=>localStorage.getItem(k)).find(Boolean);
    const saved = JSON.parse(raw || 'null');
    if (!saved) return fallback;
    const mergedText = {};
    Object.entries(fallback.text).forEach(([k,v]) => {
      const old = saved.text?.[k] || {};
      mergedText[k] = { ...v, ...old, style:{...v.style,...(old.style||{})} };
    });
    mergedText.achieverRankBox = { ...mergedText.achieverRankBox, size: 11, style: { ...mergedText.achieverRankBox.style, fontSize: 11 } };
    mergedText.phoneBox = { ...mergedText.phoneBox, size: 11, style: { ...mergedText.phoneBox.style, fontSize: 11 } };
    return { ...fallback, ...saved, photo:{...fallback.photo,...(saved.photo||{})}, text:mergedText, style:{...fallback.style,...(saved.style||{})}, version:3 };
  } catch { return fallback; }
};

const groupKeys = {
  leader:['leaderNameBox','leaderCityBox'],
  achiever:['achieverNameBox','achieverRankBox','phoneBox']
};
const groupLabel = { leader:'Leader Details', achiever:'Achiever Details' };
const sampleText = { leaderNameBox:'Mr. Rahul Sharma', leaderCityBox:'NEW DELHI', achieverNameBox:'Ms. Priya Sharma', achieverRankBox:'RANK 8: SAPPHIRE', phoneBox:'+91 98765 43210' };

function styleCss(style) {
  const gradient = style.fillMode === 'gradient' ? `linear-gradient(${style.gradientAngle}deg, ${style.gradientA}, ${style.gradientB}, ${style.gradientC})` : 'none';
  return {
    fontSize:`${style.fontSize}px`, fontFamily:style.font, fontWeight:style.weight, fontStyle:style.italic?'italic':'normal', textDecoration:style.underline?'underline':'none',
    color:style.fillMode==='gradient'?'transparent':style.fillColor,
    backgroundImage:gradient, backgroundClip:style.fillMode==='gradient'?'text':'border-box', WebkitBackgroundClip:style.fillMode==='gradient'?'text':'border-box', WebkitTextFillColor:style.fillMode==='gradient'?'transparent':undefined,
    WebkitTextStroke:`${style.strokeWidth}px ${style.strokeColor}`,
    textShadow:style.shadow?`${style.shadowX}px ${style.shadowY}px ${style.shadowBlur}px rgba(0,0,0,.85)`:'none'
  };
}

function StylePreview({ layout, achieverRankLabel }) {
  const items = [
    ['leaderNameBox', 'Mr. Rahul Sharma'],
    ['leaderCityBox', 'NEW DELHI'],
    ['achieverNameBox', 'Ms. Priya Sharma'],
    ['achieverRankBox', achieverRankLabel],
    ['phoneBox', '+91 98765 43210'],
  ];
  return <div className="cal-style-preview">
    {items.map(([key, text]) => {
      const b = layout.text[key];
      if (!b) return null;
      return <div key={key} className="cal-preview-text" style={{
        left:`${b.x/W*100}%`, top:`${b.y/H*100}%`, width:`${b.w/W*100}%`, height:`${b.h/H*100}%`,
        ...styleCss(b.style || defaultStyle(b))
      }}>{text}</div>;
    })}
  </div>;
}

function ColorInput({label,value,onChange}) { return <label className="color-row"><span>{label}</span><input type="color" value={value} onChange={e=>onChange(e.target.value)}/><code>{value}</code></label>; }

function StylePanel({ title, style, onChange, group, achieverRank, setAchieverRank, achieverOther, setAchieverOther }) {
  const patch=(p)=>onChange({...style,...p});
  const nudge=(field,delta,min,max)=>patch({[field]:Math.max(min,Math.min(max,(style[field]??0)+delta))});
  return <section className="cal-card style-panel">
    <div className="style-title"><div><small>TEXT STYLING</small><h2>{title}</h2></div><span className="center-badge">CENTERED</span></div>
    <label>PRESET</label><div className="preset-row">{Object.keys(STYLE_PRESETS).map(name=><button key={name} onClick={()=>patch({...STYLE_PRESETS[name],font:style.font})}>{name}</button>)}</div>
    {group==='achiever' && <div className="achiever-rank-control">
      <label>ACHIEVER RANK</label>
      <div className="awpl-rank-line"><strong>AWPL,</strong><select value={achieverRank} onChange={e=>setAchieverRank(e.target.value)}>{RANKS.map(r=><option key={r}>{r}</option>)}<option value="Other">Other</option></select></div>
      {achieverRank==='Other' && <input className="rank-other-input" value={achieverOther} onChange={e=>setAchieverOther(e.target.value)} placeholder="Enter your rank" />}
      <small>AWPL, is fixed. Selected/custom rank appears after the comma.</small>
    </div>}
    <label>FONT — 20 OPTIONS</label>
    <select className="font-select" value={style.font} onChange={e=>patch({font:e.target.value})}>{FONT_OPTIONS.map(f=><option key={f.name} value={f.value}>{f.name}</option>)}</select>
    <div className="font-preview" style={{fontFamily:style.font}}>Aa — Sample Text — 123</div>
    <label>TEXT SIZE</label><div className="stepper"><button onClick={()=>nudge('fontSize',-1,6,120)}>−</button><strong>{style.fontSize}px</strong><button onClick={()=>nudge('fontSize',1,6,120)}>+</button></div>
    <div className="toggle-row"><button className={style.weight>=700?'on':''} onClick={()=>patch({weight:style.weight>=700?400:800})}><b>B</b> Bold</button><button className={style.italic?'on':''} onClick={()=>patch({italic:!style.italic})}><i>I</i> Italic</button><button className={style.underline?'on':''} onClick={()=>patch({underline:!style.underline})}><u>U</u> Underline</button></div>
    <label>FILL</label><div className="seg-row"><button className={style.fillMode==='solid'?'on':''} onClick={()=>patch({fillMode:'solid'})}>Solid</button><button className={style.fillMode==='gradient'?'on':''} onClick={()=>patch({fillMode:'gradient'})}>Multi-color / Gradient</button></div>
    {style.fillMode==='solid' ? <ColorInput label="Fill Color" value={style.fillColor} onChange={v=>patch({fillColor:v})}/> : <div className="color-grid"><ColorInput label="Color 1" value={style.gradientA} onChange={v=>patch({gradientA:v})}/><ColorInput label="Color 2" value={style.gradientB} onChange={v=>patch({gradientB:v})}/><ColorInput label="Color 3" value={style.gradientC} onChange={v=>patch({gradientC:v})}/><div className="range-row"><span>Direction</span><input type="range" min="0" max="360" value={style.gradientAngle} onChange={e=>patch({gradientAngle:+e.target.value})}/><b>{style.gradientAngle}°</b></div></div>}
    <label>BLACK / CUSTOM BORDER (STROKE)</label><div className="stroke-row"><ColorInput label="Border" value={style.strokeColor} onChange={v=>patch({strokeColor:v})}/><div className="range-row"><span>Thickness</span><input type="range" min="0" max="6" step="1" value={style.strokeWidth} onChange={e=>patch({strokeWidth:+e.target.value})}/><b>{style.strokeWidth}px</b></div></div>
    <label>SHADOW</label><div className="seg-row"><button className={style.shadow?'on':''} onClick={()=>patch({shadow:!style.shadow})}>{style.shadow?'✓ Shadow ON':'Shadow OFF'}</button></div>{style.shadow&&<div className="shadow-grid"><div><span>Blur</span><input type="range" min="0" max="20" value={style.shadowBlur} onChange={e=>patch({shadowBlur:+e.target.value})}/><b>{style.shadowBlur}</b></div><div><span>X</span><input type="range" min="-10" max="10" value={style.shadowX} onChange={e=>patch({shadowX:+e.target.value})}/><b>{style.shadowX}</b></div><div><span>Y</span><input type="range" min="-10" max="10" value={style.shadowY} onChange={e=>patch({shadowY:+e.target.value})}/><b>{style.shadowY}</b></div></div>}
    <div className="style-note">All text is <b>center aligned</b> automatically. Leader controls apply to Leader Name + City; Achiever controls apply to Achiever Name + Rank + Phone.</div>
  </section>;
}

export default function CalibrationApp() {
  const [rank,setRank]=useState(RANKS[0]); const [tpl,setTpl]=useState(1); const [layout,setLayout]=useState(()=>loadLayout(RANKS[0],1));
  const [status,setStatus]=useState('Ready. Your existing saved positions are preserved.'); const [imgError,setImgError]=useState(false); const [styleStep,setStyleStep]=useState('leader'); const [leftOffset,setLeftOffset]=useState(0); const [rightOffset,setRightOffset]=useState(0); const [achieverRank,setAchieverRank]=useState('Rank 8: Sapphire'); const [achieverOther,setAchieverOther]=useState('');
  const posterUrl=useMemo(()=>`${CLOUDINARY_BASE}/${slug(rank)}_${tpl}.png?v=20260915`,[rank,tpl]);
  useEffect(()=>{const loaded=loadLayout(rank,tpl);setLayout(loaded);setImgError(false);setStyleStep('leader');setAchieverRank(loaded.achieverRankValue || 'Rank 8: Sapphire');setAchieverOther(loaded.achieverOther || '');setStatus('Loaded saved layout.');},[rank,tpl]);
  const update=(group,key,value)=>setLayout(prev=>({...prev,[group]:{...prev[group],[key]:value}}));
  const updateGroupStyle=(group,style)=>setLayout(prev=>{
    const next={...prev,text:{...prev.text}};
    groupKeys[group].forEach(k=>{
      const permanent11 = k==='achieverRankBox' || k==='phoneBox';
      const appliedSize = permanent11 ? 11 : style.fontSize;
      next.text[k]={...next.text[k],style:{...style,fontSize:appliedSize},size:appliedSize,font:style.font};
    });
    return next;
  });
  const currentGroup=styleStep;
  const currentStyle=layout.text[groupKeys[currentGroup][0]]?.style||defaultStyle(layout.text[groupKeys[currentGroup][0]]||baseText.leaderNameBox);
  const save=()=>{
    try{
      const safe={...layout,text:{...layout.text},achieverRankValue:achieverRank,achieverOther};
      safe.text.achieverRankBox={...safe.text.achieverRankBox,size:11,style:{...safe.text.achieverRankBox.style,fontSize:11}};
      safe.text.phoneBox={...safe.text.phoneBox,size:11,style:{...safe.text.phoneBox.style,fontSize:11}};
      const payload=JSON.stringify(safe);
      storageKeys(rank,tpl).forEach(k=>localStorage.setItem(k,payload));
      setLayout(safe);
      setStatus(`✓ Saved ${slug(rank)}_${tpl}.png — positions + text styling synced.`);
    }catch(e){setStatus(`Save failed: ${e.message}`)}
  };
  const reset=()=>{setLayout(freshLayout(tpl));setStatus('↺ Reset. Existing saved layout was not deleted until you press Save.');};
  return <div className="cal-page">
    <header className="cal-header"><div><div className="cal-kicker">AARSH DIGITAL</div><h1>Template Calibration Studio <em>PRO</em></h1><p>Standalone mode • no Firebase • 1067 × 1600 • 12 templates • saved layouts preserved</p></div><button className="cal-back" onClick={()=>window.location.href='/'}>← Back to Aarsh Digital Digital</button></header>
    <div className="cal-layout">
      <aside className="cal-sidebar">
        <section className="cal-card"><label>RANK</label><select value={rank} onChange={e=>setRank(e.target.value)}>{RANKS.map(r=><option key={r}>{r}</option>)}</select><label>TEMPLATE</label><div className="cal-grid">{Array.from({length:12},(_,i)=>i+1).map(n=><button key={n} className={tpl===n?'active':''} onClick={()=>setTpl(n)}><strong>{ICONS[n-1]}</strong><small>T{n}</small></button>)}</div></section>
        <section className="cal-card workflow-card">
          <div className="workflow-lock">🔒 TEMPLATE LOCKED</div>
          <h2>Step 1 — Template</h2>
          <p>Template position, photo circles and calibration are preserved from your saved layout. Step 2 only controls text styling.</p>
          <div className="cal-status">{status}</div>
          <button className="cal-save" onClick={save}>✓ Save Layout + Styles</button>
        </section>
        <section className="cal-card step2-card">
          <div className="step2-head"><div><small>STEP 2</small><h2>Text & Styling</h2></div><span>{styleStep==='leader'?'1 / 2':'2 / 2'}</span></div>
          <div className="step2-tabs"><button className={styleStep==='leader'?'active':''} onClick={()=>setStyleStep('leader')}>① Leader Details</button><button className={styleStep==='achiever'?'active':''} onClick={()=>setStyleStep('achiever')}>② Achiever Details</button></div>
        </section>
        {styleStep==='leader' ? <><StylePanel group="leader" title="Leader Details" style={layout.text.leaderNameBox.style||defaultStyle(layout.text.leaderNameBox)} onChange={s=>updateGroupStyle('leader',s)}/><button className="step-next" onClick={()=>setStyleStep('achiever')}>Next → Achiever Details</button></> : <><StylePanel group="achiever" title="Achiever Details" style={layout.text.achieverNameBox.style||defaultStyle(layout.text.achieverNameBox)} onChange={s=>updateGroupStyle('achiever',s)} achieverRank={achieverRank} setAchieverRank={setAchieverRank} achieverOther={achieverOther} setAchieverOther={setAchieverOther}/><button className="step-next secondary" onClick={()=>setStyleStep('leader')}>← Back to Leader Details</button></>}
        <section className="cal-help"><b>Locked workflow</b><ol><li>Select the template/rank above.</li><li>Complete all Leader styling.</li><li>Press <b>Next → Achiever Details</b>.</li><li>Complete Achiever styling and rank.</li><li>Press <b>Save Layout + Styles</b>.</li></ol><small>The 12 existing calibration positions are not edited from Step 2.</small></section>
      </aside>
      <div className="preview-with-mover">
      <main className="cal-main"><div className="cal-preview-head"><div><b>{slug(rank)}_{tpl}.png</b><span>{rank} • Template {tpl} • Editing {groupLabel[currentGroup]}</span></div><strong>1067 × 1600 LOCKED</strong></div><div className="cal-stage"><div className="cal-poster">{!imgError&&<img src={posterUrl} alt="Template" onError={()=>setImgError(true)}/>} {imgError&&<div className="cal-img-error"><b>Template image could not be loaded.</b><span>{posterUrl}</span></div>}<StylePreview layout={layout} achieverRankLabel={`AWPL, ${achieverRank==='Other' ? (achieverOther || 'YOUR RANK') : achieverRank}`.toUpperCase()}/></div></div><div className="cal-legend"><span>🔒 Template locked</span><span>✦ Live text style preview</span><span>◎ Center aligned</span><span>✓ Existing calibration preserved</span></div></main>
      
      </div>
    </div>
  </div>;
}
