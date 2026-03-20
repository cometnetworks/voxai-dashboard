import React from 'react';
import { Building2 } from 'lucide-react';

export default function Opportunities({ prospects, navigateTo }) {
  const urgents = prospects.filter(p => ['Urgente', 'Alta', 'High'].includes(p.priority));
  
  return (
    <div className="animate-fade-in space-y-6">
      <div><h2 className="text-2xl font-bold dark:text-white text-slate-800">Oportunidades Urgentes</h2></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {urgents.map(p => (
          <div key={p.id} className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400"><Building2 size={20}/></div>
                <div><h3 className="font-bold text-lg dark:text-white text-slate-800">{p.company}</h3><p className="text-xs text-slate-500">{p.industry}</p></div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-transparent">{p.score}</span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${p.priority === 'Urgente' || p.priority === 'High' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-transparent' : 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border border-orange-200 dark:border-transparent'}`}>{p.priority}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
              <div><p className="text-sm font-medium dark:text-slate-200 text-slate-700">{p.decisionMaker}</p><p className="text-[11px] text-slate-500">{p.role}</p></div>
              <button onClick={() => navigateTo('detalle', p)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors">Ver Detalle</button>
            </div>
          </div>
        ))}
        {urgents.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 rounded-xl">
            No hay oportunidades urgentes identificadas en este momento.
          </div>
        )}
      </div>
    </div>
  );
}
