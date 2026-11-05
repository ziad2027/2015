import React from 'react';
import { LogOut, X, AlertTriangle, Phone } from 'lucide-react';

interface ConfirmExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmExitModal: React.FC<ConfirmExitModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-['Cairo',sans-serif]">
      <div className="bg-white rounded-3xl max-w-xs w-full p-6 shadow-2xl space-y-5 text-center relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner border border-rose-100">
          <LogOut className="w-8 h-8 rotate-180" />
        </div>
        
        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-slate-900 leading-tight">
            تأكيد تسجيل الخروج
          </h2>
          <p className="text-xs text-slate-500 font-bold leading-relaxed">
            هل تريد حقاً تسجيل الخروج من حسابك؟
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-1">
          {/* Yes - Confirm Logout */}
          <button
            onClick={onConfirm}
            className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 rotate-180" />
            <span>نعم، تسجيل الخروج</span>
          </button>

          {/* No - Stay */}
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition-all active:scale-95 cursor-pointer"
          >
            لا، إلغاء والبقاء
          </button>

          {/* Direct WhatsApp Contact helper */}
          <div className="pt-2 border-t border-slate-100">
            <a
              href="https://wa.me/967773633918"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center justify-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>تواصل مع الإدارة واتساب: 773633918</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
