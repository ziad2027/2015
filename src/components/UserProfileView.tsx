import React, { useState } from 'react';
import { 
  UserCircle, 
  HeartHandshake, 
  AlertCircle, 
  LogOut, 
  Edit3, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Smartphone, 
  Trash2,
  Check,
  XCircle,
  ShieldAlert,
  Users,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Settings2,
  Settings,
  Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Donor, UrgentRequest, BLOOD_TYPES, BloodType } from '../types';
import { updateRequestStatus, saveDonorProfile, deleteDonorProfile } from '../services/donorService';
import { RoleSelectionModal } from './RoleSelectionModal';

interface UserProfileViewProps {
  donors: Donor[];
  urgentRequests: UrgentRequest[];
  onNavigateToRegister: (donorId?: string) => void;
  onOpenInstallModal: () => void;
  onOpenAuth: () => void;
  onGoToAdmin: () => void;
  onOpenExitConfirm: () => void;
  onSearchWithFilter: (bloodType: BloodType | 'ALL') => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  donors,
  urgentRequests,
  onNavigateToRegister,
  onOpenInstallModal,
  onOpenAuth,
  onGoToAdmin,
  onOpenExitConfirm,
  onSearchWithFilter,
}) => {
  const { currentUser, userProfile, isGuest, logout, activeRole, switchActiveRole, updateUserProfileAndAccount } = useAuth();
  const [toggleLoading, setToggleLoading] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  // Settings / Edit Form Toggle State
  const [showSettings, setShowSettings] = useState(false);


  // Editable account details states
  const [fullNameInput, setFullNameInput] = useState(userProfile?.displayName || currentUser?.displayName || '');
  const [phoneInput, setPhoneInput] = useState(userProfile?.phone || '');
  const [passwordInput, setPasswordInput] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Keep inputs synced when userProfile changes
  React.useEffect(() => {
    if (userProfile?.displayName) setFullNameInput(userProfile.displayName);
    if (userProfile?.phone) setPhoneInput(userProfile.phone);
  }, [userProfile]);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveResult(null);
    try {
      await updateUserProfileAndAccount(fullNameInput, phoneInput, passwordInput);
      setSaveResult({ success: true, msg: 'تم حفظ وتحديث الاسم والمعلومات بنجاح! ✓' });
      setPasswordInput('');
    } catch (err: any) {
      setSaveResult({ success: false, msg: err.message || 'حدث خطأ أثناء حفظ التعديلات' });
    } finally {
      setSaveLoading(false);
    }
  };

  // Find all user's donor records
  const myDonors = currentUser
    ? donors.filter((d) => d.userId === currentUser.uid)
    : [];

  // Find user's urgent requests
  const myRequests = currentUser
    ? urgentRequests.filter((r) => r.userId === currentUser.uid)
    : [];

  const handleToggleAvailability = async (donor: Donor) => {
    setToggleLoading(true);
    try {
      await saveDonorProfile(
        {
          ...donor,
          isAvailable: !donor.isAvailable,
        },
        donor.id
      );
    } catch (err) {
      console.error('Error toggling availability:', err);
    } finally {
      setToggleLoading(false);
    }
  };

  const handleDeleteDonor = async (donorId: string) => {
    if (window.confirm('هل أنت متأكد من حذف اسمك من سجل المتبرعين؟')) {
      try {
        await deleteDonorProfile(donorId);
      } catch (err) {
        console.error('Error deleting donor:', err);
      }
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 text-center space-y-4 max-w-md mx-auto shadow-xs">
        <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <UserCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-slate-900">
          {isGuest ? 'أنت تتصفح التطبيق كزائر' : 'حساب المستخدم'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          قم بتسجيل الدخول أو إنشاء حساب برقم هاتفك لتتمكن من التسجيل كمتبرع، تعديل بياناتك في أي وقت، ونشر ومتابعة طلبات الدم العاجلة.
        </p>
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={onOpenAuth}
            className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm shadow-md shadow-red-200 transition-all active:scale-98"
          >
            تسجيل الدخول / إنشاء حساب
          </button>
          <button
            onClick={onOpenInstallModal}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs border border-emerald-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>طريقة تثبيت التطبيق على أندرويد (APK)</span>
          </button>
        </div>

        {/* Contact info for guest view */}
        <div className="pt-2 border-t border-slate-100">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-right flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-bold block">التواصل والدعم:</span>
                <a 
                  href="mailto:zalsyyadi@gmail.com" 
                  className="text-xs font-black text-red-600 font-mono hover:underline" 
                  dir="ltr"
                >
                  zalsyyadi@gmail.com
                </a>
              </div>
            </div>
            <a
              href="mailto:zalsyyadi@gmail.com"
              className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-black flex items-center gap-1 shadow-xs hover:bg-red-700 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>مراسلة</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const userDisplayName = userProfile?.displayName || currentUser.displayName || 'فاعل خير';
  const userPhoneDisplay = userProfile?.phone || currentUser.email?.replace('@qataba-blood.app', '').replace('user_', '') || 'غير مدخل';

  return (
    <div className="space-y-4 max-w-2xl mx-auto text-right">
      
      {/* 1. Account Info Card (حسابي الشخصي - للعرض كما في الصورة) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center text-lg font-black shadow-md shadow-red-200 shrink-0">
              {userDisplayName[0]}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">حسابي الشخصي</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-slate-500 font-bold">معلومات الحساب</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold px-2 py-0.5 rounded-full">
                  حساب مؤكد ✓
                </span>
              </div>
            </div>
          </div>

          {activeRole === 'admin' && (
            <button
              onClick={() => logout()}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 text-xs font-black flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          )}
        </div>

        {/* Display Fields (As requested in user's mockup) */}
        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-black text-slate-800 mb-1">الاسم الكامل:</label>
            <div className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold font-sans">
              {userDisplayName}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-800 mb-1">رقم الهاتف:</label>
            <div className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold font-mono" dir="ltr">
              {userPhoneDisplay}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-800 mb-1">البريد الإلكتروني للتواصل:</label>
            <div className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold font-mono flex items-center justify-between" dir="ltr">
              <a href="mailto:zalsyyadi@gmail.com" className="text-red-600 hover:underline">
                zalsyyadi@gmail.com
              </a>
              <span className="text-[10px] text-slate-500 font-sans">تواصل الإدارة والدعم</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Settings Section / Button (زر الإعدادات لتعديل الاسم والمعلومات) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full flex items-center justify-between p-1 rounded-xl text-slate-900 hover:text-red-600 transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 group-hover:bg-red-50 text-slate-700 group-hover:text-red-600 flex items-center justify-center transition-colors">
              <Settings className="w-5 h-5" />
            </div>
            <div className="text-right">
              <h3 className="text-sm font-black text-slate-900">الإعدادات وتعديل البيانات</h3>
              <p className="text-[11px] text-slate-500 font-bold">تعديل الاسم الكامل، رقم الهاتف، أو كلمة المرور</p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 text-xs font-black flex items-center gap-1 border border-red-100">
            <Edit3 className="w-3.5 h-3.5" />
            <span>{showSettings ? 'إخفاء الإعدادات' : 'فتح الإعدادات'}</span>
          </div>
        </button>

        {showSettings && (
          <form onSubmit={handleSaveAccount} className="space-y-3.5 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل الجديد:</label>
              <input
                type="text"
                value={fullNameInput}
                onChange={(e) => setFullNameInput(e.target.value)}
                placeholder="أدخل الاسم الجديد بالكامل"
                className="w-full p-3 rounded-2xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-xs font-bold outline-hidden bg-slate-50/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف الجديد:</label>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="مثال: 771234567"
                className="w-full p-3 rounded-2xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-xs font-bold font-mono outline-hidden bg-slate-50/50"
                dir="ltr"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور الجديدة (اختياري):</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="اتركها فارغة إذا لم تكن تريد تغيير كلمة السر"
                className="w-full p-3 rounded-2xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-xs font-bold outline-hidden bg-slate-50/50"
              />
            </div>

            <button
              type="submit"
              disabled={saveLoading}
              className="w-full py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md shadow-red-200 transition-all flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50"
            >
              {saveLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>حفظ التعديلات في الحساب</span>
                </>
              )}
            </button>

            {saveResult && (
              <div className={`p-3 rounded-2xl text-xs font-bold ${
                saveResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {saveResult.msg}
              </div>
            )}
          </form>
        )}

        {/* Admin Switcher inside Settings if Admin */}
        {userProfile?.role === 'admin' && (
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {activeRole === 'admin' && (
              <button
                onClick={onGoToAdmin}
                className="w-full py-3 px-4 rounded-2xl bg-slate-900 text-white font-black text-xs shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 hover:bg-slate-800"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>فتح لوحة تحكم المسؤول (إكسل وإعدادات)</span>
              </button>
            )}

            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-black text-xs transition-all flex items-center justify-center gap-2 hover:bg-amber-100"
            >
              <Settings2 className="w-4 h-4 text-amber-600" />
              <span>تغيير وضع الحساب (مستخدم / مسؤول)</span>
            </button>
          </div>
        )}
      </div>

      {/* My Donor Record Status (Multiple Donors Support) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-extrabold text-slate-900">
              سجلات التبرع بالدم الخاصة بي
            </h3>
          </div>
          {myDonors.length > 0 && (
            <button
              onClick={() => onNavigateToRegister()}
              className="text-xs text-red-600 hover:underline font-bold flex items-center gap-1"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>إضافة متبرع آخر</span>
            </button>
          )}
        </div>

        {myDonors.length > 0 ? (
          <div className="space-y-4">
            {myDonors.map((donor) => (
              <div key={donor.id} className="space-y-2 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        {donor.fullName}
                      </span>
                      <span className="text-xs font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-md">
                        فصيلة {donor.bloodType}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500" />
                      <span>{donor.residence}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleToggleAvailability(donor)}
                      disabled={toggleLoading}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all ${
                        donor.isAvailable
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {donor.isAvailable ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>متاح</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>غير متاح</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => onNavigateToRegister(donor.id)}
                      className="px-3 py-1.5 rounded-xl text-[10px] font-extrabold bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-100 transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>تعديل</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>رقم التواصل: <strong className="text-slate-800 font-mono" dir="ltr">{donor.phone}</strong></span>
                  <button
                    onClick={() => handleDeleteDonor(donor.id)}
                    className="text-slate-400 hover:text-red-600 text-[10px] flex items-center gap-0.5 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            ))}
            
            {myDonors.length >= 1 && (
              <div className="pt-2">
                <button
                  onClick={() => onNavigateToRegister()}
                  className="w-full py-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-black border border-red-100 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>هل تريد إضافة متبرع آخر من هذا الحساب؟ (اضغط هنا)</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100 text-center space-y-2">
            <p className="text-xs text-slate-600 font-medium">
              لم تسجل نفسك كمتبرع بالدم حتى الآن. كن سبباً في إحياء نفس وامنح فرصة للأمل!
            </p>
            <button
              onClick={() => onNavigateToRegister()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-extrabold shadow-xs hover:bg-red-700"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>التسجيل كمتبرع الآن</span>
            </button>
          </div>
        )}
      </div>

      {/* 6. My Urgent Requests */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <h3 className="text-sm font-extrabold text-slate-900">
            طلبات الدم التي نشرتها ({myRequests.length})
          </h3>
        </div>

        {myRequests.length > 0 ? (
          <div className="space-y-2.5">
            {myRequests.map((req) => (
              <div
                key={req.id}
                className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span>{req.patientName}</span>
                    <span className="text-red-700 bg-red-100 px-1.5 py-0.5 rounded font-black">
                      {req.bloodType}
                    </span>
                  </div>
                  <div className="text-slate-500">{req.hospital}</div>
                </div>

                <button
                  onClick={() =>
                    updateRequestStatus(
                      req.id,
                      req.status === 'fulfilled' ? 'open' : 'fulfilled'
                    )
                  }
                  className={`px-3 py-1.5 rounded-xl font-bold border transition-colors shrink-0 ${
                    req.status === 'fulfilled'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                  }`}
                >
                  {req.status === 'fulfilled' ? 'تم توفير الدم ✓' : 'إغلاق (تم توفير الدم)'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-2">
            لم تنشر أي طلبات دم عاجلة من هذا الحساب.
          </p>
        )}
      </div>

      {/* 7. Contact & Support Section (التواصل والدعم الفني) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Mail className="w-5 h-5 text-red-600" />
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              التواصل والدعم الفني
            </h3>
            <p className="text-[11px] text-slate-500 font-bold">
              للاستفسارات والملاحظات وتحديث البيانات
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-bold block">البريد الإلكتروني للتواصل:</span>
              <a 
                href="mailto:zalsyyadi@gmail.com"
                className="text-xs sm:text-sm font-black text-red-600 hover:underline font-mono" 
                dir="ltr"
              >
                zalsyyadi@gmail.com
              </a>
            </div>
          </div>

          <a
            href="mailto:zalsyyadi@gmail.com"
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>مراسلة</span>
          </a>
        </div>
      </div>

      {/* Exit App Button */}
      <div className="pt-4 pb-8">
        <button
          onClick={onOpenExitConfirm}
          className="w-full py-3.5 px-4 rounded-2xl bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-98 shadow-xs"
        >
          <XCircle className="w-5 h-5 text-red-600" />
          <span>إغلاق التطبيق والخروج</span>
        </button>
        <p className="text-[10px] text-slate-400 text-center mt-2 font-bold">
          قطرة دم تنقذ حياة • قعطبة • إصدار 1.2.0
        </p>
      </div>

      <RoleSelectionModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentRole={activeRole}
        onRoleChange={(role) => {
          switchActiveRole(role);
          setIsRoleModalOpen(false);
        }}
      />

    </div>
  );
};
