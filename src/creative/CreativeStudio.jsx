import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { removeBackground } from '@imgly/background-removal';
import './CreativeStudio.css';

const MAX_BANNER_PEOPLE = 22;
const RANK_TEMPLATE_COUNT = 45;
const RANK_TEMPLATE_BASE = '/templates/rank-common-4k';
const WELCOME_TEMPLATE_COUNT = 11;
const WELCOME_TEMPLATE_BASE = '/templates/welcome';
const CLOSING_TEMPLATE_COUNT = 11;
const CLOSING_TEMPLATE_BASE = '/templates/closing';

const getRankTemplateUrl = (no) => {
  const padded = String(no).padStart(2, '0');
  return `${RANK_TEMPLATE_BASE}/${padded}.jpeg`;
};

// 🎯 Har category ke liye possible candidate file paths (1-11 sab load honge)
const getTemplateCandidates = (category, no) => {
  const num = String(no);
  const padded = num.padStart(2, '0');
  const base = category === 'welcome' 
    ? WELCOME_TEMPLATE_BASE 
    : category === 'closing' 
      ? CLOSING_TEMPLATE_BASE 
      : RANK_TEMPLATE_BASE;

  if (category === 'welcome' || category === 'closing') {
    return Array.from(new Set([
      `${base}/${num}.jpg`,
      `${base}/${padded}.jpg`,
      `${base}/${num}.jpeg`,
      `${base}/${padded}.jpeg`,
      `${base}/${num}.png`,
      `${base}/${padded}.png`
    ]));
  }

  return Array.from(new Set([
    `${base}/${padded}.jpeg`,
    `${base}/${padded}.jpg`,
    `${base}/${padded}.png`,
    `${base}/${num}.jpeg`,
    `${base}/${num}.jpg`
  ]));
};

const getCategoryTemplateUrl = (category, no) => {
  return getTemplateCandidates(category, no)[0];
};

// 🎯 Auto-Fallback Image Component: Jo bhi extension hogi bina atke load kar lega
function SmartTemplateImage({ category, no, alt, className, style, loading = "lazy", fetchPriority }) {
  const candidates = getTemplateCandidates(category, no);
  const [currIndex, setCurrIndex] = useState(0);

  useEffect(() => {
    setCurrIndex(0);
  }, [category, no]);

  return (
    <img
      key={`${category}-${no}-${currIndex}`}
      src={candidates[currIndex]}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      fetchPriority={fetchPriority || (loading === "eager" ? "high" : "auto")}
      decoding="async"
      draggable="false"
      onError={() => {
        setCurrIndex((prev) => (prev + 1 < candidates.length ? prev + 1 : prev));
      }}
    />
  );
}

const RANK_INCOME = {
  Bronze: '₹2,500', Silver: '₹7,500', Gold: '₹15,000', Platinum: '₹32,000',
  Emerald: '₹69,000', Topaz: '₹2,30,000', 'Ruby Star': '₹3,50,000', Sapphire: '₹6,00,000',
  'Star Sapphire': '₹13,00,000', Diamond: '₹22,00,000', 'Blue Diamond': '₹41,20,000',
  'Black Diamond': '₹73,40,000', 'Royal Diamond': '₹1,35,80,000', 'Crown Diamond': '₹2,66,00,000',
  Ambassador: '₹4,57,20,000', 'Royal Ambassador': '₹8,99,40,000',
  'Crown Ambassador': '₹17,78,80,000', 'Brand Ambassador': '₹36,57,60,000'
};

const CATEGORIES = [
  { id: 'rank-promotion', label: 'Rank Promotion', icon: '/assets/categories/rank-trophy.png', desc: '18 ranks', isRank: true, theme: 'cat-theme-gold' },
  { id: 'welcome', label: 'Welcome Banner', icon: '/assets/categories/icon-welcome.png', desc: 'Create a warm and professional welcome banner.', isDirect: true, theme: 'cat-theme-peach' },
  { id: 'closing', label: 'Closing Banner', icon: '/assets/categories/icon-closing.png', desc: 'Create attractive closing banners for your events.', isDirect: true, theme: 'cat-theme-rose' },
  { id: 'leader-studio', label: 'Leadr. Studio Virtual World Tour', icon: '/assets/categories/icon-world-tour.png', desc: 'Virtual tour promotion creatives.', theme: 'cat-theme-cyan' },
  { id: 'motivation', label: 'Motivation Quote', icon: '/assets/categories/icon-motivation.png', desc: 'Inspiring quotes for your team.', theme: 'cat-theme-amber' },
  { id: 'income', label: 'Income Banner', icon: '/assets/categories/icon-income.png', desc: 'Showcase income achievements.', theme: 'cat-theme-emerald' },
  { id: 'festival', label: 'Festival', icon: '/assets/categories/icon-festival.png', desc: 'Festival special creative posts.', theme: 'cat-theme-orange' },
  { id: 'achievements', label: 'Achievements', icon: '/assets/categories/icon-achievements.png', desc: 'Celebrate achievements.', theme: 'cat-theme-indigo' },
  { id: 'bonanza', label: 'Bonanza Promotion', icon: '/assets/categories/icon-bonanza.png', desc: 'Promotional banners for bonanza.', theme: 'cat-theme-pink' },
  { id: 'anniversary', label: 'Anniversary', icon: '/assets/categories/icon-anniversary.png', desc: 'Anniversary special creatives.', theme: 'cat-theme-purple' },
  { id: 'thank-you', label: 'Thank You Message', icon: '/assets/categories/icon-thankyou.png', desc: 'Express gratitude with creatives.', theme: 'cat-theme-teal' },
  { id: 'meeting', label: 'Meeting', icon: '/assets/categories/icon-meeting.png', desc: 'Meeting invitation banners.', theme: 'cat-theme-blue' },
  { id: 'capping', label: 'Capping Achievements', icon: '/assets/categories/icon-capping.png', desc: 'Capping achievement creatives.', theme: 'cat-theme-violet' },
];

const RANKS = [
  'Rank 1: Bronze', 'Rank 2: Silver', 'Rank 3: Gold', 'Rank 4: Platinum',
  'Rank 5: Emerald', 'Rank 6: Topaz', 'Rank 7: Ruby Star', 'Rank 8: Sapphire',
  'Rank 9: Star Sapphire', 'Rank 10: Diamond', 'Rank 11: Blue Diamond',
  'Rank 12: Black Diamond', 'Rank 13: Royal Diamond', 'Rank 14: Crown Diamond',
  'Rank 15: Ambassador', 'Rank 16: Royal Ambassador', 'Rank 17: Crown Ambassador',
  'Rank 18: Brand Ambassador'
];

const RANK_THEMES = [
  'rp-bronze', 'rp-silver', 'rp-gold', 'rp-platinum', 'rp-emerald', 'rp-topaz',
  'rp-ruby', 'rp-sapphire', 'rp-star', 'rp-diamond', 'rp-blue-diamond',
  'rp-black-diamond', 'rp-royal-diamond', 'rp-crown-diamond', 'rp-ambassador',
  'rp-royal-ambassador', 'rp-crown-ambassador', 'rp-brand-ambassador'
];

const RANK_ASSETS = [
  'Bronze.png', 'Silver.png', 'Gold.png', 'Platinum.png',
  'Emerald.png', 'Topaz.png', 'Ruby_Star.png', 'Sapphire.png',
  'Star_Sapphire.png', 'Diamond.png', 'Blue_Diamond.png',
  'Black_Diamond.png', 'Royal_Diamond.png', 'Crown_Diamond.png',
  'Ambassador.png', 'Royal_Ambassador.png', 'Crown_Ambassador.png',
  'Brand_Ambassador.png'
];

const RANK_OPTIONS = RANKS.map((label, index) => ({
  id: label,
  label: label.replace(/^Rank\s+\d+:\s*/, ''),
  rank: index + 1,
  theme: RANK_THEMES[index],
  image: `/rank-assets/${RANK_ASSETS[index]}`
}));

const STORAGE_KEY = 'aarsh-creative-banner-settings-v1';

// Shared, permanent Cloudinary assets. These URLs are the defaults for every device.
const DEFAULT_BANNER_ASSETS = {
  fighterLogo: 'https://res.cloudinary.com/httsesgq/image/upload/v1793255694/fighter_logo.png',
  fighterStudio: 'https://res.cloudinary.com/httsesgq/image/upload/v1793255695/fighter_success_system_logo.png',
  asclepiasLogo: 'https://res.cloudinary.com/httsesgq/image/upload/v1793255696/asclepias_logo.png',
};
const DEFAULT_UPLINE_PHOTOS = [
  'https://res.cloudinary.com/httsesgq/image/upload/v1793255694/upline_01.png',
  'https://res.cloudinary.com/httsesgq/image/upload/v1793255694/upline_02.png',
  'https://res.cloudinary.com/httsesgq/image/upload/v1793255695/upline_03.png',
  'https://res.cloudinary.com/httsesgq/image/upload/v1793255695/upline_04.png',
  'https://res.cloudinary.com/httsesgq/image/upload/v1793255694/upline_05.png',
  'https://res.cloudinary.com/httsesgq/image/upload/v1793255695/upline_06.png',
  'https://res.cloudinary.com/httsesgq/image/upload/v1793255695/upline_07.png',
  'https://res.cloudinary.com/httsesgq/image/upload/v1793255695/upline_08.png',
  'https://res.cloudinary.com/httsesgq/image/upload/v1793255695/upline_09.png',
  'https://res.cloudinary.com/httsesgq/image/upload/v1793255695/upline_10.png',
  'https://res.cloudinary.com/httsesgq/image/upload/v1793255695/upline_11.png',
];

const DEFAULT_BANNER_SETTINGS = {
  ...DEFAULT_BANNER_ASSETS,
  people: DEFAULT_UPLINE_PHOTOS.map((url, index) => ({
    id: `cloudinary-upline-${index + 1}`,
    url,
    name: '',
    role: 'Leader',
    bgRemoved: false,
  })),
  showContactOnBanners: true,
  contactNumber: '',
  showRankOnBanners: true,
  customRankName: '',
  showSocialNameOnBanners: false,
  socialName: '',
  showUplinesRank: true,
  showUplinesAchievements: false,
  showUplinesBonanza: false,
  showUplinesCapping: true,
  showTeamLogo: true,
  fighterSuccessSystem: true,
  fighterTextSystem: true,
};

const readSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BANNER_SETTINGS;
    const saved = JSON.parse(raw);
    return {
      ...DEFAULT_BANNER_SETTINGS,
      ...saved,
      // Existing user-created uplines take precedence; otherwise show the 11 shared defaults.
      people: Array.isArray(saved.people) && saved.people.length
        ? saved.people.slice(0, MAX_BANNER_PEOPLE)
        : DEFAULT_BANNER_SETTINGS.people,
    };
  } catch {
    return DEFAULT_BANNER_SETTINGS;
  }
};

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
  reader.onerror = () => reject(new Error('Could not read processed image'));
  reader.readAsDataURL(blob);
});

// Keep uploaded settings images small enough for browser storage and mobile rendering.
const fileToDataUrl = (file, maxSide = 640) => new Promise((resolve) => {
  if (!file) return resolve('');
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.68));
    };
    img.onerror = () => resolve(reader.result || '');
  };
  reader.onerror = () => resolve('');
  reader.readAsDataURL(file);
});

const REFERENCE_CANVAS_RANK = { w: 896, h: 1344 };
const REFERENCE_CANVAS_SQUARE = { w: 1600, h: 1600 };

// 🎯 RANK PROMOTION COORDINATES (896 x 1344)
const FINAL_COORDS = {
  achieverNameTop:   { x: 457, y: 417, w: 390, h: 42, size: 29 },
  achieverCityTop:   { x: 446, y: 478, w: 400, h: 30, size: 32 },
  achieverPhotoTop:  { x: 27,  y: 0,   w: 390, h: 740 },
  rank:              { x: 440, y: 599, w: 380, h: 69, size: 68 },
  dsRank:            { x: 520, y: 682, w: 220, h: 32, size: 34 },
  amount:            { x: 60,  y: 828, w: 340, h: 59, size: 58 },
  leaderNameBottom:  { x: 195, y: 1058, w: 430, h: 40, size: 26 },
  leaderRankBottom:  { x: 195, y: 1098, w: 430, h: 25, size: 18 },
  leaderPhotoBottom: { x: 583, y: 619, w: 270, h: 510 },
  leaderPhone:       { x: 122, y: 1171, w: 160, h: 25, size: 21 },
  uplinesRow:        { x: 186, y: 26,  w: 440, h: 34, size: 34 },
  asclepias:         { x: 5,   y: 2,   w: 170, h: 80 },
  fighterLogo:       { x: 627, y: 21,  w: 132, h: 50 },
  fighterText:       { x: 749, y: 21,   w: 150, h: 57 }
};

