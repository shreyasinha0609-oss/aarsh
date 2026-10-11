import { useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';

const CLOUDINARY_BASE = 'https://res.cloudinary.com/httsesgq/image/upload';
const RANKS = [
  'Rank 1: Bronze','Rank 2: Silver','Rank 3: Gold','Rank 4: Platinum',
  'Rank 5: Emerald','Rank 6: Topaz','Rank 7: Ruby Star','Rank 8: Sapphire',
  'Rank 9: Star Sapphire','Rank 10: Diamond','Rank 11: Blue Diamond',
  'Rank 12: Black Diamond','Rank 13: Royal Diamond','Rank 14: Crown Diamond',
  'Rank 15: Ambassador','Rank 16: Royal Ambassador','Rank 17: Crown Ambassador',
  'Rank 18: Brand Ambassador'
];
const TEMPLATES = Array.from({length: 15}, (_, i) => i + 1);
const BASE = { w: 1067, h: 1600 };
const DEFAULT_LAYOUT = {
  leaderCircle: {x:46.4,y:243.4,w:359.2,h:391.2},
  leaderNameBox: {x:690.3,y:560.4,w:372.2,h:42.8,size:23},
  leaderCityBox: {x:699.3,y:640.4,w:359.2,h:42.8,size:22},
  achieverCircle: {x:776.5,y:1115.75,w:247,h:304.5},
  achieverNameBox: {x:376.5,y:1285,w:379,h:42.8,size:20},
  achieverRankBox: {x:460.1,y:1330,w:359.2,h:35.9,size:13},
  phoneBox: {x:144.2,y:1445.4,w:205.6,h:29.9,size:14}
};

const slug = r => (r.split(':')[1] || r).trim().toLowerCase().replace(/\s+/g,'_')
  .replace('diamond','daimond').replace('blue_diamond','blue_daimond').replace('black_diamond','black_daimond')
  .replace('royal_diamond','royal_daimond').replace('crown_diamond','crown_daimond');

function readSavedLayout(rank, tpl) {
  const keys = [
    `aarsh-template-calibration-v1:${slug(rank)}:${tpl}`,
    `aarsh-calibration-v2:${slug(rank)}:${tpl}`,
    `aarsh-calibration-v2:rank_${slug(rank)}:${tpl}`
  ];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const saved = JSON.parse(raw);
      const text = saved.text || {};
      const photo = saved.photo || {};
      return {
        leaderCircle: {...DEFAULT_LAYOUT.leaderCircle, ...(photo.leaderCircle || {})},
        leaderNameBox: {...DEFAULT_LAYOUT.leaderNameBox, ...(text.leaderNameBox || {})},
        leaderCityBox: {...DEFAULT_LAYOUT.leaderCityBox, ...(text.leaderCityBox || {})},
        achieverCircle: {...DEFAULT_LAYOUT.achieverCircle, ...(photo.achieverCircle || {})},
        achieverNameBox: {...DEFAULT_LAYOUT.achieverNameBox, ...(text.achieverNameBox || {})},
        achieverRankBox: {...DEFAULT_LAYOUT.achieverRankBox, ...(text.achieverRankBox || {})},
        phoneBox: {...DEFAULT_LAYOUT.phoneBox, ...(text.phoneBox || {})}
      };
    } catch {}
  }
  return {...DEFAULT_LAYOUT};
}

const pct = (n, total) => `${(n / total) * 100}%`;

