import React from 'react';

export default function Pipeline({ prospects }) {
  const stages = ['Prospecto', 'Oportunidad', 'Propuesta', 'Cerrado'];
  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="mb-6"><h2 className="text-2xl font-bold dark:text-white text-slate-800">Pipeline de Ventas</h2><p className="text-sm text-slate-500 mt-1">Vista Kanban de prospección</p></div>
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {stages.map(stage => (
          <div key={stage} className="flex-none w-80 bg-surface-container-low rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-on-surface uppercase tracking-wider">{stage}</h3>
              <span className="text-xs font-bold bg-surface text-on-surface-variant px-2 py-1 rounded-md shadow-sm">{prospects.filter(p => p.status === stage || (!p.status && stage==='Prospecto')).length}</span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {prospects.filter(p => p.status === stage || (!p.status && stage==='Prospecto')).map(p => (
                <div key={p.id} className="bg-surface-container p-3 rounded-lg shadow-elevation hover:bg-surface-container-high transition-colors cursor-grab">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${['Urgente', 'High'].includes(p.priority) ? 'bg-error/10 text-error' : p.priority === 'Alta' ? 'bg-error/5 text-error/80' : 'bg-surface text-on-surface-variant'}`}>{p.priority}</span>
                    <span className="text-xs font-bold text-tertiary">{p.score}</span>
                  </div>
                  <h4 className="font-medium text-sm text-on-surface leading-tight mb-1">{p.company}</h4>
                  <p className="text-xs text-on-surface-variant truncate">{p.decisionMaker}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
