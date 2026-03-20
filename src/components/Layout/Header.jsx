import React from 'react';
import { Menu } from 'lucide-react';

export default function Header({ title, setIsMobileOpen }) {
  return (
    <header className="flex items-center justify-between p-4 lg:px-8 lg:py-4 border-b border-slate-200 dark:border-slate-800/50 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-sm z-30 sticky top-0">
      <div className="flex items-center gap-4">
        <button onClick={() => setIsMobileOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
          <Menu size={24} />
        </button>
        <span className="font-bold text-xl dark:text-white capitalize text-slate-800 dark:text-slate-100">{title}</span>
      </div>
    </header>
  );
}
