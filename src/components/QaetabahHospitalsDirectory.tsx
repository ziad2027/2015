import React, { useState, useEffect } from 'react';
import { 
  X, 
  Hospital as HospitalIcon, 
  Phone, 
  MapPin, 
  Search, 
  ShieldCheck, 
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeToHospitals, saveHospital, deleteHospital, seedHospitals } from '../services/hospitalService';
import { Hospital } from '../types';

interface QaetabahHospitalsDirectoryProps {
  isOpen: boolean;
  onClose: () => void;
  isEmbedded?: boolean;
}

export const QaetabahHospitalsDirectory: React.FC<QaetabahHospitalsDirectoryProps> = ({
  isOpen,
  onClose,
  isEmbedded = false
}) => {
  const { currentUser, userProfile, activeRole } = useAuth();
  const isAdmin = activeRole === 'admin' || userProfile?.role === 'admin' || currentUser?.email === 'ziadalsyyadi@gmail.com';

  const [searchQuery, setSearchQuery] = useState('');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  // In-page Admin Hospital Management States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [hospitalForm, setHospitalForm] = useState<Omit<Hospital, 'id'>>({
    name: '',
    type: '',
    address: '',
    phone: '',
    services: ''
  });
  const [hospitalLoading, setHospitalLoading] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    setLoading(true);
    const unsub = subscribeToHospitals((data) => {
      setHospitals(data);
      setLoading(false);
    });

    return () => unsub();
  }, [isOpen]);

  const handleSaveHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalForm.name.trim() || !hospitalForm.phone.trim()) {
      setAdminFeedback('يرجى ملء اسم المستشفى ورقم الهاتف');
      return;
    }

    setHospitalLoading(true);
    setAdminFeedback(null);
    try {
      await saveHospital({
        name: hospitalForm.name.trim(),
        type: hospitalForm.type.trim() || 'مستشفى عام',
        address: hospitalForm.address.trim() || 'قعطبة',
        phone: hospitalForm.phone.trim(),
        services: hospitalForm.services.trim() || 'طوارئ وبنك دم'
      }, editingHospital?.id);

      setAdminFeedback('تم حفظ بيانات المستشفى بنجاح! ✓');
      setIsFormOpen(false);
      setEditingHospital(null);
      setHospitalForm({ name: '', type: '', address: '', phone: '', services: '' });
      setTimeout(() => setAdminFeedback(null), 4000);
    } catch (err: any) {
      setAdminFeedback(`خطأ في الحفظ: ${err.message}`);
    } finally {
      setHospitalLoading(false);
    }
  };

  const handleDeleteHospital = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف (${name})؟`)) return;
    try {
      await deleteHospital(id);
      setAdminFeedback('تم حذف المستشفى بنجاح');
      setTimeout(() => setAdminFeedback(null), 3000);
    } catch (err: any) {
      setAdminFeedback(`خطأ في الحذف: ${err.message}`);
    }
  };

  const handleSeed = async () => {
    if (!window.confirm('هل تريد استعادة قائمة مستشفيات قعطبة المعتمدة الافتراضية؟')) return;
    try {
      await seedHospitals();
      setAdminFeedback('تم استعادة المستشفيات الافتراضية بنجاح!');
      setTimeout(() => setAdminFeedback(null), 3000);
    } catch (err: any) {
      setAdminFeedback(`خطأ: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  const filteredHospitals = hospitals.filter(h =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.services.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const directoryContent = (
    <div 
      className={`bg-white rounded-3xl w-full shadow-lg overflow-hidden border border-slate-200/90 flex flex-col font-['Cairo',sans-serif] ${isEmbedded ? 'max-w-4xl mx-auto' : 'max-w-lg max-h-[85vh]'}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="bg-linear-to-r from-red-600 to-rose-700 px-5 py-4 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
            <HospitalIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white leading-tight">
              دليل المستشفيات والنقاط الطبية
            </h3>
            <p className="text-xs text-red-100 font-medium">
              مديرية قعطبة • مستشفيات وبنوك الدم المعتمدة
            </p>
          </div>
        </div>

        {!isEmbedded && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

        {/* Admin Bar */}
        {isAdmin && (
          <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-amber-900 font-extrabold">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>أدوات المستشفيات (وضع المسؤول)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setEditingHospital(null);
                  setHospitalForm({ name: '', type: 'مستشفى عام', address: 'قعطبة', phone: '', services: 'طوارئ وبنك دم' });
                  setIsFormOpen(true);
                }}
                className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة مستشفى</span>
              </button>
              <button
                type="button"
                onClick={handleSeed}
                className="px-2 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold"
                title="استعادة المستشفيات الافتراضية"
              >
                استعادة
              </button>
            </div>
          </div>
        )}

        {adminFeedback && (
          <div className="px-4 py-2 bg-emerald-50 text-emerald-800 text-xs font-bold border-b border-emerald-200 text-center">
            {adminFeedback}
          </div>
        )}

        {/* Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المستشفى، العنوان، أو الخدمات..."
              className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-hidden focus:ring-2 focus:ring-red-500 shadow-2xs"
            />
          </div>
        </div>

        {/* List of Hospitals */}
        <div className="p-4 overflow-y-auto space-y-3 grow">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
              <p className="text-xs font-bold text-slate-400 text-center">جارٍ جلب بيانات المستشفيات...</p>
            </div>
          ) : filteredHospitals.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <HospitalIcon className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">لا توجد نتائج مطابقة لبحثك</p>
            </div>
          ) : (
            filteredHospitals.map((h) => (
              <div 
                key={h.id}
                className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all space-y-2.5 text-right"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{h.name}</h4>
                    <span className="inline-block mt-0.5 text-[10px] bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded-full border border-red-100">
                      {h.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`tel:${h.phone.replace(/\s+/g, '')}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs hover:bg-emerald-700 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>اتصال</span>
                    </a>

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingHospital(h);
                            setHospitalForm({
                              name: h.name,
                              type: h.type,
                              address: h.address,
                              phone: h.phone,
                              services: h.services
                            });
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors"
                          title="تعديل المستشفى"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHospital(h.id, h.name)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                          title="حذف المستشفى"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-slate-100 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>{h.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-slate-700 font-bold">{h.services}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add/Edit Hospital Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingHospital ? 'تعديل بيانات المستشفى' : 'إضافة مستشفى جديد'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveHospital} className="space-y-3 text-right">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">اسم المستشفى / المركز:</label>
                  <input
                    type="text"
                    required
                    value={hospitalForm.name}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                    placeholder="مثال: مستشفى السلام التخصصي"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">التصنيف:</label>
                  <input
                    type="text"
                    value={hospitalForm.type}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, type: e.target.value })}
                    placeholder="مثال: مستشفى عام / مركز طوارئ"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">العنوان / المنطقة:</label>
                  <input
                    type="text"
                    value={hospitalForm.address}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                    placeholder="مثال: الشارع العام - قعطبة"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">رقم الهاتف / الطوارئ:</label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={hospitalForm.phone}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, phone: e.target.value })}
                    placeholder="02-XXXXXX أو 77XXXXXXX"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">الخدمات المتوفرة:</label>
                  <input
                    type="text"
                    value={hospitalForm.services}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, services: e.target.value })}
                    placeholder="مثال: طوارئ 24 ساعة، فحص توافق، بنك دم"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={hospitalLoading}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50"
                  >
                    {hospitalLoading ? 'جارٍ الحفظ...' : 'حفظ المستشفى'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500 font-bold">
          🏥 يتم تحديث الدليل الطبي لمديرية قعطبة دورياً لخدمة المرضى والمتبرعين
        </div>
      </div>
  );

  if (isEmbedded) {
    return directoryContent;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      {directoryContent}
    </div>
  );
};
