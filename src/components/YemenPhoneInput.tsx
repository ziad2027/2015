import React from 'react';
import { Phone } from 'lucide-react';
import { sanitizePhone } from '../services/phoneVerificationService';

interface YemenPhoneInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const YemenPhoneInput: React.FC<YemenPhoneInputProps> = ({
  value,
  onChange,
  placeholder = '771 234 567',
  required = true,
  disabled = false,
  autoFocus = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const clean = sanitizePhone(raw);
    onChange(clean);
  };

  // Determine operator badge
  const getOperator = (val: string): { name: string; color: string } | null => {
    if (val.startsWith('77') || val.startsWith('78')) {
      return { name: 'يمن موبايل', color: 'bg-red-50 text-red-700 border-red-200' };
    }
    if (val.startsWith('73')) {
      return { name: 'يو (YOU)', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (val.startsWith('71')) {
      return { name: 'سبأفون', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (val.startsWith('70')) {
      return { name: 'واي (Y)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    return null;
  };

  const operator = getOperator(value);

  return (
    <div className="space-y-1">
      <div className="relative flex items-center rounded-xl border border-slate-300 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 bg-white overflow-hidden transition-all">
        
        {/* Fixed Yemen Country Code Badge */}
        <div 
          className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 border-l border-slate-200 text-slate-800 font-mono font-bold text-xs sm:text-sm select-none shrink-0"
          dir="ltr"
          title="مفتاح الجمهورية اليمنية +967 مضاف تلقائياً"
        >
          <span className="text-base leading-none">🇾🇪</span>
          <span>+967</span>
        </div>

        {/* Local Phone Number Input */}
        <input
          type="tel"
          maxLength={9}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          dir="ltr"
          disabled={disabled}
          autoFocus={autoFocus}
          className="w-full px-3 py-2.5 text-xs sm:text-sm font-mono font-bold text-slate-900 placeholder:text-slate-400 outline-hidden bg-transparent text-right"
          required={required}
        />

        <div className="pl-3 text-slate-400 pointer-events-none">
          <Phone className="w-4 h-4" />
        </div>
      </div>

      {/* Operator and validation hint */}
      <div className="flex items-center justify-between text-[11px] px-1">
        <span className="text-slate-400">
          أدخل الأرقام الـ 9 فقط (مثال: 771234567)
        </span>
        {operator && (
          <span className={`px-2 py-0.2 rounded-md border font-bold text-[10px] ${operator.color}`}>
            {operator.name}
          </span>
        )}
      </div>
    </div>
  );
};
