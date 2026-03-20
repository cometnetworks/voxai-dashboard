import React from 'react';
import { LayoutDashboard, GitMerge, Users, Target, FileText, Video, Sun, Moon, X } from 'lucide-react';

function SidebarItem({ icon, label, view, currentView, onClick, badge, alert, collapsed }) {
  const active = currentView === view;
  return (
    <button onClick={onClick} className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg transition-all duration-200 ${active ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'} group relative`}>
      <div className="flex items-center gap-3">
        <span className={active ? 'text-blue-600 dark:text-blue-400' : ''}>{icon}</span>
        {!collapsed && <span className="text-sm">{label}</span>}
      </div>
      {!collapsed && badge !== undefined && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${alert ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
          {badge}
        </span>
      )}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
          {label}
        </div>
      )}
    </button>
  );
}

export default function Sidebar({ currentView, setCurrentView, isDark, toggleTheme, collapsed, setCollapsed, isMobileOpen, setIsMobileOpen, prospectsCount, urgentCount }) {
  return (
    <>
      {isMobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 ${collapsed ? 'w-20' : 'w-64'} bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-slate-800/60 transform transition-all duration-300 ease-in-out flex flex-col ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className={`p-6 hidden lg:flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
            <span className="text-white font-bold text-lg">VX</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-xl dark:text-white leading-tight">Vox Media</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">AI Pipeline Dashboard</p>
            </div>
          )}
        </div>
        <div className="lg:hidden p-4 flex justify-between items-center bg-[#0F172A] border-b border-slate-800/60">
           <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">VX</span>
            </div>
            <span className="font-bold text-lg dark:text-white">Vox Media AI</span>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="text-slate-500"><X size={24} /></button>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {!collapsed && <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Navegación</p>}
          <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard" view="dashboard" currentView={currentView} onClick={() => { setCurrentView('dashboard'); setIsMobileOpen(false); }} collapsed={collapsed} />
          <SidebarItem icon={<GitMerge size={18} />} label="Pipeline" view="pipeline" currentView={currentView} onClick={() => { setCurrentView('pipeline'); setIsMobileOpen(false); }} collapsed={collapsed} />
          <SidebarItem icon={<Users size={18} />} label="Prospectos" view="prospectos" currentView={currentView} onClick={() => { setCurrentView('prospectos'); setIsMobileOpen(false); }} badge={prospectsCount} collapsed={collapsed} />
          <SidebarItem icon={<Target size={18} />} label="Oportunidades" view="oportunidades" currentView={currentView} onClick={() => { setCurrentView('oportunidades'); setIsMobileOpen(false); }} badge={urgentCount} alert collapsed={collapsed} />
          <SidebarItem icon={<Video size={18} />} label="Reuniones" view="reuniones" currentView={currentView} onClick={() => { setCurrentView('reuniones'); setIsMobileOpen(false); }} collapsed={collapsed} />
          <SidebarItem icon={<FileText size={18} />} label="Reportes" view="reportes" currentView={currentView} onClick={() => { setCurrentView('reportes'); setIsMobileOpen(false); }} collapsed={collapsed} />
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/60">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between px-2'} py-2 mb-2`}>
            {!collapsed && <span className="text-sm font-medium">Modo visual</span>}
            <button onClick={toggleTheme} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-2'} py-2 mt-2`}>
            <div className="w-8 h-8 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">M</div>
            {!collapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium dark:text-white truncate">Hola, Miguel</span>
                <span className="text-xs text-slate-500">Admin</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
