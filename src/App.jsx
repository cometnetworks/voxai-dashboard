import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, GitMerge, Users, Target, FileText, Video, Sun, Moon, 
  Download, Copy, UploadCloud, Search, CheckCircle, Clock, ChevronRight, 
  Menu, X, Building2, Mail, Briefcase, AlertCircle
} from 'lucide-react';
import { extractTextFromPdf, analyzeProspectsWithAI } from './parser';

// --- INITIAL DATA EXTRACTED FROM PDF ---
const defaultProspects = [
  {
    id: 'p1', company: 'SCITUM S.A. de C.V.', industry: 'Ciberseguridad / MSSP', score: 92,
    priority: 'Alta', status: 'Prospecto', decisionMaker: 'Cristina Hernández Fernández',
    role: 'CEO', email: 'cristina.hernandez@scitum.com.mx', linkedinSearch: 'Cristina Hernández Fernández SCITUM CEO',
    trigger: 'Necesidad de flujo constante de proyectos enterprise para 500+ especialistas.',
    painPoints: ['Pipeline inconsistente con alto costo de talento ocioso', 'Competencia con integradores globales (IBM, Accenture)', 'Ciclos de venta muy largos (6-9 meses)', 'Saturación en México, necesidad de expandir a LATAM'],
    techStack: 'SentinelOne, Palo Alto, SIEM/SOC propietario',
    useCase: 'Conectar con CISOs de Fortune 500 en LATAM para outsourcing de SOC y migración a servicios gestionados.',
    draftSubject: 'Cristina: Pipeline de CISOs para SCITUM',
    draftEmail: `Estimada Cristina:\n\nComo MSSP líder con 500+ especialistas certificados, sé que tu mayor desafio no es la capacidad técnica, sino mantener tu pipeline con proyectos de alto valor.\n\nEn Vox Media Agency ayudamos a empresas como Red Hat y HPE a reducir 70% el tiempo de prospección. Para SCITUM específicamente:\n\n• Acceso directo a CISOs de Fortune 500 LATAM evaluando MDR/SOC\n• Reuniones confirmadas con decisores que ya tienen presupuesto\n• Leads verificados con celular directo\n\n¿Tienes 20 minutos esta semana para explorar cómo llenar tu Q1 con oportunidades reales?\n\nSaludos,\nMiguel\nVox Media Agency`
  },
  {
    id: 'p2', company: 'KIO Cyber (KIO Networks)', industry: 'Ciberseguridad / Data Centers',
    score: 89, priority: 'Alta', status: 'Oportunidad', decisionMaker: 'Octavio Camarena',
    role: 'CEO KIO Networks', email: 'ocamarena@kionetworks.com', linkedinSearch: 'Octavio Camarena CEO KIO Networks',
    trigger: 'Expansión de dispositivos gestionados (de 2,200 a 5,000+).',
    painPoints: ['Dependencia de canal tradicional (conectividad)', 'Educación del mercado en MDR vs Antivirus', 'Commoditización de servicios SOC por precio', 'Bajo cross-sell en base instalada'],
    techStack: 'SOC 24/7 propietario, MDR, Splunk/QRadar, KIO Data Centers',
    useCase: 'Reuniones con CTOs de empresas (500-2000 emp.) evaluando MDR y startups con necesidad de compliance SOC2.',
    draftSubject: 'Octavio: De 2,200 a 5,000 dispositivos en KIO Cyber',
    draftEmail: `Estimado Octavio:\n\nKIO Cyber tiene infraestructura de clase mundial (99.28% SLA, SOC 24/7), pero escalar de 2,200 a 5,000+ dispositivos gestionados requiere pipeline agresivo.\n\nEn Vox especializamos en ciberseguridad:\n• Reuniones confirmadas con CTOs evaluando MDR este trimestre\n• Acceso directo a decisores con incidentes recientes\n\nRed Hat redujo 70% su tiempo de prospección con nuestro modelo.\n\n¿20 minutos el jueves o viernes para mapear tu ICP y arrancar en marzo?\n\nSaludos,\nMiguel`
  },
  {
    id: 'p3', company: 'MCM Telecom', industry: 'Telecomunicaciones / IT',
    score: 85, priority: 'Media', status: 'Prospecto', decisionMaker: 'Alejandro Hernández Bringas',
    role: 'CEO', email: 'ahernandez@mcmtelecom.com.mx', linkedinSearch: 'Alejandro Hernández Bringas CEO MCM Telecom',
    trigger: 'Baja penetración de servicios de ciberseguridad en base de clientes telecom.',
    painPoints: ['Percepción como commodity telco, no partner de seguridad', 'Competencia dura contra pure-players', 'Falta de casos de éxito visibles anti-DDoS'],
    techStack: 'Juniper-Corero anti-DDoS, Symphony UCaaS, ISO 27001',
    useCase: 'Upsell de seguridad a base de 820+ clientes enterprise e identificación de prospectos evaluando SASE.',
    draftSubject: 'Alejandro: Monetizar ciberseguridad en base MCM',
    draftEmail: `Estimado Alejandro:\n\nMCM domina telecomunicaciones empresariales, pero monetizar ciberseguridad en tu base instalada requiere approach diferente al de conectividad.\n\nVox trabaja con telcos expandiendo a security:\n• Identificamos CIOs en tu cartera con presupuesto separado de ciberseguridad\n• Generamos reuniones que valoran bundle telecom + anti-DDoS\n\n¿15-20 minutos para diseñar estrategia de cross-sell de seguridad?\n\nSaludos,\nMiguel`
  },
  {
    id: 'p4', company: 'CYCSAS Ciberseguridad', industry: 'Boutique Ciberseguridad', score: 88,
    priority: 'Alta', status: 'Propuesta', decisionMaker: 'Enaela Lilian García Villeda',
    role: 'CEO y Fundadora', email: 'enaela.garcia@cycsas.com.mx', linkedinSearch: 'Enaela García Villeda CYCSAS fundadora',
    trigger: 'Necesidad de filtrar prospectos exploratorios para optimizar tiempo de preventa.',
    painPoints: ['Limitación de escala humana (preventa mal invertida)', 'Diferenciación en mercado saturado vs MSSPs grandes', 'Dependencia de referidos para crecer'],
    techStack: 'Netskope SASE, Monitoreo 24/7, ISO/PCI-DSS, PMI',
    useCase: 'Conectar con mid-market evaluando Netskope SASE y empresas en proceso de certificación ISO 27001.',
    draftSubject: 'Enaela: Optimizar pipeline de CYCSAS sin crecer comercial',
    draftEmail: `Estimada Enaela:\n\nFelicidades por 20 años y 200+ clientes. Como boutique especializada, tu diferenciador es expertise técnico, pero escalar requiere optimizar tiempo de tu equipo en prospectos con fit real.\n\nEn Vox eliminamos ruido:\n• Solo enviamos reuniones con empresas que YA tienen proyecto activo\n• Pre-calificamos presupuesto y timing de compra\n\n¿20 minutos para revisar tu ICP ideal y arrancar con 2-3 reuniones piloto?\n\nSaludos,\nMiguel`
  },
  {
    id: 'p5', company: 'Seekurity', industry: 'Auditoría / Pentesting', score: 95,
    priority: 'Urgente', status: 'Prospecto', decisionMaker: 'Hiram Alejandro Camarillo',
    role: 'CEO y Cofundador', email: 'hiram@seekurity.com', linkedinSearch: 'Hiram Alejandro Camarillo Seekurity',
    trigger: 'Falta de pipeline predecible enterprise a pesar de alto expertise técnico (bugs en FAANG).',
    painPoints: ['Brand awareness limitado vs consultoras grandes', 'Ciclos de venta erráticos por referidos', 'Competencia injusta por precio con offshore'],
    techStack: 'Burp Suite, Metasploit, Python/PHP/Java audit tools, OSINT',
    useCase: 'CISOs Fortune 500 para bug bounty interno, CTOs de Fintechs pre-funding para auditorías compliance.',
    draftSubject: 'Hiram: De bugs en FAANG a pipeline enterprise para Seekurity',
    draftEmail: `Estimado Hiram:\n\nImpresionante track record (bugs en Facebook, Google, Microsoft, Apple). Seekurity tiene credibilidad técnica de élite, pero convertir eso en pipeline enterprise es el reto.\n\nEn Vox conectamos boutiques técnicas con enterprise:\n• Acceso a CISOs de Fortune 500 LATAM con programa de bug bounty\n• Reuniones con CTOs de fintechs/healthtech que requieren auditorías GDPR/HIPAA\n\n¿20 minutos esta semana para mapear tu cliente ideal?\n\nSaludos,\nMiguel`
  }
];

