import React from 'react';
import { ChevronRight, Building2, AlertCircle, Target, GitMerge, Briefcase, Users, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Detail({ prospect, navigateTo }) {
  if (!prospect) return <div className="text-center py-20 text-slate-500">Selecciona un prospecto.</div>;
  
  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado al portapapeles`, { position: 'bottom-right' });
  };
  
  return (
    <div className="animate-fade-in space-y-6 pb-20">
      <button onClick={() => navigateTo('prospectos')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
        <ChevronRight className="rotate-180" size={16}/> Volver a prospectos
      </button>

      <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800/60 rounded-xl p-6 relative overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <Building2 size={32} className="text-white"/>
            </div>
            <div>
              <h1 className="text-2xl font-bold dark:text-white text-slate-900">{prospect.company}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{prospect.industry}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${prospect.status === 'Oportunidad' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : prospect.status === 'Propuesta' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' : prospect.status === 'Cerrado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'}`}>{prospect.status || 'Prospecto'}</span>
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${['Urgente', 'High'].includes(prospect.priority) ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : prospect.priority === 'Alta' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>{prospect.priority}</span>
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-transparent">{prospect.score}/100</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InsightCard title="TRIGGER" icon={<AlertCircle size={18} className="text-orange-500"/>} content={prospect.trigger}/>
        <InsightCard title="DOLORES" icon={<Target size={18} className="text-red-500"/>} content={<ul className="list-disc pl-5 space-y-1">{(prospect.painPoints||[]).map((p,i)=><li key={i}>{p}</li>)}</ul>}/>
        <InsightCard title="USO VOX" icon={<GitMerge size={18} className="text-blue-500"/>} content={prospect.useCase}/>
        <InsightCard title="STACK" icon={<Briefcase size={18} className="text-emerald-500"/>} content={prospect.techStack}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800/60 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2"><Users size={16}/> Decisor Principal</h3>
          </div>
          <div className="bg-slate-50 dark:bg-[#0F172A] p-4 rounded-lg border border-slate-100 dark:border-slate-800/50">
            <p className="text-lg font-semibold dark:text-white text-slate-900">{prospect.decisionMaker}</p>
            <p className="text-sm text-slate-500 mb-3">{prospect.role}</p>
            
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={16} className="text-slate-400"/>
                  <a href={`mailto:${prospect.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">{prospect.email}</a>
                </div>
                <button onClick={() => copyToClipboard(prospect.email, 'Email')} className="text-xs text-slate-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">Copiar</button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800/60 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2"><Mail size={16}/> Email Sugerido (IA)</h3>
            <button onClick={() => copyToClipboard(prospect.draftEmail, 'Email sugerido')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Copiar Todo</button>
          </div>
          <div className="bg-slate-50 dark:bg-[#0F172A] p-4 rounded-lg border border-slate-100 dark:border-slate-800/50">
            <div className="mb-3 pb-3 border-b border-slate-200 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="font-semibold text-sm text-slate-900 dark:text-white"><span className="text-slate-500 mr-2">Asunto:</span> {prospect.draftSubject}</p>
              <button onClick={() => copyToClipboard(prospect.draftSubject, 'Asunto')} className="text-xs text-slate-400 hover:text-blue-500 self-end sm:self-auto">Copiar Asunto</button>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{prospect.draftEmail}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ title, icon, content }) {
  return (
    <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800/60 rounded-xl p-6 shadow-sm transition-all hover:shadow-md">
      <h3 className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-2 mb-4">{icon} {title}</h3>
      <div className="text-sm dark:text-slate-300 text-slate-700 leading-relaxed font-medium">{content}</div>
    </div>
  );
}
