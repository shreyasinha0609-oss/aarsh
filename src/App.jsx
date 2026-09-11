import { useState, useRef, useEffect } from 'react';
import './App.css';
import { auth, googleProvider, db } from './firebase';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import html2canvas from 'html2canvas';

const BACKEND_URL = "https://aarsh-backend.onrender.com";

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

const templateColors = {
  1: "#6D28D9",
  2: "#059669",
  3: "#2563EB",
  4: "#EA580C",
  5: "#DB2777"
};

const RECHARGE_OPTIONS = [
  { points: 30, price: 30 },
  { points: 100, price: 100 },
  { points: 200, price: 200 },
  { points: 500, price: 500 },
  { points: 1000, price: 1000 },
  { points: 2000, price: 2000 },
];

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
  leaderCircle: {
    x: 48.9,
    y: 246.2,
    w: 359.2,
    h: 391.2
  },

  leaderNameBox: {
    x: 690.3,
    y: 560.4,
    w: 372.2,
    h: 42.8,
    size: 23,
    font: "'FrasaDisplay-Bold', Arial, sans-serif"
  },

  leaderCityBox: {
    x: 699.3,
    y: 640.4,
    w: 359.2,
    h: 42.8,
    size: 27,
    font: "'Garat', Arial, sans-serif"
  },

  achieverCircle: {
    x: 777.9,
    y: 1114.9,
    w: 247,
    h: 304.5
  },

  achieverNameBox: {
    x: 376.5,
    y: 1285,
    w: 379,
    h: 42.8,
    size: 24,
    font: "'FrasaDisplay-Bold', Arial, sans-serif"
  },

  achieverRankBox: {
    x: 460.1,
    y: 1330,
    w: 359.2,
    h: 35.9,
    size: 13,
    font: "'FrasaDisplay-Bold', Arial, sans-serif"
  },

  phoneBox: {
    x: 144.2,
    y: 1445.4,
    w: 205.6,
    h: 29.9,
    size: 18,
    font: "'ALICE', Arial, sans-serif"
  }
};

