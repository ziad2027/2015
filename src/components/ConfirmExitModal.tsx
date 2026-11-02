import React from 'react';
import { LogOut, X } from 'lucide-react';

interface ConfirmExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmExitModal: React.FC<ConfirmExitModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xs w-full p-6 shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
          <LogOut className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 leading-tight">
            هل تريد حقاً إغلاق التطبيق؟
          </h2>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            ستفقد أي تغييرات غير محفوظة إذا لم تقم بتأكيد الحفظ قبل الخروج.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-lg shadow-red-100 transition-all active:scale-95"
          >
            نعم، أغلق الآن
          </button>
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm transition-all active:scale-95"
          >
            لا، ابقَ هنا
          </button>
        </div>
      </div>
    </div>
  );
};
