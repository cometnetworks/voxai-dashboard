import React from 'react';
import { Menu } from 'lucide-react';

export default function Header({ title, setIsMobileOpen }) {
  return (
    <header className="flex items-center justify-between p-4 lg:px-8 lg:py-4 bg-surface-container-lowest/80 backdrop-blur-xl z-30 sticky top-0">
      <div className="flex items-center gap-4">
        <button onClick={() => setIsMobileOpen(true)} className="lg:hidden p-2 -ml-2 text-on-surface-variant hover:text-on-surface transition-colors">
          <Menu size={24} />
        </button>
        <span className="font-bold text-xl capitalize text-on-surface">{title}</span>
      </div>
    </header>
  );
}
