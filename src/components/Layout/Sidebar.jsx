import React from 'react';
import { LayoutDashboard, GitMerge, Users, Target, FileText, Video, Sun, Moon, X, Settings } from 'lucide-react';

function SidebarItem({ icon, label, view, currentView, onClick, badge, alert, collapsed }) {
  const active = currentView === view;
  return (
    <button onClick={onClick} className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg transition-all duration-200 ${active ? 'bg-gradient-to-tr from-primary/10 to-primary-container/20 text-primary font-medium shadow-[inset_2px_0_0_0_var(--color-primary-container)]' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'} group relative`}>
      <div className="flex items-center gap-3">
        <span className={active ? 'text-primary' : 'group-hover:text-primary-container transition-colors'}>{icon}</span>
        {!collapsed && <span className="text-sm">{label}</span>}
      </div>
      {!collapsed && badge !== undefined && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${alert ? 'bg-error/10 text-error' : 'bg-surface-container text-on-surface-variant group-hover:bg-surface-container-high group-hover:text-on-surface'}`}>
          {badge}
        </span>
      )}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-surface-container-highest text-on-surface text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-elevation">
          {label}
        </div>
      )}
    </button>
  );
}

export default function Sidebar({ currentView, setCurrentView, isDark, toggleTheme, collapsed, setCollapsed, isMobileOpen, setIsMobileOpen, prospectsCount, urgentCount }) {
  return (
    <>
      {isMobileOpen && <div className="fixed inset-0 bg-background/80 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 ${collapsed ? 'w-20' : 'w-64'} bg-surface-container-lowest transform transition-all duration-300 ease-in-out flex flex-col ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className={`p-6 hidden lg:flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-lg shadow-primary-container/20 cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
            <span className="text-on-primary font-bold text-lg">VX</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-xl text-on-surface leading-tight">Vox Media</h1>
              <p className="text-xs text-on-surface-variant">AI Pipeline Dashboard</p>
            </div>
          )}
        </div>
        <div className="lg:hidden p-4 flex justify-between items-center bg-surface-container-lowest">
           <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
              <span className="text-on-primary font-bold text-sm">VX</span>
            </div>
            <span className="font-bold text-lg text-on-surface">Vox Media AI</span>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="text-on-surface-variant"><X size={24} /></button>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {!collapsed && <p className="px-3 text-xs font-semibold text-on-surface-variant/60 uppercase tracking-widest mb-4">Navegación</p>}
          <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard" view="dashboard" currentView={currentView} onClick={() => { setCurrentView('dashboard'); setIsMobileOpen(false); }} collapsed={collapsed} />
          <SidebarItem icon={<GitMerge size={18} />} label="Pipeline" view="pipeline" currentView={currentView} onClick={() => { setCurrentView('pipeline'); setIsMobileOpen(false); }} collapsed={collapsed} />
          <SidebarItem icon={<Users size={18} />} label="Prospectos" view="prospectos" currentView={currentView} onClick={() => { setCurrentView('prospectos'); setIsMobileOpen(false); }} badge={prospectsCount} collapsed={collapsed} />
          <SidebarItem icon={<Target size={18} />} label="Oportunidades" view="oportunidades" currentView={currentView} onClick={() => { setCurrentView('oportunidades'); setIsMobileOpen(false); }} badge={urgentCount} alert collapsed={collapsed} />
          <SidebarItem icon={<Video size={18} />} label="Reuniones" view="reuniones" currentView={currentView} onClick={() => { setCurrentView('reuniones'); setIsMobileOpen(false); }} collapsed={collapsed} />
          <SidebarItem icon={<FileText size={18} />} label="Reportes" view="reportes" currentView={currentView} onClick={() => { setCurrentView('reportes'); setIsMobileOpen(false); }} collapsed={collapsed} />
          {!collapsed && <p className="px-3 pt-6 pb-2 text-xs font-semibold text-on-surface-variant/60 uppercase tracking-widest">Sistema</p>}
          <SidebarItem icon={<Settings size={18} />} label="Configuración" view="settings" currentView={currentView} onClick={() => { setCurrentView('settings'); setIsMobileOpen(false); }} collapsed={collapsed} />
        </nav>
        <div className="p-4 mt-auto">
          <div className="h-[1px] w-full bg-surface-container-low mb-4"></div>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between px-2'} py-2 mb-2`}>
            {!collapsed && <span className="text-sm font-medium text-on-surface-variant">Modo visual</span>}
            <button onClick={toggleTheme} className="p-2 rounded-lg bg-surface hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-2'} py-2 mt-2 group cursor-pointer hover:bg-surface-container-low rounded-lg transition-colors`}>
            <div className="w-8 h-8 shrink-0 rounded-full bg-surface text-primary flex items-center justify-center font-bold text-sm">M</div>
            {!collapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-on-surface truncate group-hover:text-primary-container transition-colors">Hola, Miguel</span>
                <span className="text-xs text-on-surface-variant">Admin</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
