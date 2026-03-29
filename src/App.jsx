import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import BottomNav from './components/Layout/BottomNav';
import { useData } from './hooks/useData';
import { useTheme } from './hooks/useTheme';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import Prospects from './pages/Prospects';
import Opportunities from './pages/Opportunities';
import Detail from './pages/Detail';
import Reports from './pages/Reports';
import Meetings from './pages/Meetings';
import Settings from './pages/Settings';

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedProspect, setSelectedProspect] = useState(null);
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const {
    prospects, setProspects,
    meetings, setMeetings,
    reportsHistory, setReportsHistory,
    isLoading
  } = useData();

  const navigateTo = (view, prospect = null) => {
    if (prospect) setSelectedProspect(prospect);
    setCurrentView(view);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard prospects={prospects} navigateTo={navigateTo} />;
      case 'pipeline': return <Pipeline prospects={prospects} />;
      case 'prospectos': return <Prospects prospects={prospects} setProspects={setProspects} navigateTo={navigateTo} />;
      case 'oportunidades': return <Opportunities prospects={prospects} navigateTo={navigateTo} />;
      case 'detalle': return <Detail prospect={selectedProspect} setProspects={setProspects} navigateTo={navigateTo} />;
      case 'reportes': return <Reports prospects={prospects} setProspects={setProspects} reportsHistory={reportsHistory} setReportsHistory={setReportsHistory} />;
      case 'reuniones': return <Meetings prospects={prospects} meetings={meetings} setMeetings={setMeetings} />;
      case 'settings': return <Settings isDark={isDark} toggleTheme={toggleTheme} />;
      default: return <Dashboard prospects={prospects} navigateTo={navigateTo} />;
    }
  };

  const getPageTitle = () => {
    const titles = {
      'dashboard': 'Dashboard',
      'pipeline': 'Pipeline',
      'prospectos': 'Prospectos',
      'oportunidades': 'Oportunidades',
      'detalle': 'Detalle de Prospecto',
      'reportes': 'Reportes',
      'reuniones': 'Reuniones',
      'settings': 'Configuración'
    };
    return titles[currentView] || 'Dashboard';
  };

  const urgentCount = prospects.filter(p => ['Urgente', 'Alta', 'High'].includes(p.priority)).length;

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#0B1120]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-on-surface-variant">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 transition-colors duration-300`}>
      <Toaster 
        toastOptions={{
          style: {
            background: isDark ? '#1e293b' : '#fff',
            color: isDark ? '#fff' : '#0f172a',
          }
        }} 
      />
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isDark={isDark} 
        toggleTheme={toggleTheme} 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen}
        prospectsCount={prospects.length}
        urgentCount={urgentCount}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={getPageTitle()} setIsMobileOpen={setIsMobileOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 dark:bg-[#0B1120]/50 relative pb-20 md:pb-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-500/5 dark:bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="p-4 lg:p-8 max-w-7xl mx-auto relative z-10 w-full animate-fade-in">
            {renderContent()}
          </div>
        </main>
      </div>

      <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  );
}
