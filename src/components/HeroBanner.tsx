import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Search, 
  AlertCircle, 
  ChevronLeft,
  Maximize2,
  Info
} from 'lucide-react';
import { ActiveTab, Donor, UrgentRequest, BloodType } from '../types';

interface HeroBannerProps {
  onNavigate: (tab: ActiveTab | BloodType) => void;
  donors: Donor[];
  urgentRequests: UrgentRequest[];
  onOpenCompatibility: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onNavigate,
  donors,
  urgentRequests,
  onOpenCompatibility,
}) => {
  const [showImageZoom, setShowImageZoom] = useState(false);
  const heroImagePath = '/assets/images/blood_donation_hero_banner.jpg';

  const activeUrgentCount = urgentRequests.filter((r) => r.status === 'open').length;
  const fulfilledCount = urgentRequests.filter((r) => r.status === 'fulfilled').length;
  const availableDonorsCount = donors.filter((d) => d.isAvailable).length;
  const totalDonors = donors.length > 0 ? donors.length : 58;

  // Blood types cards data
  const bloodData: Array<{
    type: BloodType;
    badgeBg: string;
    badgeText: string;
    statusLabel: string;
    statusColor: string;
    barBg: string;
    defaultPct: number;
    defaultCount: number;
  }> = [
    {
      type: 'O+',
      badgeBg: 'bg-red-600 text-white',
      badgeText: '+O',
      statusLabel: 'الأكثر طلباً',
      statusColor: 'text-red-600',
      barBg: 'bg-red-600',
      defaultPct: 45,
      defaultCount: 26,
    },
    {
      type: 'A+',
      badgeBg: 'bg-amber-600 text-white',
      badgeText: '+A',
      statusLabel: 'شائع ومطلوب',
      statusColor: 'text-amber-600',
      barBg: 'bg-amber-600',
      defaultPct: 31,
      defaultCount: 18,
    },
    {
      type: 'B+',
      badgeBg: 'bg-sky-500 text-white',
      badgeText: '+B',
      statusLabel: 'طلب متكرر',
      statusColor: 'text-sky-600',
      barBg: 'bg-sky-500',
      defaultPct: 5,
      defaultCount: 3,
    },
    {
      type: 'AB+',
      badgeBg: 'bg-purple-600 text-white',
      badgeText: '+AB',
      statusLabel: 'مستقبل عام',
      statusColor: 'text-purple-600',
      barBg: 'bg-purple-600',
      defaultPct: 3,
      defaultCount: 2,
    },
    {
      type: 'O-',
      badgeBg: 'bg-rose-700 text-white',
      badgeText: '-O',
      statusLabel: 'مانح عام نادر',
      statusColor: 'text-rose-700',
      barBg: 'bg-rose-700',
      defaultPct: 5,
      defaultCount: 3,
    },
    {
      type: 'A-',
      badgeBg: 'bg-orange-600 text-white',
      badgeText: '-A',
      statusLabel: 'فصيلة نادرة',
      statusColor: 'text-orange-600',
      barBg: 'bg-orange-600',
      defaultPct: 7,
      defaultCount: 4,
    },
    {
      type: 'B-',
      badgeBg: 'bg-emerald-600 text-white',
      badgeText: '-B',
      statusLabel: 'فصيلة نادرة',
      statusColor: 'text-emerald-600',
      barBg: 'bg-emerald-600',
      defaultPct: 2,
      defaultCount: 1,
    },
    {
      type: 'AB-',
      badgeBg: 'bg-indigo-600 text-white',
      badgeText: '-AB',
      statusLabel: 'أندر الفصائل',
      statusColor: 'text-indigo-600',
      barBg: 'bg-indigo-600',
      defaultPct: 2,
      defaultCount: 1,
    },
  ];

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      
      {/* 1. Original Hero Image Banner Section */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg border border-red-100 bg-white">
        <div className="relative aspect-16/9 sm:aspect-21/9 w-full bg-slate-900 group">
          <img
            src={heroImagePath}
            alt="سجل المتبرعين بالدم في مديرية قعطبة - قطرة دم تنقذ حياة"
            className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500 cursor-pointer"
            onClick={() => setShowImageZoom(true)}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />

          {/* Gradient Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none"></div>

          {/* Quick Zoom Trigger */}
          <button
            onClick={() => setShowImageZoom(true)}
            className="absolute top-2.5 left-2.5 p-1.5 rounded-lg bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition-colors"
            title="تكبير الصورة"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Floating Badge Over Image */}
          <div className="absolute bottom-2.5 right-3 left-3 flex items-end justify-between text-white pointer-events-none">
            <div className="space-y-0.5">
              <span className="inline-block px-2 py-0.5 rounded-md bg-red-600/90 text-white text-[11px] font-bold backdrop-blur-xs">
                مديرية قعطبة • مبادرة خيرية
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-white drop-shadow-md">
                «وَمَنْ أَحْيَاهَا فَكَأَنَّمَا أَحْيَا النَّاسَ جَمِيعًا»
              </h2>
            </div>
            <span className="text-[10px] text-white/80 bg-black/40 px-2 py-1 rounded-md backdrop-blur-xs hidden sm:inline-block">
              اضغط لتكبير الصورة
            </span>
          </div>
        </div>

        {/* Inspirational Message Bar */}
        <div className="p-3 bg-red-50/70 border-t border-red-100 text-slate-700 text-xs sm:text-sm text-center leading-relaxed font-medium">
          فالتبرع بالدم ليس مجرد عمل إنساني، بل أجر تدخره عند الله، ورسالة عطاء وتكافل تُجسّد أسمى معاني الرحمة بين أبناء قعطبة وضواحيها.
        </div>
      </div>

      {/* 2. Primary 3 Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Register as Donor */}
        <button
          onClick={() => onNavigate('register')}
          className="group relative overflow-hidden p-4 rounded-xl bg-linear-to-br from-red-600 to-rose-700 text-white shadow-md shadow-red-200 hover:shadow-lg hover:from-red-700 hover:to-rose-800 transition-all text-right flex flex-col justify-between min-h-[105px] active:scale-98"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
              خطوة خير
            </span>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-tight">
              التسجيل كمتبرع
            </h3>
            <p className="text-xs text-red-100 mt-0.5 line-clamp-1">
              سجل فصيلتك ورقمك لتنقذ مريضاً محتاجاً
            </p>
          </div>
        </button>

        {/* Search Blood Type */}
        <button
          onClick={() => onNavigate('search')}
          className="group relative overflow-hidden p-4 rounded-xl bg-white border-2 border-red-200 text-slate-800 shadow-xs hover:shadow-md hover:border-red-500 transition-all text-right flex flex-col justify-between min-h-[105px] active:scale-98"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Search className="w-6 h-6" />
            </div>
            <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
              {availableDonorsCount} متاح
            </span>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              البحث عن فصيلة دم
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
              ابحث حسب الفصيلة، الاسم، أو السكن
            </p>
          </div>
        </button>

        {/* Urgent Requests */}
        <button
          onClick={() => onNavigate('urgent')}
          className="group relative overflow-hidden p-4 rounded-xl bg-linear-to-br from-amber-500 to-red-600 text-white shadow-md shadow-amber-200 hover:shadow-lg transition-all text-right flex flex-col justify-between min-h-[105px] active:scale-98"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <AlertCircle className="w-6 h-6" />
            </div>
            {activeUrgentCount > 0 ? (
              <span className="text-[11px] bg-white text-red-700 px-2 py-0.5 rounded-full font-extrabold animate-pulse">
                {activeUrgentCount} عاجل الآن
              </span>
            ) : (
              <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                حالات الطوارئ
              </span>
            )}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-tight">
              طلبات الدم العاجلة
            </h3>
            <p className="text-xs text-amber-100 mt-0.5 line-clamp-1">
              اطلب دماً لمريض أو تبرع للحالات الحرجة
            </p>
          </div>
        </button>
      </div>

      {/* 3. Blood Types Cards Grid Section (Added directly to Home) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">🩸</span>
            <div>
              <h3 className="text-base font-black text-slate-900">فصائل الدم المطلوبة والمتاحة</h3>
              <p className="text-xs text-slate-500">اختر أي فصيلة للانتقال لتصفية المتبرعين فوراً</p>
            </div>
          </div>
          <span className="text-xs font-black bg-red-50 text-red-700 px-2.5 py-1 rounded-full border border-red-100">
            {totalDonors} متبرع
          </span>
        </div>

        {/* 8 Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {bloodData.map((item) => {
            const actualCount = donors.filter((d) => d.bloodType === item.type).length;
            const displayCount = donors.length > 0 ? actualCount : item.defaultCount;
            const displayPct = donors.length > 0
              ? Math.round((displayCount / totalDonors) * 100) || item.defaultPct
              : item.defaultPct;

            return (
              <div key={item.type} className="group relative">
                <button
                  onClick={() => onNavigate(item.type)}
                  className="w-full bg-slate-50/80 hover:bg-red-50/50 rounded-2xl p-3 border border-slate-200/80 hover:border-red-300 shadow-2xs transition-all text-right group flex flex-col justify-between space-y-2 active:scale-98"
                >
                  {/* Top Row: Percentage & Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400">
                      {displayPct}%
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-black tracking-wider shadow-2xs ${item.badgeBg}`}>
                      {item.badgeText}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.barBg}`}
                      style={{ width: `${Math.max(displayPct, 12)}%` }}
                    ></div>
                  </div>

                  {/* Bottom Row: Status Label & Count */}
                  <div className="flex items-center justify-between pt-0.5">
                    <span className={`text-[10px] font-black ${item.statusColor}`}>
                      {item.statusLabel}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {displayCount} متبرع
                    </span>
                  </div>
                </button>
                
                {/* Information Trigger (Floating Button) - Request 3 */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCompatibility();
                  }}
                  className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors z-10"
                  title="معلومات التوافق"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Helper Instruction Note */}
        <div className="p-2.5 rounded-xl bg-slate-50 text-slate-500 text-[11px] font-bold text-center flex items-center justify-center gap-1.5 border border-slate-100">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span>انقر على أي فصيلة بالأعلى لتصفية قائمة المتبرعين في قعطبة فوراً</span>
        </div>
      </div>

      {/* 4. Community Stats Grid Summary */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
        <div className="grid grid-cols-4 gap-2 text-center divide-x divide-x-reverse divide-slate-100">
          <div>
            <div className="text-lg sm:text-xl font-black text-red-600">
              {donors.length}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">متبرع مسجل</div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-amber-600">
              {activeUrgentCount}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">طلبات نشطة</div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-emerald-600">
              {fulfilledCount}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">حالات أُسعفت</div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-slate-700">
              8 / 8
            </div>
            <div className="text-[11px] text-slate-500 font-medium">فصائل مغطاة</div>
          </div>
        </div>
      </div>

      {/* 5. ABO Blood Compatibility Link Banner */}
      <div 
        onClick={onOpenCompatibility}
        className="flex items-center justify-between p-3.5 rounded-2xl bg-linear-to-r from-red-50 to-rose-50 border border-red-200 cursor-pointer hover:bg-red-100/60 transition-colors shadow-xs"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-xs shadow-2xs">
            ABO
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-slate-900">
              دليل توافق فصائل الدم
            </div>
            <div className="text-[11px] text-slate-500">
              تعرّف على الفصيلة التي يمكنها التبرع لك ولمن تستطيع التبرع
            </div>
          </div>
        </div>
        <ChevronLeft className="w-4 h-4 text-slate-400" />
      </div>

      {/* Image Zoom Modal */}
      {showImageZoom && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setShowImageZoom(false)}
        >
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setShowImageZoom(false)}
              className="absolute -top-10 left-0 text-white text-sm bg-white/20 px-3 py-1 rounded-full font-bold hover:bg-white/30"
            >
              إغلاق ✕
            </button>
            <img
              src={heroImagePath}
              alt="سجل المتبرعين بالدم"
              className="w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
            <p className="text-white/80 text-xs text-center mt-3">
              سجل المتبرعين بالدم في مديرية قعطبة • قطرة دم تنقذ حياة
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
