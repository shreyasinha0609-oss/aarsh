import { useState, useRef, useEffect } from 'react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import html2canvas from 'html2canvas';

const BACKEND_URL = "https://aarsh.onrender.com";

const RANKS = [
  "Rank 1: Bronze","Rank 2: Silver","Rank 3: Gold","Rank 4: Platinum",
  "Rank 5: Emerald","Rank 6: Topaz","Rank 7: Ruby Star","Rank 8: Sapphire",
  "Rank 9: Star Sapphire","Rank 10: Diamond","Rank 11: Blue Diamond",
  "Rank 12: Black Diamond","Rank 13: Royal Diamond","Rank 14: Crown Diamond",
  "Rank 15: Ambassador","Rank 16: Royal Ambassador","Rank 17: Crown Ambassador",
  "Rank 18: Brand Ambassador"
];

const CLOUD_NAME = "httsesgq";
const CLOUDINARY_BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;
const templateColors = { 1: "#6D28D9", 2: "#059669", 3: "#2563EB", 4: "#EA580C", 5: "#DB2777" };

const getRankSlug = (rankStr) => {
  const part = rankStr.split(':')[1] || rankStr;
  let slug = part.trim().toLowerCase().replace(/\s+/g,'_');
  const fixMap = {
    'diamond': 'daimond',
    'blue_diamond': 'blue_daimond',
    'black_diamond': 'black_daimond',
    'royal_diamond': 'royal_daimond',
    'crown_diamond': 'crown_daimond'
  };
  return fixMap[slug] || slug;
};

