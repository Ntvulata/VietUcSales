import React from 'react';
import { Ship, Wifi } from 'lucide-react';

interface HeaderProps {
  title: string;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 py-3.5 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="flex items-center gap-3">
        <div className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-600 text-white shadow-sm">
          <Ship className="w-5 h-5" />
        </div>
        <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
          <Wifi className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span className="hidden sm:inline">Firebase</span> Realtime
        </div>
      </div>
    </header>
  );
};
