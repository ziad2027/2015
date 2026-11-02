import React from 'react';
import { X, Bell, ShieldAlert, Phone, AlertCircle, CheckCircle2, Megaphone, ArrowLeft, Hospital } from 'lucide-react';
import { UrgentRequest } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  urgentRequests: UrgentRequest[];
  announcement?: string;
  onGoToUrgent: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  urgentRequests,
  announcement,
  onGoToUrgent,
}) => {
  if (!isOpen) return null;

  const openRequests = urgentRequests.filter((r) => r.status === 'open');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh] font-['Cairo',sans-serif]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-linear-to-r from-red-600 to-rose-600 px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
              <Bell className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white leading-tight">
                الإشعارات والتنبيهات الواردة
              </h3>
              <p className="text-xs text-red-100 font-medium">
                {openRequests.length > 0 
                  ? `يوجد ${openRequests.length} طلب دم عاجل بحاجة لمتبرعين` 
                  : 'لا توجد طلبات دم عاجلة حالياً'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 grow">
          
          {/* Global Administrative Announcement */}
          {announcement && (
            <div className="bg-amber-50 border border-amber-200/70 rounded-2xl p-3.5 flex items-start gap-3 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <Megaphone className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-amber-900">تنويه هام من إدارة التطبيق</h4>
                <p className="text-xs text-amber-800 leading-relaxed font-semibold">{announcement}</p>
              </div>
            </div>
          )}

          {/* Urgent Requests Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <h4 className="text-xs font-black text-slate-800">الطلبات العاجلة الواردة حديثاً</h4>
              </div>
              <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                {openRequests.length} نشطة
              </span>
            </div>

            {openRequests.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-4 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700">لا توجد حالات تبرع طارئة غير ملباة حالياً</p>
                <p className="text-[11px] text-slate-500">نشكر جميع المتبرعين الكرام في قعطبة ومريس والضالع على استجابتهم المستمرة</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {openRequests.map((req) => (
                  <div 
                    key={req.id} 
                    className="p-3.5 bg-rose-50/60 border border-rose-100 rounded-2xl space-y-2 hover:bg-rose-50 transition-colors shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900">{req.patientName}</span>
                          <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full shadow-xs">
                            {req.bloodType}
                          </span>
                          {req.urgencyLevel === 'critical' && (
                            <span className="text-[9px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                              حرجة جداً
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 text-[11px] font-medium">
                          <Hospital className="w-3.5 h-3.5 text-rose-500" />
                          <span>{req.hospital}</span>
                        </div>
                      </div>

                      <div className="text-left shrink-0">
                        <span className="text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-lg inline-block">
                          {req.unitsNeeded} أكياس
                        </span>
                      </div>
                    </div>

                    {req.notes && (
                      <p className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-xl border border-rose-100/60 font-medium leading-snug">
                        {req.notes}
                      </p>
                    )}

                    <div className="pt-1 flex items-center justify-between border-t border-rose-100/80">
                      <div className="text-[10px] text-slate-500 font-bold">
                        التواصل: <span className="text-slate-800">{req.contactName}</span>
                      </div>
                      <a
                        href={`tel:${req.contactPhone}`}
                        className="inline-flex items-center gap-1 bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-extrabold px-3 py-1 rounded-xl shadow-xs transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        <span>اتصال {req.contactPhone}</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={() => {
              onClose();
              onGoToUrgent();
            }}
            className="flex items-center gap-1.5 text-xs font-black text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <span>عرض كل الحالات في التبويب الرئيسي</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
