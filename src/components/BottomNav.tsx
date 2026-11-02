import React from 'react';
import { Home, Users, Droplet, UserCircle, HeartHandshake } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  urgentCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  urgentCount,
}) => {
  const navItems = [
    {
      id: 'home' as ActiveTab,
      label: 'الرئيسية',
      icon: Home,
    },
    {
      id: 'search' as ActiveTab,
      label: 'المتبرعون',
      icon: Users,
    },
    {
      id: 'urgent' as ActiveTab,
      label: 'طلبات الدم',
      icon: Droplet,
      badge: urgentCount > 0 ? urgentCount : undefined,
    },
    {
      id: 'profile' as ActiveTab,
      label: 'حسابي',
      icon: UserCircle,
    },
    {
      id: 'info' as ActiveTab,
      label: 'فوائد التبرع',
      icon: HeartHandshake,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-t border-slate-200/80 shadow-lg pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all select-none active:scale-95 ${
                isActive
                  ? 'text-red-600 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              {/* Active Indicator Top Pill */}
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-red-600 rounded-b-full shadow-xs shadow-red-400"></span>
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.5] text-red-600' : 'stroke-[1.8]'
                  }`}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-red-600 text-white text-[10px] font-black flex items-center justify-center rounded-full shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[11px] leading-none tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