export default function App() {

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [step, setStep] = useState(1);
  const [rank, setRank] = useState(RANKS[0]);
  const [tpl, setTpl] = useState(1);
  const [themeColor, setThemeColor] = useState(templateColors[1]);

  // PHONE OTP STATES
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  // Firebase reCAPTCHA reference
  const recaptchaVerifierRef = useRef(null);

  // Form States
  const [lPre, setLPre] = useState('Mr.');
  const [lF, setLF] = useState('');
  const [lL, setLL] = useState('');
  const [lCity, setLCity] = useState('');
  const [lTextColor, setLTextColor] = useState('#ffffff');
  const [lPhoto, setLPhoto] = useState(null);

  const [aPre, setAPre] = useState('Mr.');
  const [aF, setAF] = useState('');
  const [aL, setAL] = useState('');
  const aCompany = "AWPL";
  const aPhoneCode = "+91";
  const [aPh, setAPh] = useState('');
  const [aPhoto, setAPhoto] = useState(null);
  const [aTextColor, setATextColor] = useState('#ffffff');

  const [points, setPoints] = useState(0);
  const [errors, setErrors] = useState({});
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(RECHARGE_OPTIONS[0]);
  const [isDownloading, setIsDownloading] = useState(false);

  const posterRef = useRef(null);

  // =========================================================
  // PHONE OTP - CLEANUP RECAPTCHA
  // =========================================================

  const clearRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch (e) {
        console.log("reCAPTCHA cleanup:", e);
      }

      recaptchaVerifierRef.current = null;
    }
  };

  // =========================================================
  // SEND PHONE OTP
  // =========================================================

  const sendPhoneOTP = async () => {

    const cleanPhone = phoneNumber.replace(/\D/g, '');

    if (cleanPhone.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    setPhoneLoading(true);

    try {

      clearRecaptcha();

      // Create Firebase reCAPTCHA verifier
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        {
          size: 'normal',

          callback: () => {
            console.log("reCAPTCHA verified");
          },

          'expired-callback': () => {
            alert("reCAPTCHA expired. Please try again.");
          }
        }
      );

      const formattedPhone = `+91${cleanPhone}`;

      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifierRef.current
      );

      setConfirmationResult(result);
      setOtpSent(true);
      setOtp('');

      alert("OTP sent successfully 📱");

    } catch (error) {

      console.error("Phone OTP Error:", error);

      clearRecaptcha();

      if (error.code === 'auth/invalid-phone-number') {
        alert("Invalid mobile number. Please check your number.");
      }

      else if (error.code === 'auth/too-many-requests') {
        alert("Too many attempts. Please try again later.");
      }

      else if (error.code === 'auth/quota-exceeded') {
        alert("SMS limit exceeded. Please try again later.");
      }

      else {
        alert(error.message || "Unable to send OTP.");
      }

    } finally {
      setPhoneLoading(false);
    }
  };

  // =========================================================
  // VERIFY PHONE OTP
  // =========================================================

  const verifyPhoneOTP = async () => {

    if (!confirmationResult) {
      alert("Please request OTP first.");
      return;
    }

    if (otp.length !== 6) {
      alert("Please enter the 6-digit OTP.");
      return;
    }

    setPhoneLoading(true);

    try {

      await confirmationResult.confirm(otp);

      // Firebase onAuthStateChanged will handle the login
      setConfirmationResult(null);
      setOtpSent(false);
      setOtp('');
      setPhoneNumber('');
      setShowPhoneModal(false);

      clearRecaptcha();

    } catch (error) {

      console.error("OTP Verification Error:", error);

      if (error.code === 'auth/invalid-verification-code') {
        alert("Invalid OTP. Please check the OTP and try again.");
      }

      else if (error.code === 'auth/code-expired') {
        alert("OTP expired. Please request a new OTP.");
        setOtpSent(false);
        setConfirmationResult(null);
        clearRecaptcha();
      }

      else {
        alert(error.message || "OTP verification failed.");
      }

    } finally {
      setPhoneLoading(false);
    }
  };

  // =========================================================
  // OPEN PHONE LOGIN
  // =========================================================

  const openPhoneLogin = () => {
    setOtpSent(false);
    setOtp('');
    setConfirmationResult(null);
    setPhoneNumber('');
    setPhoneLoading(false);

    clearRecaptcha();

    setShowPhoneModal(true);
  };

  // =========================================================
  // CLOSE PHONE LOGIN
  // =========================================================

  const closePhoneLogin = () => {

    setShowPhoneModal(false);

    setOtpSent(false);
    setOtp('');
    setConfirmationResult(null);
    setPhoneNumber('');
    setPhoneLoading(false);

    clearRecaptcha();
  };

  // =========================================================
  // BUY CREDITS
  // =========================================================

  const buyCredits = async (plan) => {

    if (!window.Razorpay) {
      alert("Razorpay SDK fail to load!");
      return;
    }

    try {

      const res = await fetch(`${BACKEND_URL}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: plan.price
        })
      });

      const order = await res.json();

      if (!order.id) {
        alert(
          "Order initialization failed: " +
          (order.error || "Unknown error")
        );
        return;
      }

      const options = {

        key: order.key_id,
        amount: order.amount,
        currency: "INR",

        name: "Aarsh AI",

        description: `${plan.points} Points Pack`,

        order_id: order.id,

        prefill: {
          name: user?.displayName || user?.phoneNumber || "Aarsh User",
          email: user?.email || "",
          contact: user?.phoneNumber || "9999999999"
        },

        handler: async function (response) {

          const verifyRes = await fetch(
            `${BACKEND_URL}/verify-payment`,
            {
              method: 'POST',

              headers: {
                'Content-Type': 'application/json'
              },

              body: JSON.stringify({
                ...response,
                uid: user.uid,
                points: plan.points
              })
            }
          );

          const data = await verifyRes.json();

          if (data.success) {

            setPoints(data.newCredits);

            setShowRechargeModal(false);

            alert(
              `Payment Verified! ${plan.points} Points Added ✅`
            );

          } else {

            alert("Payment verification failed!");

          }
        },

        theme: {
          color: "#6D28D9"
        }
      };

      const rzp = new window.Razorpay(options);

      rzp.open();

    } catch (e) {

      alert(
        "Order initialization error: " +
        e.message
      );

    }
  };

  // =========================================================
  // FIREBASE AUTH STATE
  // =========================================================

  useEffect(() => {

    const unsub = onAuthStateChanged(
      auth,
      async (currentUser) => {

        setUser(currentUser);

        if (currentUser) {

          const userRef = doc(
            db,
            "users",
            currentUser.uid
          );

          const snap = await getDoc(userRef);

          if (!snap.exists()) {

            await setDoc(
              userRef,
              {
                name:
                  currentUser.displayName ||
                  "Aarsh User",

                email:
                  currentUser.email || "",

                phone:
                  currentUser.phoneNumber || "",

                photo:
                  currentUser.photoURL || "",

                lastLogin: new Date(),

                credits: 0
              }
            );

            setPoints(0);

          } else {

            setPoints(
              snap.data().credits ?? 0
            );

            await setDoc(
              userRef,
              {
                lastLogin: new Date(),

                phone:
                  currentUser.phoneNumber ||
                  snap.data().phone ||
                  ""
              },
              {
                merge: true
              }
            );
          }
        }

        setAuthLoading(false);
      }
    );

    return () => unsub();

  }, []);

  // =========================================================
  // GOOGLE LOGIN
  // =========================================================

  const handleLogin = async () => {

    try {

      await signInWithPopup(
        auth,
        googleProvider
      );

    } catch (err) {

      alert(err.message);

    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {

    try {

      await signOut(auth);

    } catch (err) {

      alert(err.message);

    }
  };

  // =========================================================
  // PHOTO HANDLERS
  // =========================================================

  const onLeaderPhoto = (e) => {

    const f = e.target.files[0];

    if (f) {

      setLPhoto(
        URL.createObjectURL(f)
      );

      setErrors(p => ({
        ...p,
        lPhoto: false
      }));
    }
  };

  const onAchieverPhoto = (e) => {

    const f = e.target.files[0];

    if (f) {

      setAPhoto(
        URL.createObjectURL(f)
      );

      setErrors(p => ({
        ...p,
        aPhoto: false
      }));
    }
  };

  // =========================================================
  // TEMPLATE
  // =========================================================

  const handleTemplate = (t) => {

    setTpl(t);

    setThemeColor(
      templateColors[t]
    );
  };

  // =========================================================
  // VALIDATION
  // =========================================================

  const validateStep2 = () => {

    const newErrors = {};

    if (!lF.trim())
      newErrors.lF = true;

    if (!lL.trim())
      newErrors.lL = true;

    if (!lCity.trim())
      newErrors.lCity = true;

    if (!lPhoto)
      newErrors.lPhoto = true;

    if (!aF.trim())
      newErrors.aF = true;

    if (!aL.trim())
      newErrors.aL = true;

    if (!aPh.trim())
      newErrors.aPh = true;

    if (!aPhoto)
      newErrors.aPhoto = true;

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // =========================================================
  // GENERATE
  // =========================================================

  const generate = async () => {

    if (!validateStep2())
      return;

    if (points < 5) {

      alert(
        'Insufficient Credits (Requires 5). Please purchase more.'
      );

      return;
    }

    try {

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      await updateDoc(
        userRef,
        {
          credits: points - 5
        }
      );

      setPoints(
        p => p - 5
      );

      setStep(3);

    } catch (e) {

      alert(
        "Credit deduction error: " +
        e.message
      );
    }
  };

  // =========================================================
  // DOWNLOAD
  // =========================================================

  const download = async () => {

    if (!posterRef.current || isDownloading)
      return;

    setIsDownloading(true);

    try {

      if (
        document.fonts &&
        document.fonts.ready
      ) {
        await document.fonts.ready;
      }

      const canvas = await html2canvas(
        posterRef.current,
        {
          scale: 2,

          useCORS: true,

          allowTaint: false,

          backgroundColor: null,

          logging: false,

          onclone: (
            clonedDoc
          ) => {

            const textElements =
              clonedDoc.querySelectorAll(
                '[data-poster-text]'
              );

            textElements.forEach(
              (el) => {

                el.style.opacity = '1';

                el.style.visibility =
                  'visible';

                el.style.overflow =
                  'visible';
              }
            );
          }
        }
      );

      const link =
        document.createElement('a');

      link.download =
        `Poster-${aF || 'Design'}.png`;

      link.href =
        canvas.toDataURL(
          'image/png',
          1.0
        );

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

    } catch (err) {

      alert(
        "Download failed: " +
        err.message
      );

    } finally {

      setIsDownloading(false);

    }
  };

  // =========================================================
  // INPUT CLASSES
  // =========================================================

  const inputClass = (hasError) =>
    `border p-3 rounded-xl w-full outline-none transition-all ${
      hasError
        ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
        : 'border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
    }`;

  const labelClass = (hasError) =>
    `w-full border-2 border-dashed p-4 rounded-xl flex flex-col items-center cursor-pointer mb-4 font-medium transition-all ${
      hasError
        ? 'border-red-500 bg-red-50 text-red-600'
        : 'border-purple-300 bg-purple-50/60'
    }`;

  const posterUrl =
    `${CLOUDINARY_BASE}/w_1067,q_auto,f_auto/${getRankSlug(rank)}_${tpl}.png`;

  // =========================================================
  // TEXT STYLE
  // =========================================================

  const getTextStyle = (
    config,
    customColor
  ) => ({

    position: 'absolute',

    left:
      `${(config.x / 1067) * 100}%`,

    top:
      `${(config.y / 1600) * 100}%`,

    width:
      `${(config.w / 1067) * 100}%`,

    height:
      `${(config.h / 1600) * 100}%`,

    fontSize:
      `${config.size * 0.9}px`,

    fontFamily:
      config.font,

    color:
      customColor,

    textShadow:
      '2px 2px 5px rgba(0, 0, 0, 0.85)',

    display:
      'flex',

    alignItems:
      'center',

    whiteSpace:
      'nowrap',

    overflow:
      'visible',

    zIndex:
      10
  });

  // =========================================================
  // AUTH LOADING
  // =========================================================

  if (authLoading) {

    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-100 font-bold">
        Loading system components...
      </div>
    );
  }

  // =========================================================
  // LOGIN PAGE
  // =========================================================

  if (!user) {

    return (
      <div className="aarsh-login-page">

        {/* Decorative floating elements */}

        <div className="login-decoration decoration-star">
          ✦
        </div>

        <div className="login-decoration decoration-sparkle">
          ✦
        </div>

        <div className="login-decoration decoration-heart">
          ♡
        </div>

        <div className="login-decoration decoration-smile">
          ☺
        </div>

        {/* LEFT CREATIVE AREA */}

        <div className="login-side login-side-left">

          <div className="creative-note note-yellow">

            <span>✨</span>

            <b>
              Turn Ideas
            </b>

            <small>
              into amazing posters!
            </small>

          </div>

          <div className="login-illustration-placeholder">

            <div className="illustration-circle yellow-circle">

              <span>
                😄
              </span>

            </div>

            <div className="illustration-person yellow-person">
              👦
            </div>

          </div>

          <div className="floating-object object-book">
            📚
          </div>

          <div className="floating-object object-coffee">
            ☕
          </div>

        </div>

        {/* CENTER LOGIN CARD */}

        <div className="aarsh-login-card">

          <div className="login-logo-wrap">

            <img
              src="/logo.png"
              alt="Aarsh Logo"
              className="login-logo"
            />

          </div>

          <div className="login-brand">

            <h1>
              Aarsh
            </h1>

            <p>
              AI • POSTER GENERATOR
            </p>

          </div>

          <div className="login-heading">

            <h2>

              Create Posters
              <br />

              that Make People
              <br />

              <span>
                Smile 😊
              </span>

            </h2>

            <p>
              Create • Customize • Share
            </p>

          </div>

          {/* GOOGLE LOGIN */}

          <button
            onClick={handleLogin}
            className="login-google-btn"
          >

            <span className="google-icon">
              G
            </span>

            <span>
              Continue with Google
            </span>

            <span className="button-arrow">
              →
            </span>

          </button>

          {/* DIVIDER */}

          <div className="login-divider">

            <span></span>

            <b>
              OR
            </b>

            <span></span>

          </div>

          {/* PHONE LOGIN */}

          <button
            type="button"
            className="login-phone-btn"
            onClick={openPhoneLogin}
          >

            <span className="phone-icon">
              📱
            </span>

            <span>

              <strong>
                Continue with Phone
              </strong>

              <small>
                Get OTP instantly
              </small>

            </span>

            <span className="button-arrow">
              →
            </span>

          </button>

          <div className="login-trust">

            <span>
              🔒
            </span>

            <span>
              Secure &amp; simple login
            </span>

          </div>

          <div className="login-happiness">

            <span>
              ✨
            </span>

            <span>
              Let's create something awesome!
            </span>

            <span>
              ✨
            </span>

          </div>

        </div>

        {/* RIGHT CREATIVE AREA */}

        <div className="login-side login-side-right">

          <div className="creative-note note-purple">

            <span>
              🎨
            </span>

            <b>
              Design is Fun!
            </b>

            <small>
              Make something awesome
            </small>

          </div>

          <div className="login-illustration-placeholder">

            <div className="illustration-circle purple-circle">

              <span>
                ✌️
              </span>

            </div>

            <div className="illustration-person purple-person">
              👩
            </div>

          </div>

          <div className="floating-object object-laptop">
            💻
          </div>

          <div className="floating-object object-sparkle">
            ✨
          </div>

        </div>

        {/* BOTTOM FEATURES */}

        <div className="login-features">

          <div className="login-feature">

            <span>
              ✨
            </span>

            <div>

              <b>
                Beautiful Templates
              </b>

              <small>
                Ready to create
              </small>

            </div>

          </div>

          <div className="login-feature">

            <span>
              ⚡
            </span>

            <div>

              <b>
                Super Easy
              </b>

              <small>
                Just a few clicks
              </small>

            </div>

          </div>

          <div className="login-feature">

            <span>
              ❤️
            </span>

            <div>

              <b>
                Made for Everyone
              </b>

              <small>
                Create &amp; share happiness
              </small>

            </div>

          </div>

        </div>

        {/* =================================================
            PHONE OTP MODAL
        ================================================= */}

        {showPhoneModal && (

          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{
              background:
                'rgba(15, 23, 42, 0.65)',
              backdropFilter:
                'blur(10px)'
            }}
            onMouseDown={(e) => {

              if (
                e.target === e.currentTarget
              ) {
                closePhoneLogin();
              }

            }}
          >

            <div
              className="relative bg-white w-full max-w-md rounded-[30px] shadow-2xl p-6 md:p-8"
              style={{
                animation:
                  'aarshPhoneModalIn 0.25s ease-out'
              }}
            >

              {/* CLOSE BUTTON */}

              <button
                type="button"
                onClick={closePhoneLogin}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-lg transition-all"
              >
                ✕
              </button>

              {/* SEND OTP SCREEN */}

              {!otpSent ? (

                <>

                  <div
                    className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-4"
                    style={{
                      background:
                        'linear-gradient(135deg, #FCE7F3, #EDE9FE)'
                    }}
                  >
                    📱
                  </div>

                  <h2 className="text-2xl md:text-3xl font-black text-center text-gray-900">
                    Login with Phone
                  </h2>

                  <p className="text-center text-gray-500 text-sm mt-2 mb-6">
                    Enter your mobile number and we'll send you a secure OTP.
                  </p>

                  {/* PHONE NUMBER */}

                  <div className="flex items-center border-2 border-purple-100 focus-within:border-purple-500 rounded-2xl overflow-hidden bg-gray-50 mb-5">

                    <div className="px-4 py-4 font-bold text-gray-700 border-r bg-white">
                      🇮🇳 +91
                    </div>

                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="10-digit mobile number"
                      maxLength="10"
                      value={phoneNumber}
                      onChange={(e) =>
                        setPhoneNumber(
                          e.target.value
                            .replace(/\D/g, '')
                            .slice(0, 10)
                        )
                      }
                      className="flex-1 px-4 py-4 bg-transparent outline-none text-lg font-semibold"
                    />

                  </div>

                  {/* RECAPTCHA */}

                  <div
                    id="recaptcha-container"
                    className="flex justify-center mb-5 overflow-hidden"
                  ></div>

                  {/* SEND OTP BUTTON */}

                  <button
                    type="button"
                    onClick={sendPhoneOTP}
                    disabled={phoneLoading}
                    className="w-full py-4 rounded-2xl text-white font-black text-lg shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background:
                        'linear-gradient(135deg, #ec4899, #7c3aed, #2563eb)'
                    }}
                  >

                    {phoneLoading
                      ? "⏳ Sending OTP..."
                      : "Send OTP →"}

                  </button>

                  <p className="text-center text-xs text-gray-400 mt-4">
                    🔒 Your phone number is securely handled by Firebase.
                  </p>

                </>

              ) : (

                /* OTP SCREEN */

                <>

                  <div
                    className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-4"
                    style={{
                      background:
                        'linear-gradient(135deg, #DCFCE7, #DBEAFE)'
                    }}
                  >
                    🔐
                  </div>

                  <h2 className="text-2xl md:text-3xl font-black text-center text-gray-900">
                    Enter OTP
                  </h2>

                  <p className="text-center text-gray-500 text-sm mt-2 mb-6">

                    We've sent a 6-digit OTP to
                    <br />

                    <strong className="text-purple-700">
                      +91 {phoneNumber}
                    </strong>

                  </p>

                  {/* OTP INPUT */}

                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="••••••"
                    maxLength="6"
                    value={otp}
                    autoFocus
                    onChange={(e) =>
                      setOtp(
                        e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 6)
                      )
                    }
                    className="w-full border-2 border-purple-100 focus:border-purple-500 rounded-2xl py-4 px-4 text-center text-3xl font-black tracking-[0.5em] outline-none mb-5"
                  />

                  {/* VERIFY */}

                  <button
                    type="button"
                    onClick={verifyPhoneOTP}
                    disabled={phoneLoading}
                    className="w-full py-4 rounded-2xl text-white font-black text-lg shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background:
                        'linear-gradient(135deg, #ec4899, #7c3aed, #2563eb)'
                    }}
                  >

                    {phoneLoading
                      ? "⏳ Verifying..."
                      : "Verify & Login 🚀"}

                  </button>

                  {/* CHANGE NUMBER */}

                  <button
                    type="button"
                    onClick={() => {

                      setOtpSent(false);
                      setOtp('');
                      setConfirmationResult(null);

                      clearRecaptcha();

                    }}
                    className="w-full mt-3 py-3 rounded-xl font-bold text-purple-700 hover:bg-purple-50 transition-all"
                  >
                    ← Change mobile number
                  </button>

                  <p className="text-center text-xs text-gray-400 mt-2">
                    Didn't receive the OTP? You can go back and request again.
                  </p>

                </>

              )}

            </div>

          </div>

        )}

        {/* MODAL ANIMATION */}

        <style>
          {`
            @keyframes aarshPhoneModalIn {
              from {
                opacity: 0;
                transform: translateY(20px) scale(0.96);
              }

              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}
        </style>

      </div>
    );
  }

  // =========================================================
  // MAIN APP
  // =========================================================

  return (

    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundImage:
          `linear-gradient(135deg, #FFD6E8 0%, #E9D5FF 50%, #BFDBFE 100%)`
      }}
    >

      {/* HEADER */}

      <div className="max-w-[1400px] mx-auto bg-white/85 backdrop-blur-xl flex flex-col md:flex-row justify-between items-center gap-2 px-4 md:px-6 py-3 rounded-b-2xl md:rounded-2xl mx-2 md:mx-auto mt-0 md:mt-3 border border-white/60 shadow-lg">

        <div className="flex items-center gap-3">

          <img
            src="/logo.png"
            alt="Aarsh Logo"
            className="w-11 h-11 md:w-12 md:h-12 object-contain bg-white rounded-xl p-1 shadow"
          />

          <div>

            <h1 className="font-black text-[22px] md:text-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 bg-clip-text text-transparent leading-none">
              Aarsh
            </h1>

            <p className="text-[10px] tracking-[0.2em] font-bold text-gray-500">
              AI • POSTER GENERATOR
            </p>

          </div>

        </div>

        <div className="flex items-center gap-3 text-sm">

          <span className="bg-gradient-to-r from-pink-500 to-blue-600 text-white px-4 py-1.5 rounded-full font-bold shadow">
            ⭐ {points} Points
          </span>

          <button
            onClick={() =>
              setShowRechargeModal(true)
            }
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-full font-bold text-xs shadow"
          >
            + Recharge
          </button>

          {user.photoURL ? (

            <img
              src={user.photoURL}
              alt="user profile"
              className="w-8 h-8 rounded-full border-2 border-purple-200"
            />

          ) : (

            <div className="w-8 h-8 rounded-full border-2 border-purple-200 bg-purple-100 flex items-center justify-center font-bold text-purple-700">
              {(
                user.displayName ||
                user.phoneNumber ||
                "A"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

          )}

          <button
            onClick={handleLogout}
            className="bg-white border px-3 py-1.5 rounded-full font-bold text-xs hover:bg-gray-50"
          >
            Logout
          </button>

        </div>

      </div>

      {/* MAIN GRID */}

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 px-2 md:px-4 pb-10 mt-4">

        <div className="bg-white/90 backdrop-blur p-4 md:p-6 rounded-[22px] border border-white shadow-xl order-2 lg:order-1">

          {/* STEP 1 */}

          {step === 1 && (

            <>

              <p className="text-purple-700 font-bold text-xs tracking-widest">
                STEP 1
              </p>

              <h2 className="text-xl md:text-2xl font-black mb-4">
                Select Target Rank & Design Layout
              </h2>

              <select
                value={rank}
                onChange={e =>
                  setRank(e.target.value)
                }
                className="w-full border-2 border-purple-200 p-3 md:p-4 rounded-xl mb-6 bg-white text-base outline-none focus:border-purple-500"
              >

                {RANKS.map(r => (

                  <option key={r}>
                    {r}
                  </option>

                ))}

              </select>

              <p className="font-black text-lg mb-3">
                Template Variants (1-15)
              </p>

              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 mb-8">

                {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(i => (

                  <button
                    key={i}
                    onClick={() =>
                      handleTemplate(i)
                    }
                    className={`h-24 md:h-28 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                      tpl === i
                        ? 'scale-105 shadow-lg border-2'
                        : 'bg-white hover:border-purple-200'
                    }`}
                    style={{
                      backgroundColor:
                        tpl === i
                          ? (templateColors[i] || '#6D28D9') + '20'
                          : 'white',

                      borderColor:
                        tpl === i
                          ? (templateColors[i] || '#6D28D9')
                          : '#E5E7EB'
                    }}
                  >

                    <span className="text-2xl">
                      {['🏆','🛡️','🏅','👑','🌿'][i-1]}
                    </span>

                    <b className="text-sm">
                      T-{i}
                    </b>

                  </button>

                ))}

              </div>

              <button
                onClick={() =>
                  setStep(2)
                }
                className="w-full bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 text-white py-4 rounded-xl font-black text-lg shadow-lg"
              >
                Proceed →
              </button>

            </>

          )}

          {/* STEP 2 */}

          {step === 2 && (

            <>

              <p className="text-purple-700 font-bold text-xs tracking-widest">
                STEP 2 • FORM ENTRY
              </p>

              {/* LEADER */}

              <h3 className="font-black text-xl mt-3 mb-3 tracking-wide bg-gradient-to-r from-blue-700 to-purple-600 bg-clip-text text-transparent">
                ✦ Leader Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-[100px_1fr_1fr] gap-2 mb-2">

                <select
                  value={lPre}
                  onChange={e =>
                    setLPre(e.target.value)
                  }
                  className="border border-gray-200 p-3 rounded-xl bg-white outline-none"
                >

                  <option value="Mr.">
                    Mr.
                  </option>

                  <option value="Mrs.">
                    Mrs.
                  </option>

                  <option value="Miss">
                    Miss
                  </option>

                  <option value="Dr.">
                    Dr.
                  </option>

                </select>

                <input
                  placeholder="First Name *"
                  value={lF}
                  onChange={e => {

                    setLF(e.target.value);

                    setErrors(p => ({
                      ...p,
                      lF: false
                    }));

                  }}
                  className={inputClass(errors.lF)}
                />

                <input
                  placeholder="Last Name *"
                  value={lL}
                  onChange={e => {

                    setLL(e.target.value);

                    setErrors(p => ({
                      ...p,
                      lL: false
                    }));

                  }}
                  className={inputClass(errors.lL)}
                />

              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_80px] gap-2 mb-2 items-center">

                <input
                  placeholder="City *"
                  value={lCity}
                  onChange={e => {

                    setLCity(e.target.value);

                    setErrors(p => ({
                      ...p,
                      lCity: false
                    }));

                  }}
                  className={inputClass(errors.lCity)}
                />

                <div className="flex flex-col items-center">

                  <span className="text-[10px] font-bold text-gray-500 mb-1">
                    Color
                  </span>

                  <input
                    type="color"
                    value={lTextColor}
                    onChange={e =>
                      setLTextColor(e.target.value)
                    }
                    className="w-12 h-9 rounded-lg cursor-pointer border-0 p-0"
                  />

                </div>

              </div>

              <label className={labelClass(errors.lPhoto)}>

                ☁️ Upload Leader Image (Upper Circle) *

                <input
                  type="file"
                  hidden
                  onChange={onLeaderPhoto}
                  accept="image/*"
                />

              </label>

              {/* ACHIEVER */}

              <h3 className="font-black text-xl mb-3 tracking-wide bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
                ✦ Achiever Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-[100px_1fr_1fr] gap-2 mb-2">

                <select
                  value={aPre}
                  onChange={e =>
                    setAPre(e.target.value)
                  }
                  className="border border-gray-200 p-3 rounded-xl bg-white outline-none"
                >

                  <option value="Mr.">
                    Mr.
                  </option>

                  <option value="Mrs.">
                    Mrs.
                  </option>

                  <option value="Miss">
                    Miss
                  </option>

                  <option value="Dr.">
                    Dr.
                  </option>

                </select>

                <input
                  placeholder="First Name *"
                  value={aF}
                  onChange={e => {

                    setAF(e.target.value);

                    setErrors(p => ({
                      ...p,
                      aF: false
                    }));

                  }}
                  className={inputClass(errors.aF)}
                />

                <input
                  placeholder="Last Name *"
                  value={aL}
                  onChange={e => {

                    setAL(e.target.value);

                    setErrors(p => ({
                      ...p,
                      aL: false
                    }));

                  }}
                  className={inputClass(errors.aL)}
                />

              </div>

              <div className="grid grid-cols-[90px_65px_1fr] gap-2 mb-2">

                <input
                  value={aCompany}
                  readOnly
                  className="border border-gray-200 p-3 rounded-xl bg-gray-100 font-bold text-center outline-none"
                />

                <input
                  value={aPhoneCode}
                  readOnly
                  className="border border-gray-200 p-3 rounded-xl bg-gray-100 text-center outline-none"
                />

                <input
                  placeholder="Mobile Number *"
                  value={aPh}
                  onChange={e => {

                    setAPh(e.target.value);

                    setErrors(p => ({
                      ...p,
                      aPh: false
                    }));

                  }}
                  className={inputClass(errors.aPh)}
                />

              </div>

              <label className={labelClass(errors.aPhoto)}>

                ☁️ Upload Achiever Image (Lower Circle) *

                <input
                  type="file"
                  hidden
                  onChange={onAchieverPhoto}
                  accept="image/*"
                />

              </label>

              <div className="flex items-center justify-between bg-purple-50 p-3 rounded-xl mb-4 border border-purple-100">

                <span className="text-sm font-bold text-purple-900">
                  Achiever Text Color:
                </span>

                <input
                  type="color"
                  value={aTextColor}
                  onChange={e =>
                    setATextColor(e.target.value)
                  }
                  className="w-12 h-8 rounded-lg cursor-pointer border-0 p-0"
                />

              </div>

              <div className="grid grid-cols-2 gap-3">

                <button
                  onClick={() =>
                    setStep(1)
                  }
                  className="border py-3 rounded-xl font-bold"
                >
                  ← Back
                </button>

                <button
                  onClick={generate}
                  className="bg-gradient-to-r from-pink-500 to-blue-600 text-white py-3 rounded-xl font-black shadow-lg"
                >
                  ✨ Render Canvas (-5)
                </button>

              </div>

            </>

          )}

          {/* STEP 3 */}

          {step === 3 && (

            <div className="text-center py-4">

              <h2 className="text-3xl font-black bg-gradient-to-r from-pink-500 to-blue-600 bg-clip-text text-transparent">
                🎉 Canvas Render Complete
              </h2>

              <div className="grid grid-cols-2 gap-3 mt-6">

                <button
                  onClick={() =>
                    setStep(2)
                  }
                  className="border py-3 rounded-xl font-bold"
                >
                  ← Back to Editor
                </button>

                <button
                  onClick={download}
                  disabled={isDownloading}
                  className="bg-black hover:bg-gray-900 text-white py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2"
                >

                  {isDownloading
                    ? "⏳ Generating HD Image..."
                    : "⬇ Download Image"}

                </button>

              </div>

            </div>

          )}

        </div>

        {/* CANVAS PREVIEW */}

        <div className="bg-white/90 backdrop-blur p-4 md:p-6 rounded-[22px] border border-white shadow-xl h-fit lg:sticky top-3 order-1 lg:order-2">

          <h2 className="font-black text-center">
            👁️ Real-time Precise Alignment
          </h2>

          <p className="text-center text-xs text-gray-500 mb-3">
            Asset: {getRankSlug(rank)}_{tpl}
          </p>

          <div
            ref={posterRef}
            className="relative w-full rounded-xl overflow-hidden border shadow bg-white"
            style={{
              aspectRatio: '1067 / 1600'
            }}
          >

            <img
              src={posterUrl}
              alt="template frame"
              className="w-full h-full block"
              crossOrigin="anonymous"
            />

            {/* LEADER PHOTO */}

            <div
              style={{
                position: 'absolute',

                left:
                  `${(EXACT_COORDS.leaderCircle.x / 1067) * 100}%`,

                top:
                  `${(EXACT_COORDS.leaderCircle.y / 1600) * 100}%`,

                width:
                  `${(EXACT_COORDS.leaderCircle.w / 1067) * 100}%`,

                height:
                  `${(EXACT_COORDS.leaderCircle.h / 1600) * 100}%`,

                borderRadius: '50%',

                overflow: 'hidden',

                zIndex: 5
              }}
            >

              {lPhoto && (

                <img
                  src={lPhoto}
                  alt="Leader"
                  crossOrigin="anonymous"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />

              )}

            </div>

            {/* LEADER TEXT */}

            <div
              data-poster-text
              style={getTextStyle(
                EXACT_COORDS.leaderNameBox,
                lTextColor
              )}
            >

              {lF || lL
                ? `${lPre} ${lF} ${lL}`.trim()
                : ''}

            </div>

            <div
              data-poster-text
              style={getTextStyle(
                EXACT_COORDS.leaderCityBox,
                lTextColor
              )}
            >

              {lCity
                ? lCity.toUpperCase()
                : ''}

            </div>

            {/* ACHIEVER PHOTO */}

            <div
              style={{
                position: 'absolute',

                left:
                  `${(EXACT_COORDS.achieverCircle.x / 1067) * 100}%`,

                top:
                  `${(EXACT_COORDS.achieverCircle.y / 1600) * 100}%`,

                width:
                  `${(EXACT_COORDS.achieverCircle.w / 1067) * 100}%`,

                height:
                  `${(EXACT_COORDS.achieverCircle.h / 1600) * 100}%`,

                borderRadius: '50%',

                overflow: 'hidden',

                zIndex: 5
              }}
            >

              {aPhoto && (

                <img
                  src={aPhoto}
                  alt="Achiever"
                  crossOrigin="anonymous"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />

              )}

            </div>

            {/* ACHIEVER TEXT */}

            <div
              data-poster-text
              style={getTextStyle(
                EXACT_COORDS.achieverNameBox,
                aTextColor
              )}
            >

              {aF || aL
                ? `${aPre} ${aF} ${aL}`.trim()
                : ''}

            </div>

            <div
              data-poster-text
              style={getTextStyle(
                EXACT_COORDS.achieverRankBox,
                aTextColor
              )}
            >

              {rank
                ? rank.toUpperCase()
                : ''}

            </div>

            <div
              data-poster-text
              style={getTextStyle(
                EXACT_COORDS.phoneBox,
                aTextColor
              )}
            >

              {aPh
                ? `${aPhoneCode} ${aPh}`
                : ''}

            </div>

          </div>

        </div>

      </div>

      {/* RECHARGE MODAL */}

      {showRechargeModal && (

        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">

          <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-white">

            <div className="flex justify-between items-center mb-4">

              <h3 className="font-black text-2xl bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Recharge Points
              </h3>

              <button
                onClick={() =>
                  setShowRechargeModal(false)
                }
                className="text-gray-400 hover:text-black font-bold text-xl"
              >
                ✕
              </button>

            </div>

            <p className="text-gray-500 text-sm mb-6">
              Choose a plan to instantly add points to your account.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">

              {RECHARGE_OPTIONS.map(
                (plan) => (

                  <button
                    key={plan.points}
                    onClick={() =>
                      setSelectedPlan(plan)
                    }
                    className={`p-4 rounded-2xl border-2 text-center transition-all ${
                      selectedPlan.points === plan.points
                        ? 'border-purple-600 bg-purple-50 shadow-md scale-[1.02]'
                        : 'border-gray-200 hover:border-purple-300 bg-white'
                    }`}
                  >

                    <p className="font-black text-xl text-purple-900">
                      {plan.points} Points
                    </p>

                    <p className="text-xs text-gray-500 font-bold mt-1">
                      ₹{plan.price}
                    </p>

                  </button>

                )
              )}

            </div>

            <button
              onClick={() =>
                buyCredits(selectedPlan)
              }
              className="w-full bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 text-white py-4 rounded-xl font-black text-lg shadow-lg hover:opacity-95"
            >
              Pay ₹{selectedPlan.price} with Razorpay
            </button>

          </div>

        </div>

      )}

    </div>
  );
}