// 🎯 WELCOME BANNER COORDINATES (1600 x 1600)
export const WELCOME_COORDS = {
  uplinesRow: {
    x: 315,
    y: 20,
    w: 945,
    h: 72,
    size: 72
  },
  achieverPhoto: {
    x: 25,
    y: 260,
    w: 710,
    h: 720
  },
  achieverName: {
    x: 650,
    y: 607,
    w: 860,
    h: 65,
    size: 46
  },
  achieverCity: {
    x: 650,
    y: 670,
    w: 860,
    h: 50,
    size: 42
  },
  leaderPhotoBottom: {
    x: 1140,
    y: 1120,
    w: 540,
    h: 450
  },
  leaderNameBottom: {
    x: 560,
    y: 1410,
    w: 620,
    h: 55,
    size: 46
  },
  leaderRankBottom: {
    x: 560,
    y: 1475,
    w: 620,
    h: 40,
    size: 32
  },
  leaderPhone: {
    x: 224,
    y: 1477,
    w: 220,
    h: 50,
    size: 44
  }
};

// 🎯 CLOSING BANNER SPECIAL COORDINATES (1600 x 1600) — ACHIVER NAME & CITY ALAG
export const CLOSING_COORDS = {
  ...WELCOME_COORDS,
  achieverName: {
    x: 650,          // Closing ke hisaab se Name X position
    y: 545,          // Closing ke hisaab se Name Y position (Alag position)
    w: 860,
    h: 70,
    size: 48
  },
  achieverCity: {
    x: 650,          // Closing ke hisaab se City X position
    y: 615,          // Closing ke hisaab se City Y position (Alag position)
    w: 860,
    h: 50,
    size: 40
  }
};

const refBox = (c, refW = 896, refH = 1344) => ({
  left: `${(c.x / refW) * 100}%`,
  top: `${(c.y / refH) * 100}%`,
  width: `${(c.w / refW) * 100}%`,
  height: `${(c.h / refH) * 100}%`,
  position: 'absolute'
});

const refText = (c, family, color = '#fff', weight = 900, extra = {}, refW = 896, refH = 1344) => ({
  ...refBox(c, refW, refH),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  whiteSpace: 'nowrap',
  lineHeight: 1,
  fontFamily: family,
  fontSize: `${((c.size || 24) / refW) * 100}cqw`,
  fontWeight: weight,
  color,
  zIndex: 14,
  ...extra
});

