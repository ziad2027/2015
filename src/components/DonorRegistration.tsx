import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  User as UserIcon, 
  FileText, 
  ShieldCheck, 
  Edit3,
  LogIn,
  FileSpreadsheet,
  Trash2,
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { BloodType, BLOOD_TYPES, Donor } from '../types';
import { COMMON_LOCATIONS } from '../data/initialData';
import { saveDonorProfile, checkPhoneExists } from '../services/donorService';
import { sanitizePhone } from '../services/phoneVerificationService';
import { YemenPhoneInput } from './YemenPhoneInput';
import { syncDonorToGoogleSheets, GOOGLE_SHEETS_CONFIG } from '../services/googleSheetsService';

interface DonorRegistrationProps {
  onSuccessNavigate: () => void;
  donors: Donor[];
  onOpenAuth: () => void;
  editingDonorId?: string | null;
  onDeleteDonor?: (donorId: string, phone?: string) => Promise<void>;
}

export const DonorRegistration: React.FC<DonorRegistrationProps> = ({
  onSuccessNavigate,
  donors,
  onOpenAuth,
  editingDonorId,
  onDeleteDonor,
}) => {
  const { currentUser, userProfile, activeRole } = useAuth();
  const isAdmin = activeRole === 'admin' || userProfile?.role === 'admin' || currentUser?.email === 'ziadalsyyadi@gmail.com';

  // Find the specific donor profile being edited or the first one if none specified
  const existingDonor = editingDonorId
    ? donors.find(d => d.id === editingDonorId)
    : (currentUser ? donors.find(d => d.userId === currentUser.uid) : null);

  const cleanDonorPhone = existingDonor?.phone ? existingDonor.phone.replace(/\D/g, '') : '';
  const cleanUserPhone = userProfile?.phone ? userProfile.phone.replace(/\D/g, '') : '';
  const isOwner = Boolean(
    existingDonor && currentUser && (
      (existingDonor.userId && existingDonor.userId === currentUser.uid) ||
      (cleanUserPhone.length >= 7 && cleanDonorPhone.length >= 7 && cleanDonorPhone === cleanUserPhone)
    )
  );
  const canEdit = isOwner || isAdmin;

  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [bloodType, setBloodType] = useState<BloodType>('O+');
  const [phone, setPhone] = useState('');
  const [residence, setResidence] = useState('');
  const [notes, setNotes] = useState('');
  const [lastDonationDate, setLastDonationDate] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [allowContact, setAllowContact] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Sync isCreatingNew state with editingDonorId
  useEffect(() => {
    if (!editingDonorId && currentUser && donors.some(d => d.userId === currentUser.uid)) {
      setIsCreatingNew(true);
    } else {
      setIsCreatingNew(false);
    }
  }, [editingDonorId, currentUser, donors]);

  // Prefill if editing existing donor or newly logged in
  useEffect(() => {
    if (existingDonor && !isCreatingNew) {
      setFullName(existingDonor.fullName);
      setBloodType(existingDonor.bloodType);
      setPhone(existingDonor.phone);
      setResidence(existingDonor.residence);
      setNotes(existingDonor.notes || '');
      setLastDonationDate(existingDonor.lastDonationDate || '');
      setIsAvailable(existingDonor.isAvailable);
      setAllowContact(existingDonor.allowContact);
    } else {
      // Reset form for new donor
      setFullName('');
      setBloodType('O+');
      setPhone(userProfile?.phone || '');
      setResidence('');
      setNotes('');
      setLastDonationDate('');
      setIsAvailable(true);
      setAllowContact(true);
      
      // If just logged in and no existing donor, try to use profile info
      if (currentUser && !existingDonor) {
        if (userProfile?.displayName && !userProfile.displayName.startsWith('فاعل خير (')) {
          setFullName(userProfile.displayName);
        }
      }
    }
  }, [existingDonor, currentUser, userProfile, isCreatingNew]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    const cleanName = fullName.trim();
    if (cleanName.length < 2) {
      setErrorMessage('يرجى كتابة الاسم الكامل (حرفين على الأقل)');
      return;
    }

    const cleanPhone = sanitizePhone(phone || userProfile?.phone || '');
    if (cleanPhone.length < 7 || cleanPhone.length > 15) {
      setErrorMessage('يرجى إدخال رقم هاتف صحيح');
      return;
    }

    const cleanResidence = residence.trim();
    if (cleanResidence.length < 2) {
      setErrorMessage('يرجى تحديد السكن أو المنطقة الحالية');
      return;
    }

    if (!canEdit && existingDonor && !isCreatingNew) {
      setErrorMessage('عذراً، لا تملك صلاحية تعديل بيانات هذا المتبرع. يُسمح لكل شخص بتعديل بياناته فقط.');
      return;
    }

    setLoading(true);

    try {
      const activeUserId = currentUser.uid;
      const targetUserId = (!isCreatingNew && existingDonor && existingDonor.userId) 
        ? existingDonor.userId 
        : activeUserId;

      const savedDonorId = await saveDonorProfile(
        {
          userId: targetUserId,
          fullName: cleanName,
          bloodType,
          phone: cleanPhone,
          phoneVerified: true,
          residence: cleanResidence,
          notes: notes.trim(),
          lastDonationDate: lastDonationDate.trim(),
          isAvailable,
          allowContact,
        },
        (!isCreatingNew && existingDonor) ? existingDonor.id : undefined
      );

      setSuccessMessage(
        existingDonor && !isCreatingNew
          ? (isAdmin 
              ? `تم تحديث بيانات المتبرع (${cleanName}) بنجاح بصلاحية مسؤول التطبيق!` 
              : 'تم تحديث بيانات المتبرع بنجاح!')
          : 'بارك الله فيك! تم تسجيلك بنجاح وحفظ بياناتك كمتبرع مؤكد.'
      );

      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });

      if (savedDonorId) {
        const syncResult = await syncDonorToGoogleSheets({
          name: cleanName,
          bloodType,
          phone: cleanPhone,
          address: cleanResidence,
          notes: notes.trim(),
          donorId: savedDonorId,
        });

        if (syncResult.success) {
          setSuccessMessage(
            existingDonor && !isCreatingNew
              ? (isAdmin
                  ? `تم تحديث بيانات المتبرع (${cleanName}) بنجاح وبمزامنة الجدول!`
                  : 'تم تحديث البيانات بنجاح!')
              : 'بارك الله فيك! تم تسجيلك وحفظ بياناتك بنجاح في التطبيق والجدول.'
          );
        } else {
          setErrorMessage(`تم حفظ البيانات في التطبيق بنجاح، ولكن فشلت المزامنة مع Google Sheets: ${syncResult.error}`);
        }
      } else {
        setSuccessMessage(
          existingDonor && !isCreatingNew
            ? (isAdmin
                ? `تم تحديث بيانات المتبرع (${cleanName}) بنجاح!`
                : 'تم تحديث البيانات بنجاح!')
            : 'بارك الله فيك! تم تسجيلك بنجاح.'
        );
      }

      
      setLoading(false);
      setTimeout(() => onSuccessNavigate(), 500);

    } catch (err: any) {
      console.error('Error saving donor profile:', err);
      setLoading(false);
      setErrorMessage('حدث خطأ أثناء حفظ البيانات. يرجى التأكد من اتصال الإنترنت.');
    }
  };

  // Access guard: only owner or admin can edit an existing donor profile
  if (editingDonorId && existingDonor && !canEdit && !isCreatingNew) {
    return (
      <div className="max-w-xl mx-auto p-4 sm:p-6 text-center space-y-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-slate-900">
            تعديل البيانات متاح لصاحب الحساب فقط
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
            عذراً، وفقاً لسياسة الخصوصية وأمان سجل المتبرعين، لا يمكن تعديل بيانات متبرع آخر. يُسمح لكل شخص بتعديل بياناته التي أدخلها بنفسه فقط.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsCreatingNew(true);
                setFullName('');
                setBloodType('O+');
                setPhone(userProfile?.phone || '');
                setResidence('');
                setNotes('');
                setLastDonationDate('');
                setIsAvailable(true);
                setAllowContact(true);
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              التسجيل كمتبرع جديد
            </button>
            <button
              type="button"
              onClick={onSuccessNavigate}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              العودة لقائمة المتبرعين
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-red-600 to-rose-700 text-white rounded-2xl p-4 sm:p-5 shadow-md shadow-red-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
            {(!isCreatingNew && existingDonor) ? <Edit3 className="w-6 h-6" /> : <HeartHandshake className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
              {(!isCreatingNew && existingDonor) ? 'تعديل بيانات المتبرع' : 'التسجيل في سجل المتبرعين بالدم'}
            </h2>
            <p className="text-xs sm:text-sm text-red-100 mt-0.5">
              مديرية قعطبة وضواحيها • سجل موثوق ومحمي للمتبرعين
            </p>
          </div>
        </div>

        {existingDonor && !isCreatingNew && (
          <div className="mt-3 flex flex-col gap-2">
            <div className="text-xs bg-white/15 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>أنت مسجل برقم مؤكد ({existingDonor.phone}). يمكنك تعديل بياناتك أو تحديث حالة توفرك.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsCreatingNew(true);
                setFullName('');
                setBloodType('O+');
                setPhone(userProfile?.phone || '');
                setResidence('');
                setNotes('');
                setIsAvailable(true);
                setAllowContact(true);
              }}
              className="text-[11px] bg-red-100 text-red-800 px-3 py-1.5 rounded-lg font-bold hover:bg-red-200 transition-colors"
            >
              + إضافة متبرع جديد (إضافة أخرى)
            </button>
          </div>
        )}
      </div>

      {/* If Not Logged In Banner */}
      {!currentUser && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-amber-950">
                تسجيل الدخول مطلوب لحفظ ملف المتبرع الموثوق
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                لضمان عدم استخدام أرقام هواتف غير مؤكدة ولحماية خصوصيتك والسماح لك بتعديل بياناتك لاحقاً، يرجى تسجيل الدخول أو إنشاء حساب برقم هاتفك وكلمة المرور أولاً.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAuth}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>تسجيل الدخول / إنشاء حساب برقم الهاتف</span>
          </button>
        </div>
      )}



      {/* Google Sheets Connection Status - Removed as per user request to simplify UI */}

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs">
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="font-bold">تنبيه</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
            <p className="font-bold">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
              الاسم الكامل <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: صالح محمد القعطبي"
                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-sm outline-hidden font-medium"
                required
              />
              <UserIcon className="w-5 h-5 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          {/* Blood Type Selection Grid */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
              فصيلة الدم <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {BLOOD_TYPES.map((bt) => (
                <button
                  type="button"
                  key={bt}
                  onClick={() => setBloodType(bt)}
                  className={`py-2.5 rounded-xl text-center font-black text-sm sm:text-base border-2 transition-all active:scale-95 ${
                    bloodType === bt
                      ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-200 scale-102'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-red-300 hover:bg-red-50/50'
                  }`}
                >
                  {bt}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              الفصائل المطلوبة: O+، O-، A+، A-، B+، B-، AB+، AB-
            </p>
          </div>

          {/* Phone Number */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-800">
                رقم الهاتف الموثق في الحساب <span className="text-red-500">*</span>
              </label>
              {currentUser && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  رقم مؤكد في Firebase
                </span>
              )}
            </div>
            <YemenPhoneInput
              value={phone || userProfile?.phone || ''}
              onChange={setPhone}
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              يُمنع تكرار رقم الهاتف لمتبرع آخر لضمان مصداقية السجل الخيري.
            </p>
          </div>

          {/* Current Residence */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
              السكن الحالي (المنطقة / القرية) <span className="text-red-500">*</span>
            </label>
            <div className="relative mb-2">
              <input
                type="text"
                value={residence}
                onChange={(e) => setResidence(e.target.value)}
                placeholder="اكتب السكن أو اختر من المناطق أدناه"
                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-sm outline-hidden font-medium"
                required
              />
              <MapPin className="w-5 h-5 text-slate-400 absolute right-3 top-2.5" />
            </div>

            {/* Quick Location Pills */}
            <div className="flex flex-wrap gap-1.5">
              {COMMON_LOCATIONS.map((loc) => (
                <button
                  type="button"
                  key={loc}
                  onClick={() => setResidence(loc.replace(' (تحديد يدوي)', ''))}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                    residence === loc
                      ? 'bg-red-100 text-red-800 border-red-300 font-bold'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Health Notes */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
              ملاحظات إضافية (اختياري)
            </label>
            <div className="relative">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثلاً: متوفر سيارة للوصول للمستشفى، أفضل وقت للتواصل بعد العصر، آخر تبرع قبل 4 أشهر..."
                rows={2}
                maxLength={500}
                className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-sm outline-hidden"
              />
              <FileText className="w-5 h-5 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          {/* Last Donation Date */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-red-600" />
                <span>تاريخ التبرع / آخر تبرع بالدم (اختياري)</span>
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                للتأكد من انقضاء المدة الصحية
              </span>
            </label>
            <div className="relative mb-2">
              <input
                type="date"
                value={lastDonationDate}
                onChange={(e) => setLastDonationDate(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-sm outline-hidden font-medium"
              />
              <Calendar className="w-5 h-5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            {/* Quick Date Pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setLastDonationDate(new Date().toISOString().split('T')[0])}
                className="text-[11px] px-2.5 py-1 rounded-lg border bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                اليوم
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setMonth(d.getMonth() - 2);
                  setLastDonationDate(d.toISOString().split('T')[0]);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg border bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                قبل شهرين
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setMonth(d.getMonth() - 4);
                  setLastDonationDate(d.toISOString().split('T')[0]);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg border bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                قبل 4 أشهر
              </button>
              <button
                type="button"
                onClick={() => setLastDonationDate('')}
                className="text-[11px] px-2.5 py-1 rounded-lg border bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                متبرع جديد (لم أتبرع بعد)
              </button>
            </div>
          </div>

          {/* Availability Status Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-800">
                جاهز للتبرع حالياً
              </div>
              <div className="text-[11px] text-slate-500">
                يمكنك إيقاف التفعيل مؤقتاً عند السفر أو المرض
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Privacy Consent Agreement */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50/50 border border-red-100">
            <input
              type="checkbox"
              id="consent"
              checked={allowContact}
              onChange={(e) => setAllowContact(e.target.checked)}
              className="mt-1 w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500 cursor-pointer"
            />
            <label htmlFor="consent" className="text-xs text-slate-700 leading-relaxed cursor-pointer select-none">
              <span className="font-bold text-slate-900">موافقة على التواصل الخيري:</span>{' '}
              أوافق على إتاحة رقم هاتفي للباحثين عن فصيلة الدم لإنقاذ حياة المحتاجين والحالات الطارئة.
            </label>
          </div>

          {/* Action Buttons: Save & Admin Delete */}
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-linear-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-extrabold text-sm sm:text-base shadow-md shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : !currentUser ? (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>تسجيل الدخول برقم الهاتف للمتابعة</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>
                    {(!isCreatingNew && existingDonor) 
                      ? (isAdmin ? `حفظ تعديلات المتبرع (${fullName || existingDonor.fullName}) كمسؤول` : 'حفظ تعديلات المتبرع')
                      : 'تأكيد التسجيل كمتبرع مؤكد بالدم'}
                  </span>
                </>
              )}
            </button>

            {/* Admin Delete Donor Button */}
            {isAdmin && existingDonor && !isCreatingNew && onDeleteDonor && (
              <button
                type="button"
                onClick={() => setConfirmDeleteModal(true)}
                disabled={loading || isDeleting}
                className="w-full py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>حذف هذا المتبرع نهائياً من السجل (صلاحيات المسؤول)</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Admin Delete Modal from Registration Form */}
      {confirmDeleteModal && existingDonor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 text-right">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>
            
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-slate-900">تأكيد حذف المتبرع</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                هل أنت متأكد من حذف بيانات المتبرع <span className="font-black text-red-600 underline">{existingDonor.fullName}</span> ({existingDonor.bloodType}) من السجل نهائياً؟
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                بصفتك مسؤول التطبيق، سيتم حذف هذا المتبرع فوراً ولن يظهر في نتائج البحث.
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
                  if (!onDeleteDonor || !existingDonor) return;
                  setIsDeleting(true);
                  setDeleteError(null);
                  try {
                    await onDeleteDonor(existingDonor.id, existingDonor.phone);
                    setConfirmDeleteModal(false);
                    onSuccessNavigate();
                  } catch (err: any) {
                    setDeleteError(err.message || 'حدث خطأ أثناء الحذف');
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
                  setConfirmDeleteModal(false);
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
    </div>
  );
};
