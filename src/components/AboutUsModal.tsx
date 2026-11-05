import React from 'react';
import { X, Heart, Droplet, Target, Eye, Compass, ShieldCheck } from 'lucide-react';

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutUsModal: React.FC<AboutUsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-['Cairo',sans-serif] text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-5 bg-linear-to-r from-red-600 to-rose-700 text-white flex items-center justify-between shrink-0 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-inner">
              <Droplet className="w-6 h-6 fill-white" />
            </div>
            <div>
              <h2 className="text-base font-black">من نحن</h2>
              <p className="text-[11px] text-red-100 font-bold">مبادرة «قطرة دم تنقذ حياة إنسان»</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-sm leading-relaxed">
          
          {/* Main Title & Subtitle */}
          <div className="text-center space-y-2 border-b border-slate-100 pb-4">
            <span className="inline-block px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-black">
              مبادرة إنسانية خيرية
            </span>
            <h1 className="text-xl font-black text-slate-900">
              قطرة دم تنقذ حياة إنسان
            </h1>
            <h3 className="text-xs font-extrabold text-slate-600">
              مبادرة إنسانية لخدمة أبناء مديرية قعطبة – محافظة الضالع
            </h3>
          </div>

          {/* Description */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
            <p className="text-xs sm:text-sm font-medium text-slate-700 leading-loose">
              تطبيق <strong>«قطرة دم تنقذ حياة إنسان»</strong> هو مبادرة إنسانية وخيرية تهدف إلى تسهيل عملية التبرع بالدم، وربط المحتاجين إلى الدم بالمتبرعين في مديرية قعطبة والمناطق المجاورة، من خلال منصة إلكترونية تساعد على الوصول إلى المتبرع المناسب في الوقت المناسب.
            </p>
            <p className="text-xs sm:text-sm font-medium text-slate-700 leading-loose">
              نسعى من خلال هذا التطبيق إلى بناء مجتمع متعاون ومتكاتف، تكون فيه قطرة الدم أملاً لمريض، وسبباً في إنقاذ حياة إنسان.
            </p>
          </div>

          {/* Goals */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-red-600 border-b border-slate-100 pb-2">
              <Target className="w-5 h-5" />
              <h3 className="font-extrabold text-sm text-slate-900">أهداف التطبيق</h3>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></span>
                <span>إنشاء قاعدة بيانات منظمة للمتبرعين بالدم حسب فصائل الدم.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></span>
                <span>تسهيل البحث عن المتبرعين حسب فصيلة الدم ومكان السكن.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></span>
                <span>استقبال ونشر طلبات التبرع بالدم العاجلة.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></span>
                <span>تسهيل التواصل بين المحتاجين والمتبرعين.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></span>
                <span>نشر ثقافة التبرع بالدم والعمل التطوعي.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></span>
                <span>تعزيز روح التكافل والتعاون بين أبناء المجتمع.</span>
              </li>
            </ul>
          </div>

          {/* Our Message */}
          <div className="space-y-2 bg-rose-50/60 p-4 rounded-2xl border border-rose-100">
            <div className="flex items-center gap-2 text-rose-700">
              <Compass className="w-5 h-5" />
              <h3 className="font-extrabold text-sm text-slate-900">رسالتنا</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              أن نجعل الوصول إلى متبرع بالدم أسرع وأسهل، وأن نساهم في إنقاذ الأرواح من خلال العمل الإنساني والتعاون المجتمعي.
            </p>
          </div>

          {/* Our Vision */}
          <div className="space-y-2 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-700">
              <Eye className="w-5 h-5" />
              <h3 className="font-extrabold text-sm text-slate-900">رؤيتنا</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              أن تصبح مديرية قعطبة نموذجاً في التكافل الإنساني والتعاون في مجال التبرع بالدم، وأن تمتد هذه المبادرة لخدمة بقية المديريات والمحافظات اليمنية.
            </p>
          </div>

          {/* Slogan */}
          <div className="p-4 rounded-2xl bg-linear-to-r from-red-600 to-rose-600 text-white text-center space-y-1 shadow-md">
            <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-red-100">
              <Heart className="w-4 h-4 fill-white text-white" />
              <span>شعارنا</span>
            </div>
            <p className="text-base font-black">
              قطرة منك قد تعيد الحياة لإنسان.
            </p>
          </div>

          {/* Note */}
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="leading-snug">
              هذا التطبيق مبادرة خيرية مجتمعية، غايتها خدمة الإنسان دون مقابل، والتبرع بالدم فيه عمل تطوعي وإنساني.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-colors shadow-xs"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
