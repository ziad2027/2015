import React from 'react';
import { 
  HeartHandshake, 
  Search, 
  AlertCircle, 
  ChevronLeft,
  Hospital,
  Info,
  Users,
  CheckCircle2,
  Phone,
  Droplet,
  MessageCircle,
  UserPlus
} from 'lucide-react';
import regeneratedHeroImage from '../assets/images/regenerated_image_1793757211567.jpg';
import { ActiveTab, Donor, UrgentRequest, BloodType } from '../types';

interface HeroBannerProps {
  onNavigate: (tab: ActiveTab | BloodType) => void;
  donors: Donor[];
  urgentRequests: UrgentRequest[];
  onOpenCompatibility: () => void;
}

// Custom SVG Blood Droplet Badge matching the user's attached design
const BloodDropBadge: React.FC<{ type: string; className?: string }> = ({ type, className = "w-11 h-13" }) => (
  <div className={`relative flex items-center justify-center shrink-0 ${className} drop-shadow-sm`}>
    <svg viewBox="0 0 48 58" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`dropGrad-${type}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ff416c" />
          <stop offset="45%" stopColor="#e50914" />
          <stop offset="85%" stopColor="#a30813" />
          <stop offset="100%" stopColor="#750009" />
        </radialGradient>
        <linearGradient id={`highlight-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Main Droplet Body */}
      <path
        d="M24 2 C24 2 6 22 6 36 C6 46 14.05 54 24 54 C33.95 54 42 46 42 36 C42 22 24 2 24 2 Z"
        fill={`url(#dropGrad-${type})`}
      />
      {/* Top-Left Gloss Highlight */}
      <path
        d="M22 8 C20 12 12 25 12 35 C12 38 13 41 15 43 C13.5 40 14 34 16 28 C18 22 23 13 22 8 Z"
        fill={`url(#highlight-${type})`}
        opacity="0.6"
      />
    </svg>
    {/* Centered White Blood Type Label */}
    <span className="absolute inset-0 flex items-center justify-center pt-2 text-white font-black text-xs sm:text-sm tracking-wider drop-shadow-md select-none">
      {type}
    </span>
  </div>
);

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onNavigate,
  donors,
  urgentRequests,
  onOpenCompatibility,
}) => {
  const heroImagePath = regeneratedHeroImage;
  const WHATSAPP_NUMBER = '773633918';
  const WHATSAPP_URL = `https://wa.me/967${WHATSAPP_NUMBER}`;

  const activeUrgentCount = urgentRequests.filter((r) => r.status === 'open').length;
  const fulfilledCount = urgentRequests.filter((r) => r.status === 'fulfilled').length;
  
  // Real donor counts, with default realistic numbers if database is newly seeded
  const rawTotalDonors = donors.length;
  const totalDonors = rawTotalDonors > 0 ? rawTotalDonors : 1250;
  
  const rawAvailable = donors.filter((d) => d.isAvailable).length;
  const availableDonorsCount = rawTotalDonors > 0 ? rawAvailable : 978;
  const unavailableDonorsCount = totalDonors - availableDonorsCount;
  
  const availablePercentage = Math.round((availableDonorsCount / totalDonors) * 100) || 78;

  // The 8 Blood Groups in the exact 4x2 grid order from the user's attached picture:
  // Row 1: O+, A+, B+, AB+
  // Row 2: O-, A-, B-, AB-
  const bloodDataGrid: Array<{
    type: BloodType;
    defaultCount: number;
    defaultPct: number;
  }> = [
    { type: 'O+', defaultCount: 400, defaultPct: 32 },
    { type: 'A+', defaultCount: 300, defaultPct: 24 },
    { type: 'B+', defaultCount: 200, defaultPct: 16 },
    { type: 'AB+', defaultCount: 100, defaultPct: 8 },
    { type: 'O-', defaultCount: 90, defaultPct: 7.2 },
    { type: 'A-', defaultCount: 70, defaultPct: 5.6 },
    { type: 'B-', defaultCount: 60, defaultPct: 4.8 },
    { type: 'AB-', defaultCount: 30, defaultPct: 2.4 },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 font-['Cairo',sans-serif] text-right">
      
      {/* 1. Hero Image Banner Header (Top Edge-to-Edge) */}
      <div className="w-full bg-white rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 border border-slate-200 shadow-md relative overflow-hidden">
        <div className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
          <img
            src={heroImagePath}
            alt="بنك الدم في مديرية قعطبة - قطرة دم تنقذ حياة"
            className="w-full h-auto object-cover sm:object-contain rounded-xl sm:rounded-2xl shadow-xs pointer-events-none select-none max-h-[260px] sm:max-h-[360px]"
            loading="eager"
            draggable={false}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Quranic Verse & Slogan Card directly under the Hero Image */}
      <div className="w-full bg-linear-to-r from-red-700 via-rose-700 to-red-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-lg border border-red-500/30 text-center space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        
        {/* Holy Quran Verse */}
        <div className="space-y-1 relative z-10">
          <p className="text-base sm:text-xl font-extrabold text-amber-200 tracking-wide font-serif leading-relaxed">
            ﴿ وَمَنْ أَحْيَاهَا فَكَأَنَّمَا أَحْيَا النَّاسَ جَمِيعًا ﴾
          </p>
          <p className="text-[11px] sm:text-xs font-bold text-red-100">
            سورة المائدة – الآية 32
          </p>
        </div>

        {/* Slogan with hearts */}
        <div className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-6 py-1.5 sm:py-2 bg-white/15 backdrop-blur-md rounded-full text-xs sm:text-base font-black text-white border border-white/20 shadow-inner relative z-10">
          <span>❤️</span>
          <span>قَطْرَةُ دَمٍ تُنْقِذُ حَيَاةَ إِنْسَان</span>
          <span>❤️</span>
        </div>

        {/* Subtext */}
        <div className="space-y-1 text-xs sm:text-sm font-bold text-red-50 relative z-10">
          <p className="leading-snug">معاً لإنقاذ الأرواح في مديرية قعطبة.</p>
          <p className="text-amber-200 font-extrabold">تبرعك حياة، وعطاؤك أمل، وتعاوننا إنقاذ.</p>
        </div>
      </div>

      {/* 2. Top Stats Bar (Two Rounded Cards from user image) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 w-full">
        {/* Right Card: Available Donors Percentage (Green Theme) */}
        <div className="rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 bg-linear-to-br from-[#effbf4] via-[#e4f7ec] to-[#d8f3e2] border border-emerald-200 shadow-xs flex items-center justify-between text-right">
          {/* Green Droplet with Checkmark Icon */}
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
          </div>
          <div className="flex flex-col items-end">
            <span className="text-2xl sm:text-4xl font-black text-emerald-900 tracking-tight leading-none" dir="ltr">
              {availablePercentage}%
            </span>
            <span className="text-[10px] sm:text-xs font-black text-emerald-800 mt-1 leading-tight text-left">
              نسبة المتبرعين المتاحين
            </span>
          </div>
        </div>

        {/* Left Card: Total Donors Count (Red Theme) */}
        <div className="rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 bg-linear-to-br from-[#fff1f3] via-[#ffe7eb] to-[#ffdce2] border border-rose-200 shadow-xs flex items-center justify-between text-right">
          {/* Red People Icon */}
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-linear-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow-sm shrink-0">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
          </div>
          <div className="flex flex-col items-end">
            <span className="text-2xl sm:text-4xl font-black text-red-900 tracking-tight leading-none" dir="ltr">
              {totalDonors.toLocaleString()}
            </span>
            <span className="text-[10px] sm:text-xs font-black text-red-800 mt-1 leading-tight text-left">
              إجمالي المتبرعين
            </span>
          </div>
        </div>
      </div>

      {/* 3. Section Title Ribbon: ──• توزيع فصائل الدم •── */}
      <div className="relative flex items-center justify-center my-3 sm:my-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t-2 border-red-200"></div>
        </div>
        <div className="relative flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-700 hidden sm:inline-block"></span>
          <div className="px-6 sm:px-10 py-2 sm:py-2.5 rounded-full bg-linear-to-r from-red-700 via-rose-700 to-red-800 text-white font-black text-xs sm:text-base shadow-md shadow-red-200 flex items-center gap-2 select-none">
            <span>توزيع فصائل الدم</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-red-700 hidden sm:inline-block"></span>
        </div>
      </div>

      {/* 4. 8 Blood Group Cards Grid (4 columns x 2 rows, expanded to fill container) */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3.5 w-full">
        {bloodDataGrid.map((item) => {
          const actualCount = donors.filter((d) => d.bloodType === item.type).length;
          const displayCount = rawTotalDonors > 0 ? actualCount : item.defaultCount;
          const displayPct = rawTotalDonors > 0
            ? Number(((displayCount / totalDonors) * 100).toFixed(1))
            : item.defaultPct;

          return (
            <button
              key={item.type}
              onClick={() => onNavigate(item.type)}
              title={`عرض المتبرعين بفصيلة ${item.type}`}
              className="group bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 border border-slate-200 hover:border-red-500 shadow-2xs hover:shadow-lg transition-all text-center flex flex-col items-center justify-between min-h-[135px] sm:min-h-[155px] cursor-pointer active:scale-95 relative"
            >
              {/* Droplet SVG Icon with Blood Type */}
              <BloodDropBadge type={item.type} className="w-10 h-12 sm:w-13 sm:h-15 group-hover:scale-110 transition-transform" />

              {/* Donor count: e.g. 400 متبرع */}
              <div className="mt-1 leading-none">
                <span className="text-[11px] sm:text-xs font-black text-slate-900 block">
                  {displayCount} متبرع
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 block mt-0.5" dir="ltr">
                  {displayPct}%
                </span>
              </div>

              {/* Progress Bar (red on pink track) */}
              <div className="w-full bg-rose-100 rounded-full h-1.5 sm:h-2 mt-1.5 overflow-hidden">
                <div
                  className="bg-linear-to-r from-red-600 to-rose-700 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(displayPct, 8)}%` }}
                ></div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 5. Detailed Donor Status Strip (3-column rounded panel from user image) */}
      <div className="rounded-2xl sm:rounded-3xl p-3 sm:p-4 bg-linear-to-r from-[#effbf4] via-[#fff5f6] to-[#ffeef1] border border-slate-200 shadow-xs">
        <div className="grid grid-cols-3 divide-x divide-x-reverse divide-slate-200/80 text-center items-center">
          
          {/* Right Column: Available Donors Now (Green) */}
          <div className="px-2 flex flex-col items-center">
            <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
              <span className="text-[10px] sm:text-xs font-black text-emerald-800">
                متاح للتبرع الآن
              </span>
              <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
              </div>
            </div>
            <span className="text-base sm:text-xl font-black text-emerald-900 leading-none">
              {availableDonorsCount} متبرع
            </span>
          </div>

          {/* Middle Column: Total Donors (Red Accent) */}
          <div className="px-2 flex flex-col items-center">
            <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
              <span className="text-[10px] sm:text-xs font-black text-slate-700">
                إجمالي المتبرعين
              </span>
              <Users className="w-3.5 h-3.5 text-red-600" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-red-700 leading-none tracking-tight">
              {totalDonors.toLocaleString()}
            </span>
          </div>

          {/* Left Column: Currently Unavailable (Rose) */}
          <div className="px-2 flex flex-col items-center">
            <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
              <span className="text-[10px] sm:text-xs font-black text-rose-700">
                غير متاح حالياً
              </span>
              <Droplet className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
            </div>
            <span className="text-base sm:text-xl font-black text-rose-800 leading-none">
              {unavailableDonorsCount} متبرع
            </span>
          </div>

        </div>
      </div>

      {/* 6. Two Large Bottom Action Buttons (Matching user image) */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Right Button: طلب دم عاجل (Urgent Request) */}
        <button
          onClick={() => onNavigate('urgent')}
          className="group relative overflow-hidden py-3.5 sm:py-4 px-4 rounded-full bg-linear-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-black text-sm sm:text-base shadow-lg shadow-red-200/80 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-red-500/50"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Droplet className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-white text-white" />
          </div>
          <span>طلب دم عاجل</span>
          {activeUrgentCount > 0 && (
            <span className="bg-white text-red-700 text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
              {activeUrgentCount}
            </span>
          )}
        </button>

        {/* Left Button: إضافة متبرع (Register Donor) */}
        <button
          onClick={() => onNavigate('register')}
          className="group relative overflow-hidden py-3.5 sm:py-4 px-4 rounded-full bg-linear-to-r from-red-700 via-rose-800 to-red-900 hover:from-red-800 hover:to-rose-900 text-white font-black text-sm sm:text-base shadow-lg shadow-red-300/80 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-red-600/50"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <UserPlus className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <span>إضافة متبرع</span>
        </button>
      </div>



      {/* 8. ABO Compatibility Quick Guide Link */}
      <div 
        onClick={onOpenCompatibility}
        className="flex items-center justify-between p-3.5 rounded-2xl bg-linear-to-r from-red-50 to-rose-50 border border-red-200 cursor-pointer hover:bg-red-100/60 transition-colors shadow-2xs"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-xs shadow-2xs">
            ABO
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-slate-900">
              دليل توافق فصائل الدم التفاعلي
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500">
              تعرّف على الفصيلة التي يمكنها التبرع لك ولمن تستطيع التبرع في قعطبة
            </div>
          </div>
        </div>
        <ChevronLeft className="w-4 h-4 text-slate-400" />
      </div>

    </div>
  );
};
