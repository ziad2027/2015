import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileSpreadsheet, 
  Settings, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  Database,
  Trash2,
  Lock,
  Search,
  ExternalLink,
  FolderOpen,
  Edit3,
  Phone,
  MapPin,
  Megaphone,
  Bell,
  RefreshCw
} from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { importRawDonors, pushAllDonorsToSheets, GOOGLE_SHEETS_CONFIG } from '../services/googleSheetsService';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { Donor, BloodType, BLOOD_TYPES } from '../types';
import { BloodDonationEducationalInfo } from './BloodDonationEducationalInfo';

interface AdminDashboardProps {
  onBack: () => void;
  donors?: Donor[];
  onEditDonor?: (donorId: string) => void;
  onDeleteDonor?: (donorId: string, phone?: string) => Promise<void>;
  onGlobalRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onBack,
  donors = [],
  onEditDonor,
  onDeleteDonor,
  onGlobalRefresh,
  isRefreshing = false,
}) => {
  const { userProfile, currentUser, activeRole, switchActiveRole, loginWithGoogle } = useAuth();
  const [importText, setImportText] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [announcementType, setAnnouncementType] = useState<'general' | 'urgent' | 'campaign'>('general');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);

  // Donors management states
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminBloodFilter, setAdminBloodFilter] = useState<BloodType | 'ALL'>('ALL');
  const [adminDonorToDelete, setAdminDonorToDelete] = useState<Donor | null>(null);
  const [adminIsDeleting, setAdminIsDeleting] = useState(false);
  const [adminDeleteError, setAdminDeleteError] = useState<string | null>(null);
  const [showDonorsSection, setShowDonorsSection] = useState(true);

  // Filtered donors in admin panel
  const filteredDonors = React.useMemo(() => {
    return donors.filter((d) => {
      if (adminBloodFilter !== 'ALL' && d.bloodType !== adminBloodFilter) return false;
      if (adminSearchQuery.trim()) {
        const q = adminSearchQuery.toLowerCase().trim();
        return (
          d.fullName.toLowerCase().includes(q) ||
          d.residence.toLowerCase().includes(q) ||
          d.phone.includes(q)
        );
      }
      return true;
    });
  }, [donors, adminBloodFilter, adminSearchQuery]);

  // Load existing settings
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'global'));
        if (snap.exists()) {
          const data = snap.data();
          setAnnouncement(data.announcement || data.noticeMessage || '');
          if (data.announcementType) {
            setAnnouncementType(data.announcementType);
          }
        }
      } catch (e) {}
    };
    fetchSettings();
  }, []);

  const handlePinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    if (pinInput.trim() === '635215' || userProfile?.role === 'admin' || currentUser?.email === 'ziadalsyyadi@gmail.com') {
      switchActiveRole('admin');
    } else {
      setPinError('رمز PIN السرّي غير صحيح. يرجى إدخال الرمز المعتمد لإدارة التطبيق.');
    }
  };

  const handleExportExcel = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sheets/donors');
      const data = await res.json();
      const donorsList = data.donors || [];

      if (donorsList.length === 0) {
        setResult({ success: false, message: 'لا توجد بيانات متبرعين للتصدير حالياً' });
        return;
      }

      // Format CSV for Excel RTL with UTF-8 BOM
      const headers = ['الاسم الكامل', 'فصيلة الدم', 'رقم الهاتف', 'العنوان / السكن', 'الملاحظات'];
      const csvRows = [headers.join(',')];

      donorsList.forEach((d: any) => {
        const row = [
          `"${(d.fullName || d.name || '').replace(/"/g, '""')}"`,
          `"${(d.bloodType || '').replace(/"/g, '""')}"`,
          `"${(d.phone || '').replace(/"/g, '""')}"`,
          `"${(d.residence || d.address || 'قعطبة').replace(/"/g, '""')}"`,
          `"${(d.notes || '').replace(/"/g, '""')}"`,
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = '\uFEFF' + csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `donors_qataba_excel_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setResult({ success: true, message: `تم تصدير ${donorsList.length} متبرع إلى ملف Excel/CSV بنجاح! ✓` });
    } catch (err: any) {
      setResult({ success: false, message: 'حدث خطأ أثناء تصدير ملف إكسل' });
    } finally {
      setLoading(false);
    }
  };

  // Access Guard check
  if (activeRole !== 'admin' && userProfile?.role !== 'admin' && currentUser?.email !== 'ziadalsyyadi@gmail.com') {
    return (
      <div className="max-w-md mx-auto my-8 p-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-5 text-right">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-7 h-7" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-black text-slate-900">تفعيل لوحة تحكم المسؤول (PIN)</h2>
          <p className="text-xs text-slate-500">أدخل رمز PIN السرّي للمسؤول لفتح لوحة الإدارة فوراً</p>
        </div>

        <form onSubmit={handlePinLogin} className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">رمز PIN السرّي للمسؤول:</label>
            <input 
              type="password" 
              maxLength={10}
              value={pinInput} 
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="أدخل رمز PIN للمسؤول..." 
              className="w-full p-3 rounded-xl border border-slate-300 text-center tracking-widest text-base font-mono font-bold focus:ring-2 focus:ring-amber-400 outline-hidden bg-slate-50"
              autoFocus
              required
            />
          </div>

          {pinError && (
            <div className="p-2.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold">
              {pinError}
            </div>
          )}

          <button 
            type="submit"
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md shadow-amber-200 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>تأكيد الرمز وتفعيل لوحة المسؤول</span>
          </button>

          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-2 text-[10px] text-slate-400 uppercase font-semibold">أو</span>
          </div>

          <button 
            type="button"
            onClick={async () => {
              setAdminAuthLoading(true);
              setPinError('');
              try {
                await loginWithGoogle();
                switchActiveRole('admin');
              } catch (err: any) {
                setPinError(err.message || 'فشل تسجيل الدخول كمسؤول');
              } finally {
                setAdminAuthLoading(false);
              }
            }}
            disabled={adminAuthLoading}
            className="w-full py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span>الدخول عبر حساب Google المسؤول</span>
          </button>

          <button 
            type="button"
            onClick={() => {
              switchActiveRole('user');
              onBack();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors"
          >
            الرجوع لوضع المستخدم العادي (قراءة وبحث)
          </button>
        </form>
      </div>
    );
  }

  const handleSaveSettings = async () => {
    if (!currentUser) return;
    setLoading(true);
    setResult(null);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        announcement: announcement.trim(),
        noticeMessage: announcement.trim(),
        announcementType,
        announcementTime: new Date().toISOString(),
        announcementActive: Boolean(announcement.trim()),
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      }, { merge: true });
      setResult({ 
        success: true, 
        message: announcement.trim() 
          ? 'تم تعميم الرسالة ونشرها بنجاح لتظهر فوراً عند جميع المشتركين في الإشعارات! ✓' 
          : 'تم تحديث الإعدادات بنجاح!' 
      });
    } catch (err: any) {
      setResult({ success: false, message: `فشل الحفظ: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleClearAnnouncement = async () => {
    if (!currentUser) return;
    setLoading(true);
    setResult(null);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        announcement: '',
        noticeMessage: '',
        announcementActive: false,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      }, { merge: true });
      setAnnouncement('');
      setResult({ success: true, message: 'تم إلغاء ومسح الرسالة من إشعارات جميع المشتركين بنجاح. ✓' });
    } catch (err: any) {
      setResult({ success: false, message: `فشل المسح: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await importRawDonors(importText);
      if (res.success) {
        setResult({ 
          success: true, 
          message: `تم استيراد ${res.count} متبرعاً بنجاح إلى قاعدة البيانات!` 
        });
        setImportText('');
      } else {
        setResult({ success: false, message: res.error || 'فشل الاستيراد' });
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text || !text.trim()) {
          setResult({ success: false, message: 'الملف المختار فارغ أو تعذر قراءته' });
          setLoading(false);
          return;
        }

        setImportText(text);

        // Automatically trigger import
        const res = await importRawDonors(text);
        if (res.success) {
          setResult({ 
            success: true, 
            message: `تم اختيار الملف (${file.name}) واستيراد ${res.count} متبرعاً بنجاح إلى قاعدة البيانات!` 
          });
        } else {
          setResult({ 
            success: false, 
            message: res.error || 'حدث خطأ أثناء تحليل بيانات الملف المختار' 
          });
        }
      } catch (err: any) {
        setResult({ success: false, message: `فشل قراءة الملف: ${err.message}` });
      } finally {
        setLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      setResult({ success: false, message: 'حدث خطأ أثناء فتح ملف الهاتف' });
      setLoading(false);
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Hidden native file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        accept=".csv,.txt,.tsv,.xlsx,.xls" 
        className="hidden" 
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-200">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900">لوحة تحكم المسؤول</h1>
              <span className="text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full">
                صلاحيات كاملة ✓
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">إدارة السجل، الإعلانات، المزامنة، وصلاحيات التعديل</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onGlobalRefresh && (
            <button
              onClick={onGlobalRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors text-xs font-bold shadow-xs active:scale-95 disabled:opacity-50"
              title="تحديث شامل للتطبيق وسحب أي إضافات وتعديلات جديدة فوراً"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'جارٍ التحديث...' : 'تحديث شامل للتطبيق'}</span>
            </button>
          )}

          <button 
            onClick={() => {
              switchActiveRole('user');
              onBack();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-xs font-bold shadow-xs"
          >
            <span>الرجوع لوضع المستخدم</span>
          </button>

          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-black transition-colors text-xs font-bold"
          >
            <ArrowRight className="w-4 h-4" />
            <span>الرئيسية</span>
          </button>
        </div>
      </div>

      {/* Admin Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-red-600">
            <FileSpreadsheet className="w-5 h-5" />
            <h2 className="text-sm font-black">استيراد بيانات من إكسل / ملفات الهاتف</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            اضغط الزر أدناه لفتح ملفات الهاتف مباشرة واختيار ملف إكسل أو ملف نصي للاستيراد التلقائي.
          </p>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs sm:text-sm shadow-md shadow-amber-200 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
          >
            <FolderOpen className="w-5 h-5" />
            <span>📁 فتح ملفات الهاتف واختيار الملف تلقائياً</span>
          </button>

          <div className="relative flex items-center justify-center my-1">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-2 text-[10px] text-slate-400 uppercase font-bold">أو لصق نصي يدوي</span>
          </div>

          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="ألصق النص هنا (الاسم، الفصيلة، الهاتف، العنوان...)"
            className="w-full h-24 p-3 rounded-2xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-hidden text-xs font-medium"
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleImport}
              disabled={loading || !importText.trim()}
              className="flex-1 py-3 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm shadow-md shadow-red-100 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>بدء الاستيراد النصي</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportExcel}
              disabled={loading}
              className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-100 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير السجل إلى Excel</span>
            </button>
          </div>
          
          {result && (
            <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-bold ${
              result.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {result.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{result.message}</span>
            </div>
          )}
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900">
              <Megaphone className="w-5 h-5 text-amber-600" />
              <h2 className="text-sm font-black">إرسال رسالة تظهر عند الجميع في الإشعارات</h2>
            </div>
            {announcement && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                <span>نشط حالياً</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            اكتب رسالة أو تعميم لتظهر لجميع المشتركين في نافذة الإشعارات والشريط التنبيهي فوراً:
          </p>
          
          <div className="space-y-3">
            {/* Announcement Category Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">نوع الإشعار:</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setAnnouncementType('general')}
                  className={`py-1.5 px-2 rounded-xl text-center text-xs font-bold border transition-all ${
                    announcementType === 'general'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  تنويه عام
                </button>
                <button
                  type="button"
                  onClick={() => setAnnouncementType('urgent')}
                  className={`py-1.5 px-2 rounded-xl text-center text-xs font-bold border transition-all ${
                    announcementType === 'urgent'
                      ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  نداء طارئ
                </button>
                <button
                  type="button"
                  onClick={() => setAnnouncementType('campaign')}
                  className={`py-1.5 px-2 rounded-xl text-center text-xs font-bold border transition-all ${
                    announcementType === 'campaign'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  حملة تبرع
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">نص الرسالة المنشورة للجميع:</label>
              <textarea
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="اكتب التنويه أو الإشعار الذي تريده أن يظهر لجميع المستخدمين فوراً..."
                rows={3}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-hidden text-xs font-medium"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={loading || !announcement.trim()}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-200 transition-all flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <Megaphone className="w-4 h-4" />
                <span>إرسال وتعميم في الإشعارات للجميع</span>
              </button>

              {announcement.trim() && (
                <button
                  type="button"
                  onClick={handleClearAnnouncement}
                  disabled={loading}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
                  title="مسح الإشعار الحالي"
                >
                  مسح الإشعار
                </button>
              )}
            </div>

            {/* Comprehensive App Refresh Button in Admin Dashboard */}
            {onGlobalRefresh && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onGlobalRefresh}
                  disabled={isRefreshing}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-2xs active:scale-98"
                >
                  <RefreshCw className={`w-4 h-4 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'جارٍ التحديث الشامل...' : '🔄 زر التحديث الشامل للتطبيق وسحب أي إضافة جديدة'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400">روابط الربط والتحكم</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">متصل</span>
            </div>
            <div className="space-y-2">
              <a 
                href={`https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_CONFIG.spreadsheetId}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm active:scale-95"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="text-xs font-black">فتح جدول بيانات Google Sheets</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <code className="text-[9px] text-slate-500 truncate flex-1 font-mono">
                  {GOOGLE_SHEETS_CONFIG.appsScriptUrl}
                </code>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Stats & Detailed Management */}
      <div className="space-y-4">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-red-600" />
          <span>إدارة بيانات المجتمع</span>
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base sm:text-lg font-black text-slate-900">سجل المتبرعين (تعديل وحذف)</div>
                <p className="text-[11px] text-slate-500 font-medium">التحكم المباشر في بيانات المتبرعين، التعديل أو الحذف الفوري</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowDonorsSection(prev => !prev)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-xs transition-all"
              >
                {showDonorsSection ? 'إخفاء القائمة' : 'عرض السجل للتحكم'}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
              <span className="text-slate-500 font-bold">إجمالي المتبرعين المسجلين:</span>
              <span className="bg-red-50 text-red-700 font-black px-2 py-0.5 rounded-full border border-red-200">
                {donors.length} متبرع
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-black text-slate-900">مزامنة الأرشيف</div>
                <p className="text-[10px] text-slate-500">جلب أحدث البيانات من Google Sheets</p>
              </div>
              <button 
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await fetch('/api/sheets/donors');
                    const data = await res.json();
                    if (data.success) {
                      setResult({ success: true, message: `تم مزامنة ${data.count} اسماً من الأرشيف (Sheets ➔ App) بنجاح!` });
                    } else if (data.requiresSharePermission) {
                      setResult({ success: false, message: 'تحذير: جدول البيانات "مقيّد". يرجى تغييره إلى "Anyone with link" في إعدادات المشاركة بجدول غوغل.' });
                    } else {
                      setResult({ success: false, message: data.error || 'فشل المزامنة' });
                    }
                  } catch (e) {
                    setResult({ success: false, message: 'خطأ في الاتصال بالخادم' });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 border border-emerald-100 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Database className="w-3.5 h-3.5" />
                <span>مزامنة (من الجدول للتطبيق)</span>
              </button>
            </div>
            
            <div className="flex flex-col gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-black text-rose-900">مزامنة التطبيق ➔ جدول غوغل</div>
                  <p className="text-[11px] text-rose-600 font-medium">تحديث جدول البيانات بكافة متبرعي التطبيق دفعة واحدة</p>
                </div>
              </div>
              <button 
                onClick={async () => {
                  setLoading(true);
                  setResult(null);
                  try {
                    const snap = await getDocs(collection(db, 'donors'));
                    const donors = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    
                    if (donors.length === 0) {
                      setResult({ success: false, message: 'لا توجد بيانات متبرعين في التطبيق لمزامنتها حالياً' });
                      setLoading(false);
                      return;
                    }

                    const res = await pushAllDonorsToSheets(donors);
                    if (res.success) {
                      setResult({ success: true, message: `تم تحديث جدول البيانات بـ ${res.count} متبرع من التطبيق بنجاح! ✓` });
                    } else {
                      setResult({ success: false, message: res.error || 'فشل تحديث جدول البيانات. تأكد من صلاحية Anyone في Apps Script.' });
                    }
                  } catch (err: any) {
                    setResult({ success: false, message: `خطأ أثناء المزامنة: ${err.message}` });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-rose-600 text-white font-black text-sm hover:bg-rose-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-rose-200 active:scale-98"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>بدء المزامنة الشاملة للجدول</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Interactive Donors Management Panel (Edit & Delete any donor) */}
      {showDonorsSection && (
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-red-50 text-red-600">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">إدارة وتعديل وحذف أي متبرع</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  بصفتك مسؤول التطبيق، يمكنك تعديل أي متبرع أو حذفه نهائياً
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span className="bg-slate-100 px-3 py-1 rounded-full">
                {filteredDonors.length} من أصل {donors.length} متبرع
              </span>
            </div>
          </div>

          {/* Search & Blood Filter */}
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={adminSearchQuery}
                onChange={(e) => setAdminSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، السكن، أو رقم الهاتف..."
                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-hidden"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              {adminSearchQuery && (
                <button
                  onClick={() => setAdminSearchQuery('')}
                  className="absolute left-3 top-2.5 text-[10px] text-slate-400 hover:text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded"
                >
                  مسح
                </button>
              )}
            </div>

            {/* Blood Type Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setAdminBloodFilter('ALL')}
                className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all ${
                  adminBloodFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل ({donors.length})
              </button>
              {BLOOD_TYPES.map((bt) => (
                <button
                  key={bt}
                  type="button"
                  onClick={() => setAdminBloodFilter(bt)}
                  className={`py-1 px-2.5 rounded-lg text-xs font-black transition-all ${
                    adminBloodFilter === bt
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-red-50'
                  }`}
                >
                  {bt}
                </button>
              ))}
            </div>
          </div>

          {/* Donors Cards List */}
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {filteredDonors.length > 0 ? (
              filteredDonors.map((donor) => (
                <div
                  key={donor.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all flex flex-wrap items-center justify-between gap-3 text-right"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-600 text-white font-black flex items-center justify-center text-sm shrink-0 shadow-sm shadow-red-200">
                      {donor.bloodType}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                          {donor.fullName}
                        </span>
                        {donor.isAvailable ? (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                            متاح
                          </span>
                        ) : (
                          <span className="text-[9px] bg-slate-200 text-slate-600 font-medium px-1.5 py-0.5 rounded-full">
                            غير متاح
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1 font-mono font-bold">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {donor.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-500" />
                          {donor.residence}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEditDonor?.(donor.id)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdminDonorToDelete(donor)}
                      className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-black transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                لا يوجد متبرعون يطابقون معايير البحث الحالية
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Delete Confirmation Modal */}
      {adminDonorToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 text-right">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>
            
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-slate-900">تأكيد حذف المتبرع كمسؤول</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                هل أنت متأكد من حذف بيانات المتبرع <span className="font-black text-red-600 underline underline-offset-2">{adminDonorToDelete.fullName}</span> (فصيلة {adminDonorToDelete.bloodType}) من السجل نهائياً؟
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                سيتم حذف المتبرع فوراً واستبعاده من كافة الشاشات وقواعد البيانات.
              </p>
            </div>

            {adminDeleteError && (
              <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold text-center border border-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{adminDeleteError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  if (!adminDonorToDelete || !onDeleteDonor) return;
                  setAdminIsDeleting(true);
                  setAdminDeleteError(null);
                  try {
                    await onDeleteDonor(adminDonorToDelete.id, adminDonorToDelete.phone);
                    setResult({ success: true, message: `تم حذف بيانات المتبرع (${adminDonorToDelete.fullName}) بنجاح! ✓` });
                    setAdminDonorToDelete(null);
                  } catch (err: any) {
                    setAdminDeleteError(err.message || 'حدث خطأ أثناء محاولة الحذف');
                  } finally {
                    setAdminIsDeleting(false);
                  }
                }}
                disabled={adminIsDeleting}
                className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md shadow-red-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {adminIsDeleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>تأكيد الحذف</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdminDonorToDelete(null);
                  setAdminDeleteError(null);
                }}
                disabled={adminIsDeleting}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي المتبرعين', value: donors.length.toString(), icon: Database, color: 'blue' },
          { label: 'متاحين للتبرع', value: donors.filter(d => d.isAvailable).length.toString(), icon: CheckCircle2, color: 'emerald' },
          { label: 'متبرعين بدم إيجابي', value: donors.filter(d => d.bloodType.includes('+')).length.toString(), icon: ShieldCheck, color: 'rose' },
          { label: 'متبرعين بدم سلبي', value: donors.filter(d => d.bloodType.includes('-')).length.toString(), icon: Search, color: 'amber' },
        ].map((stat, idx) => (
          <div key={idx} className="p-4 rounded-3xl bg-white border border-slate-100 shadow-xs flex flex-col items-center justify-center text-center space-y-1">
            <stat.icon className={`w-5 h-5 text-${stat.color}-500 mb-1`} />
            <div className="text-lg font-black text-slate-900">{stat.value}</div>
            <div className="text-[10px] font-bold text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>
      <BloodDonationEducationalInfo />
    </div>
  );
};