export default function LeaderStyleDemo() {
  const [step, setStep] = useState(1);
  const [rank, setRank] = useState(RANKS[0]);
  const [tpl, setTpl] = useState(1);
  const [leader, setLeader] = useState({prefix:'Mr.', first:'Shreya', last:'Sinha', city:'PATNA', photo:null});
  const [achiever, setAchiever] = useState({prefix:'Mr.', first:'Archana', last:'Sinha', phone:'1111111111', rank:'Rank 1: Bronze', photo:null});
  const [layout, setLayout] = useState(() => readSavedLayout(RANKS[0],1));
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef(null);

  useEffect(() => setLayout(readSavedLayout(rank, tpl)), [rank, tpl]);

  const templateUrl = `${CLOUDINARY_BASE}/${slug(rank)}_${tpl}.png?v=20260921`;
  const leaderName = `${leader.prefix} ${leader.first} ${leader.last}`.trim();
  const achieverName = `${achiever.prefix} ${achiever.first} ${achiever.last}`.trim();
  const achieverRank = `${(achiever.rank === 'Other' ? 'Other' : 'AWPL')}, ${(achiever.rank.split(':')[1] || achiever.rank).trim()}`;

  const fileToUrl = (file, setter) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setter(prev => ({...prev, photo:url}));
  };

  const textStyle = (box, size) => ({
    position:'absolute', left:pct(box.x,BASE.w), top:pct(box.y,BASE.h), width:pct(box.w,BASE.w), height:pct(box.h,BASE.h),
    fontSize:`${size * 1}px`, fontFamily:'Arial, sans-serif', fontWeight:700, color:'#fff',
    display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center', whiteSpace:'nowrap',
    zIndex:10, pointerEvents:'none', lineHeight:1
  });

  const photoStyle = box => ({position:'absolute',left:pct(box.x,BASE.w),top:pct(box.y,BASE.h),width:pct(box.w,BASE.w),height:pct(box.h,BASE.h),borderRadius:'50%',overflow:'hidden',zIndex:5});

  const download = async width => {
    if (!previewRef.current) return;
    setDownloading(true);
    try {
      await document.fonts?.ready;
      const node = previewRef.current;
      const rect = node.getBoundingClientRect();
      const scale = width / rect.width;
      const canvas = await html2canvas(node,{scale,width:Math.round(rect.width),height:Math.round(rect.height),useCORS:true,allowTaint:false,backgroundColor:'#fff',logging:false,imageTimeout:30000});
      const out = document.createElement('canvas');
      out.width = width; out.height = Math.round(width * BASE.h / BASE.w);
      out.getContext('2d').drawImage(canvas,0,0,out.width,out.height);
      const a = document.createElement('a'); a.download=`aarsh-${slug(rank)}-T${tpl}-${width}.png`; a.href=out.toDataURL('image/png'); a.click();
    } finally { setDownloading(false); }
  };

  return <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#fff7ff,#eef5ff)',padding:24,fontFamily:'Arial,sans-serif',color:'#163a78'}}>
    <div style={{maxWidth:1180,margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
        <div><div style={{fontWeight:900,fontSize:26}}>Aarsh Digital — Leader Style</div><div style={{color:'#667ea8'}}>Fixed template placement • no customer coordinates • preview = final</div></div>
        <div style={{fontWeight:900}}>STEP {step}/4</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'minmax(360px,1fr) minmax(360px,520px)',gap:20,alignItems:'start'}}>
        <div style={{background:'#fff',borderRadius:24,padding:22,boxShadow:'0 12px 40px rgba(40,60,120,.12)'}}>
          {step===1 && <>
            <h2 style={{marginTop:0}}>1. Select Template</h2>
            <label style={{fontWeight:800}}>Rank</label>
            <select value={rank} onChange={e=>setRank(e.target.value)} style={{width:'100%',padding:13,borderRadius:12,margin:'8px 0 20px'}}>{RANKS.map(r=><option key={r}>{r}</option>)}</select>
            <div style={{fontWeight:800,marginBottom:10}}>Template</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>{TEMPLATES.map(i=><button key={i} onClick={()=>setTpl(i)} style={{padding:'12px 5px',borderRadius:12,border:i===tpl?'3px solid #7c3aed':'1px solid #ddd',background:i===tpl?'#f3e8ff':'#fff',fontWeight:900}}>T-{i}</button>)}</div>
            <button onClick={()=>setStep(2)} style={{marginTop:24,width:'100%',padding:14,border:0,borderRadius:14,background:'linear-gradient(90deg,#7c3aed,#2563eb)',color:'#fff',fontWeight:900}}>Next: Leader Details →</button>
          </>}
          {step===2 && <>
            <h2 style={{marginTop:0}}>2. Leader Details</h2>
            <div style={{display:'grid',gridTemplateColumns:'100px 1fr 1fr',gap:10}}>
              <select value={leader.prefix} onChange={e=>setLeader({...leader,prefix:e.target.value})} style={{padding:12,borderRadius:10}}><option>Mr.</option><option>Mrs.</option><option>Miss</option><option>Dr.</option></select>
              <input value={leader.first} onChange={e=>setLeader({...leader,first:e.target.value})} placeholder="First Name" style={{padding:12,borderRadius:10}}/>
              <input value={leader.last} onChange={e=>setLeader({...leader,last:e.target.value})} placeholder="Last Name" style={{padding:12,borderRadius:10}}/>
            </div>
            <input value={leader.city} onChange={e=>setLeader({...leader,city:e.target.value})} placeholder="City" style={{marginTop:10,width:'100%',padding:12,borderRadius:10,boxSizing:'border-box'}}/>
            <label style={{display:'block',marginTop:16,padding:16,border:'2px dashed #a78bfa',borderRadius:14,cursor:'pointer',fontWeight:800}}>📷 Upload Leader Photo<input type="file" accept="image/*" hidden onChange={e=>fileToUrl(e.target.files?.[0],v=>setLeader(p=>({...p,...v})))} /></label>
            <p style={{fontSize:13,color:'#7184a5'}}>No X/Y controls. The template decides where everything goes.</p>
            <div style={{display:'flex',gap:10}}><button onClick={()=>setStep(1)} style={{flex:1,padding:13,borderRadius:12}}>← Back</button><button onClick={()=>setStep(3)} style={{flex:2,padding:13,border:0,borderRadius:12,background:'#2563eb',color:'#fff',fontWeight:900}}>Next: Achiever →</button></div>
          </>}
          {step===3 && <>
            <h2 style={{marginTop:0}}>3. Achiever Details</h2>
            <div style={{display:'grid',gridTemplateColumns:'100px 1fr 1fr',gap:10}}>
              <select value={achiever.prefix} onChange={e=>setAchiever({...achiever,prefix:e.target.value})} style={{padding:12,borderRadius:10}}><option>Mr.</option><option>Mrs.</option><option>Miss</option><option>Dr.</option></select>
              <input value={achiever.first} onChange={e=>setAchiever({...achiever,first:e.target.value})} placeholder="First Name" style={{padding:12,borderRadius:10}}/>
              <input value={achiever.last} onChange={e=>setAchiever({...achiever,last:e.target.value})} placeholder="Last Name" style={{padding:12,borderRadius:10}}/>
            </div>
            <input value={achiever.phone} onChange={e=>setAchiever({...achiever,phone:e.target.value})} placeholder="Phone" style={{marginTop:10,width:'100%',padding:12,borderRadius:10,boxSizing:'border-box'}}/>
            <select value={achiever.rank} onChange={e=>setAchiever({...achiever,rank:e.target.value})} style={{marginTop:10,width:'100%',padding:12,borderRadius:10}}>{RANKS.map(r=><option key={r}>{r}</option>)}<option>Other</option></select>
            <label style={{display:'block',marginTop:16,padding:16,border:'2px dashed #a78bfa',borderRadius:14,cursor:'pointer',fontWeight:800}}>📷 Upload Achiever Photo<input type="file" accept="image/*" hidden onChange={e=>fileToUrl(e.target.files?.[0],v=>setAchiever(p=>({...p,...v})))} /></label>
            <p style={{fontSize:13,color:'#7184a5'}}>No coordinates, no font calculations, no template editing. Just fill details.</p>
            <div style={{display:'flex',gap:10}}><button onClick={()=>setStep(2)} style={{flex:1,padding:13,borderRadius:12}}>← Back</button><button onClick={()=>setStep(4)} style={{flex:2,padding:13,border:0,borderRadius:12,background:'#ec4899',color:'#fff',fontWeight:900}}>Preview & Download →</button></div>
          </>}
          {step===4 && <>
            <h2 style={{marginTop:0}}>4. Download</h2>
            <p style={{color:'#60779e'}}>This is the same live poster shown on the right. Download captures this exact preview.</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>{[1080,1460,2160,3840].map(w=><button key={w} disabled={downloading} onClick={()=>download(w)} style={{padding:14,borderRadius:12,border:'1px solid #ddd',background:'#fff',fontWeight:900}}>{w===3840?'4K':w+' px'}</button>)}</div>
            <button onClick={()=>setStep(3)} style={{marginTop:14,width:'100%',padding:13,borderRadius:12}}>← Edit Details</button>
          </>}
        </div>

        <div style={{background:'#fff',borderRadius:24,padding:18,boxShadow:'0 12px 40px rgba(40,60,120,.12)',position:'sticky',top:18}}>
          <div style={{fontWeight:900,fontSize:18,marginBottom:12}}>Live Preview — Template T-{tpl}</div>
          <div style={{width:'100%',maxWidth:500,margin:'0 auto'}}>
            <div ref={previewRef} style={{position:'relative',width:'100%',aspectRatio:`${BASE.w}/${BASE.h}`,overflow:'hidden',background:'#eee'}}>
              <img src={templateUrl} alt="Template" crossOrigin="anonymous" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'fill'}}/>
              {leader.photo && <div style={photoStyle(layout.leaderCircle)}><img src={leader.photo} alt="Leader" style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>}
              <div style={textStyle(layout.leaderNameBox,23)}>{leaderName}</div>
              <div style={textStyle(layout.leaderCityBox,22)}>{leader.city.toUpperCase()}</div>
              {achiever.photo && <div style={photoStyle(layout.achieverCircle)}><img src={achiever.photo} alt="Achiever" style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>}
              <div style={{...textStyle(layout.achieverNameBox,20),color:'#149c83'}}>{achieverName}</div>
              <div style={{...textStyle(layout.achieverRankBox,13),color:'#149c83',fontSize:'11px'}}>{achieverRank.toUpperCase()}</div>
              <div style={{...textStyle(layout.phoneBox,14),color:'#111',fontSize:'10px'}}>{achiever.phone}</div>
            </div>
          </div>
          <div style={{marginTop:10,fontSize:12,color:'#7184a5',textAlign:'center'}}>The download uses this exact preview — no second positioning engine.</div>
        </div>
      </div>
    </div>
  </div>;
}
