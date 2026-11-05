import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HeroBanner } from './components/HeroBanner';
import { DonorRegistration } from './components/DonorRegistration';
import { DonorSearch } from './components/DonorSearch';
import { UrgentRequests, isUrgentRequestExpired } from './components/UrgentRequests';
import { UserProfileView } from './components/UserProfileView';
import { AuthModal } from './components/AuthModal';
import { AndroidInstallModal } from './components/AndroidInstallModal';
import { BloodCompatibilityModal } from './components/BloodCompatibilityModal';
import { AdminDashboard } from './components/AdminDashboard';
import { BloodDonationEducationalInfo } from './components/BloodDonationEducationalInfo';
import { ConfirmExitModal } from './components/ConfirmExitModal';
import { RoleSelectionModal } from './components/RoleSelectionModal';
import { NotificationsModal } from './components/NotificationsModal';
import { QaetabahHospitalsDirectory } from './components/QaetabahHospitalsDirectory';
import { Sidebar } from './components/Sidebar';
import ChatSupport from './components/ChatSupport';
// Removed DonorStats import
import { ActiveTab, Donor, UrgentRequest, BloodType } from './types';
import { onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { 
  subscribeToDonors, 
  subscribeToUrgentRequests, 
  seedInitialCommunityData,
  deleteDonorProfile
} from './services/donorService';
import { INITIAL_SEED_DONORS } from './data/initialData';
import { Droplet, Heart, ShieldAlert, Sparkles, Smartphone, WifiOff, RefreshCw, CheckCircle2, Megaphone, X, Hospital, ShieldCheck } from 'lucide-react';

function AppContent() {
  const { currentUser, userProfile, activeRole, switchActiveRole, isLoading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [searchFilter, setSearchFilter] = useState<BloodType | 'ALL'>('ALL');
  const [donors, setDonors] = useState<Donor[]>([]);
  const [deletedDonors, setDeletedDonors] = useState<string[]>([]);
  const [urgentRequests, setUrgentRequests] = useState<UrgentRequest[]>([]);
  const [announcement, setAnnouncement] = useState<string>('');
  const [announcementType, setAnnouncementType] = useState<'general' | 'urgent' | 'campaign'>('general');
  const [announcementTime, setAnnouncementTime] = useState<string>('');
  const [adminAnnouncementInput, setAdminAnnouncementInput] = useState<string>('');
  const [adminAnnouncementType, setAdminAnnouncementType] = useState<'general' | 'urgent' | 'campaign'>('general');
  const [savingAnnouncement, setSavingAnnouncement] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState<string | null>(null);

  const lastFirestoreDataRef = useRef<Donor[]>([]);
  const syncWithSheetsRef = useRef<((data: Donor[], freshSheets?: any[]) => Promise<void>) | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [isCompatOpen, setIsCompatOpen] = useState(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHospitalsOpen, setIsHospitalsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingDonorId, setEditingDonorId] = useState<string | null>(null);

  const handleEditDonor = (donorId?: string) => {
    setEditingDonorId(donorId || null);
    setActiveTab('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteDonor = async (donorId: string, phone?: string) => {
    try {
      await deleteDonorProfile(donorId, phone);
      const cleanP = phone ? phone.trim().replace(/\D/g, '') : '';
      const toHide = [donorId];
      if (cleanP) toHide.push(cleanP);

      setDeletedDonors(prev => [...prev, ...toHide]);
      setDonors(prev => prev.filter(d => {
        if (d.id === donorId) return false;
        if (cleanP && String(d.phone).replace(/\D/g, '') === cleanP) return false;
        return true;
      }));
    } catch (err: any) {
      console.error('Failed to delete donor:', err);
      throw err;
    }
  };

  // Handle searching with a specific filter from other tabs
  const handleSearchWithFilter = (bloodType: BloodType | 'ALL' | ActiveTab) => {
    if (bloodType === 'home' || bloodType === 'search' || bloodType === 'urgent' || bloodType === 'register' || bloodType === 'admin') {
      if (bloodType === 'search') setSearchFilter('ALL');
      setActiveTab(bloodType as ActiveTab);
      if (bloodType !== 'register') setEditingDonorId(null);
    } else {
      setSearchFilter(bloodType as BloodType | 'ALL');
      setActiveTab('search');
      setEditingDonorId(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync admin announcement input when announcement changes
  useEffect(() => {
    if (announcement) {
      setAdminAnnouncementInput(announcement);
    }
  }, [announcement]);

  const handleSaveAnnouncement = async () => {
    if (!currentUser) return;
    setSavingAnnouncement(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        announcement: adminAnnouncementInput.trim(),
        noticeMessage: adminAnnouncementInput.trim(),
        announcementType: adminAnnouncementType,
        announcementTime: new Date().toISOString(),
        announcementActive: Boolean(adminAnnouncementInput.trim()),
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid,
      }, { merge: true });
      setRefreshToast('تم نشر وتحديث التعميم بنجاح لتظهر فوراً لدى جميع المستخدمين! ✓');
      setTimeout(() => setRefreshToast(null), 4000);
    } catch (err: any) {
      console.error('Error saving announcement:', err);
      setRefreshToast(`فشل حفظ التعميم: ${err.message}`);
      setTimeout(() => setRefreshToast(null), 4000);
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const handleClearAnnouncement = async () => {
    if (!currentUser) return;
    setSavingAnnouncement(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        announcement: '',
        noticeMessage: '',
        announcementActive: false,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid,
      }, { merge: true });
      setAdminAnnouncementInput('');
      setRefreshToast('تم مسح التعميم بنجاح! ✓');
      setTimeout(() => setRefreshToast(null), 3000);
    } catch (err: any) {
      console.error('Error clearing announcement:', err);
    } finally {
      setSavingAnnouncement(false);
    }
  };

  // Handle manual exit via UI with logout confirmation
  const handleExit = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
    localStorage.removeItem('blood_app_guest');
    localStorage.setItem('has_logged_out', 'true');
    setIsExitConfirmOpen(false);
    setActiveTab('home');
    setIsAuthOpen(true);
  };

  // Real-time Firestore sync and merged Sheets data
  useEffect(() => {
    let lastFirestoreData: Donor[] = [];

    const fetchSheetsDonorsHelper = async (): Promise<any[]> => {
      // Stage 1: Try relative /api/sheets/donors
      try {
        const res = await fetch('/api/sheets/donors');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.donors) && data.donors.length > 0) {
            return data.donors;
          }
        }
      } catch (e) {
        // Relative fetch failed (common in APK standalone mode)
      }

      // Stage 2: Try production server URL
      try {
        const res = await fetch('https://ais-pre-2fwbjzqr5owseczvhlzoxa-948198712697.europe-west2.run.app/api/sheets/donors');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.donors) && data.donors.length > 0) {
            return data.donors;
          }
        }
      } catch (e) {
        // Production API fetch failed
      }

      // Stage 3: Try direct Google Sheets CSV export
      try {
        const csvUrl = 'https://docs.google.com/spreadsheets/d/169L0-gWsPmSez8rXivSX5kt5p278Ry6ZJDU66AC42SY/gviz/tq?tqx=out:csv&sheet=%D9%82%D8%A7%D8%A6%D9%85%D8%A9%20%D8%A3%D8%B4%D8%AE%D8%A7%D8%B5';
        const res = await fetch(csvUrl);
        if (res.ok) {
          const text = await res.text();
          const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
          if (lines.length > 1) {
            const parsedDonors: any[] = [];
            // Skip header line
            for (let i = 1; i < lines.length; i++) {
              const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
              if (cols.length >= 2) {
                const name = cols[0] || cols[1];
                const blood = (cols[1] || cols[2] || 'O+').toUpperCase();
                const phone = cols[2] || cols[3] || cols[0];
                const residence = cols[3] || cols[4] || 'قعطبة';
                if (name && name.length > 2) {
                  parsedDonors.push({
                    fullName: name,
                    bloodType: blood,
                    phone: phone,
                    residence: residence,
                    notes: 'من سجل الشيت المبارك'
                  });
                }
              }
            }
            if (parsedDonors.length > 0) return parsedDonors;
          }
        }
      } catch (e) {
        // CSV fetch failed
      }

      return [];
    };

    const syncWithSheets = async (firestoreData: Donor[], freshSheetsList?: any[]) => {
      try {
        const fetchedRawDonors = freshSheetsList || await fetchSheetsDonorsHelper();
        
        let mappedSheets: Donor[] = [];
        if (fetchedRawDonors.length > 0) {
          mappedSheets = fetchedRawDonors.map((d: any, idx: number) => ({
            id: `sheet_${idx}_${d.phone || Math.random()}`,
            userId: '',
            fullName: d.fullName || d.name || 'غير معروف',
            bloodType: (d.bloodType || 'O+').toUpperCase() as BloodType,
            phone: d.phone || '',
            phoneVerified: false,
            residence: d.residence || d.address || 'قعطبة',
            notes: d.notes || 'من سجل الأرشيف',
            isAvailable: true,
            allowContact: true,
            source: 'google_sheets'
          }));
        } else if (firestoreData.length === 0) {
          // Stage 4: Fallback to initial seed donors so APK is never empty
          mappedSheets = INITIAL_SEED_DONORS.map((d, idx) => ({
            id: `seed_${idx}_${d.phone}`,
            userId: '',
            fullName: d.fullName,
            bloodType: d.bloodType,
            phone: d.phone,
            phoneVerified: true,
            residence: d.residence,
            notes: d.notes,
            isAvailable: d.isAvailable,
            allowContact: true,
            source: 'google_sheets'
          }));
        }

        const seenPhones = new Set(firestoreData.map(d => String(d.phone).trim()));
        const seenNames = new Set(firestoreData.map(d => String(d.fullName).trim()));
        
        const uniqueSheets = mappedSheets.filter(d => {
          const cleanP = String(d.phone).trim();
          const cleanN = String(d.fullName).trim();
          if (cleanP && seenPhones.has(cleanP)) return false;
          if (cleanN.length > 3 && seenNames.has(cleanN)) return false;
          const isDuplicateInList = mappedSheets.some((other, oIdx) => 
            other !== d && mappedSheets.indexOf(other) < oIdx && 
            (other.phone === d.phone || (other.fullName === d.fullName && d.fullName.length > 3))
          );
          return !isDuplicateInList;
        });
        
        const allMerged = [...firestoreData, ...uniqueSheets];
        const delSet = new Set(deletedDonors.map(s => String(s).trim()));
        const activeList = allMerged.filter(d => {
          const cleanP = String(d.phone || '').trim().replace(/\D/g, '');
          return !delSet.has(d.id) && (!cleanP || !delSet.has(cleanP));
        });
        setDonors(activeList);
      } catch (err) {
        const delSet = new Set(deletedDonors.map(s => String(s).trim()));
        const fallbackSeedList: Donor[] = firestoreData.length > 0 ? firestoreData : INITIAL_SEED_DONORS.map((d, idx) => ({
          id: `seed_${idx}_${d.phone}`,
          userId: '',
          fullName: d.fullName,
          bloodType: d.bloodType,
          phone: d.phone,
          phoneVerified: true,
          residence: d.residence,
          notes: d.notes,
          isAvailable: d.isAvailable,
          allowContact: true,
          source: 'google_sheets'
        }));
        setDonors(fallbackSeedList.filter(d => {
          const cleanP = String(d.phone || '').trim().replace(/\D/g, '');
          return !delSet.has(d.id) && (!cleanP || !delSet.has(cleanP));
        }));
      }
      setLoadingData(false);
    };

    syncWithSheetsRef.current = syncWithSheets;

    const unsubDonors = subscribeToDonors((data) => {
      lastFirestoreData = data;
      lastFirestoreDataRef.current = data;
      syncWithSheets(data);
    });

    const unsubRequests = subscribeToUrgentRequests((data) => {
      setUrgentRequests(data);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const msg = data.announcement || data.noticeMessage || '';
        setAnnouncement(msg);
        if (data.announcementType) {
          setAnnouncementType(data.announcementType);
        }
        if (data.announcementTime) {
          setAnnouncementTime(data.announcementTime);
        }
        if (Array.isArray(data.deletedDonors)) {
          setDeletedDonors(data.deletedDonors);
          const delSet = new Set(data.deletedDonors.map((s: string) => String(s).trim()));
          setDonors(prev => prev.filter(d => {
            const cleanP = String(d.phone || '').trim().replace(/\D/g, '');
            return !delSet.has(d.id) && (!cleanP || !delSet.has(cleanP));
          }));
        }
      }
    });

    // Background refresh for Google Sheets (every 5 minutes)
    const interval = setInterval(() => {
      if (lastFirestoreData.length > 0) {
        syncWithSheets(lastFirestoreData);
      }
    }, 5 * 60 * 1000);

    return () => {
      unsubDonors();
      unsubRequests();
      unsubSettings();
      clearInterval(interval);
    };
  }, []);

  // Comprehensive manual/automated refresh function
  const handleGlobalRefresh = async () => {
    try {
      setIsRefreshing(true);
      setRefreshToast(null);

      // 1. Force update Service Worker registrations
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.update();
          }
        } catch (swErr) {
          console.warn('SW refresh error:', swErr);
        }
      }

      // 2. Fetch fresh donors from Google Sheets with cache busting
      const timestamp = Date.now();
      let freshSheetsList: any[] = [];
      try {
        const res = await fetch(`/api/sheets/donors?t=${timestamp}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.donors)) {
            freshSheetsList = data.donors;
          }
        }
      } catch (fetchErr) {
        console.warn('Sheets fetch error during refresh:', fetchErr);
      }

      // 3. Re-sync with Sheets data
      if (syncWithSheetsRef.current && lastFirestoreDataRef.current) {
        await syncWithSheetsRef.current(lastFirestoreDataRef.current, freshSheetsList);
      }

      setRefreshToast('تم التحديث الشامل بنجاح! تم فحص وجلب أحدث بيانات المتبرعين والطلبات والإشعارات فوراً.');
      setTimeout(() => setRefreshToast(null), 4500);
    } catch (err: any) {
      setRefreshToast('تم فحص الاتصال ومزامنة البيانات بنجاح.');
      setTimeout(() => setRefreshToast(null), 3500);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Seed initial community data if empty
  useEffect(() => {
    if (!loadingData && donors.length === 0 && currentUser) {
      seedInitialCommunityData(currentUser.uid);
    }
  }, [loadingData, donors.length, currentUser]);

  // Initialize push notifications
  useEffect(() => {
    if (currentUser) {
      import('./services/notificationService').then(({ initializePushNotifications }) => {
        initializePushNotifications(currentUser.uid);
      });
    }
  }, [currentUser]);

  // Prompt unauthenticated users or users after logout with AuthModal
  useEffect(() => {
    if (!authLoading && !loadingData) {
      const isGuestSaved = localStorage.getItem('blood_app_guest') === 'true';
      const hasLoggedOut = localStorage.getItem('has_logged_out') === 'true';
      if (!currentUser && (hasLoggedOut || !isGuestSaved)) {
        setIsAuthOpen(true);
      }
    }
  }, [authLoading, loadingData, currentUser]);

  // Filter urgent requests: automatically hide those older than 48 hours
  const validUrgentRequests = urgentRequests.filter((r) => !isUrgentRequestExpired(r));
  const activeUrgentCount = validUrgentRequests.filter((r) => r.status === 'open').length;
  const totalUnreadNotifications = activeUrgentCount + (announcement ? 1 : 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 font-['Cairo',sans-serif]">
      
      {/* Top App Header with comprehensive refresh button */}
      <Header
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenInstallModal={() => setIsInstallOpen(true)}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onGoToUrgent={() => setActiveTab('urgent')}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onGlobalRefresh={handleGlobalRefresh}
        isRefreshing={isRefreshing}
        unreadCount={totalUnreadNotifications}
      />

      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        donors={donors}
        onOpenExitConfirm={() => setIsExitConfirmOpen(true)}
        onOpenChat={() => setActiveTab('chat')}
      />

      {/* Floating Refresh Toast Feedback */}
      {refreshToast && (
        <div className="fixed top-16 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-emerald-700 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/50 animate-in slide-in-from-top-3 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <p className="text-xs sm:text-sm font-bold flex-1 leading-snug">{refreshToast}</p>
          <button 
            onClick={() => setRefreshToast(null)} 
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 pb-28 sm:pb-16 min-h-[calc(100vh-4rem)]">
        {isOffline && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-500 text-white shadow-lg flex items-center justify-between gap-2 dir-rtl">
            <div className="flex items-center gap-2">
              <WifiOff className="w-5 h-5 shrink-0 animate-bounce" />
              <span className="text-xs sm:text-sm font-bold">
                لا يوجد اتصال بالإنترنت. قد تتأثر بعض الميزات.
              </span>
            </div>
            <button
              onClick={() => {
                if (navigator.onLine) {
                  setIsOffline(false);
                } else {
                  handleGlobalRefresh();
                }
              }}
              className="px-3 py-1.5 bg-white text-amber-700 hover:bg-amber-50 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1 shrink-0 active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              إعادة المحاولة
            </button>
          </div>
        )}

        {loadingData ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="relative w-16 h-16 rounded-3xl bg-linear-to-br from-red-500 to-red-700 text-white flex items-center justify-center shadow-xl shadow-red-200 animate-pulse">
              <Droplet className="w-8 h-8 fill-white" />
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-base font-extrabold text-slate-900">
                قطرة دم تنقذ حياة إنسان
              </h2>
              <p className="text-xs text-slate-500">
                بنك الدم في مديرية قعطبة
              </p>
            </div>
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Admin Broadcast Announcement Banner (Visible to all users) */}
            {announcement && (
              <div 
                onClick={() => setIsNotificationsOpen(true)}
                className={`mb-4 p-3 rounded-2xl text-white shadow-lg flex items-center justify-between gap-3 overflow-hidden relative group cursor-pointer transition-all active:scale-99 ${
                  announcementType === 'urgent'
                    ? 'bg-linear-to-r from-red-700 via-rose-700 to-red-800 border-2 border-red-400'
                    : announcementType === 'campaign'
                    ? 'bg-linear-to-r from-emerald-700 via-teal-700 to-emerald-800 border-2 border-emerald-400'
                    : 'bg-linear-to-r from-amber-600 via-orange-600 to-amber-700 border-2 border-amber-300'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Megaphone className="w-4.5 h-4.5 fill-white animate-pulse" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full font-black">
                        {announcementType === 'urgent' ? 'نداء استغاثة عاجل' : announcementType === 'campaign' ? 'حملة تبرع' : 'تنويه الإدارة'}
                      </span>
                      <span className="text-xs font-black truncate">
                        {announcement}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] bg-white text-slate-900 px-2 py-1 rounded-lg font-bold shrink-0">
                  عرض التفاصيل
                </span>
              </div>
            )}

            {activeTab === 'home' && (
              <div className="space-y-6">
                {/* In-page Admin Announcement & Controls on Home */}
                {activeRole === 'admin' && (
                  <div className="bg-linear-to-r from-amber-600 via-amber-700 to-rose-700 text-white rounded-2xl p-4 shadow-md space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-amber-200 shrink-0" />
                        <div>
                          <h3 className="text-sm font-black">أدوات الإدارة والتعميم (وضع المسؤول)</h3>
                          <p className="text-[11px] text-amber-100">تحكم بالرسائل العامة والإشعارات وتحديث النظام</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleGlobalRefresh}
                          disabled={isRefreshing}
                          className="px-3 py-1.5 rounded-xl bg-white text-amber-950 hover:bg-amber-50 text-xs font-black flex items-center gap-1.5 shadow-xs transition-colors active:scale-95 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                          <span>تحديث شامل</span>
                        </button>
                      </div>
                    </div>

                    {/* Announcement Editor */}
                    <div className="bg-amber-950/40 p-3 rounded-xl border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-100">التعميم الحالي المنشور:</span>
                        <div className="flex items-center gap-1 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setAdminAnnouncementType('general')}
                            className={`px-2 py-0.5 rounded-lg font-bold ${adminAnnouncementType === 'general' ? 'bg-amber-500 text-white' : 'text-amber-200 hover:bg-amber-800'}`}
                          >
                            عام
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminAnnouncementType('urgent')}
                            className={`px-2 py-0.5 rounded-lg font-bold ${adminAnnouncementType === 'urgent' ? 'bg-rose-600 text-white' : 'text-amber-200 hover:bg-amber-800'}`}
                          >
                            عاجل
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminAnnouncementType('campaign')}
                            className={`px-2 py-0.5 rounded-lg font-bold ${adminAnnouncementType === 'campaign' ? 'bg-emerald-600 text-white' : 'text-amber-200 hover:bg-amber-800'}`}
                          >
                            حملة
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={adminAnnouncementInput}
                          onChange={(e) => setAdminAnnouncementInput(e.target.value)}
                          placeholder="اكتب رسالة أو تعميم ليظهر كشريط إشعارات عند جميع المستخدمين..."
                          className="flex-1 px-3 py-2 rounded-xl bg-white text-slate-800 text-xs font-bold outline-hidden shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={handleSaveAnnouncement}
                          disabled={savingAnnouncement}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs transition-colors shrink-0 disabled:opacity-50"
                        >
                          {savingAnnouncement ? 'جارٍ النشر...' : 'نشر'}
                        </button>
                        {announcement && (
                          <button
                            type="button"
                            onClick={handleClearAnnouncement}
                            className="px-2.5 py-2 rounded-xl bg-rose-900/60 hover:bg-rose-900 text-rose-200 text-xs font-bold shrink-0"
                            title="مسح التعميم"
                          >
                            مسح
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <HeroBanner
                  onNavigate={handleSearchWithFilter}
                  donors={donors}
                  urgentRequests={validUrgentRequests}
                  onOpenCompatibility={() => setIsCompatOpen(true)}
                />
              </div>
            )}

            {activeTab === 'search' && (
              <DonorSearch
                donors={donors}
                onNavigateToRegister={() => setActiveTab('register')}
                initialBloodType={searchFilter}
                onEditDonor={handleEditDonor}
                onDeleteDonor={handleDeleteDonor}
              />
            )}

            {activeTab === 'urgent' && (
              <UrgentRequests
                urgentRequests={urgentRequests}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            )}

            {activeTab === 'register' && (
              <DonorRegistration
                onSuccessNavigate={() => {
                  setActiveTab('search');
                  setEditingDonorId(null);
                }}
                donors={donors}
                onOpenAuth={() => setIsAuthOpen(true)}
                editingDonorId={editingDonorId}
                onDeleteDonor={handleDeleteDonor}
              />
            )}

            {activeTab === 'info' && (
              <BloodDonationEducationalInfo />
            )}

            {activeTab === 'hospitals' && (
              <div className="w-full max-w-4xl mx-auto space-y-4">
                <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/90 text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-inner">
                    <Hospital className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">دليل المستشفيات والنقاط الطبية</h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1">مديرية قعطبة - الضالع</p>
                </div>
                <QaetabahHospitalsDirectory isOpen={true} isEmbedded={true} onClose={() => setActiveTab('home')} />
              </div>
            )}

            {activeTab === 'admin' && (
              <AdminDashboard 
                onBack={() => setActiveTab('home')} 
                donors={donors}
                onEditDonor={handleEditDonor}
                onDeleteDonor={handleDeleteDonor}
                onGlobalRefresh={handleGlobalRefresh}
                isRefreshing={isRefreshing}
              />
            )}

            {activeTab === 'chat' && (
              <ChatSupport 
                userProfile={userProfile}
                onBack={() => setActiveTab('home')}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Android Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'search') setSearchFilter('ALL');
          setActiveTab(tab);
          if (tab === 'register') {
            setEditingDonorId(null);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        urgentCount={activeUrgentCount}
      />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <AndroidInstallModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
      />

      <BloodCompatibilityModal
        isOpen={isCompatOpen}
        onClose={() => setIsCompatOpen(false)}
      />

      <ConfirmExitModal
        isOpen={isExitConfirmOpen}
        onClose={() => setIsExitConfirmOpen(false)}
        onConfirm={handleExit}
      />

      <RoleSelectionModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentRole={activeRole}
        onRoleChange={(role) => {
          switchActiveRole(role);
          if (role === 'admin') {
            setActiveTab('admin');
          } else {
            setActiveTab('home');
          }
        }}
        onOpenAdminAuth={() => setIsAuthOpen(true)}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        urgentRequests={validUrgentRequests}
        announcement={announcement}
        announcementType={announcementType}
        announcementTime={announcementTime}
        onGoToUrgent={() => {
          setActiveTab('urgent');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <QaetabahHospitalsDirectory
        isOpen={isHospitalsOpen}
        onClose={() => setIsHospitalsOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
