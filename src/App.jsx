import { useState, useRef, useEffect } from 'react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import html2canvas from 'html2canvas';

const BACKEND_URL = "https://aarsh.onrender.com"; // Tera live backend

const RANKS = ["Rank 1: Bronze","Rank 2: Silver","Rank 3: Gold","Rank 4: Platinum","Rank 5: Emerald","Rank 6: Topaz","Rank 7: Ruby Star","Rank 8: Sapphire","Rank 9: Star Sapphire","Rank 10: Diamond","Rank 11: Blue Diamond","Rank 12: Black Diamond","Rank 13: Royal Diamond","Rank 14: Crown Diamond","Rank 15: Ambassador","Rank 16: Royal Ambassador","Rank 17: Crown Ambassador","Rank 18: Brand Ambassador"];
const CLOUD_NAME = "httsesgq";
const CLOUDINARY_BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;
const templateColors = { 1: "#6D28D9", 2: "#059669", 3: "#2563EB", 4: "#EA580C", 5: "#DB2777" };
const getRankSlug = (rankStr) => { const part = rankStr.split(':')[1] || rankStr; return part.trim().toLowerCase().replace(/\s+/g,'_'); };

const TEMPLATE_CONFIG = {
  default: {
    leader: { left: '3.8%', top: '6.5%', size: '23.5%' },
    achiever: { left: '68.8%', top: '68.8%', size: '20.2%' },
    leaderName: { left: '51.5%', top: '21.2%', fontSize: '2.3%' },
    city: { left: '51.5%', top: '26.8%', fontSize: '1.9%' },
    achieverName: { left: '25.5%', top: '73.2%', fontSize: '1.9%' },
    rank: { left: '25.5%', top: '75.8%', fontSize: '1.25%' },
    phone: { left: '9.5%', top: '83%', fontSize: '1.45%', width: '22%' }
  }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [step,setStep]=useState(1);
  const [rank,setRank]=useState(RANKS[0]);
  const [tpl,setTpl]=useState(1);
  const [themeColor,setThemeColor]=useState(templateColors[1]);
  const [aPre,setAPre]=useState('Mr'); const [aF,setAF]=useState(''); const [aL,setAL]=useState(''); const [aCity,setACity]=useState(''); const [aPhoto,setAPhoto]=useState(null);
  const [lPre,setLPre]=useState('Mr'); const [lF,setLF]=useState(''); const [lL,setLL]=useState(''); const [lRank,setLRank]=useState(RANKS[0]); const [lPh,setLPh]=useState('');
  const [lPhoto,setLPhoto]=useState(null);
  const [points,setPoints]=useState(0);
  const [errors, setErrors] = useState({});
  const posterRef = useRef(null);

  const buyCredits = async () => {
    if (!window.Razorpay) { alert("Razorpay load nahi hua!"); return; }
    try {
      // 1. Backend se order banao
      const res = await fetch(`${BACKEND_URL}/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 100 })
      });
      const order = await res.json();

      const options = {
        key: order.key_id, // Backend se ayega, secure
        amount: order.amount,
        currency: "INR",
        name: "Aarsh AI",
        description: "100 Credits Pack",
        order_id: order.id,
        prefill: { name: user.displayName, email: user.email, contact: "9999999999" },
        handler: async function (response) {
          // 2. Backend pe verify karo
          const verifyRes = await fetch(`${BACKEND_URL}/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({...response, uid: user.uid })
          });
          const data = await verifyRes.json();
          if(data.success){
            setPoints(data.newCredits);
            alert("Payment Success! 100 Credits Added ✅");
          } else {
            alert("Payment verification failed!");
          }
        },
        theme: { color: "#6D28D9" }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch(e){
      alert("Order create failed: " + e.message + " - Check backend");
      // Fallback for testing if backend doesn't have razorpay routes yet
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { credits: points + 100 });
      setPoints(points + 100);
      alert("Test Mode: 100 Credits Added (Backend routes banao to secure hoga)");
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if(currentUser){
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);
        if(!snap.exists()){
          await setDoc(userRef, { name: currentUser.displayName, email: currentUser.email, photo: currentUser.photoURL, lastLogin: new Date(), credits: 0 });
          setPoints(0);
        } else {
          setPoints(snap.data().credits?? 0);
          await setDoc(userRef, { lastLogin: new Date() }, { merge: true });
        }
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogin = async () => { try { await signInWithPopup(auth, googleProvider); } catch (err) { alert(err.message); } };
  const handleLogout = async () => { await signOut(auth); };
  const onA=(e)=>{ const f=e.target.files[0]; if(f) { setAPhoto(URL.createObjectURL(f)); setErrors(prev=>({...prev, aPhoto: false})) } }
  const onL=(e)=>{ const f=e.target.files[0]; if(f) { setLPhoto(URL.createObjectURL(f)); setErrors(prev=>({...prev, lPhoto: false})) } }
  const handleTemplate = (t) => { setTpl(t); setThemeColor(templateColors[t]); }
  const validateStep2 = () => {
    const newErrors = {};
    if(!aF.trim()) newErrors.aF = true; if(!aL.trim()) newErrors.aL = true; if(!aCity.trim()) newErrors.aCity = true; if(!aPhoto) newErrors.aPhoto = true;
    if(!lF.trim()) newErrors.lF = true; if(!lL.trim()) newErrors.lL = true; if(!lPh.trim()) newErrors.lPh = true; if(!lPhoto) newErrors.lPhoto = true;
    setErrors(newErrors); return Object.keys(newErrors).length === 0;
  }
  const generate= async ()=>{
    if(!validateStep2()) return;
    if(points < 5){ alert('Insufficient Credits (0). Please Buy Credits!'); return; }
    try{
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { credits: points - 5 });
      setPoints(p=>p-5);
      setStep(3);
    } catch(e){ alert("Error updating credits: " + e.message); }
  }
  const download = async () => {
    if(!posterRef.current) return;
    const canvas = await html2canvas(posterRef.current, { scale: 3, useCORS: true, backgroundColor: null, allowTaint: true });
    const a = document.createElement('a');
    a.download = `Aarsh-${aF||'Poster'}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  }
  const inputClass = (hasError) => `border p-3 rounded-xl w-full outline-none transition-all ${hasError? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'}`;
  const labelClass = (hasError) => `w-full border-2 border-dashed p-4 rounded-xl flex flex-col items-center cursor-pointer mb-4 font-medium transition-all ${hasError? 'border-red-500 bg-red-50 text-red-600' : 'border-purple-300 bg-purple-50/60'}`;
  const posterUrl = `${CLOUDINARY_BASE}/${getRankSlug(rank)}_${tpl}.png`;
  const cfg = TEMPLATE_CONFIG[`${getRankSlug(rank)}_${tpl}`] || TEMPLATE_CONFIG.default;

  if(authLoading) return <div className="min-h-screen flex items-center justify-center bg-purple-100 font-black">Loading Aarsh...</div>
  if(!user){
    return (
      <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4" style={{backgroundImage:`url('/bg.jpg'), linear-gradient(135deg, #FFD6E8 0%, #E9D5FF 50%, #BFDBFE 100%)`}}>
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]"></div>
        <div className="relative bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl rounded-[32px] p-8 md:p-12 max-w-[480px] w-full text-center">
          <img src="/logo.png" alt="Aarsh" className="w-24 h-24 md:w-32 md:h-32 mx-auto object-contain bg-white rounded-[24px] p-3 shadow-lg mb-4" />
          <h1 className="font-black text-5xl md:text-6xl bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 bg-clip-text text-transparent">Aarsh</h1>
          <p className="tracking-[0.3em] font-bold text-gray-500 text-xs mt-1">AI • IMAGE GENERATOR</p>
          <button onClick={handleLogin} className="w-full mt-8 bg-black text-white py-4 rounded-xl font-bold text-[15px] flex items-center justify-center gap-3 hover:bg-gray-900 shadow-lg">Sign in with Google</button>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed" style={{backgroundImage:`url('/bg.jpg'), linear-gradient(135deg, #FFD6E8 0%, #E9D5FF 50%, #BFDBFE 100%)`}}>
      <div className="max-w-[1400px] mx-auto bg-white/85 backdrop-blur-xl flex flex-col md:flex-row justify-between items-center gap-2 px-4 md:px-6 py-3 rounded-b-2xl md:rounded-2xl mx-2 md:mx-auto mt-0 md:mt-3 border border-white/60 shadow-lg">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Aarsh Logo" className="w-11 h-11 md:w-12 md:h-12 object-contain bg-white rounded-xl p-1 shadow" />
          <div><h1 className="font-black text-[22px] md:text-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 bg-clip-text text-transparent leading-none">Aarsh</h1><p className="text-[10px] tracking-[0.2em] font-bold text-gray-500">AI • IMAGE GENERATOR</p></div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="bg-gradient-to-r from-pink-500 to-blue-600 text-white px-4 py-1.5 rounded-full font-bold shadow">⭐ {points} Credits</span>
          <button onClick={buyCredits} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-full font-bold text-xs shadow">+ Buy 100 ₹100</button>
          <img src={user.photoURL} className="w-8 h-8 rounded-full border-2 border-purple-200" />
          <button onClick={handleLogout} className="bg-white border px-3 py-1.5 rounded-full font-bold text-xs hover:bg-gray-50">Logout</button>
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 px-2 md:px-4 pb-10 mt-4">
        <div className="bg-white/90 backdrop-blur p-4 md:p-6 rounded-[22px] border border-white shadow-xl order-2 lg:order-1">
          {step===1 && (
            <>
              <p className="text-purple-700 font-bold text-xs tracking-widest">STEP 1</p>
              <h2 className="text-xl md:text-2xl font-black mb-4">Select Your Professional Rank & Template</h2>
              <select value={rank} onChange={e=>setRank(e.target.value)} className="w-full border-2 border-purple-200 p-3 md:p-4 rounded-xl mb-6 bg-white text-base outline-none focus:border-purple-500">{RANKS.map(r=><option key={r}>{r}</option>)}</select>
              <p className="font-black text-lg mb-3">Choose Template Design (1-5)</p>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 mb-8">
                {[1,2,3,4,5].map(i=><button key={i} onClick={()=>handleTemplate(i)} className={`h-24 md:h-28 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${tpl===i?'scale-105 shadow-lg border-2':'bg-white hover:border-purple-200'}`} style={{backgroundColor: tpl===i? templateColors[i]+'20' : 'white', borderColor: tpl===i? templateColors[i] : '#E5E7EB'}}><span className="text-2xl">{['🏆','🛡️','🏅','👑','🌿'][i-1]}</span><b className="text-sm">T-{i}</b></button>)}
              </div>
              <button onClick={()=>setStep(2)} className="w-full bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 text-white py-4 rounded-xl font-black text-lg shadow-lg">Continue →</button>
            </>
          )}
          {step===2 && (
            <>
              <p className="text-purple-700 font-bold text-xs tracking-widest">STEP 2 • ENTER DETAILS</p>
              <h3 className="font-black text-xl mt-3 mb-3 tracking-wide bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">✦ Achiever Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-[90px_1fr] gap-2 mb-2">
                <select value={aPre} onChange={e=>setAPre(e.target.value)} className="border border-gray-200 p-3 rounded-xl bg-white outline-none"><option>Mr</option><option>Mrs</option><option>Miss</option><option>Dr</option></select>
                <input placeholder="First Name *" value={aF} onChange={e=>{setAF(e.target.value); setErrors(p=>({...p, aF:false}))}} className={inputClass(errors.aF)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                <input placeholder="Last Name *" value={aL} onChange={e=>{setAL(e.target.value); setErrors(p=>({...p, aL:false}))}} className={inputClass(errors.aL)} />
                <input placeholder="City *" value={aCity} onChange={e=>{setACity(e.target.value); setErrors(p=>({...p, aCity:false}))}} className={inputClass(errors.aCity)} />
              </div>
              <label className={labelClass(errors.aPhoto)}>☁️ Upload Achiever Photo *<input type="file" hidden onChange={onA} accept="image/*" /></label>
              <h3 className="font-black text-xl mb-3 tracking-wide bg-gradient-to-r from-blue-700 to-purple-600 bg-clip-text text-transparent">✦ Leader Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-[90px_1fr_1fr] gap-2 mb-2">
                <select value={lPre} onChange={e=>setLPre(e.target.value)} className="border border-gray-200 p-3 rounded-xl bg-white outline-none"><option>Mr</option><option>Mrs</option></select>
                <input placeholder="First Name *" value={lF} onChange={e=>{setLF(e.target.value); setErrors(p=>({...p, lF:false}))}} className={inputClass(errors.lF)} />
                <input placeholder="Last Name *" value={lL} onChange={e=>{setLL(e.target.value); setErrors(p=>({...p, lL:false}))}} className={inputClass(errors.lL)} />
              </div>
              <select value={lRank} onChange={e=>setLRank(e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl mb-2 bg-white outline-none">{RANKS.map(r=><option key={r}>{r}</option>)}</select>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                <div className="flex gap-2"><div className="w-full p-3 rounded-xl font-black text-white text-center tracking-widest" style={{backgroundColor: themeColor}}>AWPL</div></div>
                <input placeholder="Phone Number *" value={lPh} onChange={e=>{setLPh(e.target.value); setErrors(p=>({...p, lPh:false}))}} className={inputClass(errors.lPh)} />
              </div>
              <label className={labelClass(errors.lPhoto)}>☁️ Upload Leader Photo *<input type="file" hidden onChange={onL} accept="image/*" /></label>
              <div className="grid grid-cols-2 gap-3"><button onClick={()=>setStep(1)} className="border py-3 rounded-xl font-bold">← Previous</button><button onClick={generate} className="bg-gradient-to-r from-pink-500 to-blue-600 text-white py-3 rounded-xl font-black shadow-lg">✨ Generate Poster (-5)</button></div>
            </>
          )}
          {step===3 && (
            <div className="text-center py-4">
              <h2 className="text-3xl font-black bg-gradient-to-r from-pink-500 to-blue-600 bg-clip-text text-transparent">🎉 Poster Generated!</h2>
              <p className="text-xs text-gray-500 mt-2">Jo preview me dikh raha hai wahi download hoga</p>
              <div className="grid grid-cols-2 gap-3 mt-6"><button onClick={()=>setStep(2)} className="border py-3 rounded-xl font-bold">← Edit Details</button><button onClick={download} className="bg-black text-white py-3 rounded-xl font-black">⬇ Download PNG</button></div>
            </div>
          )}
        </div>
        <div className="bg-white/90 backdrop-blur p-4 md:p-6 rounded-[22px] border border-white shadow-xl h-fit lg:sticky top-3 order-1 lg:order-2">
          <h2 className="font-black text-center">👁️ Live Preview - 100% Exact</h2>
          <p className="text-center text-xs text-gray-500 mb-3">Template: {getRankSlug(rank)}_{tpl}</p>
          <div ref={posterRef} className="relative w-full rounded-xl overflow-hidden border shadow bg-white">
            <img src={posterUrl} alt="template" className="w-full h-auto block" crossOrigin="anonymous" />
            {lPhoto && <img src={lPhoto} alt="leader" className="absolute rounded-full object-cover" style={{left:cfg.leader.left, top:cfg.leader.top, width:cfg.leader.size, aspectRatio:'1', objectFit:'cover', border:'3px solid #c9a86a'}} />}
            {aPhoto && <img src={aPhoto} alt="achiever" className="absolute rounded-full object-cover" style={{left:cfg.achiever.left, top:cfg.achiever.top, width:cfg.achiever.size, aspectRatio:'1', objectFit:'cover', border:'3px solid white'}} />}
            <div className="absolute font-black text-[#d4b779]" style={{left:cfg.leaderName.left, top:cfg.leaderName.top, fontSize:cfg.leaderName.fontSize}}>{lF||lL? `${lPre} ${lF} ${lL}`.trim() : ''}</div>
            <div className="absolute font-bold text-[#7fbf8a] tracking-widest" style={{left:cfg.city.left, top:cfg.city.top, fontSize:cfg.city.fontSize}}>{aCity}</div>
            <div className="absolute font-black text-[#0a2342]" style={{left:cfg.achieverName.left, top:cfg.achieverName.top, fontSize:cfg.achieverName.fontSize}}>{aF||aL? `${aPre} ${aF} ${aL}`.trim() : ''}</div>
            <div className="absolute font-bold text-[#0a2342]" style={{left:cfg.rank.left, top:cfg.rank.top, fontSize:cfg.rank.fontSize}}>AWPL, {(lRank.split(':')[1]||lRank).toUpperCase()}</div>
            <div className="absolute font-black text-black text-center bg-white rounded-full" style={{left:cfg.phone.left, top:cfg.phone.top, fontSize:cfg.phone.fontSize, width:cfg.phone.width, padding:'0.8% 0'}}>{lPh}</div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4"><button onClick={download} className="bg-gradient-to-r from-pink-500 to-blue-600 text-white py-3 rounded-xl font-black text-sm shadow">⬇ Download PNG</button><button onClick={()=>window.location.reload()} className="border border-purple-200 py-3 rounded-xl font-bold text-sm">↻ Refresh</button></div>
        </div>
      </div>
    </div>
  )
}