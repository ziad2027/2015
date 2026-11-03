import React, { useState } from 'react';
import { Shield, User, X, Lock, KeyRound, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: 'user' | 'admin';
  onRoleChange: (role: 'user' | 'admin') => void;
  onOpenAdminAuth?: () => void;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onRoleChange,
}) => {
  const { userProfile, currentUser } = useAuth();

  const [showPinForm, setShowPinForm] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  if (!isOpen) return null;

  const ADMIN_PIN = '635215';

  const handleResetModal = () => {
    setShowPinForm(false);
    setPinInput('');
    setPinError(null);
  };

  const handleSelectUserRole = () => {
    onRoleChange('user');
    handleResetModal();
    onClose();
  };

  const handleVerifyPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPinError(null);

    const cleanPin = pinInput.trim();
    if (!cleanPin) {
      setPinError('يرجى إدخال رمز PIN السرّي');
      return;
    }

    if (
      cleanPin === ADMIN_PIN || 
      userProfile?.role === 'admin' || 
      currentUser?.email === 'ziadalsyyadi@gmail.com'
    ) {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
      onRoleChange('admin');
      handleResetModal();
      onClose();
    } else {
      setPinError('رمز PIN السرّي غير صحيح، يرجى كتابته بدقة');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => {
        handleResetModal();
        onClose();
      }}
    >
      <div 
        className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 p-5 space-y-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <Shield className="w-6 h-6 fill-red-50" />
            </div>
            <div className="text-right">
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                أدوار وصلاحيات التطبيق
              </h2>
              <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                تحديد وضع الحساب والصلاحيات
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              handleResetModal();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!showPinForm ? (
          /* Role Selection Cards */
          <div className="space-y-3">
            {/* Standard User Option */}
            <button
              onClick={handleSelectUserRole}
              className={`w-full text-right p-4 rounded-2xl border-2 transition-all flex items-center gap-3.5 group ${
                currentRole === 'user'
                  ? 'border-red-600 bg-red-50/50'
                  : 'border-slate-100 bg-white hover:border-slate-200'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                currentRole === 'user' ? 'bg-red-600 text-white shadow-md shadow-red-200' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
              }`}>
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`text-xs sm:text-sm font-black transition-colors ${
                    currentRole === 'user' ? 'text-red-700' : 'text-slate-900'
                  }`}>
                    دور: «مستخدم»
                  </h3>
                  {currentRole === 'user' && (
                    <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">نشط الآن</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-bold mt-1 leading-relaxed">
                  وضع القراءة والبحث فقط، تسجيل متبرع، ونشر طلبات الدم العاجلة
                </p>
              </div>
            </button>

            {/* Admin PIN Activation Button / Option */}
            <button
              onClick={() => {
                if (currentRole === 'admin') {
                  onRoleChange('admin');
                  onClose();
                } else {
                  setShowPinForm(true);
                }
              }}
              className={`w-full text-right p-4 rounded-2xl border-2 transition-all flex items-center gap-3.5 group ${
                currentRole === 'admin'
                  ? 'border-amber-500 bg-amber-50/50'
                  : 'border-amber-200 bg-amber-50/20 hover:border-amber-400'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                currentRole === 'admin' ? 'bg-amber-500 text-white shadow-md shadow-amber-200' : 'bg-amber-100 text-amber-800 group-hover:bg-amber-200'
              }`}>
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`text-xs sm:text-sm font-black transition-colors ${
                    currentRole === 'admin' ? 'text-amber-900' : 'text-slate-900'
                  }`}>
                    تفعيل دور المسؤول (PIN)
                  </h3>
                  {currentRole === 'admin' ? (
                    <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">مفعل</span>
                  ) : (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      إدخال الرمز
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-bold mt-1 leading-relaxed">
                  لوحة الإدارة الكاملة، استيراد وتصدير ملفات Excel، وإدارة الصلاحيات
                </p>
              </div>
            </button>
          </div>
        ) : (
          /* PIN Input Form */
          <form onSubmit={handleVerifyPin} className="space-y-4 pt-1 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>إدخال رمز PIN السرّي للمسؤول</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPinForm(false)}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>رجوع</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-bold">
              يرجى إدخال رمز PIN السرّي المخصص لإدارة التطبيق لتأكيد الهوية وتفعيل صلاحيات الإدارة فوراً:
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                رمز PIN السرّي:
              </label>
              <input
                type="password"
                maxLength={10}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="أدخل رمز PIN"
                className="w-full text-center tracking-widest py-3 text-lg font-mono font-bold rounded-2xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-hidden bg-slate-50"
                autoFocus
                required
              />
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-200 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تأكيد الرمز وتفعيل دور المسؤول</span>
              </button>

              <button
                type="button"
                onClick={handleSelectUserRole}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                البقاء في وضع «مستخدم عادي» (قراءة وبحث)
              </button>
            </div>
          </form>
        )}

        {/* Footer info */}
        <div className="p-3 pt-2 text-center bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] text-slate-500 font-bold">
            وضع المسؤول محمي برمز PIN سري مخصص لإدارة المبادرة وتنسيق حالات التبرع
          </p>
        </div>
      </div>
    </div>
  );
};
