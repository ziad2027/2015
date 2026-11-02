import React, { useState } from 'react';
import { X, Droplet, ArrowLeftRight, Check, Heart, ShieldAlert } from 'lucide-react';
import { BloodType, BLOOD_TYPES } from '../types';

interface BloodCompatibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CompatibilityInfo {
  canGiveTo: BloodType[];
  canReceiveFrom: BloodType[];
  special: string;
}

const COMPATIBILITY_DATA: Record<BloodType, CompatibilityInfo> = {
  'O-': {
    canGiveTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['O-'],
    special: 'المعطي العام للجميع: فصيلة نادرة وثمينة جداً تُنقذ أي مريض في الطوارئ الحرجة.',
  },
  'O+': {
    canGiveTo: ['O+', 'A+', 'B+', 'AB+'],
    canReceiveFrom: ['O+', 'O-'],
    special: 'أكثر فصائل الدم شيوعاً وطلباً في المستشفيات وبنوك الدم.',
  },
  'A-': {
    canGiveTo: ['A-', 'A+', 'AB-', 'AB+'],
    canReceiveFrom: ['A-', 'O-'],
    special: 'فصيلة مهمة تُعطي فصائل A و AB بنوعيها الموجب والسالب.',
  },
  'A+': {
    canGiveTo: ['A+', 'AB+'],
    canReceiveFrom: ['A+', 'A-', 'O+', 'O-'],
    special: 'ثاني أكثر فصيلة انتشاراً، تستقبل من 4 فصائل مختلفة.',
  },
  'B-': {
    canGiveTo: ['B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['B-', 'O-'],
    special: 'فصيلة نادرة مطلوبة بكثرة للمرضى ذوي الفصيلة B سالب.',
  },
  'B+': {
    canGiveTo: ['B+', 'AB+'],
    canReceiveFrom: ['B+', 'B-', 'O+', 'O-'],
    special: 'فصيلة شائعة ومهمة لجراحات الطوارئ ومرضى التلاسيميا.',
  },
  'AB-': {
    canGiveTo: ['AB-', 'AB+'],
    canReceiveFrom: ['AB-', 'A-', 'B-', 'O-'],
    special: 'أندر فصيلة دم على الإطلاق (أقل من 1% من البشر).',
  },
  'AB+': {
    canGiveTo: ['AB+'],
    canReceiveFrom: ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
    special: 'المستقبل العام: يستطيع أصحاب هذه الفصيلة استقبال الدم من أي متبرع على الإطلاق.',
  },
};

export const BloodCompatibilityModal: React.FC<BloodCompatibilityModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selected, setSelected] = useState<BloodType>('O+');

  if (!isOpen) return null;

  const info = COMPATIBILITY_DATA[selected];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl relative space-y-4">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <Droplet className="w-6 h-6 fill-red-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              دليل توافق فصائل الدم
            </h2>
            <p className="text-xs text-slate-500">
              اختر فصيلتك لتعرف لمن تستطيع التبرع ومن يستطيع إعطاءك
            </p>
          </div>
        </div>

        {/* Blood Type Selector */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {BLOOD_TYPES.map((bt) => (
            <button
              key={bt}
              onClick={() => setSelected(bt)}
              className={`py-2 rounded-xl text-center font-black text-xs sm:text-sm border transition-all ${
                selected === bt
                  ? 'bg-red-600 text-white border-red-600 shadow-xs scale-105'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {bt}
            </button>
          ))}
        </div>

        {/* Selected Details Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-red-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                {selected}
              </span>
              <span className="font-extrabold text-sm text-slate-900">
                فصيلة {selected}
              </span>
            </div>
            <span className="text-[11px] font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full">
              معلومات التوافق
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {info.special}
          </p>

          {/* Can Donate To */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-800 block">
              تستطيع التبرع بالدم لأصحاب الفصائل:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {info.canGiveTo.map((target) => (
                <span
                  key={target}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-black border border-emerald-300 flex items-center gap-1"
                >
                  <Check className="w-3 h-3 text-emerald-700" />
                  {target}
                </span>
              ))}
            </div>
          </div>

          {/* Can Receive From */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-bold text-slate-800 block">
              تستقبل الدم فقط من أصحاب الفصائل:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {info.canReceiveFrom.map((source) => (
                <span
                  key={source}
                  className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 text-xs font-black border border-blue-300 flex items-center gap-1"
                >
                  <Check className="w-3 h-3 text-blue-700" />
                  {source}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Golden Rules */}
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>قواعد طبية ذهبية:</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-800">
            • <span className="font-bold">O- (سالب):</span> المعطي العام لجميع البشر في الحوادث والحروب.<br />
            • <span className="font-bold">AB+ (موجب):</span> المستقبل العام من جميع فصائل الدم.<br />
            • الفصائل السالبة تقبل التبرع من السالب فقط، بينما الفصائل الموجبة تقبل من الموجب والسالب.
          </p>
        </div>

      </div>
    </div>
  );
};
