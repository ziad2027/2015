import React from 'react';
import { Bell, RefreshCw, Menu, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenInstallModal: () => void;
  onOpenSidebar: () => void;
  onGoToUrgent?: () => void;
  onOpenNotifications?: () => void;
  onOpenRoleModal: () => void;
  onGlobalRefresh?: () => void;
  isRefreshing?: boolean;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  onOpenInstallModal,
  onOpenSidebar,
  onGoToUrgent,
  onOpenNotifications,
  onOpenRoleModal,
  onGlobalRefresh,
  isRefreshing = false,
  unreadCount = 2,
}) => {
  const { activeRole } = useAuth();
  const iconPath = '/assets/images/app_logo_icon.jpg';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-xs">
      <div className="max-w-4xl mx-auto px-3 py-2 flex items-center justify-between gap-1.5">
        
        {/* Right Side: Hamburger + App Branding */}
        <div className="flex items-center gap-2.5 shrink-0 overflow-hidden">
          <button 
            onClick={onOpenSidebar}
            className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 overflow-hidden">
            <div className="relative shrink-0">
              <div className="p-0.5 rounded-full border-2 border-rose-500 shadow-sm">
                <img
                  src={iconPath}
                  alt="أيقونة بنك الدم"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>

            <div className="flex flex-col text-right">
              <h1 className="text-[11px] sm:text-sm font-black text-slate-900 leading-none whitespace-nowrap">
                قطرة دم تنقذ حياة إنسان
              </h1>
              <p className="text-[9px] text-slate-400 font-bold mt-1 whitespace-nowrap leading-none">
                بنك الدم في مديرية قعطبة
              </p>
            </div>
          </div>
        </div>

        {/* Left Side: Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Admin Role Badge (Static Indicator) */}
          {activeRole === 'admin' && (
            <button 
              onClick={onOpenRoleModal}
              className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-black shadow-xs hidden sm:block"
            >
              وضع المسؤول ✓
            </button>
          )}

          {/* User/Admin Role Switch Button */}
          <button
            onClick={onOpenRoleModal}
            title="تبديل وضع المستخدم (مسؤول / متبرع)"
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer ${
              activeRole === 'admin' 
                ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:text-red-600 hover:bg-red-50'
            }`}
          >
            <UserCircle className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
          </button>

          {/* Comprehensive App Refresh Button */}
          {onGlobalRefresh && (
            <button
              onClick={onGlobalRefresh}
              disabled={isRefreshing}
              title="تحديث شامل للتطبيق وسحب أي إضافات وتعديلات جديدة فوراً"
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-50 border border-slate-200 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 flex items-center justify-center transition-all shadow-xs cursor-pointer ${
                isRefreshing ? 'opacity-80' : 'active:scale-95'
              }`}
            >
              <RefreshCw className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          )}

          <button
            onClick={() => {
              if (onOpenNotifications) {
                onOpenNotifications();
              } else if (onGoToUrgent) {
                onGoToUrgent();
              }
            }}
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

