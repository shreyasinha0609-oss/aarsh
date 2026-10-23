import { useEffect, useState } from 'react';
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

const getCategoryTemplateUrl = (category, no) => {
  if (category === 'welcome') {
    return `${WELCOME_TEMPLATE_BASE}/${no}.jpg`;
  }
  if (category === 'closing') {
    return `${CLOSING_TEMPLATE_BASE}/${no}.jpg`;
  }
  return getRankTemplateUrl(no);
};

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
const WELCOME_CUSTOM_COORDS_KEY = 'aarsh-welcome-closing-custom-coords-v1';

const readSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {
      asclepiasLogo: '', people: [], fighterLogo: '', fighterStudio: '',
      showContactOnBanners: true, contactNumber: '',
      showRankOnBanners: true, customRankName: '',
      showSocialNameOnBanners: false, socialName: '',
      showUplinesRank: true, showUplinesAchievements: false,
      showUplinesBonanza: false, showUplinesCapping: true,
      showTeamLogo: true, fighterSuccessSystem: true, fighterTextSystem: true
    };
  } catch {
    return {
      asclepiasLogo: '', people: [], fighterLogo: '', fighterStudio: '',
      showContactOnBanners: true, contactNumber: '',
      showRankOnBanners: true, customRankName: '',
      showSocialNameOnBanners: false, socialName: '',
      showUplinesRank: true, showUplinesAchievements: false,
      showUplinesBonanza: false, showUplinesCapping: true,
      showTeamLogo: true, fighterSuccessSystem: true, fighterTextSystem: true
    };
  }
};

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
  reader.onerror = () => reject(new Error('Could not read processed image'));
  reader.readAsDataURL(blob);
});

const fileToDataUrl = (file, maxSide = 1200) => new Promise((resolve) => {
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
      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = () => resolve(reader.result || '');
  };
  reader.onerror = () => resolve('');
  reader.readAsDataURL(file);
});

// REFERENCE CANVASES
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
  uplinesRow:        { x: 186, y: 28,  w: 440, h: 24, size: 30 },
  asclepias:         { x: 5,   y: 2,   w: 170, h: 80 },
  fighterLogo:       { x: 627, y: 18,  w: 132, h: 50 },
  fighterText:       { x: 749, y: 8,   w: 150, h: 57 }
};

// 🎯 EXACT LOCKED COORDINATES FOR WELCOME & CLOSING BANNERS (1600 x 1600)
export const DEFAULT_WELCOME_CLOSING_COORDS = {
  uplinesRow: {
    x: 295,
    y: 15,
    w: 945,
    h: 95,
    size: 58
  },
  achieverPhoto: {
    x: 0,
    y: 0,
    w: 740,
    h: 980
  },
  achieverName: {
    x: 650,
    y: 480,
    w: 860,
    h: 315,
    size: 45
  },
  achieverCity: {
    x: 715,
    y: 630,
    w: 740,
    h: 110,
    size: 44
  },
  leaderPhotoBottom: {
    x: 1035,
    y: 1040,
    w: 725,
    h: 535
  },
  leaderNameBottom: {
    x: 560,
    y: 1400,
    w: 595,
    h: 80,
    size: 49
  },
  leaderRankBottom: {
    x: 625,
    y: 1445,
    w: 445,
    h: 110,
    size: 32
  },
  leaderPhone: {
    x: 100,
    y: 1460,
    w: 475,
    h: 70,
    size: 44
  }
};

