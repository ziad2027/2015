import React, { useState } from 'react';
import { 
  AlertCircle, 
  Plus, 
  Clock, 
  MapPin, 
  Phone, 
  MessageCircle, 
  CheckCircle2, 
  Share2, 
  Hospital, 
  User as UserIcon, 
  Calendar,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  X,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { UrgentRequest, BloodType, BLOOD_TYPES, UrgencyLevel } from '../types';
import { createUrgentRequest, updateRequestStatus, deleteUrgentRequest } from '../services/donorService';
import { YemenPhoneInput } from './YemenPhoneInput';

// Helper to check if urgent request is expired (older than 48 hours)
export const isUrgentRequestExpired = (req: UrgentRequest): boolean => {
  if (!req.createdAt) return false;
  let createdMs = 0;
  if (typeof req.createdAt?.toMillis === 'function') {
    createdMs = req.createdAt.toMillis();
  } else if (req.createdAt?.seconds) {
    createdMs = req.createdAt.seconds * 1000;
  } else if (typeof req.createdAt === 'number') {
    createdMs = req.createdAt;
  } else if (typeof req.createdAt === 'string') {
    createdMs = new Date(req.createdAt).getTime();
  } else if (req.createdAt instanceof Date) {
    createdMs = req.createdAt.getTime();
  }
  if (!createdMs || isNaN(createdMs)) return false;
  // 48 hours in milliseconds
  return (Date.now() - createdMs) > 48 * 60 * 60 * 1000;
};

// Helper to get remaining hours out of 48h
export const getUrgentRemainingHours = (req: UrgentRequest): number => {
  if (!req.createdAt) return 48;
  let createdMs = Date.now();
  if (typeof req.createdAt?.toMillis === 'function') {
    createdMs = req.createdAt.toMillis();
  } else if (req.createdAt?.seconds) {
    createdMs = req.createdAt.seconds * 1000;
  } else if (typeof req.createdAt === 'number') {
    createdMs = req.createdAt;
  } else if (typeof req.createdAt === 'string') {
    createdMs = new Date(req.createdAt).getTime();
  } else if (req.createdAt instanceof Date) {
    createdMs = req.createdAt.getTime();
  }
  const elapsed = Date.now() - createdMs;
  const leftMs = (48 * 60 * 60 * 1000) - elapsed;
  return Math.max(0, Math.floor(leftMs / (60 * 60 * 1000)));
};

interface UrgentRequestsProps {
  urgentRequests: UrgentRequest[];
  onOpenAuth: () => void;
}

export const UrgentRequests: React.FC<UrgentRequestsProps> = ({
  urgentRequests,
  onOpenAuth,
}) => {
  const { currentUser, userProfile, activeRole } = useAuth();
  const isAdmin = activeRole === 'admin' || userProfile?.role === 'admin' || currentUser?.email === 'ziadalsyyadi@gmail.com';

  const [filterStatus, setFilterStatus] = useState<'open' | 'fulfilled' | 'all'>('open');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [whatsAppTargetReq, setWhatsAppTargetReq] = useState<UrgentRequest | null>(null);

  // Admin delete urgent request states
  const [reqToDelete, setReqToDelete] = useState<UrgentRequest | null>(null);
  const [isDeletingReq, setIsDeletingReq] = useState(false);
  const [deleteReqError, setDeleteReqError] = useState<string | null>(null);

  const handleDeleteRequestConfirm = async () => {
    if (!reqToDelete) return;
    setIsDeletingReq(true);
    setDeleteReqError(null);
    try {
      await deleteUrgentRequest(reqToDelete.id);
      setReqToDelete(null);
    } catch (err: any) {
      setDeleteReqError(err.message || 'فشل حذف البلاغ');
    } finally {
      setIsDeletingReq(false);
    }
  };

  // New Request Form state
  const [patientName, setPatientName] = useState('');
  const [bloodType, setBloodType] = useState<BloodType>('O+');
  const [unitsNeeded, setUnitsNeeded] = useState(1);
  const [hospital, setHospital] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>('urgent');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter requests (only active within 48h limit)
  const validRequests = urgentRequests.filter((req) => !isUrgentRequestExpired(req));

  const filteredRequests = validRequests.filter((req) => {
    if (filterStatus === 'open') return req.status === 'open';
    if (filterStatus === 'fulfilled') return req.status === 'fulfilled';
    return true;
  });

  const openCount = validRequests.filter((r) => r.status === 'open').length;
  const fulfilledCount = validRequests.filter((r) => r.status === 'fulfilled').length;

  // Handle new request submit
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!currentUser) {
      setFormError('يرجى تسجيل الدخول أو إنشاء حساب لنشر طلب دم عاجل ومتابعته');
      return;
    }

    if (patientName.trim().length < 2) {
      setFormError('يرجى كتابة اسم المريض أو الحالة');
      return;
    }

    if (hospital.trim().length < 2) {
      setFormError('يرجى كتابة المستشفى أو مكان الحاجة');
      return;
    }

    if (contactPhone.trim().replace(/\D/g, '').length < 7) {
      setFormError('يرجى إدخال رقم هاتف صحيح للتواصل');
      return;
    }

    setSubmitting(true);
    try {
      await createUrgentRequest({
        userId: currentUser.uid,
        patientName: patientName.trim(),
        bloodType,
        unitsNeeded: Number(unitsNeeded) || 1,
        hospital: hospital.trim(),
        contactName: contactName.trim() || patientName.trim(),
        contactPhone: contactPhone.trim(),
        urgencyLevel,
        status: 'open',
        notes: notes.trim(),
      });

      confetti({
        particleCount: 70,
        spread: 60,
      });

      // Reset form
      setPatientName('');
      setHospital('');
      setContactName('');
      setContactPhone('');
      setNotes('');
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error creating request:', err);
      setFormError('حدث خطأ أثناء نشر الطلب. يرجى المحاولة ثانية.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle status to fulfilled
  const handleToggleStatus = async (request: UrgentRequest) => {
    const newStatus = request.status === 'open' ? 'fulfilled' : 'open';
    try {
      await updateRequestStatus(request.id, newStatus);
      if (newStatus === 'fulfilled') {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Quick hospital suggestions in Qa'tabah / Al-Dhale
  const HOSPITAL_SUGGESTIONS = [
    'مستشفى السلام التخصصي - قعطبة',
    'مستشفى قعطبة العام',
    'مستشفى النصر العام - الضالع',
    'مستشفى التضامن التخصصي - الضالع',
    'مركز الطوارئ التوليدية - قعطبة',
    'مستشفى مريس العام',
  ];

  const handleWhatsApp = (req: UrgentRequest) => {
    setWhatsAppTargetReq(req);
  };

  const confirmWhatsAppNavigation = (req: UrgentRequest) => {
    const cleanNumber = req.contactPhone.replace(/\D/g, '');
    const international = cleanNumber.startsWith('967') ? cleanNumber : `967${cleanNumber}`;
    const text = encodeURIComponent(
      `السلام عليكم ورحمة الله،\nبخصوص طلب الدم العاجل لفصيلة (${req.bloodType}) في (${req.hospital}) للمريض (${req.patientName}) عبر تطبيق (قطرة دم تنقذ حياة).\nأنا مستعد للتبرع والمساعدة، يرجى إفادتي بالتفاصيل ومكان الحضور فوراً.`
    );
    window.open(`https://wa.me/${international}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Admin Urgent Requests In-Page Bar */}
      {isAdmin && (
        <div className="bg-linear-to-r from-amber-600 via-amber-700 to-rose-700 text-white rounded-2xl p-4 shadow-md space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-200 shrink-0" />
              <div>
                <h3 className="text-sm font-black">أدوات إدارة طلبات الدم (وضع المسؤول)</h3>
                <p className="text-[11px] text-amber-100">يمكنك إغلاق أي طلب أو إعادة فتحه أو حذفه مباشرة عند توفير أكياس الدم</p>
              </div>
            </div>
            <span className="text-xs bg-amber-900/60 px-3 py-1 rounded-full font-bold border border-amber-400/30">
              {openCount} طلبات نشطة
            </span>
          </div>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="bg-linear-to-r from-red-600 via-rose-600 to-amber-600 text-white rounded-2xl p-4 sm:p-5 shadow-md shadow-red-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                طلبات الدم العاجلة والحرجة
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-red-100">
              مديرية قعطبة والمستشفيات المجاورة • استجابة فورية لإنقاذ الأرواح
            </p>
          </div>

          <button
            onClick={() => {
              if (!currentUser) {
                onOpenAuth();
              } else {
                setIsModalOpen(true);
              }
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white text-red-700 hover:bg-red-50 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>نشر طلب دم عاجل</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 text-xs font-bold">
        <button
          onClick={() => setFilterStatus('open')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            filterStatus === 'open'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>الحالات المفتوحة ({openCount})</span>
        </button>

        <button
          onClick={() => setFilterStatus('fulfilled')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            filterStatus === 'fulfilled'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>تم توفير الدم ({fulfilledCount})</span>
        </button>

        <button
          onClick={() => setFilterStatus('all')}
          className={`py-2 px-3 rounded-lg transition-all ${
            filterStatus === 'all'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>الكل ({urgentRequests.length})</span>
        </button>
      </div>

      {/* Requests List */}
      {filteredRequests.length > 0 ? (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const isAuthor = currentUser && (currentUser.uid === req.userId);
            const isCritical = req.urgencyLevel === 'critical';
            const isFulfilled = req.status === 'fulfilled';

            return (
              <div
                key={req.id}
                className={`bg-white rounded-2xl p-4 border transition-all shadow-xs space-y-3 relative overflow-hidden ${
                  isFulfilled
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isCritical
                    ? 'border-red-300 ring-2 ring-red-100'
                    : 'border-slate-200 hover:border-red-200'
                }`}
              >
                {/* Urgent Strip on Critical Cases */}
                {isCritical && !isFulfilled && (
                  <div className="absolute top-0 right-0 left-0 h-1 bg-linear-to-r from-red-600 via-rose-500 to-amber-500"></div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    {/* Header Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isFulfilled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          تم توفير الدم بنجاح بحمد الله
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                            isCritical
                              ? 'bg-red-600 text-white animate-pulse'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          {isCritical ? 'حالة حرجة جداً' : 'طلب عاجل'}
                        </span>
                      )}

                      <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        مطلوب {req.unitsNeeded} كيس دم
                      </span>

                      {!isFulfilled && (
                        <span 
                          className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-full"
                          title="صلاحية ظهور البلاغ 48 ساعة فقط ثم يختفي تلقائياً"
                        >
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>متبقي {getUrgentRemainingHours(req)} ساعة</span>
                        </span>
                      )}
                    </div>

                    {/* Patient & Hospital */}
                    <h3 className="text-base font-extrabold text-slate-900 pt-0.5">
                      {req.patientName}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      <Hospital className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span>{req.hospital}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>مسؤول الحالة: {req.contactName}</span>
                    </div>

                    {req.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mt-1 border border-slate-100">
                        {req.notes}
                      </p>
                    )}
                  </div>

                  {/* Blood Type Badge */}
                  <div className="shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-br from-red-600 to-rose-700 text-white shadow-md shadow-red-200">
                    <span className="text-lg sm:text-xl font-black leading-none">
                      {req.bloodType}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider font-semibold opacity-90 mt-0.5">
                      مطلوب
                    </span>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 flex-1">
                    {/* Call Direct - Clean privacy */}
                    <a
                      href={`tel:${req.contactPhone}`}
                      className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors active:scale-95"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>اتصال</span>
                    </a>

                    {/* WhatsApp - Direct Instant Launch */}
                    <a
                      href={`https://wa.me/967${req.contactPhone.replace(/\D/g, '').replace(/^967/, '')}?text=${encodeURIComponent(
                        `السلام عليكم ورحمة الله،\nبخصوص طلب الدم العاجل لفصيلة (${req.bloodType}) في (${req.hospital}) للمريض (${req.patientName}) عبر تطبيق (قطرة دم تنقذ حياة).\nأنا مستعد للتبرع والمساعدة، يرجى إفادتي بالتفاصيل ومكان الحضور فوراً.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors active:scale-95 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>أنا مستعد للتبرع</span>
                    </a>

                    {/* Quick Share / WhatsApp Broadcast */}
                    <button
                      onClick={() => {
                        const shareText = `🔴 نداء طارئ للتبرع بالدم في قعطبة!\n` +
                          `👤 المريض: ${req.patientName}\n` +
                          `🩸 الفصيلة المطلوبة: ${req.bloodType}\n` +
                          `💉 الوحدات: ${req.unitsNeeded} كيس\n` +
                          `🏥 المستشفى: ${req.hospital}\n` +
                          `⚠️ ملاحظة: الطلب ساري لمدة 48 ساعة.\n\n` +
                          `تطبيق بنك الدم في مديرية قعطبة 🩸`;

                        if (navigator.share) {
                          navigator.share({
                            title: 'نداء عاجل للتبرع بالدم - قعطبة',
                            text: shareText,
                            url: window.location.href,
                          }).catch(() => {});
                        } else {
                          navigator.clipboard.writeText(shareText);
                          alert('تم نسخ تفاصيل النداء بنجاح! يمكنك لصقه في مجموعات واتساب.');
                        }
                      }}
                      className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors active:scale-95"
                      title="مشاركة النداء عبر واتساب ومجموعات الخير"
                    >
                      <Share2 className="w-3.5 h-3.5 text-slate-600" />
                      <span className="hidden sm:inline">مشاركة</span>
                    </button>
                  </div>

                  {/* Creator or Admin Controls (Close / Reopen / Delete) */}
                  {(isAuthor || isAdmin) && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleStatus(req)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-colors ${
                          isFulfilled
                            ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                        }`}
                      >
                        {isFulfilled ? 'إعادة فتح الطلب' : 'إغلاق (تم توفير الدم)'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setReqToDelete(req)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors"
                        title="حذف البلاغ"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {filterStatus === 'open'
              ? 'الحمد لله، لا توجد طلبات دم عاجلة مفتوحة حالياً'
              : 'لا توجد طلبات ضمن هذا القسم'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            إذا كانت هناك حالة بحاجة ماسة للدم في قعطبة أو المستشفيات المجاورة، اضغط على زر النشر لإبلاغ المتبرعين فوراً.
          </p>
          <button
            onClick={() => {
              if (!currentUser) onOpenAuth();
              else setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>نشر طلب دم عاجل</span>
          </button>
        </div>
      )}

      {/* Add Urgent Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  نشر طلب دم عاجل
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-3.5">
              
              {/* Patient Name / Case */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  اسم المريض أو وصف الحالة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="مثال: مريض بالعناية، أو حالة ولادة طارئة..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-red-500 text-xs sm:text-sm outline-hidden font-medium"
                  required
                />
              </div>

              {/* Blood Type & Units */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    فصيلة الدم المطلوبة <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value as BloodType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-red-500 text-xs sm:text-sm font-bold bg-white outline-hidden"
                  >
                    {BLOOD_TYPES.map((bt) => (
                      <option key={bt} value={bt}>
                        {bt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    عدد الأكياس / الوحدات <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={unitsNeeded}
                    onChange={(e) => setUnitsNeeded(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-red-500 text-xs sm:text-sm font-bold outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Hospital & Location */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  المستشفى / مكان الحاجة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  placeholder="اكتب اسم المستشفى أو اختر من القائمة أدناه"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-red-500 text-xs sm:text-sm outline-hidden font-medium mb-1.5"
                  required
                />
                <div className="flex flex-wrap gap-1">
                  {HOSPITAL_SUGGESTIONS.map((hosp) => (
                    <button
                      type="button"
                      key={hosp}
                      onClick={() => setHospital(hosp)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                        hospital === hosp
                          ? 'bg-red-100 text-red-800 border-red-300 font-bold'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {hosp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    اسم مسؤول الحالة <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="مثال: أخو المريض / د. مناوب"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-red-500 text-xs sm:text-sm outline-hidden font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    رقم هاتف الاتصال والواتساب <span className="text-red-500">*</span>
                  </label>
                  <YemenPhoneInput
                    value={contactPhone}
                    onChange={setContactPhone}
                    required
                  />
                </div>
              </div>

              {/* Urgency Level */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  درجة الاستعجال <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setUrgencyLevel('critical')}
                    className={`py-2 px-2 rounded-xl text-center text-xs font-bold border transition-all ${
                      urgencyLevel === 'critical'
                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    حرج جداً (الآن)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgencyLevel('urgent')}
                    className={`py-2 px-2 rounded-xl text-center text-xs font-bold border transition-all ${
                      urgencyLevel === 'urgent'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    عاجل اليوم
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgencyLevel('normal')}
                    className={`py-2 px-2 rounded-xl text-center text-xs font-bold border transition-all ${
                      urgencyLevel === 'normal'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    خلال 24-48 ساعة
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  ملاحظات أو تعليمات للمتبرع (اختياري)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي تفاصيل عن القسم أو موعد التبرع أو الاتصال..."
                  rows={2}
                  maxLength={500}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-red-500 text-xs sm:text-sm outline-hidden"
                />
              </div>

              {/* 48-Hour Auto-Expiry Notice */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs font-semibold flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  تنويه: يستمر ظهور طلب الدم العاجل لمدة 48 ساعة فقط من وقت الإرسال ثم يختفي تلقائياً لضمان مصداقية وحداثة البلاغات في قعطبة.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-red-200 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? 'جارٍ النشر...' : 'نشر الطلب العاجل فوراً'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Departure Confirmation Modal */}
      {whatsAppTargetReq && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setWhatsAppTargetReq(null)}
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
                أنت على وشك مغادرة التطبيق والتواصل عبر واتساب للمساعدة في إنقاذ حالة المريض:
              </p>
            </div>

            <div className="bg-rose-50/70 p-3 rounded-2xl border border-rose-100 text-right space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900">{whatsAppTargetReq.patientName}</span>
                <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full">
                  فصيلة {whatsAppTargetReq.bloodType}
                </span>
              </div>
              <div className="text-xs text-slate-600 font-bold flex items-center justify-between">
                <span>المستشفى:</span>
                <span className="text-slate-800 font-extrabold">{whatsAppTargetReq.hospital}</span>
              </div>
              <div className="text-xs text-slate-600 font-bold flex items-center justify-between">
                <span>المسؤول:</span>
                <span className="text-slate-800">{whatsAppTargetReq.contactName}</span>
              </div>
              <div className="text-xs text-slate-600 font-bold flex items-center justify-between">
                <span>الهاتف:</span>
                <span dir="ltr" className="font-mono text-emerald-800 font-extrabold">{whatsAppTargetReq.contactPhone}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const target = whatsAppTargetReq;
                  setWhatsAppTargetReq(null);
                  confirmWhatsAppNavigation(target);
                }}
                className="flex-1 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>نعم، الذهاب للواتس</span>
              </button>

              <button
                type="button"
                onClick={() => setWhatsAppTargetReq(null)}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Request Confirmation Modal */}
      {reqToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                تأكيد حذف طلب الدم
              </h3>
              <p className="text-xs text-slate-500">
                هل أنت متأكد من حذف طلب الدم للمريض <strong className="text-slate-800">({reqToDelete.patientName})</strong>؟
              </p>
            </div>

            {deleteReqError && (
              <div className="text-xs p-2.5 rounded-xl bg-rose-50 text-rose-700 font-bold border border-rose-200">
                {deleteReqError}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleDeleteRequestConfirm}
                disabled={isDeletingReq}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-200 transition-colors active:scale-95 disabled:opacity-50"
              >
                {isDeletingReq ? 'جارٍ الحذف...' : 'نعم، حذف الطلب'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setReqToDelete(null);
                  setDeleteReqError(null);
                }}
                className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"
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
