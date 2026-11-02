import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  X, 
  Share2, 
  Info,
  ShieldCheck,
  Globe
} from 'lucide-react';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const appUrl = window.location.href;

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'قطرة دم تنقذ حياة - سجل المتبرعين بالدم في مديرية قعطبة',
          text: 'رابط تطبيق قطرة دم تنقذ حياة، سجل المتبرعين بالدم بمديرية قعطبة للبحث والتبرع وإنقاذ الحالات الحرجة:',
          url: appUrl,
        });
      } catch (e) {}
    } else {
      handleCopyUrl();
    }
  };

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
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              دليل تشغيل وتثبيت التطبيق على أندرويد
            </h2>
            <p className="text-xs text-slate-500">
              خطوات سهلة ومباشرة من هاتفك الأندرويد بدون الحاجة لكمبيوتر
            </p>
          </div>
        </div>

        {/* Current URL Copy Box */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
          <div className="truncate text-xs text-slate-600 font-mono" dir="ltr">
            {appUrl}
          </div>
          <button
            onClick={handleCopyUrl}
            className="shrink-0 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1 shadow-2xs"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
          </button>
        </div>

        {/* Method 1: Instant PWA Install on Android */}
        <div className="p-4 rounded-2xl bg-linear-to-br from-red-50 to-rose-50 border border-red-200 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-black flex items-center justify-center shrink-0">
              1
            </span>
            <h3 className="text-sm font-extrabold text-red-950">
              الطريقة الأسرع والمثالية: التثبيت الفوري عبر متصفح كروم (PWA)
            </h3>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            التطبيق مجهز كـ <span className="font-bold">Progressive Web App</span> مع أيقونة رسمية ويعمل كأي تطبيق أندرويد مثبت:
          </p>
          <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside pr-1 font-medium">
            <li>افتح الرابط في متصفح <span className="font-bold">Google Chrome</span> على هاتفك.</li>
            <li>اضغط على زر الخيارات (الثلاث نقاط <span className="font-bold font-mono">⋮</span> أعلى يسار أو يمين الشاشة).</li>
            <li>اختر <span className="font-bold text-red-700">«تثبيت التطبيق»</span> أو <span className="font-bold text-red-700">«إضافة إلى الشاشة الرئيسية»</span>.</li>
            <li>ستظهر أيقونة «قطرة دم» على شاشة هاتفك الرئيسية وتفتح كشاشة كاملة دون شريط متصفح وبسرعة فائقة!</li>
          </ol>
        </div>

        {/* Method 2: Generating an APK file directly from Android */}
        <div className="p-4 rounded-2xl bg-linear-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0">
              2
            </span>
            <h3 className="text-sm font-extrabold text-emerald-950">
              تحويل التطبيق إلى ملف APK للتثبيت والإرسال عبر واتساب
            </h3>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            إذا كنت تريد استخراج ملف بصيغة <span className="font-bold font-mono">.apk</span> لمشاركته يدوياً مع أهالي قعطبة:
          </p>
          <div className="space-y-2 text-xs text-slate-700">
            <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
              <span className="font-bold text-slate-900 block mb-0.5">
                الخيار المجاني السريع (من متصفح الهاتف):
              </span>
              <span>ادخل إلى موقع </span>
              <a 
                href="https://www.pwabuilder.com" 
                target="_blank" 
                rel="noreferrer"
                className="font-bold text-emerald-700 underline inline-flex items-center gap-0.5"
              >
                PWABuilder.com <ExternalLink className="w-3 h-3 inline" />
              </a>
              <span> أو </span>
              <a 
                href="https://www.webintoapp.com" 
                target="_blank" 
                rel="noreferrer"
                className="font-bold text-emerald-700 underline inline-flex items-center gap-0.5"
              >
                WebIntoApp.com <ExternalLink className="w-3 h-3 inline" />
              </a>
              <span> والصق رابط هذا التطبيق، واضغط Generate APK وسيتم تحميل ملف التثبيت مباشرة إلى هاتفك.</span>
            </div>
          </div>
        </div>

        {/* Firebase Connected Badge */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-xs text-slate-700">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold text-slate-900">قاعدة البيانات السحابية متصلة:</span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              بيانات المتبرعين والطلبات العاجلة تُحفظ في Google Cloud Firestore وتتزامن فورياً بين كل المستخدمين.
            </p>
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShareApp}
          className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md"
        >
          <Share2 className="w-4 h-4" />
          <span>مشاركة رابط التطبيق عبر واتساب قعطبة</span>
        </button>

      </div>
    </div>
  );
};
