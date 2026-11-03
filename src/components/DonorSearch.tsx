import React, { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Copy, 
  Check, 
  Share2, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  HeartHandshake,
  Info,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
  Edit3,
  Trash2,
  AlertTriangle,
  Calendar,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BloodType, BLOOD_TYPES, Donor } from '../types';
import { searchDonorsFromSheets } from '../services/googleSheetsService';

interface DonorSearchProps {
  donors: Donor[];
  onNavigateToRegister: () => void;
  initialBloodType?: BloodType | 'ALL';
  onEditDonor?: (donorId: string) => void;
  onDeleteDonor?: (donorId: string, phone?: string) => Promise<void>;
}

export const DonorSearch: React.FC<DonorSearchProps> = ({
  donors,
  onNavigateToRegister,
  initialBloodType = 'ALL',
  onEditDonor,
  onDeleteDonor,
}) => {
  const { userProfile, currentUser, activeRole } = useAuth();
  const isAdmin = activeRole === 'admin' || userProfile?.role === 'admin' || currentUser?.email === 'ziadalsyyadi@gmail.com';

  const [selectedBloodType, setSelectedBloodType] = useState<BloodType | 'ALL'>(initialBloodType);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Admin delete states
  const [donorToDelete, setDonorToDelete] = useState<Donor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  // Update selection if initialBloodType changes from parent
  React.useEffect(() => {
    setSelectedBloodType(initialBloodType);
  }, [initialBloodType]);

  // Google Sheets search states
  const [sheetsDonors, setSheetsDonors] = useState<Donor[]>([]);
  const [isSearchingSheets, setIsSearchingSheets] = useState(false);
  const [sheetsError, setSheetsError] = useState<string | null>(null);


  const handleSearchSheets = async () => {
    if (selectedBloodType === 'ALL') {
      setSheetsError('يرجى اختيار فصيلة دم محددة للبحث في الأرشيف');
      return;
    }
    
    setIsSearchingSheets(true);
    setSheetsError(null);
    try {
      const result = await searchDonorsFromSheets(selectedBloodType);
      if (result.success && Array.isArray(result.data)) {
        const mapped: Donor[] = result.data.map((d: any, idx: number) => ({
          id: `sheet_${idx}_${Date.now()}`,
          userId: '',
          fullName: d.name || d.fullName || 'غير معروف',
          bloodType: d.bloodType || selectedBloodType,
          phone: d.phone || '',
          phoneVerified: false,
          residence: d.address || d.residence || 'قعطبة',
          notes: d.notes || 'من سجل Google Sheets',
          isAvailable: true,
          allowContact: true,
        }));
        setSheetsDonors(mapped);
        if (mapped.length === 0) {
          setSheetsError('لا يوجد متبرعون بهذه الفصيلة في أرشيف Google Sheets حالياً');
        }
      } else {
        setSheetsError(result.error || 'تعذر جلب البيانات من Google Sheets');
      }
    } catch (err: any) {
      setSheetsError(`خطأ: ${err.message}`);
    } finally {
      setIsSearchingSheets(false);
    }
  };

  // Filtered donors list (already includes Sheets data from App.tsx)
  const combinedDonors = useMemo(() => {
    return donors.filter((donor) => {
      if (selectedBloodType !== 'ALL' && donor.bloodType !== selectedBloodType) return false;
      if (onlyAvailable && !donor.isAvailable) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          donor.fullName.toLowerCase().includes(q) || 
          donor.residence.toLowerCase().includes(q) || 
          donor.phone.includes(q)
        );
      }
      return true;
    });
  }, [donors, selectedBloodType, onlyAvailable, searchQuery]);


  // Copy phone handler
  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => {
      setCopiedPhone(null);
    }, 2000);
  };

  const [whatsAppTargetDonor, setWhatsAppTargetDonor] = useState<Donor | null>(null);

  // WhatsApp helper - opens confirmation dialog
  const handleWhatsApp = (donor: Donor) => {
    setWhatsAppTargetDonor(donor);
  };

  const confirmWhatsAppNavigation = (donor: Donor) => {
    const cleanNumber = donor.phone.replace(/\D/g, '');
    const international = cleanNumber.startsWith('967') ? cleanNumber : `967${cleanNumber}`;
    const text = encodeURIComponent(
      `السلام عليكم أخي ${donor.fullName} الكريم،\nحصلت على رقمك من تطبيق (قطرة دم تنقذ حياة - سجل المتبرعين بقعطبة).\nلدينا حالة بحاجة ماسة لفصيلة الدم (${donor.bloodType})، هل أنت متاح للتبرع وجزاك الله خيراً؟`
    );
    window.open(`https://wa.me/${international}?text=${text}`, '_blank');
  };

  // Share donor info helper
  const handleShare = async (donor: Donor) => {
    const text = `متبرع بالدم في قعطبة:\nالاسم: ${donor.fullName}\nفصيلة الدم: ${donor.bloodType}\nالسكن: ${donor.residence}\nرقم الهاتف: ${donor.phone}\nتطبيق: قطرة دم تنقذ حياة`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `متبرع بالدم: ${donor.fullName} (${donor.bloodType})`,
          text,
        });
      } catch (e) {
        // user cancelled
      }
    } else {
      handleCopyPhone(text);
    }
  };

  // Get donor count per blood type
  const countsPerType = useMemo(() => {
    const map: Record<string, number> = { ALL: donors.length };
    BLOOD_TYPES.forEach((bt) => {
      map[bt] = donors.filter((d) => d.bloodType === bt).length;
    });
    return map;
  }, [donors]);

  return (
    <div className="space-y-4">
      {/* Delete Success Toast Banner */}
      {deleteSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-between shadow-lg shadow-emerald-200 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{deleteSuccess}</span>
          </div>
          <button 
            onClick={() => setDeleteSuccess(null)}
            className="text-white/80 hover:text-white text-xs px-2 py-0.5"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Search Header Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              البحث عن متبرعي الدم
            </h2>
            <p className="text-xs text-slate-500">
              اختر فصيلة الدم المطلوبة أو ابحث بالاسم أو السكن في قعطبة
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs bg-red-50 text-red-700 font-bold px-2.5 py-1 rounded-full border border-red-200">
              {combinedDonors.length} متبرع
            </span>
            {sheetsDonors.length > 0 && activeRole === 'admin' && (
              <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded-sm">
                يتضمن بيانات الأرشيف
              </span>
            )}
          </div>
        </div>

        {/* Search Input Box */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم أو السكن (مثلاً: مريس، قعطبة، الفاخر، سناح)..."
            className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-sm outline-hidden font-medium"
          />
          <Search className="w-5 h-5 text-slate-400 absolute right-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded"
            >
              مسح
            </button>
          )}
        </div>

        {/* Blood Type Selection Horizontal Scroll / Grid */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
            <span>تصفية حسب فصيلة الدم:</span>
            {selectedBloodType !== 'ALL' && (
              <button
                onClick={() => {
                  setSelectedBloodType('ALL');
                  setSheetsDonors([]);
                }}
                className="text-red-600 hover:underline"
              >
                عرض كل الفصائل
              </button>
            )}
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5">
            <button
              onClick={() => {
                setSelectedBloodType('ALL');
                setSheetsDonors([]);
              }}
              className={`py-2 px-1 rounded-xl text-center font-bold text-xs border transition-all ${
                selectedBloodType === 'ALL'
                  ? 'bg-red-600 text-white border-red-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div>الكل</div>
              <div className="text-[10px] opacity-80">({countsPerType.ALL})</div>
            </button>
            {BLOOD_TYPES.map((bt) => (
              <button
                key={bt}
                onClick={() => {
                  setSelectedBloodType(bt);
                  setSheetsDonors([]);
                }}
                className={`py-2 px-1 rounded-xl text-center font-black text-xs sm:text-sm border transition-all ${
                  selectedBloodType === bt
                    ? 'bg-red-600 text-white border-red-600 shadow-xs scale-102'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-red-300 hover:bg-red-50/40'
                }`}
              >
                <div>{bt}</div>
                <div className="text-[10px] opacity-85 font-normal">
                  ({countsPerType[bt] || 0})
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Google Sheets Search Trigger - Restricted to Admin active mode */}
        {selectedBloodType !== 'ALL' && sheetsDonors.length === 0 && userProfile?.role === 'admin' && activeRole === 'admin' && (
          <div className="pt-2">
            <button
              onClick={handleSearchSheets}
              disabled={isSearchingSheets}
              className="w-full py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-red-300 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              {isSearchingSheets ? (
                <Clock className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>ابحث أيضاً في أرشيف Google Sheets (فصيلة {selectedBloodType})</span>
            </button>
            {sheetsError && (
              <p className="text-[10px] text-red-500 mt-1 text-center font-medium">
                {sheetsError}
              </p>
            )}
          </div>
        )}

        {/* Filter Toggle: Available Only */}
        <div className="flex items-center justify-between pt-1 text-xs border-t border-slate-100">
          <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
            />
            <span className="font-semibold">إظهار المتاحين للتبرع حالياً فقط</span>
          </label>
          <span className="text-[11px] text-slate-500">
            مديرية قعطبة وضواحيها
          </span>
        </div>

      </div>

      {/* Donors List Results */}
      {combinedDonors.length > 0 ? (
        <div className="space-y-3">
          {combinedDonors.map((donor) => {
            const isCopied = copiedPhone === donor.phone;
            const cleanDonorPhone = donor.phone ? donor.phone.replace(/\D/g, '') : '';
            const cleanUserPhone = userProfile?.phone ? userProfile.phone.replace(/\D/g, '') : '';
            const isMyRecord = Boolean(
              currentUser && (
                (donor.userId && donor.userId === currentUser.uid) ||
                (cleanUserPhone.length >= 7 && cleanDonorPhone.length >= 7 && cleanDonorPhone === cleanUserPhone)
              )
            );

            // Donation date formatting
            const donationDateDisplay = donor.lastDonationDate 
              ? donor.lastDonationDate 
              : (donor.createdAt 
                  ? (typeof donor.createdAt === 'string' 
                      ? donor.createdAt.split('T')[0] 
                      : (donor.createdAt?.seconds 
                          ? new Date(donor.createdAt.seconds * 1000).toISOString().split('T')[0] 
                          : 'مسجل حديثاً'))
                  : 'لم يُحدد بعد');

            return (
              <div
                key={donor.id}
                className={`bg-white rounded-2xl p-4 border transition-all shadow-xs space-y-3 ${
                  isMyRecord 
                    ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/20' 
                    : 'border-slate-200 hover:border-red-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Donor Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="text-base font-extrabold text-slate-900">
                        {donor.fullName}
                      </h3>

                      {isMyRecord && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                          <UserCheck className="w-3 h-3 text-amber-700" />
                          <span>بياناتي المسجلة</span>
                        </span>
                      )}

                      {donor.phoneVerified && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-bold px-1.5 py-0.5 rounded-full" title="تم التحقق من ملكية رقم الهاتف برمز تأكيد">
                          <ShieldCheck className="w-3 h-3 text-blue-600" />
                          <span>رقم موثوق</span>
                        </span>
                      )}

                      {donor.source === 'google_sheets' && activeRole === 'admin' && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-1.5 py-0.5 rounded-full">
                          <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                          <span>سجل الأرشيف</span>
                        </span>
                      )}
                    </div>

                    {/* حالة المتبرع */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {donor.isAvailable ? (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>حالة المتبرع: متاح للتبرع الآن</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 border border-slate-300 font-bold px-2.5 py-0.5 rounded-full">
                          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                          <span>حالة المتبرع: غير متاح مؤقتاً</span>
                        </span>
                      )}
                    </div>

                    {/* السكن أو المنطقة */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="font-bold text-slate-900">السكن / المنطقة:</span>
                      <span className="font-medium text-slate-800">{donor.residence || 'مديرية قعطبة'}</span>
                    </div>

                    {/* تاريخ التبرع */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-red-50/60 px-2.5 py-1.5 rounded-xl border border-red-100">
                      <Calendar className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span className="font-bold text-slate-900">تاريخ التبرع:</span>
                      <span className="font-semibold text-red-900">{donationDateDisplay}</span>
                    </div>

                    {donor.notes && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg mt-1 border border-slate-100">
                        {donor.notes}
                      </p>
                    )}
                  </div>

                  {/* Blood Type Badge */}
                  <div className="shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-br from-red-600 to-rose-700 text-white shadow-md shadow-red-200">
                    <span className="text-lg sm:text-xl font-black leading-none">
                      {donor.bloodType}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider font-semibold opacity-90 mt-0.5">
                      فصيلة
                    </span>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  {/* Owner Edit Button (Only visible if the logged in user is the owner of this record) */}
                  {isMyRecord && (
                    <button
                      type="button"
                      onClick={() => onEditDonor?.(donor.id)}
                      className="flex-1 min-w-[125px] py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-colors active:scale-95"
                      title="تعديل بياناتي التي سجلتها"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل بياناتي</span>
                    </button>
                  )}

                  {/* Call Button */}
                  <a
                    href={`tel:${donor.phone}`}
                    className="flex-1 min-w-[110px] py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>اتصال ({donor.phone})</span>
                  </a>

                  {/* WhatsApp Button */}
                  <button
                    onClick={() => handleWhatsApp(donor)}
                    className="flex-1 min-w-[95px] py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors active:scale-95"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>واتساب</span>
                  </button>

                  {/* Copy Phone */}
                  <button
                    onClick={() => handleCopyPhone(donor.phone)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center transition-colors"
                    title="نسخ رقم الهاتف"
                  >
                    {isCopied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  {/* Share Donor */}
                  <button
                    onClick={() => handleShare(donor)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center transition-colors"
                    title="مشاركة بيانات المتبرع"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Administrator Controls Bar (Edit & Delete any donor for admins) */}
                {isAdmin && !isMyRecord && (
                  <div className="pt-2.5 mt-1 border-t border-amber-200/60 bg-amber-50/60 -mx-4 -mb-4 px-4 py-2.5 rounded-b-2xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-amber-900 text-[11px] font-black">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>صلاحيات المسؤول:</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEditDonor?.(donor.id)}
                        className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-xs transition-all flex items-center gap-1 active:scale-95"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDonorToDelete(donor)}
                        className="py-1.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-black transition-all flex items-center gap-1 active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            لم نجد متبرعين مطابقين للبحث
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            جرب اختيار فصيلة دم أخرى، أو إزالة التصفية، أو كن أول من يسجل بهذه الفصيلة لإنقاذ الأرواح في قعطبة!
          </p>
          <button
            onClick={onNavigateToRegister}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-all"
          >
            <HeartHandshake className="w-4 h-4" />
            <span>سجل كمتبرع الآن</span>
          </button>
        </div>
      )}

      {/* Admin Delete Confirmation Modal */}
      {donorToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 text-right">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>
            
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-slate-900">تأكيد حذف المتبرع</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف بيانات المتبرع <span className="font-black text-red-600 underline underline-offset-2">{donorToDelete.fullName}</span> (فصيلة {donorToDelete.bloodType}) من السجل؟
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                بصفتك مسؤول التطبيق، سيتم حذف هذا السجل نهائياً من قاعدة البيانات واستبعاده من كافة الشاشات فوراً.
              </p>
            </div>

            {deleteError && (
              <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold text-center border border-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  if (!donorToDelete || !onDeleteDonor) return;
                  setIsDeleting(true);
                  setDeleteError(null);
                  try {
                    await onDeleteDonor(donorToDelete.id, donorToDelete.phone);
                    setDeleteSuccess(`تم حذف بيانات المتبرع (${donorToDelete.fullName}) بنجاح!`);
                    setTimeout(() => {
                      setDeleteSuccess(null);
                    }, 3500);
                    setDonorToDelete(null);
                  } catch (err: any) {
                    setDeleteError(err.message || 'حدث خطأ أثناء محاولة الحذف');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
                className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md shadow-red-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>تأكيد الحذف</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setDonorToDelete(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Departure Confirmation Modal */}
      {whatsAppTargetDonor && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setWhatsAppTargetDonor(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100 text-center font-['Cairo',sans-serif]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
              <MessageCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">هل تريد المغادرة إلى واتساب؟</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                أنت على وشك مغادرة التطبيق وفتح محادثة واتساب مع المتبرع:
              </p>
            </div>

            <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100 text-right space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900">{whatsAppTargetDonor.fullName}</span>
                <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full">
                  فصيلة {whatsAppTargetDonor.bloodType}
                </span>
              </div>
              <div className="text-xs text-slate-600 font-bold flex items-center justify-between">
                <span>رقم الهاتف:</span>
                <span dir="ltr" className="font-mono text-emerald-800 font-extrabold">{whatsAppTargetDonor.phone}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                السكن: {whatsAppTargetDonor.residence || 'مديرية قعطبة'}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const target = whatsAppTargetDonor;
                  setWhatsAppTargetDonor(null);
                  confirmWhatsAppNavigation(target);
                }}
                className="flex-1 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>نعم، الذهاب للواتس</span>
              </button>

              <button
                type="button"
                onClick={() => setWhatsAppTargetDonor(null)}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
