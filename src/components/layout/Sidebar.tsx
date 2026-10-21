import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Ship, 
  DollarSign, 
  CreditCard, 
  PieChart, 
  Database,
  ArrowUpRight
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Tổng Quan', icon: LayoutDashboard },
  { to: '/contracts', label: 'Hợp Đồng Bán', icon: FileText },
  { to: '/shipments', label: 'Đợt Xuất Hàng', icon: Ship },
  { to: '/costs', label: 'Chi Phí Logistics', icon: DollarSign },
  { to: '/payments', label: 'Tiền Về & Thu Nợ', icon: CreditCard },
  { to: '/reports', label: 'Báo Cáo P&L', icon: PieChart },
  { to: '/master', label: 'Danh Mục Nguồn', icon: Database },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 min-h-screen border-r border-slate-800 shrink-0">
      {/* Brand logo & title */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/80">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-900/30">
          <Ship className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">Export Manager</h2>
          <p className="text-xs text-slate-400 font-medium">HĐ Bán Nông Sản & Bột</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-950/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="p-4 border-t border-slate-800/80 m-3 rounded-2xl bg-slate-800/40">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Hệ Thống Bán Hàng</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <p className="text-xs text-slate-500 font-mono">Firebase DB: banhang-e5939</p>
      </div>
    </aside>
  );
};