// Canvas Coordinates Standard (1067px x 1600px base)
const EXACT_COORDS = {
  leaderCircle: { x: 45.9, y: 246.2, w: 359.2, h: 391.2 },
  leaderNameBox: { x: 580.3, y: 560.4, w: 372.2, h: 42.8, size: 24, font: 'FrasaDisplay-Bold' },
  leaderCityBox: { x: 699.3, y: 640.4, w: 359.2, h: 42.8, size: 27, font: 'Garat' },
  achieverCircle: { x: 777.9, y: 1114.9, w: 247, h: 304.5 },
  achieverNameBox: { x: 376.5, y: 1285, w: 379, h: 42.8, size: 24, font: 'FrasaDisplay-Bold' },
  achieverRankBox: { x: 460.1, y: 1330, w: 359.2, h: 35.9, size: 13, font: 'FrasaDisplay-Bold' },
  phoneBox: { x: 144.2, y: 1445.4, w: 205.6, h: 29.9, size: 18, font: 'ALICE' }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [rank, setRank] = useState(RANKS[0]);
  const [tpl, setTpl] = useState(1);
  const [themeColor, setThemeColor] = useState(templateColors[1]);
  const [textColor, setTextColor] = useState('#ffffff');

  // Form States (Leader = Top Section, Achiever = Bottom Section)
  const [lPre, setLPre] = useState('Mr.'); 
  const [lF, setLF] = useState(''); 
  const [lL, setLL] = useState(''); 
  const [lCity, setLCity] = useState(''); 
  const [lPhoto, setLPhoto] = useState(null);

  const [aPre, setAPre] = useState('Mr.'); 
  const [aF, setAF] = useState(''); 
  const [aL, setAL] = useState(''); 
  const [lPh, setLPh] = useState('');
  const [aCity, setACity] = useState(''); 
  const [aPhoto, setAPhoto] = useState(null);

  const [points, setPoints] = useState(0);
  const [errors, setErrors] = useState({});
  const posterRef = useRef(null);

  // Recharge Modal States
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [selectedPointsOption, setSelectedPointsOption] = useState(100);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const RECHARGE_OPTIONS = [
    { points: 30, price: 30 },
    { points: 100, price: 100, popular: true },
    { points: 200, price: 200 },
    { points: 500, price: 500 },
    { points: 1000, price: 1000 },
    { points: 2000, price: 2000 }
  ];

  const handleRazorpayPayment = async (amountToPay) => {
    if (!window.Razorpay) { 
      alert("Razorpay SDK failed to load! Please check your network connection."); 
      return; 
    }
    
    setIsProcessingPayment(true);
    try {
      const res = await fetch(`${BACKEND_URL}/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountToPay })
      });
      const order = await res.json();

      if (order.error) {
        throw new Error(order.error);
      }

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: "INR",
        name: "Aarsh AI Poster Generator",
        description: `Recharge ${amountToPay} Points`,
        order_id: order.id,
        prefill: { 
          name: user?.displayName || "", 
          email: user?.email || "", 
          contact: lPh || "9999999999" 
        },
        handler: async function (response) {
          try {
            const verifyRes = await fetch(`${BACKEND_URL}/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...response, 
                uid: user.uid,
                selectedPoints: amountToPay 
              })
            });
            const data = await verifyRes.json();
            if(data.success){
              const userRef = doc(db, "users", user.uid);
              const updatedCredits = points + data.addedPoints;
              await updateDoc(userRef, { credits: updatedCredits });
              setPoints(updatedCredits);
              setShowRechargeModal(false);
              alert(`🎉 Success! ${data.addedPoints} Points added to your account.`);
            } else {
              alert("❌ Payment verification failed! Please contact support.");
            }
          } catch (err) {
            alert("Verification error: " + err.message);
          } finally {
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: function() {
            setIsProcessingPayment(false);
          }
        },
        theme: { color: "#6D28D9" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch(e){
      alert("Order initialization failed: " + e.message);
      setIsProcessingPayment(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if(currentUser){
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);
        if(!snap.exists()){
          await setDoc(userRef, { 
            name: currentUser.displayName, 
            email: currentUser.email, 
            photo: currentUser.photoURL, 
            lastLogin: new Date(), 
            credits: 0 
          });
          setPoints(0);
        } else {
          setPoints(snap.data().credits ?? 0);
          await setDoc(userRef, { lastLogin: new Date() }, { merge: true });
        }
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogin = async () => { try { await signInWithPopup(auth, googleProvider); } catch (err) { alert(err.message); } };
  const handleLogout = async () => { await signOut(auth); };
  
  const onLeaderPhoto = (e) => { const f = e.target.files[0]; if(f) { setLPhoto(URL.createObjectURL(f)); setErrors(p => ({...p, lPhoto: false})) } };
  const onAchieverPhoto = (e) => { const f = e.target.files[0]; if(f) { setAPhoto(URL.createObjectURL(f)); setErrors(p => ({...p, aPhoto: false})) } };
  
  const handleTemplate = (t) => { setTpl(t); setThemeColor(templateColors[t]); };

  const validateStep2 = () => {
    const newErrors = {};
    if(!lF.trim()) newErrors.lF = true; 
    if(!lL.trim()) newErrors.lL = true; 
    if(!lPh.trim()) newErrors.lPh = true; 
    if(!lPhoto) newErrors.lPhoto = true;

    if(!aF.trim()) newErrors.aF = true; 
    if(!aL.trim()) newErrors.aL = true; 
    if(!aCity.trim()) newErrors.aCity = true; 
    if(!aPhoto) newErrors.aPhoto = true;
    
    setErrors(newErrors); 
    return Object.keys(newErrors).length === 0;
  };

  const generate = async () => {
    if(!validateStep2()) return;
    if(points < 5){ 
      alert('Insufficient Credits (Requires 5 Points). Please recharge your wallet.'); 
      setShowRechargeModal(true);
      return; 
    }
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { credits: points - 5 });
      setPoints(p => p - 5);
      setStep(3);
    } catch(e) { 
      alert("Credit deduction error: " + e.message); 
    }
  };

  const download = async () => {
    if(!posterRef.current) return;
    const canvas = await html2canvas(posterRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: null,
      allowTaint: false,
      logging: false
    });
    const link = document.createElement('a');
    link.download = `Poster-${aF || 'Design'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const inputClass = (hasError) => `border p-3 rounded-xl w-full outline-none transition-all ${hasError ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'}`;
  const labelClass = (hasError) => `w-full border-2 border-dashed p-4 rounded-xl flex flex-col items-center cursor-pointer mb-4 font-medium transition-all ${hasError ? 'border-red-500 bg-red-50 text-red-600' : 'border-purple-300 bg-purple-50/60'}`;

  const posterUrl = `${CLOUDINARY_BASE}/w_1067,q_auto,f_auto/${getRankSlug(rank)}_${tpl}.png`;

  const getTextStyle = (config) => ({
    position: 'absolute',
    left: `${(config.x / 1067) * 100}%`,
    top: `${(config.y / 1600) * 100}%`,
    width: `${(config.w / 1067) * 100}%`,
    height: `${(config.h / 1600) * 100}%`,
    fontSize: `${config.size * 0.9}px`,
    fontFamily: config.font,
    color: textColor,
    textShadow: '2px 2px 5px rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    zIndex: 10
  });

  if(authLoading) return <div className="min-h-screen flex items-center justify-center bg-purple-100 font-bold text-purple-800">Loading system components...</div>;
  
  if(!user){
    return (
      <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4" style={{backgroundImage:`linear-gradient(135deg, #FFD6E8 0%, #E9D5FF 50%, #BFDBFE 100%)`}}>
        <div className="relative bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl rounded-[32px] p-8 md:p-12 max-w-[480px] w-full text-center">
          <img src="/logo.png" alt="Aarsh Logo" className="w-24 h-24 md:w-32 md:h-32 mx-auto object-contain bg-white rounded-[24px] p-3 shadow-lg mb-4" />
          <h1 className="font-black text-5xl md:text-6xl bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 bg-clip-text text-transparent">Aarsh</h1>
          <p className="tracking-[0.3em] font-bold text-gray-500 text-xs mt-1">AI • POSTER GENERATOR</p>
          <button onClick={handleLogin} className="w-full mt-8 bg-black text-white py-4 rounded-xl font-bold text-[15px] flex items-center justify-center gap-3 hover:bg-gray-900 shadow-lg transition-all">
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed" style={{backgroundImage:`linear-gradient(135deg, #FFD6E8 0%, #E9D5FF 50%, #BFDBFE 100%)`}}>
      
      {/* NAVBAR */}
      <div className="max-w-[1400px] mx-auto bg-white/85 backdrop-blur-xl flex flex-col md:flex-row justify-between items-center gap-2 px-4 md:px-6 py-3 rounded-b-2xl md:rounded-2xl mx-2 md:mx-auto mt-0 md:mt-3 border border-white/60 shadow-lg">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Aarsh Logo" className="w-11 h-11 md:w-12 md:h-12 object-contain bg-white rounded-xl p-1 shadow" />
          <div>
            <h1 className="font-black text-[22px] md:text-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 bg-clip-text text-transparent leading-none">Aarsh</h1>
            <p className="text-[10px] tracking-[0.2em] font-bold text-gray-500">AI • POSTER GENERATOR</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="bg-gradient-to-r from-pink-500 to-blue-600 text-white px-4 py-1.5 rounded-full font-bold shadow">
            ⭐ {points} Points
          </span>
          <button onClick={() => setShowRechargeModal(true)} className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-full font-bold text-xs shadow transition-all flex items-center gap-1">
            ➕ Recharge
          </button>
          <img src={user.photoURL} alt="user profile" className="w-8 h-8 rounded-full border-2 border-purple-200" />
          <button onClick={handleLogout} className="bg-white border px-3 py-1.5 rounded-full font-bold text-xs hover:bg-gray-50">Logout</button>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 px-2 md:px-4 pb-10 mt-4">
        
        {/* LEFT PANEL */}
        <div className="bg-white/90 backdrop-blur p-4 md:p-6 rounded-[22px] border border-white shadow-xl order-2 lg:order-1">
          <div className="mb-6 p-4 bg-purple-50 rounded-2xl border border-purple-100">
            <label className="font-black text-sm text-purple-900 block mb-2">🎨 Global Text Color:</label>
            <div className="flex items-center gap-3">
              <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
              <div className="flex gap-2">
                {['#ffffff', '#000000', '#facc15', '#38bdf8', '#f43f5e', '#a855f7'].map(color => (
                  <button key={color} onClick={() => setTextColor(color)} className="w-7 h-7 rounded-full border border-gray-300 shadow-sm" style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
          </div>

          {step === 1 && (
            <>
              <p className="text-purple-700 font-bold text-xs tracking-widest">STEP 1</p>
              <h2 className="text-xl md:text-2xl font-black mb-4">Select Target Rank & Design Layout</h2>
              <select value={rank} onChange={e => setRank(e.target.value)} className="w-full border-2 border-purple-200 p-3 md:p-4 rounded-xl mb-6 bg-white text-base outline-none focus:border-purple-500">
                {RANKS.map(r => <option key={r}>{r}</option>)}
              </select>
              <p className="font-black text-lg mb-3">Template Variants (1-5)</p>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 mb-8">
                {[1, 2, 3, 4, 5].map(i => (
                  <button key={i} onClick={() => handleTemplate(i)} className={`h-24 md:h-28 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${tpl===i?'scale-105 shadow-lg border-2':'bg-white hover:border-purple-200'}`} style={{backgroundColor: tpl===i? templateColors[i]+'20' : 'white', borderColor: tpl===i? templateColors[i] : '#E5E7EB'}}>
                    <span className="text-2xl">{['🏆','🛡️','🏅','👑','🌿'][i-1]}</span>
                    <b className="text-sm">T-{i}</b>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} className="w-full bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 text-white py-4 rounded-xl font-black text-lg shadow-lg">Proceed →</button>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-purple-700 font-bold text-xs tracking-widest">STEP 2 • FORM ENTRY</p>

              {/* LEADER SECTION */}
              <h3 className="font-black text-xl mt-3 mb-3 tracking-wide bg-gradient-to-r from-blue-700 to-purple-600 bg-clip-text text-transparent">✦ Leader Information (Upper Circle)</h3>
              <div className="grid grid-cols-1 md:grid-cols-[90px_1fr_1fr] gap-2 mb-2">
                <select value={lPre} onChange={e => setLPre(e.target.value)} className="border border-gray-200 p-3 rounded-xl bg-white outline-none">
                  <option>Mr.</option><option>Mrs.</option><option>Miss</option><option>Dr.</option>
                </select>
                <input placeholder="First Name *" value={lF} onChange={e => {setLF(e.target.value); setErrors(p => ({...p, lF: false}))}} className={inputClass(errors.lF)} />
                <input placeholder="Last Name *" value={lL} onChange={e => {setLL(e.target.value); setErrors(p => ({...p, lL: false}))}} className={inputClass(errors.lL)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                <input placeholder="Leader City" value={lCity} onChange={e => setLCity(e.target.value)} className={inputClass(false)} />
                <input placeholder="Contact Number *" value={lPh} onChange={e => {setLPh(e.target.value); setErrors(p => ({...p, lPh: false}))}} className={inputClass(errors.lPh)} />
              </div>
              <label className={labelClass(errors.lPhoto)}>☁️ Upload Leader Image (Upper Circle) *<input type="file" hidden onChange={onLeaderPhoto} accept="image/*" /></label>

              {/* ACHIEVER SECTION */}
              <h3 className="font-black text-xl mb-3 tracking-wide bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">✦ Achiever Information (Lower Circle)</h3>
              <div className="grid grid-cols-1 md:grid-cols-[90px_1fr] gap-2 mb-2">
                <select value={aPre} onChange={e => setAPre(e.target.value)} className="border border-gray-200 p-3 rounded-xl bg-white outline-none">
                  <option>Mr.</option><option>Mrs.</option><option>Miss</option><option>Dr.</option>
                </select>
                <input placeholder="First Name *" value={aF} onChange={e => {setAF(e.target.value); setErrors(p => ({...p, aF: false}))}} className={inputClass(errors.aF)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                <input placeholder="Last Name *" value={aL} onChange={e => {setAL(e.target.value); setErrors(p => ({...p, aL: false}))}} className={inputClass(errors.aL)} />
                <input placeholder="City *" value={aCity} onChange={e => {setACity(e.target.value); setErrors(p => ({...p, aCity: false}))}} className={inputClass(errors.aCity)} />
              </div>
              <label className={labelClass(errors.aPhoto)}>☁️ Upload Achiever Image (Lower Circle) *<input type="file" hidden onChange={onAchieverPhoto} accept="image/*" /></label>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setStep(1)} className="border py-3 rounded-xl font-bold">← Back</button>
                <button onClick={generate} className="bg-gradient-to-r from-pink-500 to-blue-600 text-white py-3 rounded-xl font-black shadow-lg">✨ Render Canvas (-5)</button>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="text-center py-4">
              <h2 className="text-3xl font-black bg-gradient-to-r from-pink-500 to-blue-600 bg-clip-text text-transparent">🎉 Canvas Render Complete</h2>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button onClick={() => setStep(2)} className="border py-3 rounded-xl font-bold">← Back to Editor</button>
                <button onClick={download} className="bg-black text-white py-3 rounded-xl font-black">⬇ Download Image</button>
              </div>
            </div>
          )}
        </div>

        {/* CANVAS PREVIEW */}
        <div className="bg-white/90 backdrop-blur p-4 md:p-6 rounded-[22px] border border-white shadow-xl h-fit lg:sticky top-3 order-1 lg:order-2">
          <h2 className="font-black text-center">👁️ Real-time Precise Alignment</h2>
          <p className="text-center text-xs text-gray-500 mb-3">Asset: {getRankSlug(rank)}_{tpl}</p>
          
          <div ref={posterRef} className="relative w-full rounded-xl overflow-hidden border shadow bg-white" style={{ aspectRatio: '1067 / 1600' }}>
            <img src={posterUrl} alt="template frame" className="w-full h-full block" crossOrigin="anonymous" />
            
            {/* 1. LEADER PHOTO */}
            <div 
              style={{
                position: 'absolute',
                left: `${(EXACT_COORDS.leaderCircle.x / 1067) * 100}%`,
                top: `${(EXACT_COORDS.leaderCircle.y / 1600) * 100}%`,
                width: `${(EXACT_COORDS.leaderCircle.w / 1067) * 100}%`,
                height: `${(EXACT_COORDS.leaderCircle.h / 1600) * 100}%`,
                borderRadius: '50%',
                overflow: 'hidden',
                zIndex: 5
              }}
            >
              {lPhoto && (
                <img src={lPhoto} alt="Leader" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>

            {/* Leader Labels */}
            <div style={getTextStyle(EXACT_COORDS.leaderNameBox)}>
              {lF || lL ? `${lPre} ${lF} ${lL}`.trim() : ''}
            </div>
            <div style={getTextStyle(EXACT_COORDS.leaderCityBox)}>
              {lCity}
            </div>

            {/* 2. ACHIEVER PHOTO */}
            <div 
              style={{
                position: 'absolute',
                left: `${(EXACT_COORDS.achieverCircle.x / 1067) * 100}%`,
                top: `${(EXACT_COORDS.achieverCircle.y / 1600) * 100}%`,
                width: `${(EXACT_COORDS.achieverCircle.w / 1067) * 100}%`,
                height: `${(EXACT_COORDS.achieverCircle.h / 1600) * 100}%`,
                borderRadius: '50%',
                overflow: 'hidden',
                zIndex: 5
              }}
            >
              {aPhoto && (
                <img src={aPhoto} alt="Achiever" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>

            {/* Achiever Labels */}
            <div style={getTextStyle(EXACT_COORDS.achieverNameBox)}>
              {aF || aL ? `${aPre} ${aF} ${aL}`.trim() : ''}
            </div>
            <div style={getTextStyle(EXACT_COORDS.achieverRankBox)}>
              {rank}
            </div>
            <div style={getTextStyle(EXACT_COORDS.phoneBox)}>
              {lPh ? `${lPh}` : ''}
            </div>

          </div>
        </div>

      </div>

      {/* RECHARGE / POINTS SELECTION MODAL */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative border border-purple-100 animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowRechargeModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl font-bold w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              ✕
            </button>
            
            <div className="text-center mb-6">
              <span className="text-4xl">⚡</span>
              <h2 className="text-2xl font-black text-gray-900 mt-2">Recharge Wallet Points</h2>
              <p className="text-xs text-gray-500 mt-1">Select points pack (1 Point = ₹1)</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {RECHARGE_OPTIONS.map((item) => (
                <button
                  key={item.points}
                  onClick={() => setSelectedPointsOption(item.points)}
                  className={`p-4 rounded-2xl border-2 text-left relative transition-all ${
                    selectedPointsOption === item.points 
                      ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-200 shadow-md' 
                      : 'border-gray-200 hover:border-purple-300 bg-white'
                  }`}
                >
                  {item.popular && (
                    <span className="absolute -top-2.5 right-3 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Popular
                    </span>
                  )}
                  <p className="font-black text-xl text-purple-950">{item.points} <span className="text-xs text-purple-600">Points</span></p>
                  <p className="text-sm font-bold text-gray-600">₹{item.price}</p>
                </button>
              ))}
            </div>

            <button
              onClick={() => handleRazorpayPayment(selectedPointsOption)}
              disabled={isProcessingPayment}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 rounded-xl font-black text-base shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessingPayment ? (
                <span>Processing Payment...</span>
              ) : (
                <span>Pay ₹{selectedPointsOption} via UPI / Card / NetBanking →</span>
              )}
            </button>
            
            <p className="text-[11px] text-center text-gray-400 mt-4">🔒 Secured by Razorpay Payment Gateway</p>
          </div>
        </div>
      )}

    </div>
  );
}