function ReferenceTemplatePreview({
  category = 'rank-promotion',
  template,
  rankLabel,
  achieverDetails,
  activePhotoStyle,
  banner,
  profile,
  onActiveLeaderPhotoChange
}) {
  const isRankPromotion = category === 'rank-promotion' || (!['welcome', 'closing'].includes(category));
  const coords = isRankPromotion 
    ? FINAL_COORDS 
    : (category === 'closing' ? CLOSING_COORDS : WELCOME_COORDS);
  const refDims = isRankPromotion ? REFERENCE_CANVAS_RANK : REFERENCE_CANVAS_SQUARE;

  const achFullName = [achieverDetails?.salutation, achieverDetails?.firstName, achieverDetails?.lastName]
    .filter(Boolean)
    .join(' ');
  const achCity = achieverDetails?.teamCity || '';

  const achImg = activePhotoStyle === 'original'
    ? (achieverDetails?.originalUrl || '')
    : (achieverDetails?.removedUrl || achieverDetails?.originalUrl || '');

  const leaderName = [profile?.title, profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || profile?.name || '';
  const rawRole = profile?.role || profile?.rank || '';
  const cleanRole = rawRole.replace(/^Rank\s+\d+:\s*/i, '').trim();
  const leaderRankDisplay = cleanRole ? `${cleanRole.toUpperCase()}, AWPL` : 'AWPL';

  const leaderPhone = (profile?.mobile || banner?.contactNumber || '')
    .replace(/^\+91\s*/, '')
    .trim();

  const profileImagesList = Array.isArray(profile?.profileImages) && profile.profileImages.length > 0
    ? profile.profileImages
    : (profile?.photo ? [profile.photo] : []);

  const [extraLeaderPhotos, setExtraLeaderPhotos] = useState([]);
  const [selectedLeaderImgIndex, setSelectedLeaderImgIndex] = useState(0);
  const allLeaderPhotos = [...profileImagesList, ...extraLeaderPhotos].slice(0, 15);
  const activeLeaderPhoto = allLeaderPhotos[selectedLeaderImgIndex] || profile?.photo || '';
  
  useEffect(() => {
    if (onActiveLeaderPhotoChange) onActiveLeaderPhotoChange(activeLeaderPhoto);
  }, [activeLeaderPhoto, onActiveLeaderPhotoChange]);

  const addTemporaryLeaderPhoto = async (file) => {
    if (!file || allLeaderPhotos.length >= 15) return;
    try {
      const imageUrl = await fileToDataUrl(file, 1200);
      const nextIndex = allLeaderPhotos.length;
      setExtraLeaderPhotos((current) => [...current, imageUrl].slice(0, Math.max(0, 15 - profileImagesList.length)));
      setSelectedLeaderImgIndex(nextIndex);
    } catch (error) {
      alert(`Photo upload failed: ${error.message || error}`);
    }
  };

  const cleanSelectedRank = (rankLabel || 'Bronze').replace(/^Rank\s+\d+:\s*/i, '').trim();
  const displayRank = banner?.showRankOnBanners === false ? '' : (banner?.customRankName || cleanSelectedRank || 'BRONZE');
  const rawAmount = RANK_INCOME[cleanSelectedRank] || RANK_INCOME[rankLabel] || '₹2,500';
  const amount = rawAmount.startsWith('₹') ? rawAmount : `₹${rawAmount}`;

  const attractiveShadow = {
    textShadow: '0 2px 5px rgba(0, 0, 0, 0.85), 0 4px 10px rgba(0, 0, 0, 0.6)'
  };

  const rankText = displayRank.toUpperCase();
  const dynamicRankSize = coords.rank ? (rankText.length > 15 
    ? Math.round(coords.rank.size * 0.58) 
    : rankText.length > 11 
      ? Math.round(coords.rank.size * 0.70) 
      : rankText.length > 8 
        ? Math.round(coords.rank.size * 0.84) 
        : coords.rank.size) : 24;

  const dynamicAmountSize = coords.amount ? (amount.length > 12 
    ? Math.round(coords.amount.size * 0.78) 
    : amount.length > 9 
      ? Math.round(coords.amount.size * 0.88) 
      : coords.amount.size) : 24;

  const avatarPercentSize = (coords.uplinesRow.h / refDims.w) * 100;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div 
        className={`cs-reference-preview ${!isRankPromotion ? 'is-square-preview' : ''}`}
        style={!isRankPromotion ? { aspectRatio: '1 / 1', position: 'relative' } : { position: 'relative' }}
      >
        <SmartTemplateImage
          category={category}
          no={template}
          alt={`Template ${template}`}
          className="cs-reference-preview-bg"
          loading="eager"
          fetchPriority="high"
        />

        {/* LOGOS FOR RANK PROMOTION */}
        {isRankPromotion && banner?.asclepiasLogo && (
          <img className="cs-ref-asset" style={{ ...refBox(coords.asclepias, refDims.w, refDims.h), objectFit: 'contain', zIndex: 20 }} src={banner.asclepiasLogo} alt="" />
        )}

        {/* 11 UPLINE MEMBERS ROW */}
        <div
          className="cs-uplines-row-container"
          style={{
            ...refBox(coords.uplinesRow, refDims.w, refDims.h),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 20,
            pointerEvents: 'none'
          }}
        >
          {Array.from({ length: 11 }).map((_, i) => {
            const photoUrl = banner?.people?.[i]?.url;
            return photoUrl ? (
              <div
                key={i}
                className="cs-upline-avatar-wrap"
                style={{
                  width: `${avatarPercentSize}cqw`,
                  height: `${avatarPercentSize}cqw`,
                  borderRadius: '50%',
                  overflow: 'hidden'
                }}
              >
                <img
                  className="cs-upline-avatar-img"
                  src={photoUrl}
                  alt={`Upline ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ) : null;
          })}
        </div>

        {isRankPromotion && banner?.fighterSuccessSystem !== false && banner?.fighterLogo && (
          <img
            className="cs-ref-asset"
            style={{ ...refBox(coords.fighterLogo, refDims.w, refDims.h), objectFit: 'contain', zIndex: 20 }}
            src={banner.fighterLogo}
            alt="Fighter Success System"
          />
        )}

        {isRankPromotion && banner?.fighterTextSystem !== false && banner?.fighterStudio && (
          <img
            className="cs-ref-asset"
            style={{ ...refBox(coords.fighterText, refDims.w, refDims.h), objectFit: 'contain', zIndex: 20 }}
            src={banner.fighterStudio}
            alt="Fighter Text System"
          />
        )}

        {/* ACHIEVER NAME */}
        <div style={refText(coords.achieverNameTop || coords.achieverName, "'Merriweather', Georgia, serif", '#ffffff', 900, attractiveShadow, refDims.w, refDims.h)}>
          {achFullName.toUpperCase()}
        </div>

        {/* ACHIEVER CITY */}
        <div style={refText(coords.achieverCityTop || coords.achieverCity, "'Montserrat', sans-serif", '#ffd700', 800, attractiveShadow, refDims.w, refDims.h)}>
          {achCity.toUpperCase()}
        </div>

        {/* ACHIEVER PHOTO CUTOUT */}
        {achImg && (
          <div style={{ 
            position: 'absolute', 
            ...refBox(coords.achieverPhotoTop || coords.achieverPhoto, refDims.w, refDims.h), 
            zIndex: 7, 
            overflow: 'hidden'
          }}>
            <img 
              src={achImg} 
              alt="Achiever" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center bottom',
                // Blend the bottom of the cutout into the template background.
                WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 89%, rgba(0,0,0,0.88) 94%, rgba(0,0,0,0.58) 98%, rgba(0,0,0,0.18) 100%)',
                maskImage: 'linear-gradient(to bottom, #000 0%, #000 89%, rgba(0,0,0,0.88) 94%, rgba(0,0,0,0.58) 98%, rgba(0,0,0,0.18) 100%)'
              }} 
            />
          </div>
        )}

        {/* 🎯 RANK DETAILS (BRONZE, DS RANK, AMOUNT) — ONLY IN RANK PROMOTION */}
        {isRankPromotion && (
          <>
            <div 
              className="cs-3d-gold-rank-title" 
              style={refText({ ...coords.rank, size: dynamicRankSize }, "'Merienda', cursive, sans-serif", '#ffd700', 900, {}, refDims.w, refDims.h)}
            >
              {rankText}
            </div>

            <div style={refText(coords.dsRank, "'Averia Serif Libre', cursive, serif", '#ffffff', 900, {
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.9), 0 4px 8px rgba(0, 0, 0, 0.6)'
            }, refDims.w, refDims.h)}>
              DS RANK
            </div>

            <div 
              className="cs-3d-gold-amount" 
              style={refText({ ...coords.amount, size: dynamicAmountSize }, "'Times New Roman', Georgia, serif", '#ffd700', 900, {}, refDims.w, refDims.h)}
            >
              {amount}
            </div>
          </>
        )}

        {/* LEADER PHOTO CUTOUT */}
        {activeLeaderPhoto && (
          <div style={{ 
            position: 'absolute', 
            ...refBox(coords.leaderPhotoBottom, refDims.w, refDims.h), 
            zIndex: 12, 
            background: 'transparent'
          }}>
            <img
              src={activeLeaderPhoto}
              alt="Leader"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center bottom',
                display: 'block',
                // Match the soft bottom fade used on the achiever photo.
                WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 89%, rgba(0,0,0,0.88) 94%, rgba(0,0,0,0.58) 98%, rgba(0,0,0,0.18) 100%)',
                maskImage: 'linear-gradient(to bottom, #000 0%, #000 89%, rgba(0,0,0,0.88) 94%, rgba(0,0,0,0.58) 98%, rgba(0,0,0,0.18) 100%)'
              }}
            />
          </div>
        )}

        {/* LEADER NAME */}
        <div style={refText(coords.leaderNameBottom, "'Merriweather', Georgia, serif", isRankPromotion ? '#0f172a' : '#ffffff', 900, !isRankPromotion ? attractiveShadow : {}, refDims.w, refDims.h)}>
          {leaderName.toUpperCase()}
        </div>

        {/* LEADER RANK */}
        <div style={refText(coords.leaderRankBottom, "'Montserrat', sans-serif", isRankPromotion ? '#c4ae31' : '#facc15', 900, !isRankPromotion ? attractiveShadow : {}, refDims.w, refDims.h)}>
          {leaderRankDisplay}
        </div>

        {/* LEADER PHONE NUMBER */}
        {banner?.showContactOnBanners !== false && leaderPhone && (
          <div style={refText(coords.leaderPhone, "'Montserrat', sans-serif", isRankPromotion ? '#000000' : '#ffffff', 500, {
            textShadow: isRankPromotion ? '0 1px 3px rgba(0, 0, 0, 0.4)' : '0 2px 4px rgba(0, 0, 0, 0.9)'
          }, refDims.w, refDims.h)}>
            {leaderPhone}
          </div>
        )}
      </div>

      {/* LEADER PHOTO PICKER STRIP — ONLY PROFILE PHOTOS */}
      <div className="cs-leader-picker-box">
        <div className="cs-leader-picker-strip">
          {allLeaderPhotos.map((imgUrl, idx) => (
            <button
              key={`${idx}-${String(imgUrl).slice(0, 18)}`}
              type="button"
              className={`cs-leader-thumb-btn ${selectedLeaderImgIndex === idx ? 'is-selected' : ''}`}
              onClick={() => setSelectedLeaderImgIndex(idx)}
              aria-label={`Use leader photo ${idx + 1}`}
              title={`Use photo ${idx + 1}`}
            >
              <img src={imgUrl} alt={`Leader photo ${idx + 1}`} />
              {selectedLeaderImgIndex === idx && <span className="cs-thumb-check">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const rankName = (rank) => rank.replace(/^Rank\s+\d+:\s*/, '');

export default function CreativeStudio({ onBack, initialSettingsOpen = false, profile = null, onPointsChange = null }) {
  const [studioTab, setStudioTab] = useState('categories');
  const [selectedRank, setSelectedRank] = useState(null);
  const [activeCategory, setActiveCategory] = useState('rank-promotion');
  const [rankTemplateView, setRankTemplateView] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(1);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templatePage, setTemplatePage] = useState(1);
  const [showTemplateActions, setShowTemplateActions] = useState(false);
  const [templateRating, setTemplateRating] = useState(0);
  const [ratingSaved, setRatingSaved] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [activeLeaderPhoto, setActiveLeaderPhoto] = useState('');
  const [people, setPeople] = useState([]);
  const [asclepiasLogo, setAsclepiasLogo] = useState('');
  const [fighterLogo, setFighterLogo] = useState('');
  const [fighterStudio, setFighterStudio] = useState('');
  const [showContactOnBanners, setShowContactOnBanners] = useState(true);
  const [contactNumber, setContactNumber] = useState('');
  const [showRankOnBanners, setShowRankOnBanners] = useState(true);
  const [customRankName, setCustomRankName] = useState('');
  const [showSocialNameOnBanners, setShowSocialNameOnBanners] = useState(false);
  const [socialName, setSocialName] = useState('');
  const [showUplinesRank, setShowUplinesRank] = useState(true);
  const [showUplinesAchievements, setShowUplinesAchievements] = useState(false);
  const [showUplinesBonanza, setShowUplinesBonanza] = useState(false);
  const [showUplinesCapping, setShowUplinesCapping] = useState(true);
  const [showTeamLogo, setShowTeamLogo] = useState(true);
  const [fighterSuccessSystem, setFighterSuccessSystem] = useState(true);
  const [fighterTextSystem, setFighterTextSystem] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(Boolean(initialSettingsOpen));
  const [savedMessage, setSavedMessage] = useState('');
  const [achieverDetailsView, setAchieverDetailsView] = useState(false);
  const [achieverDetails, setAchieverDetails] = useState({ salutation: 'Mr.', firstName: '', lastName: '', teamCity: '', originalUrl: '', removedUrl: '' });
  
  const [achieverPhotoLoading, setAchieverPhotoLoading] = useState(false);
  const [activePhotoStyle, setActivePhotoStyle] = useState('cutout');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropAspect, setCropAspect] = useState('portrait');
  const [cropZoom, setCropZoom] = useState(1.1);
  const [cropX, setCropX] = useState(50);
  const [cropY, setCropY] = useState(30);

  const applySettings = (s) => {
    setPeople(Array.isArray(s.people) ? s.people.slice(0, MAX_BANNER_PEOPLE) : DEFAULT_BANNER_SETTINGS.people);
    setAsclepiasLogo(s.asclepiasLogo || DEFAULT_BANNER_ASSETS.asclepiasLogo);
    setFighterLogo(s.fighterLogo || DEFAULT_BANNER_ASSETS.fighterLogo);
    setFighterStudio(s.fighterStudio || DEFAULT_BANNER_ASSETS.fighterStudio);
    setShowContactOnBanners(s.showContactOnBanners !== false);
    setContactNumber(s.contactNumber || '');
    setShowRankOnBanners(s.showRankOnBanners !== false);
    setCustomRankName(s.customRankName || '');
    setShowSocialNameOnBanners(Boolean(s.showSocialNameOnBanners));
    setSocialName(s.socialName || '');
    setShowUplinesRank(s.showUplinesRank !== false);
    setShowUplinesAchievements(Boolean(s.showUplinesAchievements));
    setShowUplinesBonanza(Boolean(s.showUplinesBonanza));
    setShowUplinesCapping(s.showUplinesCapping !== false);
    setShowTeamLogo(s.showTeamLogo !== false);
    setFighterSuccessSystem(s.fighterSuccessSystem !== false);
    setFighterTextSystem(s.fighterTextSystem !== false);
  };

  useEffect(() => {
    localStorage.removeItem('aarsh-custom-coords');
    let cancelled = false;

    // Use each signed-in user's own Firestore document; keep localStorage as a fallback.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const localSettings = readSettings();
      if (!user) {
        if (!cancelled) applySettings(localSettings);
        return;
      }

      try {
        const settingsRef = doc(db, 'users', user.uid, 'creativeStudio', 'bannerSettings');
        const snapshot = await getDoc(settingsRef);
        if (cancelled) return;

        if (snapshot.exists()) {
          const remoteSettings = {
            ...DEFAULT_BANNER_SETTINGS,
            ...snapshot.data(),
          };
          // Older saved settings may have no people array; keep the shared 11-photo defaults.
          if (!Array.isArray(remoteSettings.people) || remoteSettings.people.length === 0) {
            remoteSettings.people = DEFAULT_BANNER_SETTINGS.people;
          }
          applySettings(remoteSettings);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteSettings)); } catch { /* Firestore remains primary */ }
        } else {
          applySettings(localSettings);
          await setDoc(settingsRef, localSettings, { merge: true });
        }
      } catch (error) {
        console.error('Could not load banner settings from Firestore:', error);
        if (!cancelled) applySettings(localSettings);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    setSettingsOpen(Boolean(initialSettingsOpen));
  }, [initialSettingsOpen]);

  const persistSettings = (next = {}) => {
    const payload = {
      ...DEFAULT_BANNER_SETTINGS,
      asclepiasLogo: next.asclepiasLogo ?? asclepiasLogo,
      people: next.people ?? people,
      fighterLogo: next.fighterLogo ?? fighterLogo,
      fighterStudio: next.fighterStudio ?? fighterStudio,
      showContactOnBanners: next.showContactOnBanners ?? showContactOnBanners,
      contactNumber: next.contactNumber ?? contactNumber,
      showRankOnBanners: next.showRankOnBanners ?? showRankOnBanners,
      customRankName: next.customRankName ?? customRankName,
      showSocialNameOnBanners: next.showSocialNameOnBanners ?? showSocialNameOnBanners,
      socialName: next.socialName ?? socialName,
      showUplinesRank: next.showUplinesRank ?? showUplinesRank,
      showUplinesAchievements: next.showUplinesAchievements ?? showUplinesAchievements,
      showUplinesBonanza: next.showUplinesBonanza ?? showUplinesBonanza,
      showUplinesCapping: next.showUplinesCapping ?? showUplinesCapping,
      showTeamLogo: next.showTeamLogo ?? showTeamLogo,
      fighterSuccessSystem: next.fighterSuccessSystem ?? fighterSuccessSystem,
      fighterTextSystem: next.fighterTextSystem ?? fighterTextSystem,
    };

    let localSaved = false;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      localSaved = true;
    } catch (error) {
      console.error('Banner settings could not be saved locally:', error);
    }

    const user = auth.currentUser;
    if (!user) {
      setSavedMessage(localSaved
        ? 'Saved on this device. Log in to sync across devices.'
        : 'Could not save settings on this device.');
      window.setTimeout(() => setSavedMessage(''), 2600);
      return;
    }

    // Save to a dedicated per-user document, without changing the app's existing user profile.
    setDoc(doc(db, 'users', user.uid, 'creativeStudio', 'bannerSettings'), {
      ...payload,
      updatedAt: new Date().toISOString(),
    }, { merge: true })
      .then(() => setSavedMessage('Settings saved and synced successfully!'))
      .catch((error) => {
        console.error('Banner settings could not be synced to Firestore:', error);
        setSavedMessage(localSaved
          ? 'Saved on this device; cloud sync failed.'
          : 'Could not save settings. Please try again.');
      })
      .finally(() => window.setTimeout(() => setSavedMessage(''), 2600));
  };

  const addPerson = async (file) => {
    if (!file || people.length >= MAX_BANNER_PEOPLE) return;
    try {
      const url = await fileToDataUrl(file);
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const updated = [...people, { id, url, name: '', role: 'Leader', bgRemoved: false }];
      setPeople(updated);
      persistSettings({ people: updated });
    } catch (e) {
      alert(`Image upload failed: ${e.message || e}`);
    }
  };

  const addLogo = async (event, setter, fieldKey) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const url = await fileToDataUrl(file);
      setter(url);
      persistSettings({ [fieldKey]: url });
      setSavedMessage('Logo updated successfully! ✅');
    } catch (e) {
      alert(`Upload failed: ${e.message || e}`);
    } finally {
      event.target.value = '';
      window.setTimeout(() => setSavedMessage(''), 2000);
    }
  };

  const selectedRankOption = RANK_OPTIONS.find(x => x.id === selectedRank);
  const selectedRankLabel = selectedRankOption?.label || rankName(selectedRank || 'Bronze');
  const selectedRankTheme = selectedRankOption?.theme || 'rp-bronze';
  const selectedRankIndex = selectedRankOption?.rank || 1;

  const executeBgRemoval = async (imageSource) => {
    try {
      setAchieverPhotoLoading(true);
      const blob = await removeBackground(imageSource, {
        output: { format: 'image/png', quality: 0.95 }
      });
      const removedUrl = await blobToDataUrl(blob);
      setAchieverDetails(prev => ({ ...prev, removedUrl }));
      setActivePhotoStyle('cutout');
    } catch (e) {
      console.error('BG removal failed:', e);
      alert('AI background removal complete nahi ho saka, kripya transparent PNG upload karein.');
    } finally {
      setAchieverPhotoLoading(false);
    }
  };

  const handleAchieverImage = async (file) => {
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setAchieverDetails(prev => ({ ...prev, originalUrl: localUrl, removedUrl: '' }));
    setActivePhotoStyle('cutout');
    await executeBgRemoval(file);
  };

  const removeAchieverBackgroundNow = async () => {
    if (!achieverDetails.originalUrl || achieverPhotoLoading) return;
    await executeBgRemoval(achieverDetails.originalUrl);
  };

  const openPhotoCropper = () => {
    if (!achieverDetails.removedUrl && !achieverDetails.originalUrl) return;
    setCropAspect('portrait');
    setCropZoom(1.1);
    setCropX(50);
    setCropY(30);
    setCropModalOpen(true);
  };

  const applyPhotoCrop = async () => {
    const source = achieverDetails.removedUrl || achieverDetails.originalUrl;
    if (!source) return;
    try {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.src = source;
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });
      const naturalW = image.naturalWidth;
      const naturalH = image.naturalHeight;
      let targetAspect = naturalW / naturalH;
      if (cropAspect === 'square') targetAspect = 1;
      if (cropAspect === 'portrait') targetAspect = 4 / 5;
      if (cropAspect === 'landscape') targetAspect = 16 / 9;

      let cropW = naturalW;
      let cropH = naturalH;
      if (cropW / cropH > targetAspect) cropW = cropH * targetAspect;
      else cropH = cropW / targetAspect;
      cropW /= cropZoom;
      cropH /= cropZoom;
      const maxX = Math.max(0, naturalW - cropW);
      const maxY = Math.max(0, naturalH - cropH);
      const sx = maxX * (cropX / 100);
      const sy = maxY * (cropY / 100);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(cropW));
      canvas.height = Math.max(1, Math.round(cropH));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas is not supported');
      ctx.drawImage(image, sx, sy, cropW, cropH, 0, 0, canvas.width, canvas.height);
      const croppedUrl = canvas.toDataURL('image/png');
      setAchieverDetails(prev => ({ ...prev, removedUrl: croppedUrl }));
      setActivePhotoStyle('cutout');
      setCropModalOpen(false);
    } catch (error) {
      console.error('Photo crop failed:', error);
      alert('Photo crop nahi ho paaya. Ek baar dobara try karein.');
    }
  };

  const createAchiever = () => {
    const d = achieverDetails;
    if (!d.firstName.trim() || !d.lastName.trim() || !d.teamCity.trim() || !d.originalUrl) {
      alert('Please enter First Name, Last Name, City and upload an image.');
      return;
    }
    if (achieverPhotoLoading) {
      alert('AI background remove kar raha hai, kripya thoda wait karein...');
      return;
    }
    setSelectedTemplate(1);
    setShowTemplateActions(false);
    setRankTemplateView(true);
    setAchieverDetailsView(false);
  };

  const loadExportImage = (src) => new Promise((resolve, reject) => {
    if (!src) return resolve(null);
    const image = new Image();
    // Set CORS mode BEFORE src for remote assets that permit anonymous CORS.
    // Same-origin and blob/data URLs continue to work normally.
    if (/^https?:\/\//i.test(src) && new URL(src, window.location.href).origin !== window.location.origin) {
      image.crossOrigin = 'anonymous';
    }
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Image load failed (check asset URL/CORS permissions): ${src}`));
    image.src = src;
  });

  const getExportPosterCanvas = async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    const isRankPromotion = activeCategory === 'rank-promotion' || (!['welcome', 'closing'].includes(activeCategory));
    const coords = isRankPromotion 
      ? FINAL_COORDS 
      : (activeCategory === 'closing' ? CLOSING_COORDS : WELCOME_COORDS);
    const refDims = isRankPromotion ? REFERENCE_CANVAS_RANK : REFERENCE_CANVAS_SQUARE;

    const canvas = document.createElement('canvas');
    canvas.width = refDims.w;
    canvas.height = refDims.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not supported in this browser.');

    const candidateUrls = getTemplateCandidates(activeCategory, selectedTemplate);

    let background = null;
    for (const src of candidateUrls) {
      try {
        background = await loadExportImage(src);
        if (background) break;
      } catch {
        // try next candidate
      }
    }

    if (!background) {
      const previewImgEl = document.querySelector('.cs-reference-preview-bg');
      if (previewImgEl && previewImgEl.complete && previewImgEl.naturalWidth > 0) {
        background = previewImgEl;
      } else {
        throw new Error('Template image could not be loaded.');
      }
    }

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    const box = (c) => ({ x: c.x, y: c.y, w: c.w, h: c.h });

    const drawContainBottom = async (src, c) => {
      if (!src) return;
      const image = await loadExportImage(src);
      if (!image) return;
      const b = box(c);

      // Render each cutout on its own canvas so the fade mask never affects
      // the template or any other poster elements.
      const photoCanvas = document.createElement('canvas');
      photoCanvas.width = Math.max(1, Math.round(b.w));
      photoCanvas.height = Math.max(1, Math.round(b.h));
      const photoCtx = photoCanvas.getContext('2d');
      if (!photoCtx) {
        const scale = Math.min(b.w / image.naturalWidth, b.h / image.naturalHeight);
        const w = image.naturalWidth * scale;
        const h = image.naturalHeight * scale;
        ctx.drawImage(image, b.x + (b.w - w) / 2, b.y + (b.h - h), w, h);
        return;
      }

      const scale = Math.min(photoCanvas.width / image.naturalWidth, photoCanvas.height / image.naturalHeight);
      const w = image.naturalWidth * scale;
      const h = image.naturalHeight * scale;
      photoCtx.drawImage(image, (photoCanvas.width - w) / 2, photoCanvas.height - h, w, h);

      // Keep the face and upper body crisp; fade only the lower part.
      const fade = photoCtx.createLinearGradient(0, photoCanvas.height * 0.90, 0, photoCanvas.height);
      fade.addColorStop(0, 'rgba(0,0,0,1)');
      fade.addColorStop(0.55, 'rgba(0,0,0,0.82)');
      fade.addColorStop(0.88, 'rgba(0,0,0,0.48)');
      fade.addColorStop(1, 'rgba(0,0,0,0.18)');
      photoCtx.globalCompositeOperation = 'destination-in';
      photoCtx.fillStyle = fade;
      photoCtx.fillRect(0, 0, photoCanvas.width, photoCanvas.height);
      photoCtx.globalCompositeOperation = 'source-over';

      ctx.drawImage(photoCanvas, b.x, b.y, b.w, b.h);
    };

    const drawContainCenter = async (src, c) => {
      if (!src) return;
      const image = await loadExportImage(src);
      if (!image) return;
      const b = box(c);
      const scale = Math.min(b.w / image.naturalWidth, b.h / image.naturalHeight);
      const w = image.naturalWidth * scale;
      const h = image.naturalHeight * scale;
      ctx.drawImage(image, b.x + (b.w - w) / 2, b.y + (b.h - h), w, h);
    };

    const draw3DGoldText = (text, c, fontFamily) => {
      if (!text || !c) return;
      const b = box(c);
      const size = c.size || 58;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${size}px ${fontFamily}`;

      const centerX = b.x + b.w / 2;
      const centerY = b.y + b.h / 2;

      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 6;

      const goldGrad = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
      goldGrad.addColorStop(0.00, '#ffffff');
      goldGrad.addColorStop(0.22, '#fef08a');
      goldGrad.addColorStop(0.55, '#eab308');
      goldGrad.addColorStop(0.80, '#a16207');
      goldGrad.addColorStop(1.00, '#451a03');

      ctx.fillStyle = goldGrad;
      ctx.fillText(text, centerX, centerY, b.w);

      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = '#6d3412';
      ctx.strokeText(text, centerX, centerY, b.w);
      ctx.restore();
    };

    const drawStandardText = (text, c, fontFamily, color, weight = 900) => {
      if (!text || !c) return;
      const b = box(c);
      let size = c.size || 24;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;
      ctx.font = `${weight} ${size}px ${fontFamily}`;
      ctx.fillText(text, b.x + b.w / 2, b.y + b.h / 2, b.w - 4);
      ctx.restore();
    };

    const achName = [achieverDetails.salutation, achieverDetails.firstName, achieverDetails.lastName].filter(Boolean).join(' ').toUpperCase();
    const achCity = (achieverDetails.teamCity || '').toUpperCase();
    const cleanRank = (selectedRankLabel || 'Bronze').replace(/^Rank\s+\d+:\s*/i, '').trim();
    const rankDisplay = showRankOnBanners === false ? '' : (customRankName || cleanRank).toUpperCase();
    const amount = RANK_INCOME[cleanRank] || '₹2,500';
    const profileName = [profile?.title, profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || profile?.name || '';
    const role = (profile?.role || profile?.rank || '').replace(/^Rank\s+\d+:\s*/i, '').trim();
    const leaderRank = role ? `${role.toUpperCase()}, AWPL` : 'AWPL';
    const phone = (profile?.mobile || contactNumber || '').replace(/^\+91\s*/, '').trim();
    const achieverImg = activePhotoStyle === 'original' ? (achieverDetails.originalUrl || '') : (achieverDetails.removedUrl || achieverDetails.originalUrl || '');

    // 🎯 11 Upline Photos: Rank Promotion mein 34px aur Welcome/Closing (1600x1600) mein 72px!
    const row = coords.uplinesRow;
    const size = isRankPromotion ? 34 : (coords.uplinesRow.size || 72);
    const spacing = (row.w - size) / 10;
    for (let i = 0; i < 11; i += 1) {
      const url = people?.[i]?.url;
      if (!url) continue;
      const x = row.x + i * spacing;
      const y = row.y + (row.h - size) / 2;
      const image = await loadExportImage(url);
      if (!image) continue;

      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#d4af37';
      ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
      ctx.shadowBlur = isRankPromotion ? 4 : 8;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, (size / 2) - (isRankPromotion ? 1.5 : 3), 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(image, x, y, size, size);
      ctx.restore();
    }

    if (isRankPromotion) {
      if (asclepiasLogo) await drawContainCenter(asclepiasLogo, coords.asclepias);
      if (fighterSuccessSystem && fighterLogo) await drawContainCenter(fighterLogo, coords.fighterLogo);
      if (fighterTextSystem && fighterStudio) await drawContainCenter(fighterStudio, coords.fighterText);
      
      draw3DGoldText(rankDisplay, coords.rank, "'Merienda', cursive, sans-serif");
      drawStandardText('DS RANK', coords.dsRank, "'Averia Serif Libre', cursive, serif", '#ffffff', 900);
      draw3DGoldText(amount, coords.amount, "'Times New Roman', Georgia, serif");
    }

    drawStandardText(achName, coords.achieverNameTop || coords.achieverName, "'Merriweather', Georgia, serif", '#ffffff', 900);
    drawStandardText(achCity, coords.achieverCityTop || coords.achieverCity, "'Montserrat', Arial, sans-serif", '#ffd700', 800);
    
    if (achieverImg) await drawContainBottom(achieverImg, coords.achieverPhotoTop || coords.achieverPhoto);
    if (activeLeaderPhoto) await drawContainBottom(activeLeaderPhoto, coords.leaderPhotoBottom);

    drawStandardText(profileName.toUpperCase(), coords.leaderNameBottom, "'Merriweather', Georgia, serif", isRankPromotion ? '#0f172a' : '#ffffff', 900);
    drawStandardText(leaderRank, coords.leaderRankBottom, "'Montserrat', Arial, sans-serif", isRankPromotion ? '#c4ae31' : '#facc15', 900);
    if (showContactOnBanners && phone) drawStandardText(phone, coords.leaderPhone, "'Montserrat', Arial, sans-serif", isRankPromotion ? '#000000' : '#ffffff', 500);

    return canvas;
  };

  // Securely deduct 5 credits from the signed-in user's Firestore balance.
  const chargeDownloadCredits = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert('Please log in again before downloading.');
        return false;
      }

      const idToken = await currentUser.getIdToken();
      const requestId = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).slice(2)}`;

      const response = await fetch('https://aarsh.onrender.com/deduct-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, requestId })
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        alert(result.message || 'Credits could not be verified. Please try again.');
        return false;
      }

      const updatedCredits = Number(result.credits);
      if (!Number.isFinite(updatedCredits)) {
        alert('Could not verify your updated balance. Please refresh and check your account.');
        return false;
      }

      if (typeof onPointsChange === 'function') onPointsChange(updatedCredits);
      window.dispatchEvent(new CustomEvent('pointsUpdated', {
        detail: { points: updatedCredits, credits: updatedCredits }
      }));
      return true;
    } catch (error) {
      console.error('Credit deduction failed:', error);
      alert('Unable to verify credits. Please try again.');
      return false;
    }
  };

  const downloadCanvasImage = async () => {
    if (exportBusy) return;
    setExportBusy(true);
    try {
      // Prepare the image before charging credits.
      const canvas = await getExportPosterCanvas();
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Could not prepare image for download.')), 'image/png');
      });

      const charged = await chargeDownloadCredits();
      if (!charged) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Aarsh-${activeCategory.toUpperCase()}-Template-${String(selectedTemplate).padStart(2, '0')}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 3000);
    } catch (error) {
      console.error('Poster image download failed:', error);
      alert(error.message || 'Image download failed. Please try again.');
    } finally {
      setExportBusy(false);
    }
  };

  const canvasToPdfBlob = (canvas) => {
    const jpegData = canvas.toDataURL('image/jpeg', 0.96).split(',')[1];
    const jpegBytes = Uint8Array.from(atob(jpegData), (char) => char.charCodeAt(0));
    const enc = (value) => new TextEncoder().encode(value);
    const chunks = [];
    const offsets = [0];
    let length = 0;
    const push = (chunk) => { chunks.push(chunk); length += chunk.length; };
    push(enc('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'));
    const objects = [
      enc('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'),
      enc('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'),
      enc(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${canvas.width > canvas.height ? 600 : 448} ${canvas.width > canvas.height ? 600 : 672}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`)
    ];
    for (const obj of objects) { offsets.push(length); push(obj); }
    offsets.push(length);
    push(enc(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`));
    push(jpegBytes);
    push(enc('\nendstream\nendobj\n'));
    offsets.push(length);
    const content = enc(`q\n${canvas.width > canvas.height ? 600 : 448} 0 0 ${canvas.width > canvas.height ? 600 : 672} 0 0 cm\n/Im0 Do\nQ\n`);
    push(enc(`5 0 obj\n<< /Length ${content.length} >>\nstream\n`));
    push(content);
    push(enc('endstream\nendobj\n'));
    const xrefOffset = length;
    let xref = `xref\n0 6\n0000000000 65535 f \n`;
    for (let i = 1; i <= 5; i += 1) xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    push(enc(xref));
    push(enc(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`));
    const total = chunks.reduce((sum, part) => sum + part.length, 0);
    const output = new Uint8Array(total);
    let position = 0;
    chunks.forEach((part) => { output.set(part, position); position += part.length; });
    return new Blob([output], { type: 'application/pdf' });
  };

  const downloadPosterPdf = async () => {
    if (exportBusy) return;
    setExportBusy(true);
    try {
      // Prepare the PDF before charging credits.
      const canvas = await getExportPosterCanvas();
      const blob = canvasToPdfBlob(canvas);

      const charged = await chargeDownloadCredits();
      if (!charged) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Aarsh-${activeCategory.toUpperCase()}-Template-${String(selectedTemplate).padStart(2, '0')}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 3000);
    } catch (error) {
      console.error('Poster PDF download failed:', error);
      alert(error.message || 'PDF download failed. Please try again.');
    } finally {
      setExportBusy(false);
    }
  };

  const printPoster = async () => {
    setExportBusy(true);
    try {
      const canvas = await getExportPosterCanvas();
      const imageUrl = canvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank', 'noopener,noreferrer');
      if (!printWindow) throw new Error('Print window was blocked. Please allow pop-ups for this site.');
      printWindow.document.write(`<!doctype html><html><head><title>Aarsh Poster</title><style>@page{margin:0;size:auto}html,body{margin:0;padding:0;text-align:center}img{display:block;width:100%;height:auto;max-height:100vh;object-fit:contain}</style></head><body><img src="${imageUrl}" alt="Aarsh poster" onload="setTimeout(()=>window.print(),250)"></body></html>`);
      printWindow.document.close();
    } catch (error) {
      console.error('Poster print failed:', error);
      alert(error.message || 'Could not open print view. Please try again.');
    } finally { setExportBusy(false); }
  };

  const sharePoster = async () => {
    setExportBusy(true);
    try {
      const canvas = await getExportPosterCanvas();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const file = blob ? new File([blob], `Aarsh-${activeCategory}-Template-${String(selectedTemplate).padStart(2, '0')}.png`, { type: 'image/png' }) : null;
      if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: `My Aarsh ${activeCategory} Design`, text: `Template ${String(selectedTemplate).padStart(2, '0')}`, files: [file] });
      } else if (navigator.share) {
        await navigator.share({ title: `My Aarsh ${activeCategory} Design`, text: `I created a banner design on Aarsh Digital.`, url: window.location.href });
      } else {
        const shareText = `I created a banner design on Aarsh Digital.`;
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(shareText);
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error('Poster share failed:', error);
        alert('Share nahi ho saka. Aap Download Image karke kisi bhi app par share kar sakte hain.');
      }
    } finally { setExportBusy(false); }
  };

  const saveTemplateRating = () => {
    if (!templateRating) { alert('Please select a star rating first.'); return; }
    try { localStorage.setItem('aarsh-creative-studio-template-rating', String(templateRating)); } catch { /* ignore */ }
    setRatingSaved(true);
  };

  const activeTemplateCount = (activeCategory === 'welcome') 
    ? WELCOME_TEMPLATE_COUNT 
    : (activeCategory === 'closing') 
      ? CLOSING_TEMPLATE_COUNT 
      : RANK_TEMPLATE_COUNT;

  return (
    <main className="cs-page">
      {settingsOpen ? (
        <section className="cs-banner-settings-modal">
          <div className="cs-bs-header">
            <div className="cs-bs-header-left">
              <div className="cs-bs-header-icon">⚙️</div>
              <div>
                <h2>Banner Display Settings</h2>
                <p>Choose what to show automatically on your banners</p>
              </div>
            </div>
            <div className="cs-bs-header-right">
              <button type="button" className="cs-bs-close-btn" onClick={() => setSettingsOpen(false)}>✕</button>
            </div>
          </div>

          <div className="cs-bs-grid">
            <div className="cs-bs-card card-green">
              <div className="cs-bs-card-top">
                <div className="cs-bs-card-icon icon-green">📞</div>
                <div className="cs-bs-card-text">
                  <strong>Show Contact No. on banners</strong>
                  <small>Display your contact number on all supported banners.</small>
                </div>
                <div className="cs-bs-toggle-wrap">
                  <label className={`cs-bs-switch ${showContactOnBanners ? 'is-on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={showContactOnBanners}
                      onChange={e => {
                        setShowContactOnBanners(e.target.checked);
                        persistSettings({ showContactOnBanners: e.target.checked });
                      }}
                    />
                    <span className="cs-bs-slider"></span>
                  </label>
                  <span className={`cs-bs-status ${showContactOnBanners ? 'status-on' : 'status-off'}`}>
                    {showContactOnBanners ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
              <div className="cs-bs-card-bottom">
                <div className="cs-bs-input-pill pill-green">
                  <span className="pill-prefix">📞</span>
                  <input
                    type="text"
                    value={contactNumber}
                    placeholder="+91 98765 43210"
                    onChange={e => setContactNumber(e.target.value)}
                    onBlur={() => persistSettings({ contactNumber })}
                  />
                </div>
                <button
                  type="button"
                  className="cs-bs-action-btn btn-green"
                  onClick={() => {
                    const val = prompt('Edit Contact Number:', contactNumber);
                    if (val !== null) {
                      setContactNumber(val);
                      persistSettings({ contactNumber: val });
                    }
                  }}
                  title="Edit Contact"
                >✏️</button>
              </div>
            </div>

            <div className="cs-bs-card card-gold">
              <div className="cs-bs-card-top">
                <div className="cs-bs-card-icon icon-gold">🏆</div>
                <div className="cs-bs-card-text">
                  <strong>Show Rank on banners</strong>
                  <small>Display rank name on your banners automatically.</small>
                </div>
                <div className="cs-bs-toggle-wrap">
                  <label className={`cs-bs-switch ${showRankOnBanners ? 'is-on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={showRankOnBanners}
                      onChange={e => {
                        setShowRankOnBanners(e.target.checked);
                        persistSettings({ showRankOnBanners: e.target.checked });
                      }}
                    />
                    <span className="cs-bs-slider"></span>
                  </label>
                  <span className={`cs-bs-status ${showRankOnBanners ? 'status-on' : 'status-off'}`}>
                    {showRankOnBanners ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
              <div className="cs-bs-card-bottom">
                <div className="cs-bs-select-pill">
                  <span>👑</span>
                  <select
                    value={selectedRank || 'Rank 10: Diamond'}
                    onChange={e => {
                      setSelectedRank(e.target.value);
                      persistSettings({ selectedRank: e.target.value });
                    }}
                  >
                    {RANKS.map(r => (
                      <option key={r} value={r}>{r.split(':')[1]?.trim() || r}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="cs-bs-pill-btn"
                  onClick={() => {
                    const custom = prompt('Enter custom rank name:', customRankName);
                    if (custom !== null) {
                      setCustomRankName(custom);
                      persistSettings({ customRankName: custom });
                    }
                  }}
                >
                  ✏️ {customRankName ? customRankName : 'Custom Rank'}
                </button>
              </div>
            </div>

            <div className="cs-bs-card card-pink">
              <div className="cs-bs-card-top">
                <div className="cs-bs-card-icon icon-pink">📷</div>
                <div className="cs-bs-card-text">
                  <strong>Show Social Name on banners</strong>
                  <small>Display your social media name on supported banners.</small>
                </div>
                <div className="cs-bs-toggle-wrap">
                  <label className={`cs-bs-switch ${showSocialNameOnBanners ? 'is-on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={showSocialNameOnBanners}
                      onChange={e => {
                        setShowSocialNameOnBanners(e.target.checked);
                        persistSettings({ showSocialNameOnBanners: e.target.checked });
                      }}
                    />
                    <span className="cs-bs-slider"></span>
                  </label>
                  <span className={`cs-bs-status ${showSocialNameOnBanners ? 'status-on' : 'status-off'}`}>
                    {showSocialNameOnBanners ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
              <div className="cs-bs-card-bottom">
                <div className="cs-bs-input-pill pill-pink">
                  <input
                    type="text"
                    value={socialName}
                    placeholder="@yourname"
                    onChange={e => setSocialName(e.target.value)}
                    onBlur={() => persistSettings({ socialName })}
                  />
                </div>
                <button
                  type="button"
                  className="cs-bs-action-btn btn-pink"
                  onClick={() => {
                    const val = prompt('Edit Social Name:', socialName);
                    if (val !== null) {
                      setSocialName(val);
                      persistSettings({ socialName: val });
                    }
                  }}
                  title="Edit Social Name"
                >✏️</button>
              </div>
            </div>

            <div className="cs-bs-card card-blue">
              <div className="cs-bs-card-top">
                <div className="cs-bs-card-icon icon-blue">👥</div>
                <div className="cs-bs-card-text">
                  <strong>Show up lines in Rank Banners</strong>
                  <small>Include your uplines in rank promotion banners.</small>
                </div>
                <div className="cs-bs-toggle-wrap">
                  <label className={`cs-bs-switch ${showUplinesRank ? 'is-on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={showUplinesRank}
                      onChange={e => {
                        setShowUplinesRank(e.target.checked);
                        persistSettings({ showUplinesRank: e.target.checked });
                      }}
                    />
                    <span className="cs-bs-slider"></span>
                  </label>
                  <span className={`cs-bs-status ${showUplinesRank ? 'status-on' : 'status-off'}`}>
                    {showUplinesRank ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
              <div className="cs-bs-card-bottom">
                <div className="cs-bs-avatar-strip">
                  {people.map((p, idx) => (
                    <img key={p.id || idx} src={p.url} alt="" className="cs-bs-avatar" title={`Upline ${idx + 1}`} />
                  ))}
                  {people.length < MAX_BANNER_PEOPLE && (
                    <label className="cs-bs-avatar-add" title="Add Uplines Photo">
                      +<input type="file" accept="image/*" onChange={e => addPerson(e.target.files?.[0])} hidden />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="cs-bs-card card-purple">
              <div className="cs-bs-card-top">
                <div className="cs-bs-card-icon icon-purple">🎖</div>
                <div className="cs-bs-card-text">
                  <strong>Show up lines in Achievements Banners</strong>
                  <small>Include your uplines in achievements banners.</small>
                </div>
                <div className="cs-bs-toggle-wrap">
                  <label className={`cs-bs-switch ${showUplinesAchievements ? 'is-on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={showUplinesAchievements}
                      onChange={e => {
                        setShowUplinesAchievements(e.target.checked);
                        persistSettings({ showUplinesAchievements: e.target.checked });
                      }}
                    />
                    <span className="cs-bs-slider"></span>
                  </label>
                  <span className={`cs-bs-status ${showUplinesAchievements ? 'status-on' : 'status-off'}`}>
                    {showUplinesAchievements ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
              <div className="cs-bs-card-bottom">
                <div className="cs-bs-avatar-strip">
                  {people.map((p, idx) => (
                    <img key={p.id || idx} src={p.url} alt="" className="cs-bs-avatar is-muted" title={`Upline ${idx + 1}`} />
                  ))}
                  <label className="cs-bs-avatar-add" title="Add Uplines Photo">
                    +<input type="file" accept="image/*" onChange={e => addPerson(e.target.files?.[0])} hidden />
                  </label>
                </div>
              </div>
            </div>

            <div className="cs-bs-card card-rose">
              <div className="cs-bs-card-top">
                <div className="cs-bs-card-icon icon-rose">🎁</div>
                <div className="cs-bs-card-text">
                  <strong>Show up lines in Bonanza Banners</strong>
                  <small>Include your uplines in bonanza promotion banners.</small>
                </div>
                <div className="cs-bs-toggle-wrap">
                  <label className={`cs-bs-switch ${showUplinesBonanza ? 'is-on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={showUplinesBonanza}
                      onChange={e => {
                        setShowUplinesBonanza(e.target.checked);
                        persistSettings({ showUplinesBonanza: e.target.checked });
                      }}
                    />
                    <span className="cs-bs-slider"></span>
                  </label>
                  <span className={`cs-bs-status ${showUplinesBonanza ? 'status-on' : 'status-off'}`}>
                    {showUplinesBonanza ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
              <div className="cs-bs-card-bottom">
                <div className="cs-bs-avatar-strip">
                  {people.map((p, idx) => (
                    <img key={p.id || idx} src={p.url} alt="" className="cs-bs-avatar is-muted" title={`Upline ${idx + 1}`} />
                  ))}
                  <label className="cs-bs-avatar-add" title="Add Uplines Photo">
                    +<input type="file" accept="image/*" onChange={e => addPerson(e.target.files?.[0])} hidden />
                  </label>
                </div>
              </div>
            </div>

            <div className="cs-bs-card card-orange">
              <div className="cs-bs-card-top">
                <div className="cs-bs-card-icon icon-orange">🚀</div>
                <div className="cs-bs-card-text">
                  <strong>Show up lines in Capping Banners</strong>
                  <small>Include your uplines in capping achievement banners.</small>
                </div>
                <div className="cs-bs-toggle-wrap">
                  <label className={`cs-bs-switch ${showUplinesCapping ? 'is-on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={showUplinesCapping}
                      onChange={e => {
                        setShowUplinesCapping(e.target.checked);
                        persistSettings({ showUplinesCapping: e.target.checked });
                      }}
                    />
                    <span className="cs-bs-slider"></span>
                  </label>
                  <span className={`cs-bs-status ${showUplinesCapping ? 'status-on' : 'status-off'}`}>
                    {showUplinesCapping ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
              <div className="cs-bs-card-bottom">
                <div className="cs-bs-avatar-strip">
                  {people.map((p, idx) => (
                    <img key={p.id || idx} src={p.url} alt="" className="cs-bs-avatar" title={`Upline ${idx + 1}`} />
                  ))}
                  {people.length < MAX_BANNER_PEOPLE && (
                    <label className="cs-bs-avatar-add" title="Add Uplines Photo">
                      +<input type="file" accept="image/*" onChange={e => addPerson(e.target.files?.[0])} hidden />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="cs-bs-card card-teal">
              <div className="cs-bs-card-top">
                <div className="cs-bs-card-icon icon-teal">🛡</div>
                <div className="cs-bs-card-text">
                  <strong>Show Team Logo</strong>
                  <small>Display your team logo on supported banners.</small>
                </div>
                <div className="cs-bs-toggle-wrap">
                  <label className={`cs-bs-switch ${showTeamLogo ? 'is-on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={showTeamLogo}
                      onChange={e => {
                        setShowTeamLogo(e.target.checked);
                        persistSettings({ showTeamLogo: e.target.checked });
                      }}
                    />
                    <span className="cs-bs-slider"></span>
                  </label>
                  <span className={`cs-bs-status ${showTeamLogo ? 'status-on' : 'status-off'}`}>
                    {showTeamLogo ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
              <div className="cs-bs-card-bottom">
                <div className="cs-bs-preview-box">
                  {asclepiasLogo ? (
                    <img src={asclepiasLogo} alt="Team Logo" />
                  ) : (
                    <div className="cs-bs-default-logo">TEAM LEADERS</div>
                  )}
                </div>
                <label className="cs-bs-upload-btn btn-teal">
                  📤 Change Logo
                  <input type="file" accept="image/*" onChange={e => addLogo(e, setAsclepiasLogo, 'asclepiasLogo')} hidden />
                </label>
              </div>
            </div>

            <div className="cs-bs-card card-violet">
              <div className="cs-bs-card-top">
                <div className="cs-bs-card-icon icon-violet">⭐</div>
                <div className="cs-bs-card-text">
                  <strong>Fighter Success System</strong>
                  <small>Enable Fighter Success System branding on supported banners.</small>
                </div>
                <div className="cs-bs-toggle-wrap">
                  <label className={`cs-bs-switch ${fighterSuccessSystem ? 'is-on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={fighterSuccessSystem}
                      onChange={e => {
                        setFighterSuccessSystem(e.target.checked);
                        persistSettings({ fighterSuccessSystem: e.target.checked });
                      }}
                    />
                    <span className="cs-bs-slider"></span>
                  </label>
                  <span className={`cs-bs-status ${fighterSuccessSystem ? 'status-on' : 'status-off'}`}>
                    {fighterSuccessSystem ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
              <div className="cs-bs-card-bottom">
                <div className="cs-bs-fighter-preview">
                  {fighterLogo ? (
                    <img src={fighterLogo} alt="Fighter Banner" />
                  ) : (
                    <div className="cs-bs-fighter-default">
                      <span>🏃</span>
                      <div>
                        <b>FIGHTER</b>
                        <small>SUCCESS SYSTEM</small>
                      </div>
                    </div>
                  )}
                </div>
                <label className="cs-bs-upload-btn btn-violet">
                  📤 Change Image
                  <input type="file" accept="image/*" onChange={e => addLogo(e, setFighterLogo, 'fighterLogo')} hidden />
                </label>
              </div>
            </div>

            <div className="cs-bs-card card-indigo">
              <div className="cs-bs-card-top">
                <div className="cs-bs-card-icon icon-indigo">🏷️</div>
                <div className="cs-bs-card-text">
                  <strong>Fighter Text System</strong>
                  <small>Enable Fighter Text branding on supported banners.</small>
                </div>
                <div className="cs-bs-toggle-wrap">
                  <label className={`cs-bs-switch ${fighterTextSystem ? 'is-on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={fighterTextSystem}
                      onChange={e => {
                        setFighterTextSystem(e.target.checked);
                        persistSettings({ fighterTextSystem: e.target.checked });
                      }}
                    />
                    <span className="cs-bs-slider"></span>
                  </label>
                  <span className={`cs-bs-status ${fighterTextSystem ? 'status-on' : 'status-off'}`}>
                    {fighterTextSystem ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
              <div className="cs-bs-card-bottom">
                <div className="cs-bs-fighter-preview">
                  {fighterStudio ? (
                    <img src={fighterStudio} alt="Fighter Text Banner" />
                  ) : (
                    <div className="cs-bs-fighter-default">
                      <span>🎨</span>
                      <div>
                        <b>FIGHTER TEXT</b>
                        <small>STUDIO TEXT BRANDING</small>
                      </div>
                    </div>
                  )}
                </div>
                <label className="cs-bs-upload-btn btn-indigo">
                  📤 Change Image
                  <input type="file" accept="image/*" onChange={e => addLogo(e, setFighterStudio, 'fighterStudio')} hidden />
                </label>
              </div>
            </div>
          </div>

          {savedMessage && (
            <div className="cs-bs-save-toast">
              <span>✓</span> {savedMessage}
            </div>
          )}
        </section>
      ) : (
        studioTab === 'categories' ? (
          <div style={{ width: '100%' }}>
            <header className="cs-header">
              <div className="cs-nav-brand">
                <div className="cs-nav-logo-wrap">
                  <img
                    src="/aarsh-digital-logo.png"
                    alt="Aarsh Digital"
                    className="cs-nav-logo-img"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextSibling) {
                        e.currentTarget.nextSibling.style.display = 'block';
                      }
                    }}
                  />
                  <span className="cs-nav-logo-fallback" style={{ display: 'none' }}>A</span>
                </div>
                <div className="cs-nav-brand-texts">
                  <b className="cs-nav-brand-title">AARSH DIGITAL</b>
                  <small className="cs-nav-brand-sub">CREATIVE STUDIO</small>
                </div>
              </div>
              <div className="cs-header-actions">
                <button onClick={() => setSettingsOpen(v => !v)} className="cs-secondary-btn">⚙ Banner Settings</button>
                <button onClick={onBack} className="cs-back-btn">← Dashboard</button>
              </div>
            </header>

            <section className="cs-home-hero-shell">
              <div className="cs-home-hero-left">
                <div className="cs-home-hero-kicker">Aarsh Digital • Creative Studio</div>
                <h1 className="cs-home-hero-title">Start <span>Creating</span></h1>
                <h3 className="cs-home-hero-sub">Turn your ideas into stunning designs in minutes.</h3>
                <p className="cs-home-hero-desc">Choose a creative category; Rank Promotion, Welcome Banner, and Closing Banner are ready to use.</p>

                <div className="cs-home-hero-badges">
                  <div className="cs-hero-badge-pill">
                    <span className="cs-badge-icon">👑</span>
                    <div><strong>Professional</strong><small>Templates</small></div>
                  </div>
                  <div className="cs-hero-badge-pill">
                    <span className="cs-badge-icon">⚡</span>
                    <div><strong>Quick</strong><small>Design Creation</small></div>
                  </div>
                  <div className="cs-hero-badge-pill">
                    <span className="cs-badge-icon">🎨</span>
                    <div><strong>All-in-One</strong><small>Creative Solution</small></div>
                  </div>
                </div>
              </div>

              <div className="cs-home-hero-right">
                <img 
                  src="/assets/categories/hero-tablet.png" 
                  alt="Creative Studio Design Tablet" 
                  className="cs-hero-tablet-img" 
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            </section>

            <div className="cs-home-categories-title-strip">
              <h2>✦ CREATIVE CATEGORIES</h2>
            </div>

            <div className="cs-home-cards-grid">
              {CATEGORIES.map((item, index) => {
                const isReady = item.isRank || item.isDirect;
                return (
                  <div
                    key={item.id}
                    className={item.isRank ? 'cs-card-featured-rank' : `cs-card-normal-cat ${item.theme || ''}`}
                    onClick={() => {
                      if (!isReady) return;
                      setActiveCategory(item.id);
                      if (item.isRank) {
                        setSelectedRank(null);
                        setRankTemplateView(false);
                        setAchieverDetailsView(false);
                        setStudioTab('rank-promotion');
                      } else if (item.isDirect) {
                        setSelectedRank(null);
                        setRankTemplateView(false);
                        setAchieverDetailsView(true);
                        setStudioTab('direct-category');
                      }
                    }}
                    style={{ cursor: isReady ? 'pointer' : 'default' }}
                  >
                    <div className={item.isRank ? 'cs-rank-card-num-badge' : 'cs-cat-num-pill'}>{index + 1}</div>
                    <img 
                      src={item.icon} 
                      alt={item.label} 
                      className={item.isRank ? 'cs-rank-trophy-img' : 'cs-cat-3d-icon-img'} 
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className={item.isRank ? 'cs-rank-featured-info' : 'cs-cat-details-col'}>
                      <div className="cs-cat-top-row">
                        <h4 style={{ margin: 0 }}>{item.label}</h4>
                        {isReady && <span className="cs-badge-available">✔ AVAILABLE</span>}
                      </div>
                      <p>{item.desc}</p>
                      {item.isRank && (
                        <div className="cs-rank-meta-pills">
                          <span className="cs-meta-pill">👑 18 Ranks</span>
                          <span className="cs-meta-pill">🖼 45 Templates</span>
                        </div>
                      )}
                      {!isReady && <span className="cs-badge-coming-soon">COMING SOON</span>}
                    </div>
                    {!item.isRank && <span className="cs-cat-arrow-right">›</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          achieverDetailsView ? (
            <section className="aarsh-creative-studio-viewport">
              <header className="aarsh-studio-nav">
                <div className="aarsh-nav-brand">
                  <img src="/aarsh-digital-logo.png" alt="Aarsh Digital" className="aarsh-nav-logo" />
                  <span>AI • CREATE • DESIGN • GROW</span>
                </div>

                <div className="aarsh-nav-actions">
                  <button type="button" onClick={() => setSettingsOpen(true)} className="aarsh-nav-btn btn-settings">
                    <span className="btn-icon">⚙</span> Banner Settings
                  </button>
                  <button type="button" onClick={onBack} className="aarsh-nav-btn btn-dashboard">
                    <span className="btn-icon">⌂</span> Dashboard
                  </button>
                </div>
              </header>

              <div className="aarsh-studio-content-card">
                <button 
                  type="button" 
                  onClick={() => {
                    setAchieverDetailsView(false);
                    if (activeCategory === 'welcome' || activeCategory === 'closing') {
                      setStudioTab('categories');
                    }
                  }} 
                  className="aarsh-back-btn"
                >
                  ← Back
                </button>

                <div className="aarsh-achiever-hero">
                  <div className="achiever-hero-medal-stage">
                    <div className="achiever-podium-platform">
                      <div className="podium-crystal-glow"></div>
                      <div className="podium-circular-stage">
                        <span className="podium-crown-top">👑</span>
                        <div className="podium-gold-medal">
                          <span className="podium-laurel laurel-left">🌿</span>
                          <div className="podium-coin-core">
                            <span className="podium-rank-num">{selectedRankIndex || 1}</span>
                          </div>
                          <span className="podium-laurel laurel-right">🌿</span>
                        </div>
                        <div className="podium-base-pedestal"></div>
                      </div>
                    </div>
                  </div>

                  <div className="achiever-hero-titles">
                    <div className="hero-crown-mini">👑</div>
                    <span className="hero-category-tag">
                      {activeCategory === 'welcome' 
                        ? 'WELCOME BANNER' 
                        : activeCategory === 'closing' 
                          ? 'CLOSING BANNER' 
                          : 'RANK PROMOTION'}
                    </span>
                    <h1 className="hero-rank-heading">
                      {activeCategory === 'welcome' 
                        ? 'WELCOME' 
                        : activeCategory === 'closing' 
                          ? 'CLOSING' 
                          : selectedRankLabel.toUpperCase()}
                    </h1>
                    <h2 className="hero-sub-heading">ACHIEVER DETAILS</h2>
                    <p className="hero-helper-p">Fill in the details below to create your personalised designs.</p>
                  </div>

                  <div className="achiever-hero-quote-stage">
                    <div className="quote-text-group">
                      <span className="quote-handwriting">Big Dreams</span>
                      <strong className="quote-bold">Bigger</strong>
                      <strong className="quote-bold quote-sub">Achievements</strong>
                    </div>

                    <div className="quote-chart-graphic">
                      <div className="chart-bar bar-1"></div>
                      <div className="chart-bar bar-2"></div>
                      <div className="chart-bar bar-3"></div>
                      <div className="chart-arrow-svg">
                        <svg viewBox="0 0 60 70" width="48" height="56">
                          <path d="M6,62 Q28,42 46,14" fill="none" stroke="#d946ef" strokeWidth="6" strokeLinecap="round" />
                          <polygon points="46,6 55,20 40,16" fill="#d946ef" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="aarsh-form-grid">
                  <div className="aarsh-detail-card">
                    <div className="detail-card-head">
                      <div className="card-head-icon icon-pink-user">
                        <span>👤</span>
                      </div>
                      <div className="card-head-texts">
                        <h3>Personal Details</h3>
                        <p>Enter achiever information to personalise your templates</p>
                      </div>
                    </div>

                    <div className="aarsh-field-group">
                      <div className="name-inputs-row">
                        <div className="input-with-icon select-wrapper">
                          <span className="field-left-icon">👤</span>
                          <select
                            value={achieverDetails.salutation}
                            onChange={e => setAchieverDetails(p => ({ ...p, salutation: e.target.value }))}
                          >
                            <option>Mr.</option>
                            <option>Mrs.</option>
                            <option>Miss.</option>
                            <option>Dr.</option>
                          </select>
                          <span className="select-arrow-down">▾</span>
                        </div>
                        <div className="input-with-icon">
                          <span className="field-left-icon">👤</span>
                          <input
                            type="text"
                            placeholder="First Name"
                            aria-label="First Name"
                            title="First Name"
                            value={achieverDetails.firstName}
                            onChange={e => setAchieverDetails(p => ({ ...p, firstName: e.target.value }))}
                          />
                        </div>
                        <div className="input-with-icon">
                          <span className="field-left-icon">👤</span>
                          <input
                            type="text"
                            placeholder="Last Name"
                            aria-label="Last Name"
                            title="Last Name"
                            value={achieverDetails.lastName}
                            onChange={e => setAchieverDetails(p => ({ ...p, lastName: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="aarsh-field-group">
                      <div className="input-with-icon full-width">
                        <span className="field-left-icon">📍</span>
                        <input
                          type="text"
                          placeholder="City"
                          aria-label="City"
                          title="City"
                          value={achieverDetails.teamCity}
                          onChange={e => setAchieverDetails(p => ({ ...p, teamCity: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="aarsh-feature-badges-row">
                      <div className="badge-item">
                        <div className="badge-icon-box pink-badge">👑</div>
                        <b>Professional<br />Templates</b>
                      </div>
                      <div className="badge-item">
                        <div className="badge-icon-box purple-badge">🖼️</div>
                        <b>AI Background<br />Remover</b>
                      </div>
                      <div className="badge-item">
                        <div className="badge-icon-box blue-badge">HD</div>
                        <b>High Quality<br />4K Designs</b>
                      </div>
                      <div className="badge-item">
                        <div className="badge-icon-box gold-badge">⚡</div>
                        <b>Quick<br />Generation</b>
                      </div>
                    </div>
                  </div>

                  <div className="aarsh-detail-card">
                    <div className="detail-card-head photo-card-head">
                      <div className="card-head-icon icon-blue-gallery">
                        <span>🖼</span>
                      </div>
                      <div className="card-head-texts">
                        <h3>Achiever Photo</h3>
                        <p>Upload photo (Client-side AI Background Removal)</p>
                      </div>
                      <button
                        type="button"
                        className="ai-remover-tag-btn"
                        onClick={removeAchieverBackgroundNow}
                        disabled={!achieverDetails.originalUrl || achieverPhotoLoading}
                      >
                        {achieverPhotoLoading ? '⏳ Removing BG...' : '🪄 AI Background Remover'}
                      </button>
                    </div>

                    <div className="aarsh-photo-preview-grid">
                      <label className="photo-box upload-original-box">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleAchieverImage(file);
                            e.target.value = '';
                          }} 
                          style={{ display: 'none' }} 
                        />
                        {achieverDetails.originalUrl ? (
                          <img src={achieverDetails.originalUrl} alt="Original" className="uploaded-img-preview" />
                        ) : (
                          <div className="upload-placeholder-content">
                            <div className="avatar-placeholder-ring">
                              <span>👤</span>
                              <b className="plus-badge">+</b>
                            </div>
                            <strong className="upload-title">Upload Image</strong>
                            <small className="upload-sub">PNG, JPG (Max 5MB)</small>
                          </div>
                        )}
                      </label>

                      <div className="photo-box cutout-checkerboard-box" onClick={openPhotoCropper} style={{ cursor: 'pointer' }}>
                        {achieverDetails.removedUrl ? (
                          <img src={achieverDetails.removedUrl} alt="Cutout" className="uploaded-img-preview" />
                        ) : (
                          <div className="cutout-empty-state">
                            <span className="sparkle-cutout-icon">{achieverPhotoLoading ? '⏳' : '🪄'}</span>
                            <strong className="cutout-title">{achieverPhotoLoading ? 'AI Cutout in progress…' : 'Background Removed'}</strong>
                            <small className="cutout-sub">{achieverPhotoLoading ? 'Please wait...' : 'Click to crop frame'}</small>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="aarsh-photo-style-toggle">
                      <button
                        type="button"
                        className={`toggle-pill ${activePhotoStyle === 'original' ? 'is-selected' : ''}`}
                        onClick={() => setActivePhotoStyle('original')}
                      >
                        <span className="toggle-avatar-icon">⬆</span> Full Image
                      </button>
                      <button
                        type="button"
                        className={`toggle-pill ${activePhotoStyle === 'cutout' ? 'is-selected' : ''}`}
                        onClick={() => setActivePhotoStyle('cutout')}
                      >
                        <span className="toggle-avatar-icon">✨</span> Background Removed
                      </button>
                    </div>
                    {(achieverDetails.removedUrl || achieverDetails.originalUrl) && (
                      <button type="button" className="cs-open-crop-btn" onClick={openPhotoCropper}>
                        ✂️ Crop / Adjust Focus Area
                      </button>
                    )}
                  </div>
                </div>

                <div className="aarsh-next-action-wrapper">
                  <button
                    type="button"
                    onClick={createAchiever}
                    className="aarsh-glowing-next-btn"
                    disabled={achieverPhotoLoading}
                  >
                    <span className="next-btn-main">Next</span>
                    <span className="next-arrow">→</span>
                    <span className="next-btn-sub">Choose Template</span>
                  </button>
                </div>
              </div>
            </section>
          ) : rankTemplateView ? (
            <section className={`cs-template-page ${selectedRankTheme}`}>
              <div className="cs-template-topbar">
                <button 
                  type="button" 
                  className="cs-rank-back" 
                  onClick={() => {
                    setRankTemplateView(false);
                    setAchieverDetailsView(true);
                  }}
                  aria-label="Back"
                >
                  ‹
                </button>
                <span className="cs-mobile-app-header-title">
                  {activeCategory === 'welcome' 
                    ? 'COMMON WELCOME' 
                    : activeCategory === 'closing' 
                      ? 'CLOSING BANNER' 
                      : `${selectedRankLabel.toUpperCase()}`}
                </span>
                <button 
                  type="button" 
                  className="cs-rank-badge" 
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Settings"
                >
                  ⚙
                </button>
              </div>

              <div className="cs-template-workspace">
                <div className="cs-template-left-column">
                  <div className="cs-template-featured">
                    <div className="cs-template-featured-card">
                      <ReferenceTemplatePreview
                        category={activeCategory}
                        template={selectedTemplate}
                        rankLabel={selectedRankLabel}
                        achieverDetails={achieverDetails}
                        activePhotoStyle={activePhotoStyle}
                        banner={{
                          asclepiasLogo, people, fighterLogo, fighterStudio,
                          showContactOnBanners, contactNumber, showRankOnBanners, customRankName,
                          showSocialNameOnBanners, socialName, showUplinesRank, showUplinesAchievements,
                          showUplinesBonanza, showUplinesCapping, showTeamLogo, fighterSuccessSystem, fighterTextSystem
                        }}
                        profile={profile}
                        onActiveLeaderPhotoChange={setActiveLeaderPhoto}
                      />
                    </div>
                  </div>

                  {/* Image/Video Toggle + Golden Download Button */}
                  <div className="cs-mobile-quick-actions-strip">
                    <div className="cs-mobile-mode-pill">
                      <button type="button" className="cs-mobile-mode-btn is-active">Image</button>
                      <button type="button" className="cs-mobile-mode-btn" onClick={() => alert('Video templates coming soon!')}>Video</button>
                    </div>
                    <button 
                      type="button" 
                      className="cs-mobile-big-download-btn"
                      onClick={downloadCanvasImage}
                      disabled={exportBusy}
                    >
                      {exportBusy ? 'Saving…' : 'Download'}
                    </button>
                  </div>
                </div>

                <div className="cs-template-gallery-panel">
                  {(() => {
                    const isSquareCat = activeCategory === 'welcome' || activeCategory === 'closing';
                    const matchingTemplates = Array.from({ length: activeTemplateCount }, (_, index) => index + 1);

                    return (
                      <div className="cs-template-grid">
                        {matchingTemplates.map((no) => {
                          const selected = selectedTemplate === no;
                          return (
                            <button
                              key={no}
                              type="button"
                              className={`cs-template-card ${selected ? 'is-selected' : ''}`}
                              onClick={() => setSelectedTemplate(no)}
                              aria-label={`Select template ${String(no).padStart(2, '0')}`}
                              aria-pressed={selected}
                            >
                              <div 
                                className={`cs-template-thumb-wrap ${isSquareCat ? 'is-square-thumb' : ''}`}
                                style={isSquareCat ? { aspectRatio: '1 / 1' } : {}}
                              >
                                <SmartTemplateImage
                                  category={activeCategory}
                                  no={no}
                                  alt={`Template ${String(no).padStart(2, '0')}`}
                                  style={isSquareCat ? { objectFit: 'contain', aspectRatio: '1 / 1' } : {}}
                                />
                                {selected && <span className="cs-template-selected-check">✓</span>}
                              </div>
                              <span className="cs-template-tag">Template {String(no).padStart(2, '0')}</span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </section>
          ) : (
            <section 
              className="cs-rank-section" 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                boxShadow: 'none', 
                padding: '0 8px 30px' 
              }}
            >
              <div 
                className="cs-rank-full-banner-wrap"
                style={{
                  position: 'relative',
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  padding: 0,
                  margin: '0 0 16px 0',
                  overflow: 'hidden',
                  borderRadius: '26px'
                }}
              >
                <img
                  src="/assets/categories/rank-full-banner.png"
                  alt="Rank Promotion Banner"
                  className="cs-rank-full-banner-img"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    borderRadius: '26px',
                    border: '1.5px solid rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 12px 30px rgba(124, 58, 237, 0.16)'
                  }}
                  onError={(e) => {
                    const cur = e.currentTarget.src;
                    if (cur.endsWith('.png')) {
                      e.currentTarget.src = '/assets/categories/rank-full-banner.jpg';
                    } else if (cur.endsWith('.jpg')) {
                      e.currentTarget.src = '/assets/categories/rank-full-banner.jpeg';
                    }
                  }}
                />

                <div 
                  className="cs-rank-banner-overlay-actions"
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    zIndex: 10
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(v => !v)}
                    className="cs-banner-overlay-btn btn-settings"
                  >
                    ⚙ Banner Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudioTab('categories')}
                    className="cs-banner-overlay-btn btn-back"
                  >
                    ← All Categories
                  </button>
                </div>
              </div>

              <div className="cs-rank-square-grid">
                {RANK_OPTIONS.map((option, idx) => {
                  const paddedNum = String(idx + 1).padStart(2, '0');
                  return (
                    <button
                      type="button"
                      key={option.id}
                      className={`cs-rank-square-card ${option.theme} ${selectedRank === option.id ? 'is-selected' : ''}`}
                      onClick={() => {
                        setSelectedRank(option.id);
                        setAchieverDetailsView(true);
                        setRankTemplateView(false);
                      }}
                    >
                      <span className="cs-rank-number-tag">{paddedNum}</span>

                      <div className="cs-rank-center-visual">
                        <img
                          src={option.image}
                          alt={option.label}
                          className="cs-rank-3d-graphic"
                          draggable="false"
                          onError={(e) => {
                            const cur = e.currentTarget.src;
                            if (cur.includes('Ruby_Star')) e.currentTarget.src = '/rank-assets/Ruby_Star.png';
                            else if (cur.includes('Blue_Diamond')) e.currentTarget.src = '/rank-assets/Blue_Diamond.png';
                            else if (cur.includes('Black_Diamond')) e.currentTarget.src = '/rank-assets/Black_Diamond.png';
                            else if (cur.includes('Royal_Diamond')) e.currentTarget.src = '/rank-assets/Royal_Diamond.png';
                            else if (cur.includes('Crown_Diamond')) e.currentTarget.src = '/rank-assets/Crown_Diamond.png';
                            else if (cur.includes('Royal_Ambassador')) e.currentTarget.src = '/rank-assets/Royal_Ambassador.png';
                            else if (cur.includes('Crown_Ambassador')) e.currentTarget.src = '/rank-assets/Crown_Ambassador.png';
                            else if (cur.includes('Brand_Ambassador')) e.currentTarget.src = '/rank-assets/Brand_Ambassador.png';
                          }}
                        />
                      </div>

                      <div className="cs-rank-bottom-strip">
                        <span className="cs-rank-title-text">{option.label.toUpperCase()}</span>
                        <span className="cs-rank-arrow-circle">›</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedRank && (
                <div className="cs-rank-selection">
                  <span>Selected Option</span>
                  <b>{RANK_OPTIONS.find(x => x.id === selectedRank)?.label || selectedRank}</b>
                </div>
              )}
            </section>
          )
        )
      )}

      {/* 🎯 EXPORT / DOWNLOAD MODAL */}
      {showTemplateActions && (
        <div className="cs-export-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowTemplateActions(false); }}>
          <section className="cs-export-modal" role="dialog" aria-modal="true" aria-labelledby="cs-export-title">
            <header className="cs-export-header">
              <div className="cs-export-success-icon">✓</div>
              <div>
                <span className="cs-export-eyebrow">DESIGN READY</span>
                <h2 id="cs-export-title">Your poster is ready!</h2>
                <p>
                  {activeCategory === 'welcome' 
                    ? `Welcome Banner · Template ${String(selectedTemplate).padStart(2, '0')}` 
                    : activeCategory === 'closing' 
                      ? `Closing Banner · Template ${String(selectedTemplate).padStart(2, '0')}` 
                      : `${selectedRankLabel} · Template ${String(selectedTemplate).padStart(2, '0')}`}
                </p>
              </div>
              <button type="button" className="cs-export-close" onClick={() => setShowTemplateActions(false)} aria-label="Close download options">×</button>
            </header>
            <div className="cs-export-body">
              <div className="cs-export-preview-card">
                <SmartTemplateImage
                  category={activeCategory}
                  no={selectedTemplate}
                  alt={`Selected template ${selectedTemplate}`}
                  loading="eager"
                  fetchPriority="high"
                />
                <div>
                  <b>{[achieverDetails.salutation, achieverDetails.firstName, achieverDetails.lastName].filter(Boolean).join(' ')}</b>
                  <span>{achieverDetails.teamCity}</span>
                </div>
              </div>
              <div className="cs-export-actions-area">
                <h3>Download or share your design</h3>
                <p>Choose an action below. Your personalised poster will be prepared using the selected template and entered details.</p>
                <div className="cs-export-action-grid">
                  <button type="button" className="cs-export-action cs-export-image" onClick={downloadCanvasImage} disabled={exportBusy}>
                    <span>⬇</span><b>{exportBusy ? 'Preparing…' : 'Download Image'}</b><small>High-resolution PNG</small>
                  </button>
                  <button type="button" className="cs-export-action cs-export-pdf" onClick={downloadPosterPdf} disabled={exportBusy}>
                    <span>▣</span><b>Download PDF</b><small>Print-ready file</small>
                  </button>
                  <button type="button" className="cs-export-action cs-export-print" onClick={printPoster} disabled={exportBusy}>
                    <span>🖨</span><b>Print Poster</b><small>Open print dialog</small>
                  </button>
                  <button type="button" className="cs-export-action cs-export-share" onClick={sharePoster} disabled={exportBusy}>
                    <span>↗</span><b>Share Design</b><small>Share sheet / WhatsApp</small>
                  </button>
                </div>
                <div className="cs-export-rating-card">
                  <div><b>⭐ Rate your experience</b><small>How was your template creation experience?</small></div>
                  <div className="cs-export-stars" role="group" aria-label="Rate your experience">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" className={templateRating >= star ? 'is-active' : ''} onClick={() => { setTemplateRating(star); setRatingSaved(false); }} aria-label={`${star} star`}>★</button>
                    ))}
                  </div>
                  <button type="button" className="cs-export-rate-submit" onClick={saveTemplateRating}>{ratingSaved ? '✓ Rating Saved' : 'Submit Rating'}</button>
                </div>
                {ratingSaved && <p className="cs-export-rating-thanks">Thanks for your feedback! Your rating is saved on this device.</p>}
              </div>
            </div>
            <footer className="cs-export-footer"><button type="button" className="cs-export-done" onClick={() => setShowTemplateActions(false)}>Back to Templates</button></footer>
          </section>
        </div>
      )}

      {/* 🎯 CROP MODAL (FOCUSED AREA SELECTOR) */}
      {cropModalOpen && (achieverDetails.removedUrl || achieverDetails.originalUrl) && (
        <div className="cs-crop-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setCropModalOpen(false); }}>
          <section className="cs-crop-modal" role="dialog" aria-modal="true" aria-labelledby="cs-crop-title">
            <header className="cs-crop-header">
              <div>
                <span className="cs-crop-eyebrow">PHOTO FOCUS EDITOR</span>
                <h2 id="cs-crop-title">Select Focus Area</h2>
                <p>Jo hissa aap select karenge sirf wahi template par aayega.</p>
              </div>
              <button type="button" className="cs-crop-close" onClick={() => setCropModalOpen(false)} aria-label="Close cropper">×</button>
            </header>
            <div className={`cs-crop-preview cs-crop-${cropAspect}`}>
              <img 
                src={achieverDetails.removedUrl || achieverDetails.originalUrl} 
                alt="Crop preview" 
                style={{ objectPosition: `${cropX}% ${cropY}%`, transform: `scale(${cropZoom})` }} 
              />
              <span className="cs-crop-frame-hint">FOCUS PREVIEW</span>
            </div>
            <div className="cs-crop-controls">
              <label className="cs-crop-control-label">Crop Shape</label>
              <div className="cs-crop-ratios">
                {[['original', 'Original'], ['square', 'Square 1:1'], ['portrait', 'Portrait 4:5'], ['landscape', 'Landscape 16:9']].map(([value, label]) => (
                  <button type="button" key={value} className={cropAspect === value ? 'is-active' : ''} onClick={() => setCropAspect(value)}>{label}</button>
                ))}
              </div>
              <label className="cs-crop-range-label"><span>Zoom In / Out</span><b>{Math.round(cropZoom * 100)}%</b></label>
              <input aria-label="Zoom photo" className="cs-crop-range" type="range" min="1" max="2.5" step="0.05" value={cropZoom} onChange={e => setCropZoom(Number(e.target.value))} />
              <label className="cs-crop-range-label"><span>Horizontal Position (Left/Right)</span><b>{cropX}%</b></label>
              <input aria-label="Horizontal crop position" className="cs-crop-range" type="range" min="0" max="100" value={cropX} onChange={e => setCropX(Number(e.target.value))} />
              <label className="cs-crop-range-label"><span>Vertical Position (Top/Bottom)</span><b>{cropY}%</b></label>
              <input aria-label="Vertical crop position" className="cs-crop-range" type="range" min="0" max="100" value={cropY} onChange={e => setCropY(Number(e.target.value))} />
            </div>
            <footer className="cs-crop-actions">
              <button type="button" className="cs-crop-cancel" onClick={() => setCropModalOpen(false)}>Cancel</button>
              <button type="button" className="cs-crop-apply" onClick={applyPhotoCrop}>✓ Apply Focus Crop</button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}