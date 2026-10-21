import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Ship, 
  DollarSign, 
  PieChart 
} from 'lucide-react';

const MOBILE_ITEMS = [
  { to: '/', label: 'Tổng Quan', icon: LayoutDashboard },
  { to: '/contracts', label: 'Hợp Đồng', icon: FileText },
  { to: '/shipments', label: 'Lô Hàng', icon: Ship },
  { to: '/costs', label: 'Chi Phí', icon: DollarSign },
  { to: '/reports', label: 'Báo Cáo', icon: PieChart },
];

export const BottomNav: React.FC = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 pb-safe">
      <div className="flex items-center justify-around px-2 py-1.5">
        {MOBILE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-1 rounded-xl transition-colors ${
                  isActive
                    ? 'text-emerald-600 font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-emerald-50 text-emerald-600' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
