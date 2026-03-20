import React from 'react';

export default function Pipeline({ prospects }) {
  const stages = ['Prospecto', 'Oportunidad', 'Propuesta', 'Cerrado'];
  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="mb-6"><h2 className="text-2xl font-bold dark:text-white text-slate-800">Pipeline de Ventas</h2><p className="text-sm text-slate-500 mt-1">Vista Kanban de prospección</p></div>
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {stages.map(stage => (
          <div key={stage} className="flex-none w-80 bg-white/50 dark:bg-[#111827]/50 border border-slate-200 dark:border-slate-800/60 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm dark:text-slate-300 text-slate-700 uppercase tracking-wider">{stage}</h3>
              <span className="text-xs font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-md shadow-sm border border-slate-200 dark:border-slate-700">{prospects.filter(p => p.status === stage || (!p.status && stage==='Prospecto')).length}</span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {prospects.filter(p => p.status === stage || (!p.status && stage==='Prospecto')).map(p => (
                <div key={p.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700/50 hover:border-blue-500/50 transition-colors cursor-grab">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${['Urgente', 'High'].includes(p.priority) ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : p.priority === 'Alta' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>{p.priority}</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{p.score}</span>
                  </div>
                  <h4 className="font-medium text-sm dark:text-white text-slate-800 leading-tight mb-1">{p.company}</h4>
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
