import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HeroBanner } from './components/HeroBanner';
import { DonorRegistration } from './components/DonorRegistration';
import { DonorSearch } from './components/DonorSearch';
import { UrgentRequests } from './components/UrgentRequests';
import { UserProfileView } from './components/UserProfileView';
import { AuthModal } from './components/AuthModal';
import { AndroidInstallModal } from './components/AndroidInstallModal';
import { BloodCompatibilityModal } from './components/BloodCompatibilityModal';
import { AdminDashboard } from './components/AdminDashboard';
import { BloodDonationEducationalInfo } from './components/BloodDonationEducationalInfo';
import { ConfirmExitModal } from './components/ConfirmExitModal';
import { RoleSelectionModal } from './components/RoleSelectionModal';
import { NotificationsModal } from './components/NotificationsModal';
import { ActiveTab, Donor, UrgentRequest, BloodType } from './types';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from './firebase';
import { 
  subscribeToDonors, 
  subscribeToUrgentRequests, 
  seedInitialCommunityData,
  deleteDonorProfile
} from './services/donorService';
import { INITIAL_SEED_DONORS } from './data/initialData';
import { Droplet, Heart, ShieldAlert, Sparkles, Smartphone, WifiOff, RefreshCw } from 'lucide-react';

function AppContent() {
  const { currentUser, userProfile, activeRole, switchActiveRole, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [searchFilter, setSearchFilter] = useState<BloodType | 'ALL'>('ALL');
  const [donors, setDonors] = useState<Donor[]>([]);
  const [deletedDonors, setDeletedDonors] = useState<string[]>([]);
  const [urgentRequests, setUrgentRequests] = useState<UrgentRequest[]>([]);
  const [announcement, setAnnouncement] = useState<string>('');
  const [loadingData, setLoadingData] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

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
  const [editingDonorId, setEditingDonorId] = useState<string | null>(null);

  const handleEditDonor = (donorId: string) => {
    setEditingDonorId(donorId);
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
    if (bloodType === 'home' || bloodType === 'search' || bloodType === 'urgent' || bloodType === 'register' || bloodType === 'profile' || bloodType === 'admin') {
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

  // Exit confirmation logic
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Handle manual exit via UI if needed (for mobile-like experience)
  const handleExit = () => {
    window.close();
    // Fallback if window.close is blocked
    setTimeout(() => {
      window.location.href = 'about:blank';
    }, 500);
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

    const syncWithSheets = async (firestoreData: Donor[]) => {
      try {
        const fetchedRawDonors = await fetchSheetsDonorsHelper();
        
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

    const unsubDonors = subscribeToDonors((data) => {
      lastFirestoreData = data;
      syncWithSheets(data);
    });

    const unsubRequests = subscribeToUrgentRequests((data) => {
      setUrgentRequests(data);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setAnnouncement(data.announcement || data.noticeMessage || '');
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

  // Background refresh for Google Sheets (every 10 minutes)
  useEffect(() => {
    const refreshSheets = async () => {
      try {
        const sheetsRes = await fetch('/api/sheets/donors');
        const sheetsData = await sheetsRes.json();
        if (sheetsData.success && Array.isArray(sheetsData.donors)) {
          // The main donors state is updated by Firestore unsubDonors 
          // which also includes this fetch logic, so this is just a pulse
          // to trigger the unsubDonors callback if we want, but better to 
          // just let Firestore trigger it or add a separate state for sheets.
          // For simplicity, we'll rely on the existing Firestore sub.
        }
      } catch (e) {}
    };
    
    const interval = setInterval(refreshSheets, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Seed initial community data if empty
  useEffect(() => {
    if (!loadingData && donors.length === 0 && currentUser) {
      seedInitialCommunityData(currentUser.uid);
    }
  }, [loadingData, donors.length, currentUser]);

  const activeUrgentCount = urgentRequests.filter((r) => r.status === 'open').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 font-['Cairo',sans-serif]">
      
      {/* Top App Header */}
      <Header
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenInstallModal={() => setIsInstallOpen(true)}
        onGoToProfile={() => setActiveTab('profile')}
        onGoToUrgent={() => setActiveTab('urgent')}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        unreadCount={activeUrgentCount}
      />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
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
                  window.location.reload();
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
                قطرة دم تنقذ حياة
              </h2>
              <p className="text-xs text-slate-500">
                سجل المتبرعين بالدم • مديرية قعطبة
              </p>
            </div>
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {announcement && (
              <div className="mb-4 p-3 rounded-2xl bg-linear-to-r from-red-600 to-rose-700 text-white shadow-lg flex items-center gap-3 overflow-hidden relative group">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 fill-white animate-pulse" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-xs font-black whitespace-nowrap animate-marquee">
                    {announcement}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'home' && (
              <HeroBanner
                onNavigate={handleSearchWithFilter}
                donors={donors}
                urgentRequests={urgentRequests}
                onOpenCompatibility={() => setIsCompatOpen(true)}
              />
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

            {activeTab === 'profile' && (
              <UserProfileView
                donors={donors}
                urgentRequests={urgentRequests}
                onNavigateToRegister={(id) => {
                  setEditingDonorId(id || null);
                  setActiveTab('register');
                }}
                onOpenInstallModal={() => setIsInstallOpen(true)}
                onOpenAuth={() => setIsAuthOpen(true)}
                onGoToAdmin={() => setActiveTab('admin')}
                onOpenExitConfirm={() => setIsExitConfirmOpen(true)}
                onSearchWithFilter={handleSearchWithFilter}
              />
            )}

            {activeTab === 'admin' && (
              <AdminDashboard 
                onBack={() => setActiveTab('home')} 
                donors={donors}
                onEditDonor={handleEditDonor}
                onDeleteDonor={handleDeleteDonor}
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
          // If navigating via nav bar to register, we usually want a fresh form
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
        urgentRequests={urgentRequests}
        announcement={announcement}
        onGoToUrgent={() => {
          setActiveTab('urgent');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
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
