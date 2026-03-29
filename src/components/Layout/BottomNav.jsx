import React from 'react';
import { LayoutDashboard, Users, UserPlus, SendHorizontal, Settings } from 'lucide-react';

const navItems = [
  { id: 'dashboard',       icon: LayoutDashboard,  label: 'Home' },
  { id: 'prospectos',      icon: Users,             label: 'Prospectos' },
  { id: 'enriquecimiento', icon: UserPlus,          label: 'Enriquecer' },
  { id: 'cola',            icon: SendHorizontal,    label: 'Cola' },
  { id: 'settings',        icon: Settings,          label: 'Config' },
];

export default function BottomNav({ currentView, setCurrentView }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-t border-white/5 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors ${
                isActive
                  ? 'text-primary-container'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
