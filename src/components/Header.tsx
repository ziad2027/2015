import React from 'react';
import { Bell, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenInstallModal: () => void;
  onGoToProfile: () => void;
  onGoToUrgent?: () => void;
  onOpenNotifications?: () => void;
  onOpenRoleModal: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  onOpenInstallModal,
  onGoToProfile,
  onGoToUrgent,
  onOpenNotifications,
  onOpenRoleModal,
  unreadCount = 2,
}) => {
  const { activeRole, logout } = useAuth();

  const iconPath = '/assets/aistudio/1793046289767_eb8707e3.jpg';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-xs">
      <div className="max-w-4xl mx-auto px-3 py-2 flex items-center justify-between gap-1.5">
        
        {/* Right Side: App Icon + App Name */}
        <div className="flex items-center gap-2 shrink-0 overflow-hidden">
          <div className="relative shrink-0 cursor-pointer" onClick={onGoToProfile}>
            <div className="p-0.5 rounded-full border-2 border-rose-500 shadow-sm">
              <img
                src={iconPath}
                alt="أيقونة تطبيق قطرة دم"
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full animate-ping"></span>
          </div>

          <div className="flex flex-col text-right">
            <div className="flex items-center gap-1.5">
              <h1 className="text-[13px] sm:text-base font-black text-slate-900 leading-none whitespace-nowrap">
                قطرة دم تنقذ حياة إنسان
              </h1>
              <span className="text-[9px] sm:text-[10px] bg-rose-50 text-rose-500 font-extrabold px-1.5 py-0.5 rounded-full border border-rose-100 shrink-0">
                خيري
              </span>
            </div>
            <p className="text-[9px] sm:text-[11px] text-slate-500 font-bold mt-0.5 whitespace-nowrap">
              سجل المتبرعين بالدم • مديرية قعطبة
            </p>
          </div>
        </div>

        {/* Left Side: Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenRoleModal}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-black transition-all border shadow-xs ${
              activeRole === 'admin'
                ? 'bg-amber-50 text-amber-700 border-amber-100'
                : 'bg-sky-50 text-sky-700 border-sky-100'
            }`}
          >
            <span className="font-extrabold order-2">
              {activeRole === 'admin' ? 'مسؤول' : 'مستخدم'}
            </span>
            <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 order-1" />
          </button>

          <button
            onClick={onOpenNotifications || onGoToUrgent || onGoToProfile}
            title="الإشعارات والتنبيهات الواردة"
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-50 border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-red-600 text-white font-black text-[9px] flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};