const readWelcomeCoords = () => {
  try {
    const raw = localStorage.getItem(WELCOME_CUSTOM_COORDS_KEY);
    return raw ? { ...DEFAULT_WELCOME_CLOSING_COORDS, ...JSON.parse(raw) } : DEFAULT_WELCOME_CLOSING_COORDS;
  } catch {
    return DEFAULT_WELCOME_CLOSING_COORDS;
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
  onActiveLeaderPhotoChange,
  welcomeCoords
}) {
  const isDirectCategory = category === 'welcome' || category === 'closing';
  const coords = isDirectCategory ? welcomeCoords : FINAL_COORDS;
  const refDims = isDirectCategory ? REFERENCE_CANVAS_SQUARE : REFERENCE_CANVAS_RANK;

  const achFullName = [achieverDetails?.salutation, achieverDetails?.firstName, achieverDetails?.lastName]
    .filter(Boolean)
    .join(' ');
  const achCity = achieverDetails?.teamCity || '';

  const achImg = achieverDetails?.removedUrl || achieverDetails?.originalUrl || '';

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

  const bgImageUrl = isDirectCategory
    ? getCategoryTemplateUrl(category, template)
    : getRankTemplateUrl(template);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div 
        className={`cs-reference-preview ${isDirectCategory ? 'is-square-preview' : ''}`}
        style={isDirectCategory ? { aspectRatio: '1 / 1', maxWidth: '520px', position: 'relative' } : { position: 'relative' }}
      >
        <img
          className="cs-reference-preview-bg"
          src={bgImageUrl}
          alt={`Template ${template}`}
          loading="eager"
          decoding="sync"
          onError={e => {
            const currentSrc = e.currentTarget.src;
            if (currentSrc.endsWith('.jpeg')) {
              e.currentTarget.src = currentSrc.replace('.jpeg', '.jpg');
            } else if (currentSrc.endsWith('.jpg')) {
              e.currentTarget.src = currentSrc.replace('.jpg', '.png');
            }
          }}
        />

        {!isDirectCategory && banner?.asclepiasLogo && (
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
                  width: `${(coords.uplinesRow.h / refDims.h) * 100}cqw`,
                  height: `${(coords.uplinesRow.h / refDims.h) * 100}cqw`,
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

        {!isDirectCategory && banner?.fighterSuccessSystem !== false && banner?.fighterLogo && (
          <img
            className="cs-ref-asset"
            style={{ ...refBox(coords.fighterLogo, refDims.w, refDims.h), objectFit: 'contain', zIndex: 20 }}
            src={banner.fighterLogo}
            alt="Fighter Success System"
          />
        )}

        {!isDirectCategory && banner?.fighterTextSystem !== false && banner?.fighterStudio && (
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
              style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center bottom' }} 
            />
          </div>
        )}

        {/* LEADER PHOTO CUTOUT */}
        {activeLeaderPhoto && (
          <div style={{ 
            position: 'absolute', 
            ...refBox(coords.leaderPhotoBottom, refDims.w, refDims.h), 
            zIndex: 12, 
            background: 'transparent'
          }}>
            <img src={activeLeaderPhoto} alt="Leader" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center bottom', display: 'block' }} />
          </div>
        )}

        {/* LEADER NAME */}
        <div style={refText(coords.leaderNameBottom, "'Merriweather', Georgia, serif", '#ffffff', 900, attractiveShadow, refDims.w, refDims.h)}>
          {leaderName.toUpperCase()}
        </div>

        {/* LEADER RANK */}
        <div style={refText(coords.leaderRankBottom, "'Montserrat', sans-serif", '#facc15', 900, attractiveShadow, refDims.w, refDims.h)}>
          {leaderRankDisplay}
        </div>

        {/* LEADER PHONE NUMBER */}
        {banner?.showContactOnBanners !== false && leaderPhone && (
          <div style={refText(coords.leaderPhone, "'Montserrat', sans-serif", '#ffffff', 900, {
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.9)'
          }, refDims.w, refDims.h)}>
            {leaderPhone}
          </div>
        )}
      </div>

      {/* LEADER PHOTO PICKER STRIP */}
      <div className="cs-leader-picker-box">
        <div className="cs-leader-picker-header">
          <span><i aria-hidden="true">♙</i> Choose Leader Photo for Template</span>
          <small>{profileImagesList.length} photos from My Profile</small>
        </div>
        <div className="cs-leader-picker-strip">
          <label className="cs-leader-upload-tile">
            <input
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                await addTemporaryLeaderPhoto(file);
                event.target.value = '';
              }}
              disabled={allLeaderPhotos.length >= 15}
            />
            <span className="cs-leader-upload-icon">＋</span>
            <b>Upload Photo</b>
          </label>
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
          <label className={`cs-leader-upload-tile cs-leader-add-tile ${allLeaderPhotos.length >= 15 ? 'is-disabled' : ''}`}>
            <input
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                await addTemporaryLeaderPhoto(file);
                event.target.value = '';
              }}
              disabled={allLeaderPhotos.length >= 15}
            />
            <span className="cs-leader-upload-icon">＋</span>
            <b>Add More</b>
            <small>Up to 15</small>
          </label>
          {allLeaderPhotos.length === 0 && <p className="cs-leader-empty-note">No profile photos found. Upload a photo to preview it on the template.</p>}
        </div>
        {extraLeaderPhotos.length > 0 && <small className="cs-leader-temp-note">Extra photos are available for this design session; upload them to My Profile if you want to keep them there.</small>}
      </div>
    </div>
  );
}

