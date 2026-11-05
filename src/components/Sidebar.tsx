import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Calendar, 
  Settings, 
  Share2, 
  MessageSquare, 
  LogOut, 
  ChevronRight, 
  Plus,
  Trash2,
  CheckCircle2,
  Heart,
  Droplet,
  Info,
  Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Donor, DonationRecord, Conversation } from '../types';
import { updateDonorProfile } from '../services/donorService';
import { subscribeToConversation } from '../services/chatService';
import { AboutUsModal } from './AboutUsModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  donors: Donor[];
  onOpenExitConfirm: () => void;
}

export const Sidebar: React.FC<SidebarProps & { onOpenChat: () => void }> = ({
  isOpen,
  onClose,
  donors,
  onOpenExitConfirm,
  onOpenChat
}) => {
  const { currentUser, userProfile, logout } = useAuth();
  const [isEditing, setIsSidebarEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile?.displayName || '');
  const [editPhone, setEditPhone] = useState(userProfile?.phone || '');
  const [saveLoading, setSaveLoading] = useState(false);
  const [newDonationDate, setNewDonationDate] = useState('');
  const [showAddDonation, setShowAddDonation] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);

  useEffect(() => {
    if (!currentUser || userProfile?.role === 'admin') return;

    const unsubscribe = subscribeToConversation(currentUser.uid, setConversation);
    return () => unsubscribe();
  }, [currentUser, userProfile?.role]);

  // Find user's donor profile if it exists
  const myDonorProfile = donors.find(d => d.userId === currentUser?.uid);

  const handleSaveSettings = async () => {
    if (!currentUser) return;
    setSaveLoading(true);
    try {
      // In a real app, we'd update user profile and optionally the donor profile
      // For this implementation, if they have a donor profile, update it
      if (myDonorProfile) {
        await updateDonorProfile(myDonorProfile.id, {
          fullName: editName,
          phone: editPhone
        });
      }
      setIsSidebarEditing(false);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAddDonation = async () => {
    if (!myDonorProfile || !newDonationDate) return;
    setSaveLoading(true);
    try {
      const history = myDonorProfile.donationHistory || [];
      const newRecord: DonationRecord = {
        id: crypto.randomUUID(),
        date: newDonationDate,
      };
      await updateDonorProfile(myDonorProfile.id, {
        donationHistory: [...history, newRecord],
        lastDonationDate: newDonationDate // Update last donation date too
      });
      setNewDonationDate('');
      setShowAddDonation(false);
    } catch (err) {
      console.error('Failed to add donation:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteDonation = async (recordId: string) => {
    if (!myDonorProfile) return;
    setSaveLoading(true);
    try {
      const history = (myDonorProfile.donationHistory || []).filter(r => r.id !== recordId);
      await updateDonorProfile(myDonorProfile.id, {
        donationHistory: history
      });
    } catch (err) {
      console.error('Failed to delete donation:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleShareApp = () => {
    if (navigator.share) {
      navigator.share({
        title: 'تطبيق بنك الدم - مديرية قعطبة',
        text: 'تطبيق خيري متكامل للتبرع بالدم يربط المتبرعين بالمحتاجين في مديرية قعطبة. حمله الآن وساهم في إنقاذ الأرواح.',
        url: window.location.origin
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.origin);
      alert('تم نسخ رابط التطبيق! شاركه مع أصدقائك الآن.');
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-[280px] sm:max-w-xs bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col font-['Cairo',sans-serif] text-right`}>
        
        {/* Header */}
        <div className="p-5 bg-linear-to-br from-red-600 to-rose-700 text-white shrink-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
          
          <div className="relative z-10 flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-inner overflow-hidden border border-white/20 flex items-center justify-center relative">
                <Droplet className="absolute w-6 h-6 text-red-600 fill-red-600 opacity-20" />
                <img 
                  src="/assets/images/app_logo_icon.jpg" 
                  alt="Logo" 
                  className="relative z-10 w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h2 className="text-base font-black leading-tight">قطرة دم تنقذ حياة إنسان</h2>
                <p className="text-[10px] font-bold text-red-100">مديرية قعطبة • المبادرة التطوعية</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative z-10 space-y-1">
            <h3 className="text-lg font-black truncate">{userProfile?.displayName || 'ضيف'}</h3>
            <div className="flex items-center gap-1.5 text-red-100 text-xs font-bold">
              <Phone className="w-3.5 h-3.5" />
              <span dir="ltr">{userProfile?.phone || 'بدون رقم هاتف'}</span>
            </div>
          </div>
        </div>

        {/* Navigation / Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Donation History Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-red-600" />
                <h4 className="text-sm font-black text-slate-900">سجل التبرع بالدم</h4>
              </div>
              <button 
                onClick={() => setShowAddDonation(!showAddDonation)}
                className="p-1 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {showAddDonation && (
              <div className="p-3 bg-red-50 rounded-2xl border border-red-100 animate-in slide-in-from-top-2 duration-200">
                <label className="block text-[10px] font-bold text-red-700 mb-1">تاريخ التبرع الجديد:</label>
                <div className="flex gap-2">
                  <input 
                    type="date" 
                    value={newDonationDate}
                    onChange={(e) => setNewDonationDate(e.target.value)}
                    className="flex-1 p-2 rounded-xl bg-white border border-red-200 text-xs font-bold outline-hidden focus:ring-2 focus:ring-red-500"
                  />
                  <button 
                    onClick={handleAddDonation}
                    disabled={!newDonationDate || saveLoading}
                    className="px-3 bg-red-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                  >
                    إضافة
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {myDonorProfile?.donationHistory?.length ? (
                myDonorProfile.donationHistory.map((record, index) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-2xs hover:border-red-100 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-xs font-black">
                        {index + 1}
                      </div>
                      <span className="text-xs font-bold text-slate-700">{record.date}</span>
                    </div>
                    <button 
                      onClick={() => handleDeleteDonation(record.id)}
                      className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400">لا يوجد سجل تبرع حالياً</p>
                </div>
              )}
            </div>
          </div>

          {/* Settings Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Settings className="w-4.5 h-4.5 text-slate-600" />
              <h4 className="text-sm font-black text-slate-900">الإعدادات</h4>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 mr-1">الاسم الكامل:</label>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold outline-hidden focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 mr-1">رقم الهاتف:</label>
                      <input 
                        type="tel" 
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold outline-hidden focus:ring-2 focus:ring-red-500"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveSettings}
                      disabled={saveLoading}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-sm"
                    >
                      {saveLoading ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
                    </button>
                    <button 
                      onClick={() => setIsSidebarEditing(false)}
                      className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                    >
                      إلغاء
                    </button>
                  </div>
                </>
              ) : (
                <button 
                  onClick={() => setIsSidebarEditing(true)}
                  className="w-full flex items-center justify-between p-1 group"
                >
                  <span className="text-xs font-bold text-slate-700 group-hover:text-red-600 transition-colors">تعديل الملف الشخصي</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-red-500 transition-all rotate-180" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <button 
              onClick={() => setShowAboutModal(true)}
              className="w-full flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-2xl shadow-2xs hover:bg-red-100/80 transition-colors text-right cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-red-950 block">من نحن (عن المبادرة)</span>
                <span className="text-[10px] text-red-700 font-bold block">مبادرة قعطبة الإنسانية</span>
              </div>
            </button>

            <button 
              onClick={handleShareApp}
              className="w-full flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-2xs hover:bg-slate-50 transition-colors text-right"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700">مشاركة التطبيق مع الأصدقاء</span>
            </button>

            {/* Unified Contact Management Section */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-black text-slate-900">التواصل مع الإدارة</span>
              </div>

              {/* In-app chat messaging */}
              <button 
                onClick={() => {
                  onOpenChat();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl hover:border-red-300 transition-colors text-right relative group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">إرسال رسالة عبر التطبيق</span>
                    <span className="text-[10px] text-slate-400">محادثة خاصة ومباشرة</span>
                  </div>
                </div>
                {conversation && conversation.unreadCountByUser > 0 && (
                  <span className="bg-red-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {conversation.unreadCountByUser}
                  </span>
                )}
              </button>

              {/* WhatsApp 773633918 */}
              <a 
                href="https://wa.me/967773633918"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100/80 transition-colors text-right"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-950 block">مراسلة عبر واتساب</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-800" dir="ltr">773633918</span>
                  </div>
                </div>
                <span className="text-[11px] font-black text-emerald-700 bg-white px-2 py-1 rounded-lg border border-emerald-200 shadow-2xs">مراسلة</span>
              </a>

              {/* Email ziadalsyyadi@gmail.com */}
              <a 
                href="mailto:ziadalsyyadi@gmail.com"
                className="w-full flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors text-right"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">البريد الإلكتروني</span>
                    <span className="text-[10px] font-mono text-slate-500" dir="ltr">ziadalsyyadi@gmail.com</span>
                  </div>
                </div>
                <span className="text-[11px] font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">إيميل</span>
              </a>
            </div>

            {currentUser && (
              <button 
                onClick={async () => {
                  try {
                    await logout();
                    onClose();
                  } catch (e) {
                    console.error('Logout error:', e);
                  }
                }}
                className="w-full flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 hover:bg-rose-100 transition-colors text-right cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                  <LogOut className="w-4 h-4 rotate-180" />
                </div>
                <span className="text-xs font-black">تسجيل الخروج من الحساب</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 text-center space-y-1 shrink-0">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-black text-slate-800">
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            <span>قطرة دم تنقذ حياة إنسان</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold">مديرية قعطبة • الإصدار 1.2.0</p>
        </div>
      </div>

      <AboutUsModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />
    </>
  );
};