const defaultMeetings = [
  { id: 1, prospectId: 'p2', date: '2026-03-20T10:00', link: 'https://meet.google.com/abc-defg-hij', notes: 'Revisión de ICP para KIO Cyber' },
  { id: 2, prospectId: 'p4', date: '2026-03-22T15:30', link: 'https://meet.google.com/xyz-uvwx-yz', notes: 'Presentación de propuesta comercial' }
];

const exportToCSV = (data) => {
  const headers = ['Compañía', 'Industria', 'Decisor', 'Cargo', 'Email', 'Score', 'Prioridad', 'Status'];
  const rows = data.map(p => [
    p.company, p.industry, p.decisionMaker, p.role, p.email, p.score, p.priority, p.status
  ]);
  
  const csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(",") + "\n" 
    + rows.map(e => e.map(item => `"${item}"`).join(",")).join("\n");
    
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `prospectos_vox_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [currentView, setCurrentView] = useState('dashboard');
  
  const [prospects, setProspects] = useState(() => {
    const saved = localStorage.getItem('vox_prospects');
    return saved ? JSON.parse(saved) : defaultProspects;
  });
  
  const [meetings, setMeetings] = useState(() => {
    const saved = localStorage.getItem('vox_meetings');
    return saved ? JSON.parse(saved) : defaultMeetings;
  });

  const [reportsHistory, setReportsHistory] = useState(() => {
    const saved = localStorage.getItem('vox_reports_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedProspect, setSelectedProspect] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    localStorage.setItem('vox_prospects', JSON.stringify(prospects));
  }, [prospects]);

  useEffect(() => {
    localStorage.setItem('vox_meetings', JSON.stringify(meetings));
  }, [meetings]);

  useEffect(() => {
    localStorage.setItem('vox_reports_history', JSON.stringify(reportsHistory));
  }, [reportsHistory]);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const showNotification = (msg, isError = false) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg, isError }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const navigateTo = (view, prospect = null) => {
    if (prospect) setSelectedProspect(prospect);
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView prospects={prospects} navigateTo={navigateTo} />;
      case 'pipeline': return <PipelineView prospects={prospects} />;
      case 'prospectos': return <ProspectsView prospects={prospects} setProspects={setProspects} navigateTo={navigateTo} />;
      case 'oportunidades': return <OpportunitiesView prospects={prospects} navigateTo={navigateTo} />;
      case 'detalle': return <DetailView prospect={selectedProspect} navigateTo={navigateTo} showNotification={showNotification} />;
      case 'reportes': return <ReportsView setProspects={setProspects} reportsHistory={reportsHistory} setReportsHistory={setReportsHistory} showNotification={showNotification} />;
      case 'reuniones': return <MeetingsView prospects={prospects} meetings={meetings} setMeetings={setMeetings} />;
      default: return <DashboardView prospects={prospects} navigateTo={navigateTo} />;
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0B1120] text-slate-300' : 'bg-slate-50 text-slate-800'}`}>
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {notifications.map(n => (
          <div key={n.id} className={`${n.isError ? 'bg-red-600 shadow-red-900/20' : 'bg-blue-600 shadow-blue-900/20'} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in-up`}>
            {n.isError ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            <span className="text-sm font-medium">{n.msg}</span>
          </div>
        ))}
      </div>

      <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800/50 bg-white dark:bg-[#0F172A]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">VX</span>
          </div>
          <span className="font-bold text-lg dark:text-white">Vox Media AI</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
          <Menu size={24} />
        </button>
      </div>

      <div className="flex h-[calc(100vh-65px)] lg:h-screen overflow-hidden relative">
        {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-slate-800/60 transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="p-6 hidden lg:flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-lg">VX</span>
            </div>
            <div>
              <h1 className="font-bold text-xl dark:text-white leading-tight">Vox Media</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">AI Pipeline Dashboard</p>
            </div>
          </div>
          <div className="lg:hidden p-4 flex justify-end">
            <button onClick={() => setIsSidebarOpen(false)} className="text-slate-500"><X size={24} /></button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Navegación</p>
            <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard" view="dashboard" currentView={currentView} onClick={() => navigateTo('dashboard')} />
            <SidebarItem icon={<GitMerge size={18} />} label="Pipeline" view="pipeline" currentView={currentView} onClick={() => navigateTo('pipeline')} />
            <SidebarItem icon={<Users size={18} />} label="Prospectos" view="prospectos" currentView={currentView} onClick={() => navigateTo('prospectos')} badge={prospects.length} />
            <SidebarItem icon={<Target size={18} />} label="Oportunidades" view="oportunidades" currentView={currentView} onClick={() => navigateTo('oportunidades')} badge={prospects.filter(p=>p.status==='Oportunidad' || p.priority==='Urgente').length} alert />
            <SidebarItem icon={<Video size={18} />} label="Reuniones" view="reuniones" currentView={currentView} onClick={() => navigateTo('reuniones')} />
            <SidebarItem icon={<FileText size={18} />} label="Reportes" view="reportes" currentView={currentView} onClick={() => navigateTo('reportes')} />
          </nav>
          <div className="p-4 border-t border-slate-200 dark:border-slate-800/60">
            <div className="flex items-center justify-between px-2 py-2 mb-2">
              <span className="text-sm font-medium">Modo visual</span>
              <button onClick={toggleTheme} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
            <div className="flex items-center gap-3 px-2 py-2 mt-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">M</div>
              <div className="flex flex-col">
                <span className="text-sm font-medium dark:text-white">Hola, Miguel</span>
                <span className="text-xs text-slate-500">Admin</span>
              </div>
            </div>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto relative bg-slate-50/50 dark:bg-[#0B1120]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-500/10 dark:bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="p-4 lg:p-8 max-w-7xl mx-auto relative z-10">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, view, currentView, onClick, badge, alert }) {
  const active = currentView === view;
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 ${active ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}>
      <div className="flex items-center gap-3">
        <span className={active ? 'text-blue-600 dark:text-blue-400' : ''}>{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      {badge !== undefined && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${alert ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function DashboardView({ prospects, navigateTo }) {
  const total = prospects.length;
  const avgScore = total ? Math.round(prospects.reduce((acc, p) => acc + (p.score || 0), 0) / total) : 0;
  const urgents = prospects.filter(p => ['Urgente', 'Alta', 'High'].includes(p.priority)).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Dashboard General</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Visión general del pipeline de investigación IA</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Total Prospectos" value={total} sub="Extraídos por IA" icon={<Users className="text-blue-500" />} />
        <KPICard title="Score Promedio" value={`${avgScore}/100`} sub="Conversión estimada" icon={<Target className="text-emerald-500" />} />
        <KPICard title="Alta Prioridad" value={urgents} sub="Requieren acción" icon={<AlertCircle className="text-red-500" />} alert />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold dark:text-white mb-6">Distribución por Status</h3>
          <div className="space-y-4">
            <BarItem label="Prospectos" count={prospects.filter(p=>p.status==='Prospecto' || !p.status).length} total={total} color="bg-blue-500" />
            <BarItem label="Oportunidades" count={prospects.filter(p=>p.status==='Oportunidad').length} total={total} color="bg-amber-500" />
            <BarItem label="Propuestas" count={prospects.filter(p=>p.status==='Propuesta').length} total={total} color="bg-purple-500" />
            <BarItem label="Cerrados" count={prospects.filter(p=>p.status==='Cerrado').length} total={total} color="bg-emerald-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold dark:text-white">Top Urgentes</h3>
            <button onClick={() => navigateTo('oportunidades')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Ver todos</button>
          </div>
          <div className="space-y-3">
            {prospects.filter(p => ['Urgente', 'Alta', 'High'].includes(p.priority)).sort((a,b)=>b.score-a.score).slice(0,3).map(p => (
              <div key={p.id} onClick={() => navigateTo('detalle', p)} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/50 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400"><Building2 size={16} /></div>
                  <div>
                    <p className="text-sm font-semibold dark:text-white">{p.company}</p>
                    <p className="text-xs text-slate-500">{p.industry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-1 rounded">{p.score}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, sub, icon, alert }) {
  return (
    <div className={`bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 shadow-sm relative overflow-hidden`}>
      {alert && <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 dark:bg-red-500/5 rounded-bl-full blur-xl" />}
      <div className="flex justify-between items-start mb-4">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">{icon}</div>
      </div>
      <h4 className="text-3xl font-bold dark:text-white mb-1">{value}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-500">{sub}</p>
    </div>
  );
}

function BarItem({ label, count, total, color }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1"><span className="dark:text-slate-300">{label}</span><span className="dark:text-slate-400">{count} ({percentage}%)</span></div>
      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function PipelineView({ prospects }) {
  const stages = ['Prospecto', 'Oportunidad', 'Propuesta', 'Cerrado'];
  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="mb-6"><h2 className="text-2xl font-bold dark:text-white">Pipeline de Ventas</h2><p className="text-sm text-slate-500 mt-1">Vista Kanban de prospección</p></div>
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {stages.map(stage => (
          <div key={stage} className="flex-none w-80 bg-slate-100/50 dark:bg-[#111827]/50 border border-slate-200 dark:border-slate-800/60 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm dark:text-slate-300 uppercase tracking-wider">{stage}</h3>
              <span className="text-xs font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-md shadow-sm">{prospects.filter(p => p.status === stage || (!p.status && stage==='Prospecto')).length}</span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {prospects.filter(p => p.status === stage || (!p.status && stage==='Prospecto')).map(p => (
                <div key={p.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700/50 hover:border-blue-500/50 transition-colors cursor-grab">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${['Urgente', 'High'].includes(p.priority) ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : p.priority === 'Alta' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>{p.priority}</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{p.score}</span>
                  </div>
                  <h4 className="font-medium text-sm dark:text-white leading-tight mb-1">{p.company}</h4>
                  <p className="text-xs text-slate-500 truncate">{p.decisionMaker}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProspectsView({ prospects, setProspects, navigateTo }) {
  const [searchTerm, setSearchTerm] = useState('');
  const filtered = prospects.filter(p => (p.company||'').toLowerCase().includes(searchTerm.toLowerCase()) || (p.industry||'').toLowerCase().includes(searchTerm.toLowerCase()));
  const updateField = (id, field, value) => {
    setProspects(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div><h2 className="text-2xl font-bold dark:text-white">Directorio de Prospectos</h2><p className="text-sm text-slate-500 mt-1">{prospects.length} empresas encontradas</p></div>
        <button onClick={() => exportToCSV(prospects)} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 px-4 py-2 rounded-lg text-sm transition-colors"><Download size={16}/>Exportar CSV</button>
      </div>
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/60 flex items-center gap-3">
          <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input type="text" placeholder="Buscar empresa o industria..." className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-800/60"><tr><th className="px-4 py-3">Compañía</th><th className="px-4 py-3">Decisor</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Acción</th></tr></thead><tbody className="divide-y divide-slate-800/60">
          {filtered.map(p => (
            <tr key={p.id} className="hover:bg-slate-800/20">
              <td className="px-4 py-4"><p className="font-semibold dark:text-white">{p.company}</p><p className="text-xs text-slate-500">{p.industry}</p></td>
              <td className="px-4 py-4"><p className="font-medium dark:text-slate-200">{p.decisionMaker}</p><p className="text-xs text-slate-500">{p.role}</p></td>
              <td className="px-4 py-4"><input type="text" value={p.email||''} onChange={(e) => updateField(p.id, 'email', e.target.value)} className="bg-transparent border-none text-sm w-full outline-none" /></td>
              <td className="px-4 py-4"><span className="inline-flex bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs">{p.score}</span></td>
              <td className="px-4 py-4">
                <select value={p.status||'Prospecto'} onChange={(e) => updateField(p.id, 'status', e.target.value)} className="bg-slate-800 text-xs rounded p-1.5 focus:outline-none">
                  <option value="Prospecto">Prospecto</option><option value="Oportunidad">Oportunidad</option><option value="Propuesta">Propuesta</option><option value="Cerrado">Cerrado</option>
                </select>
              </td>
              <td className="px-4 py-4"><button onClick={() => navigateTo('detalle', p)} className="text-blue-400 text-xs px-3 py-1.5 rounded-md hover:bg-blue-500/10">Ver detalle</button></td>
            </tr>
          ))}
        </tbody></table></div>
      </div>
    </div>
  );
}

function OpportunitiesView({ prospects, navigateTo }) {
  const urgents = prospects.filter(p => ['Urgente', 'Alta', 'High'].includes(p.priority));
  return (
    <div className="animate-fade-in space-y-6">
      <div><h2 className="text-2xl font-bold dark:text-white">Oportunidades Urgentes</h2></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {urgents.map(p => (
          <div key={p.id} className="bg-[#111827] border border-slate-800/60 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center"><Building2 size={20}/></div>
                <div><h3 className="font-bold text-lg dark:text-white">{p.company}</h3><p className="text-xs text-slate-500">{p.industry}</p></div>
              </div>
              <div className="flex flex-col items-end gap-1"><span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{p.score}</span><span className="text-[10px] text-red-400 uppercase">{p.priority}</span></div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between">
              <div><p className="text-xs font-medium dark:text-slate-200">{p.decisionMaker}</p><p className="text-[10px] text-slate-500">{p.role}</p></div>
              <button onClick={() => navigateTo('detalle', p)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg">Ver Detalle</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailView({ prospect, navigateTo, showNotification }) {
  if (!prospect) return <div className="text-center py-20 text-slate-500">Selecciona un prospecto.</div>;
  const copy = (text) => { navigator.clipboard.writeText(text); showNotification('Copiado'); };
  
  return (
    <div className="animate-fade-in space-y-6 pb-20">
      <button onClick={() => navigateTo('prospectos')} className="flex items-center gap-2 text-sm text-slate-400"><ChevronRight className="rotate-180" size={16}/> Volver</button>
      <div className="bg-[#111827] border border-slate-800/60 rounded-xl p-6 relative overflow-hidden">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center"><Building2 size={32} className="text-white"/></div>
          <div><h1 className="text-2xl font-bold dark:text-white">{prospect.company}</h1><p className="text-sm text-slate-400 mt-1">{prospect.industry}</p></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InsightCard title="TRIGGER" icon={<AlertCircle size={16} className="text-orange-500"/>} content={prospect.trigger}/>
        <InsightCard title="DOLORES" icon={<Target size={16} className="text-red-500"/>} content={<ul className="list-disc pl-4">{(prospect.painPoints||[]).map((p,i)=><li key={i}>{p}</li>)}</ul>}/>
        <InsightCard title="USO VOX" icon={<GitMerge size={16} className="text-blue-500"/>} content={prospect.useCase}/>
        <InsightCard title="STACK" icon={<Briefcase size={16} className="text-emerald-500"/>} content={prospect.techStack}/>
      </div>
      <div className="bg-[#111827] border border-slate-800/60 rounded-xl p-6">
        <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-4"><Users size={16}/> Contactos</h3>
        <p className="text-lg font-semibold dark:text-white">{prospect.decisionMaker}</p>
        <div className="flex items-center gap-2 mt-2"><Mail size={16}/><span className="text-blue-400 text-sm">{prospect.email}</span></div>
      </div>
      <div className="bg-[#111827] border border-slate-800/60 rounded-xl p-6">
        <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-4"><Mail size={16}/> Templates</h3>
        <p className="font-semibold text-sm">Asunto: {prospect.draftSubject}</p>
        <p className="mt-2 text-sm text-slate-300 whitespace-pre-wrap">{prospect.draftEmail}</p>
      </div>
    </div>
  );
}

function InsightCard({ title, icon, content }) {
  return (
    <div className="bg-[#111827] border border-slate-800/60 rounded-xl p-5">
      <h3 className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-2 mb-3">{icon} {title}</h3>
      <div className="text-sm dark:text-slate-300">{content}</div>
    </div>
  );
}

function ReportsView({ setProspects, reportsHistory, setReportsHistory, showNotification }) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef(null);

  const processFile = async (file) => {
    setIsUploading(true);
    setProgress(10);
    try {
      const text = await extractTextFromPdf(file);
      setProgress(40);
      const newProspects = await analyzeProspectsWithAI(text);
      setProgress(90);
      
      const newValidProspects = Array.isArray(newProspects) ? newProspects : [newProspects];
      if (newValidProspects.length === 0) throw new Error("No properties validos encontrados");

      setProspects(prev => [...newValidProspects, ...prev]);
      setReportsHistory([{ id: Date.now(), name: file.name, date: new Date().toISOString(), count: newValidProspects.length }, ...reportsHistory]);
      
      setProgress(100);
      showNotification(`Reporte PDF procesado por IA. ${newValidProspects.length} nuevo(s) prospecto(s) extraído(s).`);
    } catch (err) {
      console.error(err);
      showNotification(err.message || 'Error al procesar el PDF', true);
    } finally {
      setTimeout(() => { setIsUploading(false); setProgress(0); }, 1000);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files?.[0]) {
      await processFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div><h2 className="text-2xl font-bold dark:text-white">Cargar Reportes IA</h2></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111827] border border-slate-800/60 rounded-xl p-6">
          <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" />
          <div onDragOver={e => e.preventDefault()} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-700 hover:bg-slate-800/50 rounded-xl p-8 text-center cursor-pointer transition">
            {isUploading ? (
              <div><Clock className="animate-spin mx-auto text-blue-500 mb-2" size={24}/><p>Procesando con IA... {progress}%</p></div>
            ) : (
              <div><FileText className="mx-auto text-slate-500 mb-2" size={32}/><p>Arrastra tu reporte PDF aquí o haz clic</p></div>
            )}
          </div>
        </div>
        <div className="bg-[#111827] border border-slate-800/60 rounded-xl p-6">
          <h3 className="font-semibold mb-4">Historial de Reportes</h3>
          <div className="space-y-3">
            {reportsHistory.map(r => (
              <div key={r.id} className="bg-slate-800/50 p-3 rounded-lg flex items-center justify-between">
                <div><p className="text-sm font-semibold">{r.name}</p><p className="text-xs text-slate-500">{new Date(r.date).toLocaleDateString()} • {r.count} prospectos</p></div>
                <CheckCircle className="text-emerald-500" size={20} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MeetingsView({ prospects, meetings, setMeetings }) {
  const [newLink, setNewLink] = useState('');
  const [selectedP, setSelectedP] = useState(prospects[0]?.id || '');
  const [date, setDate] = useState('');

  const addMeeting = (e) => {
    e.preventDefault();
    if(!newLink || !selectedP || !date) return;
    setMeetings([{id: Date.now(), prospectId: selectedP, link: newLink, date: date, notes: ''}, ...meetings]);
    setNewLink(''); setDate('');
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div><h2 className="text-2xl font-bold dark:text-white">Reuniones Confirmadas</h2></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#111827] border border-slate-800/60 rounded-xl p-6 h-fit">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Video size={20}/> Agendar Meet</h3>
          <form onSubmit={addMeeting} className="space-y-4">
            <select value={selectedP} onChange={e=>setSelectedP(e.target.value)} className="w-full bg-[#0F172A] border-slate-700 rounded-lg p-2 dark:text-white outline-none">
              {prospects.map(p=><option key={p.id} value={p.id}>{p.company}</option>)}
            </select>
            <input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} required className="w-full bg-[#0F172A] border-slate-700 rounded-lg p-2 dark:text-white outline-none" />
            <input type="url" placeholder="https://meet.google.com/..." value={newLink} onChange={e=>setNewLink(e.target.value)} required className="w-full bg-[#0F172A] border-slate-700 rounded-lg p-2 dark:text-white outline-none" />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg">Guardar</button>
          </form>
        </div>
        <div className="lg:col-span-2 space-y-4">
          {meetings.map(m => (
            <div key={m.id} className="bg-[#111827] p-5 rounded-xl flex items-center justify-between">
              <div><h4 className="font-bold">{prospects.find(p=>p.id===m.prospectId)?.company}</h4><p className="text-sm text-slate-500">{new Date(m.date).toLocaleString()}</p></div>
              <a href={m.link} target="_blank" rel="noreferrer" className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm">Unirse</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