const rankName = (rank) => rank.replace(/^Rank\s+\d+:\s*/, '');

export default function CreativeStudio({ onBack, initialSettingsOpen = false, profile = null }) {
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
  const [backgroundRemovalBusy, setBackgroundRemovalBusy] = useState(false);
  
  // Custom Live Coordinates state for Welcome & Closing
  const [welcomeCoords, setWelcomeCoords] = useState(readWelcomeCoords());

  const handleUpdateWelcomeCoords = (newCoords) => {
    setWelcomeCoords(newCoords);
    try {
      localStorage.setItem(WELCOME_CUSTOM_COORDS_KEY, JSON.stringify(newCoords));
    } catch { /* storage safeguard */ }
  };

  const [activePhotoStyle, setActivePhotoStyle] = useState('cutout');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropAspect, setCropAspect] = useState('portrait');
  const [cropZoom, setCropZoom] = useState(1.1);
  const [cropX, setCropX] = useState(50);
  const [cropY, setCropY] = useState(30);

  useEffect(() => {
    localStorage.removeItem('aarsh-custom-coords');

    const s = readSettings();
    setPeople(Array.isArray(s.people) ? s.people.slice(0, MAX_BANNER_PEOPLE) : []);
    setAsclepiasLogo(s.asclepiasLogo || '');
    setFighterLogo(s.fighterLogo || '');
    setFighterStudio(s.fighterStudio || '');
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
  }, []);

  useEffect(() => {
    setSettingsOpen(Boolean(initialSettingsOpen));
  }, [initialSettingsOpen]);

  const persistSettings = (next = {}) => {
    const payload = {
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setSavedMessage('Settings saved successfully!');
    } catch {
      setSavedMessage('Storage full, please clear some photos.');
    }
    window.setTimeout(() => setSavedMessage(''), 2200);
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

  const handleAchieverImage = async (file) => {
    if (!file) return;
    if (!file.type?.startsWith('image/')) {
      alert('Kripya JPG, PNG ya koi valid image upload karein.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      alert('Image 15MB se chhoti honi chahiye.');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setAchieverDetails(prev => ({ ...prev, originalUrl: localUrl, removedUrl: '' }));
    setActivePhotoStyle('original');
    setCropAspect('portrait');
    setCropZoom(1.15);
    setCropX(50);
    setCropY(30);
    setCropModalOpen(true);
    setBackgroundRemovalBusy(true);

    try {
      const timeout = new Promise((_, reject) =>
        window.setTimeout(() => reject(new Error('AI background removal timed out')), 60000)
      );
      const transparentBlob = await Promise.race([removeBackground(file), timeout]);
      const transparentUrl = await blobToDataUrl(transparentBlob);
      if (!transparentUrl) throw new Error('Background remover returned an empty image');
      setAchieverDetails(prev => ({ ...prev, originalUrl: localUrl, removedUrl: transparentUrl }));
      setActivePhotoStyle('cutout');
    } catch (removeError) {
      console.error('AI background removal failed:', removeError);
      setAchieverDetails(prev => ({ ...prev, originalUrl: localUrl, removedUrl: localUrl }));
      setActivePhotoStyle('original');
    } finally {
      setBackgroundRemovalBusy(false);
    }
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
    setSelectedTemplate(1);
    setShowTemplateActions(false);
    setRankTemplateView(true);
    setAchieverDetailsView(false);
  };

  const loadExportImage = (src) => new Promise((resolve, reject) => {
    if (!src) return resolve(null);
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Image load failed: ${src}`));
    image.src = src;
  });

  const getExportPosterCanvas = async () => {
    const isDirectCategory = activeCategory === 'welcome' || activeCategory === 'closing';
    const coords = isDirectCategory ? welcomeCoords : FINAL_COORDS;
    const refDims = isDirectCategory ? REFERENCE_CANVAS_SQUARE : REFERENCE_CANVAS_RANK;

    const canvas = document.createElement('canvas');
    canvas.width = refDims.w;
    canvas.height = refDims.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not supported in this browser.');

    let backgroundSrc = isDirectCategory
      ? getCategoryTemplateUrl(activeCategory, selectedTemplate)
      : getRankTemplateUrl(selectedTemplate);

    let background = null;
    const candidates = [backgroundSrc, backgroundSrc.replace('.jpg', '.jpeg'), backgroundSrc.replace('.jpeg', '.jpg')];
    for (const src of candidates) {
      try { background = await loadExportImage(src); break; } catch { /* try next */ }
    }
    if (!background) throw new Error('Template image could not be loaded. Please check the template asset path.');
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    const box = (c) => ({ x: c.x, y: c.y, w: c.w, h: c.h });
    const drawContain = async (src, c) => {
      if (!src) return;
      const image = await loadExportImage(src);
      if (!image) return;
      const b = box(c);
      const scale = Math.min(b.w / image.naturalWidth, b.h / image.naturalHeight);
      const w = image.naturalWidth * scale;
      const h = image.naturalHeight * scale;
      ctx.drawImage(image, b.x + (b.w - w) / 2, b.y + (b.h - h) / 2, w, h);
    };
    const drawText = (text, c, fontFamily, color, weight = 900) => {
      if (!text || !c) return;
      const b = box(c);
      let size = c.size || 24;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      ctx.shadowColor = 'rgba(0,0,0,.72)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      do {
        ctx.font = `${weight} ${size}px ${fontFamily}`;
        if (ctx.measureText(text).width <= b.w - 8) break;
        size -= 1;
      } while (size > 8);
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
    const achieverImg = achieverDetails.removedUrl || achieverDetails.originalUrl || '';

    // 11 Upline Photos
    for (let i = 0; i < 11; i += 1) {
      const url = people?.[i]?.url;
      if (!url) continue;
      const row = coords.uplinesRow;
      const size = Math.min(row.h, row.w / 11);
      const x = row.x + i * (row.w / 11) + ((row.w / 11) - size) / 2;
      const y = row.y + (row.h - size) / 2;
      const image = await loadExportImage(url);
      ctx.save();
      ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(image, x, y, size, size);
      ctx.restore();
    }

    if (!isDirectCategory) {
      if (asclepiasLogo) await drawContain(asclepiasLogo, coords.asclepias);
      if (fighterSuccessSystem && fighterLogo) await drawContain(fighterLogo, coords.fighterLogo);
      if (fighterTextSystem && fighterStudio) await drawContain(fighterStudio, coords.fighterText);
      drawText(rankDisplay, coords.rank, 'Georgia, serif', '#ffd700');
      drawText('DS RANK', coords.dsRank, 'Georgia, serif', '#ffffff');
      drawText(amount, coords.amount, 'Georgia, serif', '#ffd700');
    }

    drawText(achName, coords.achieverNameTop || coords.achieverName, 'Georgia, serif', '#ffffff');
    drawText(achCity, coords.achieverCityTop || coords.achieverCity, 'Arial, sans-serif', '#ffd700');
    if (achieverImg) await drawContain(achieverImg, coords.achieverPhotoTop || coords.achieverPhoto);

    if (activeLeaderPhoto) await drawContain(activeLeaderPhoto, coords.leaderPhotoBottom);
    drawText(profileName.toUpperCase(), coords.leaderNameBottom, 'Georgia, serif', '#ffffff');
    drawText(leaderRank, coords.leaderRankBottom, 'Arial, sans-serif', '#facc15');
    if (showContactOnBanners && phone) drawText(phone, coords.leaderPhone, 'Arial, sans-serif', '#ffffff');

    return canvas;
  };

  const downloadCanvasImage = async () => {
    setExportBusy(true);
    try {
      const canvas = await getExportPosterCanvas();
      const link = document.createElement('a');
      link.download = `Aarsh-${activeCategory.toUpperCase()}-Template-${String(selectedTemplate).padStart(2, '0')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Poster image download failed:', error);
      alert(error.message || 'Image download failed. Please try again.');
    } finally { setExportBusy(false); }
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
    setExportBusy(true);
    try {
      const canvas = await getExportPosterCanvas();
      const blob = canvasToPdfBlob(canvas);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Aarsh-${activeCategory.toUpperCase()}-Template-${String(selectedTemplate).padStart(2, '0')}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (error) {
      console.error('Poster PDF download failed:', error);
      alert(error.message || 'PDF download failed. Please try again.');
    } finally { setExportBusy(false); }
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
                      <div className={item.isRank ? 'cs-rank-featured-top-row' : ''}>
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
                        <b>Instant Cutout<br />Framing</b>
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
                        <p>Upload photo (Instant 1-second focus crop)</p>
                      </div>
                      <button
                        type="button"
                        className="ai-remover-tag-btn"
                        onClick={openPhotoCropper}
                        disabled={!achieverDetails.originalUrl}
                      >
                        ✂️ Crop Focus
                      </button>
                    </div>

                    <div className="aarsh-photo-preview-grid">
                      {backgroundRemovalBusy && (
                        <div role="status" aria-live="polite" className="cs-background-removal-status" style={{ gridColumn: '1 / -1', padding: '10px 12px', borderRadius: 10, background: '#eef2ff', color: '#3730a3', fontSize: 13, fontWeight: 600 }}>
                          ✨ AI background remove kar raha hai…
                        </div>
                      )}
                      <label className="photo-box upload-original-box">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={e => {
                            const input = e.currentTarget;
                            const file = input.files?.[0];
                            if (file) void handleAchieverImage(file);
                            input.value = '';
                          }} 
                          disabled={backgroundRemovalBusy}
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
                            <span className="sparkle-cutout-icon">✨</span>
                            <strong className="cutout-title">Cropped Focus</strong>
                            <small className="cutout-sub">Click here to crop frame</small>
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
                        <span className="toggle-avatar-icon">✨</span> Cropped Focus
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
                >
                  ← Edit Details
                </button>
                <div className="cs-rank-badge">
                  <span aria-hidden="true">▦</span> {activeTemplateCount} TEMPLATES
                </div>
              </div>

              <div className="cs-template-workspace">
                <div className="cs-template-left-column">
                  <div className="cs-template-featured">
                    <div className="cs-template-featured-card">
                      <div className="cs-template-preview-toolbar">
                        <span><b>▦</b> Template {String(selectedTemplate).padStart(2, '0')}</span>
                        <span className="cs-preview-live-pill">LIVE PREVIEW</span>
                      </div>
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
                        welcomeCoords={welcomeCoords}
                        onUpdateWelcomeCoords={handleUpdateWelcomeCoords}
                      />
                      <div className="cs-template-featured-meta">
                        <strong>Template {String(selectedTemplate).padStart(2, '0')}</strong>
                        <span>
                          {activeCategory === 'welcome' 
                            ? 'Welcome Banner AWPL' 
                            : activeCategory === 'closing' 
                              ? 'Closing Banner AWPL' 
                              : `${selectedRankLabel} · ${RANK_INCOME[selectedRankLabel] || 'Custom Amount'}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="cs-template-left-hint"><span>✦</span> Select any template on the right to preview it here.</div>
                </div>

                <div className="cs-template-gallery-panel">
                  <div className="cs-template-gallery-header">
                    <div className="cs-template-gallery-heading">
                      <span className="cs-template-gallery-icon" aria-hidden="true">▧</span>
                      <div><b>Choose Your Template</b><small>Select a template to preview in high quality</small></div>
                    </div>
                    <label className="cs-template-search">
                      <span aria-hidden="true">⌕</span>
                      <input
                        type="search"
                        value={templateSearch}
                        onChange={(event) => { setTemplateSearch(event.target.value); setTemplatePage(1); }}
                        placeholder="Search templates..."
                        aria-label="Search templates"
                      />
                      {templateSearch && <button type="button" onClick={() => { setTemplateSearch(''); setTemplatePage(1); }} aria-label="Clear search">×</button>}
                    </label>
                  </div>

                  <div className="cs-template-gallery-toolbar">
                    <span className="cs-template-count-chip">All templates <b>{activeTemplateCount}</b></span>
                    <span className="cs-template-gallery-tip">Click a card to select</span>
                  </div>

                  {(() => {
                    const isSquareCat = activeCategory === 'welcome' || activeCategory === 'closing';
                    const matchingTemplates = Array.from({ length: activeTemplateCount }, (_, index) => index + 1)
                      .filter((no) => !templateSearch.trim() || `template ${String(no).padStart(2, '0')} ${no}`.includes(templateSearch.trim().toLowerCase()));
                    const pageSize = 12;
                    const pageCount = Math.max(1, Math.ceil(matchingTemplates.length / pageSize));
                    const safePage = Math.min(templatePage, pageCount);
                    const visibleTemplates = matchingTemplates.slice((safePage - 1) * pageSize, safePage * pageSize);
                    return (
                      <>
                        <div className="cs-template-grid">
                          {visibleTemplates.map((no) => {
                            const selected = selectedTemplate === no;
                            const thumbUrl = isSquareCat
                              ? getCategoryTemplateUrl(activeCategory, no)
                              : getRankTemplateUrl(no);
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
                                  <img
                                    src={thumbUrl}
                                    alt={`Template ${String(no).padStart(2, '0')}`}
                                    loading="lazy"
                                    draggable="false"
                                    style={isSquareCat ? { objectFit: 'contain', aspectRatio: '1 / 1' } : {}}
                                    onError={(event) => {
                                      const image = event.currentTarget;
                                      if (image.src.endsWith('.jpeg')) {
                                        image.src = image.src.replace('.jpeg', '.jpg');
                                      } else if (image.src.endsWith('.jpg')) {
                                        image.src = image.src.replace('.jpg', '.png');
                                      }
                                    }}
                                  />
                                  {selected && <span className="cs-template-selected-check">✓</span>}
                                </div>
                                <span className="cs-template-tag">Template {String(no).padStart(2, '0')}</span>
                              </button>
                            );
                          })}
                        </div>
                        {matchingTemplates.length === 0 ? (
                          <div className="cs-template-empty-state"><span>⌕</span><b>No templates found</b><small>Try another template number, such as 01 or 05.</small></div>
                        ) : (
                          <div className="cs-template-pagination">
                            <button type="button" className="cs-page-arrow" disabled={safePage === 1} onClick={() => setTemplatePage(Math.max(1, safePage - 1))} aria-label="Previous page">‹</button>
                            {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
                              <button key={page} type="button" className={`cs-page-number ${safePage === page ? 'is-active' : ''}`} onClick={() => setTemplatePage(page)} aria-current={safePage === page ? 'page' : undefined}>{page}</button>
                            ))}
                            <button type="button" className="cs-page-arrow" disabled={safePage === pageCount} onClick={() => setTemplatePage(Math.min(pageCount, safePage + 1))} aria-label="Next page">›</button>
                            <span className="cs-page-summary">{matchingTemplates.length ? `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, matchingTemplates.length)} of ${matchingTemplates.length}` : '0 results'}</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  <div className="cs-template-gallery-actions">
                    <button
                      type="button"
                      className="cs-use-template-btn"
                      onClick={() => {
                        setShowTemplateActions(true);
                        setRatingSaved(false);
                      }}
                    >
                      Select & Download <span aria-hidden="true">→</span>
                    </button>
                  </div>
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
                <img 
                  src={
                    (activeCategory === 'welcome' || activeCategory === 'closing')
                      ? getCategoryTemplateUrl(activeCategory, selectedTemplate)
                      : getRankTemplateUrl(selectedTemplate)
                  } 
                  alt={`Selected template ${selectedTemplate}`} 
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