import React, { useState, useRef } from 'react';
import { 
  LogIn, 
  UserPlus, 
  KeyRound, 
  Lock, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Droplet,
  Compass,
  ArrowRight,
  ShieldCheck,
  Check,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { YemenPhoneInput } from './YemenPhoneInput';
import { ScrambledCaptcha, ScrambledCaptchaRef } from './ScrambledCaptcha';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { 
    loginWithPhone, 
    registerWithPhone, 
    resetPasswordDirect, 
    loginWithGoogle,
    continueAsGuest 
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  const [fullName, setFullName] = useState('');
  const captchaRef = useRef<ScrambledCaptchaRef | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showProviderSetupHelp, setShowProviderSetupHelp] = useState(false);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowProviderSetupHelp(false);
    setCaptchaInput('');
    setFullName('');
    if (captchaRef.current) {
      captchaRef.current.refresh();
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowProviderSetupHelp(false);
    setLoading(true);
    try {
      await loginWithGoogle();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      setSuccessMsg('تم تسجيل الدخول بنجاح!');
      setTimeout(() => {
        onClose();
        handleResetForm();
      }, 1000);
    } catch (err: any) {
      console.error('Google sign in error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg('حدث خطأ أثناء تسجيل الدخول عبر Google. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 1. Direct Login (Phone + Password only)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!phone || phone.length < 7) {
      setErrorMsg('يرجى إدخال رقم الهاتف المكون من 9 أرقام');
      return;
    }
    if (!password) {
      setErrorMsg('يرجى إدخال كلمة المرور');
      return;
    }

    setLoading(true);
    try {
      await loginWithPhone(phone, password);
      onClose();
      handleResetForm();
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        setShowProviderSetupHelp(true);
        setErrorMsg('خدمة تسجيل الدخول بكلمة المرور (Email/Password) غير مفعلة في مشروع Firebase حتى الآن.');
      } else if (
        err.code === 'auth/wrong-password' || 
        err.code === 'auth/user-not-found' || 
        err.code === 'auth/invalid-credential'
      ) {
        setErrorMsg('رقم الهاتف أو كلمة المرور غير صحيحة');
      } else {
        setErrorMsg(err.message || 'حدث خطأ أثناء تسجيل الدخول. يرجى التأكد من البيانات والمحاولة مجدداً.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Direct Register (Phone + Password only, no OTP code, instant login)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!phone || phone.length < 7) {
      setErrorMsg('يرجى إدخال رقم الهاتف اليمني المكون من 9 أرقام');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('كلمة المرور يجب أن لا تقل عن 6 خانات');
      return;
    }

    if (!fullName || fullName.trim().length < 3) {
      setErrorMsg('يرجى إدخال اسمك الكامل بشكل صحيح (3 أحرف على الأقل)');
      return;
    }

    setLoading(true);
    try {
      await registerWithPhone(phone, password, fullName);
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
      setSuccessMsg('تم إنشاء حسابك وحفظه بنجاح والدخول تلقائياً!');
      setTimeout(() => {
        onClose();
        handleResetForm();
      }, 1200);
    } catch (err: any) {
      console.error('Register error:', err);
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        setShowProviderSetupHelp(true);
        setErrorMsg('خدمة إنشاء الحسابات بكلمة المرور (Email/Password) غير مفعلة في مشروعك حتى الآن.');
      } else if (err.code === 'auth/email-already-in-use' || err.message?.includes('مسجل بالفعل')) {
        setErrorMsg('هذا الرقم مسجل بالفعل في التطبيق. يمكنك تسجيل الدخول مباشرة أو استعادة كلمة المرور.');
      } else if (err.code === 'auth/weak-password' || err.message?.includes('كلمة المرور ضعيفة')) {
        setErrorMsg('كلمة المرور ضعيفة. يرجى اختيار كلمة مرور لا تقل عن 6 خانات.');
      } else if (err.message?.includes('Missing or insufficient permissions') || err.code === 'permission-denied') {
        setErrorMsg('تم حفظ الحساب. يمكنك الآن تسجيل الدخول مباشرة برقم هاتفك وكلمة المرور.');
      } else {
        setErrorMsg(err.message || 'حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Reset Password via Scrambled Numbers Captcha Test
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!phone || phone.length < 7) {
      setErrorMsg('يرجى إدخال رقم الهاتف المسجل');
      return;
    }

    // Validate Scrambled Numbers Captcha
    if (!captchaRef.current || !captchaRef.current.validate(captchaInput)) {
      setErrorMsg('الأرقام المخربشة غير صحيحة، يرجى كتابتها بدقة كما تظهر في الصورة');
      if (captchaRef.current) captchaRef.current.refresh();
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('كلمة المرور الجديدة يجب أن لا تقل عن 6 خانات');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordDirect(phone, newPassword);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
      setSuccessMsg('تم اجتياز الاختبار بنجاح وإعادة ضبط كلمة السر والدخول تلقائياً!');
      setTimeout(() => {
        onClose();
        handleResetForm();
      }, 1400);
    } catch (err: any) {
      console.error('Reset error:', err);
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        setShowProviderSetupHelp(true);
        setErrorMsg('خدمة كلمة المرور غير مفعلة في مشروع Firebase.');
      } else {
        setErrorMsg(err.message || 'حدث خطأ أثناء إعادة ضبط كلمة السر. تأكد من رقم الهاتف.');
      }
      if (captchaRef.current) captchaRef.current.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    onClose();
    handleResetForm();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative space-y-4">
        
        {/* Close Button */}
        <button
          onClick={() => {
            onClose();
            handleResetForm();
          }}
          className="absolute top-4 left-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Branding */}
        <div className="text-center space-y-1 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-red-500 to-red-700 text-white flex items-center justify-center mx-auto shadow-md shadow-red-200">
            <Droplet className="w-6 h-6 fill-white" />
          </div>
          <h2 className="text-lg font-black text-slate-900">
            قطرة دم تنقذ حياة
          </h2>
          <p className="text-xs text-slate-500">
            سجل المتبرعين بالدم • مديرية قعطبة
          </p>
        </div>

        {/* Mode Switch Tabs (Login / Register) */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                handleResetForm();
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white text-red-700 shadow-xs font-black'
                  : 'hover:text-slate-900'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                handleResetForm();
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-white text-red-700 shadow-xs font-black'
                  : 'hover:text-slate-900'
              }`}
            >
              حساب جديد لأول مرة
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Firebase Email/Password Provider Activation Notice */}
        {showProviderSetupHelp && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-2.5 text-xs shadow-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-amber-950 text-xs sm:text-sm">
                  خطوة تفعيل سريعة في Firebase (لمرة واحدة فقط)
                </p>
                <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                  مشروع Firebase يتطلب تفعيل خيار <strong>Email/Password</strong> لتمكين إنشاء الحسابات بكلمة المرور:
                </p>
              </div>
            </div>

            <div className="bg-white/95 p-2.5 rounded-xl border border-amber-200 space-y-1 text-[11px] text-slate-700">
              <p>1. اضغط على الزر أدناه لفتح صفحة مزودي الدخول في مشروعك.</p>
              <p>2. اضغط على <strong>البريد الإلكتروني/كلمة المرور (Email/Password)</strong>.</p>
              <p>3. قم بتفعيل الخيار الأول (Enable) واضغط <strong>حفظ (Save)</strong>.</p>
            </div>

            <a
              href="https://console.firebase.google.com/project/a-drop-of-blood-saves-a-life/authentication/providers"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-xs shadow-xs transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>فتح صفحة تفعيل Email/Password في Firebase</span>
            </a>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. LOGIN FORM: Phone + Password only */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                رقم الهاتف
              </label>
              <YemenPhoneInput
                value={phone}
                onChange={setPhone}
                placeholder="771 234 567"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-800">
                  كلمة المرور
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    handleResetForm();
                  }}
                  className="text-[11px] text-red-600 hover:underline font-bold"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-xs sm:text-sm outline-hidden font-medium"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* 2. REGISTER FORM: Name + Phone + Password */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                1. الاسم الرباعي
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="أدخل اسمك الرباعي الكامل"
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-xs sm:text-sm outline-hidden font-medium"
                  required
                />
                <UserPlus className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                2. رقم الهاتف
              </label>
              <YemenPhoneInput
                value={phone}
                onChange={setPhone}
                placeholder="771 234 567"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                3. كلمة المرور
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="اختر كلمة مرور (6 خانات على الأقل)"
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-xs sm:text-sm outline-hidden font-medium"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-red-50/60 border border-red-100 text-slate-700 text-[11px] leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>
                سيتم حفظ حسابك تلقائياً وتبقى مسجلاً في التطبيق. ولن تحتاج لتسجيل الدخول مرة أخرى إلا إذا قمت بعمل تسجيل خروج يدوي.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>إنشاء الحساب والدخول تلقائياً</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* 3. FORGOT PASSWORD WITH SCRAMBLED NUMBERS TEST (اختبار أرقام مخربشة) */}
        {mode === 'forgot' && (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-red-600" />
                <span>إعادة ضبط كلمة السر عبر الاختبار الأمني</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  handleResetForm();
                }}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-0.5 font-bold"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>رجوع</span>
              </button>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                رقم الهاتف المسجل
              </label>
              <YemenPhoneInput
                value={phone}
                onChange={setPhone}
                placeholder="771 234 567"
                required
              />
            </div>

            {/* Scrambled Numbers Captcha Box */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
              <label className="block text-xs font-bold text-amber-950">
                اختبار الأمان: أدخل الأرقام المخربشة الظاهرة بالصورة:
              </label>
              
              <ScrambledCaptcha ref={captchaRef} />

              <input
                type="text"
                maxLength={6}
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value.replace(/\D/g, ''))}
                placeholder="اكتب الأرقام الظاهرة أعلاه"
                dir="ltr"
                className="w-full text-center tracking-widest py-2 text-base font-mono font-bold rounded-xl border border-amber-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-hidden bg-white"
                required
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                كلمة السر الجديدة
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="أدخل كلمة السر الجديدة (6 خانات على الأقل)"
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 text-xs sm:text-sm outline-hidden font-medium"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>تأكيد وإعادة ضبط كلمة السر والدخول</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="relative flex items-center justify-center my-2">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-2 text-[11px] text-slate-400 uppercase font-semibold">
            أو
          </span>
        </div>

        {/* Quick Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors active:scale-98"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span>تسجيل الدخول السريع بحساب Google</span>
        </button>

        {/* Continue as Guest Button */}
        <button
          type="button"
          onClick={handleGuest}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-98"
        >
          <Compass className="w-4 h-4 text-slate-600" />
          <span>المتابعة كزائر دون تسجيل حساب</span>
        </button>

      </div>
    </div>
  );
};
