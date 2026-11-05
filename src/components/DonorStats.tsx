import React from 'react';
import { Donor, BLOOD_TYPES } from '../types';
import { TrendingUp, Users, Droplets } from 'lucide-react';

interface DonorStatsProps {
  donors: Donor[];
}

export const DonorStats: React.FC<DonorStatsProps> = ({ donors }) => {
  const stats = BLOOD_TYPES.map(type => ({
    type,
    count: donors.filter(d => d.bloodType === type).length
  }));

  const totalDonors = donors.length;
  const availableDonors = donors.filter(d => d.isAvailable).length;

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-5 font-['Cairo',sans-serif]">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5 text-right">
          <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">إحصائيات بنك الدم</h3>
            <p className="text-[10px] text-slate-500 font-bold">توزع فصائل الدم في قعطبة</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-sm font-black text-red-600">{totalDonors}</span>
          <span className="text-[9px] text-slate-400 font-bold">متبرع مسجل</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {stats.map((s) => (
          <div key={s.type} className="bg-slate-50 rounded-2xl p-2.5 border border-slate-100 flex flex-col items-center justify-center space-y-1 hover:bg-red-50 hover:border-red-100 transition-all group">
            <span className="text-xs font-black text-slate-700 group-hover:text-red-600">{s.type}</span>
            <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
              <div 
                className="bg-red-500 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${totalDonors > 0 ? (s.count / totalDonors) * 100 : 0}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-black text-slate-500 group-hover:text-red-500">{s.count}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <div className="flex-1 flex items-center gap-2 p-2.5 bg-emerald-50 rounded-2xl border border-emerald-100">
          <Users className="w-4 h-4 text-emerald-600" />
          <div>
            <span className="text-[10px] font-black text-emerald-950 block">المتاحون الآن</span>
            <span className="text-xs font-black text-emerald-600">{availableDonors} متبرع</span>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-2 p-2.5 bg-blue-50 rounded-2xl border border-blue-100">
          <Droplets className="w-4 h-4 text-blue-600" />
          <div>
            <span className="text-[10px] font-black text-blue-950 block">الفصائل المغطاة</span>
            <span className="text-xs font-black text-blue-600">8 / 8</span>
          </div>
        </div>
      </div>
    </div>
  );
};
