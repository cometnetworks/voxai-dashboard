import React from 'react';
import { Building2 } from 'lucide-react';

export default function Opportunities({ prospects, navigateTo }) {
  const urgents = prospects.filter(p => ['Urgente', 'Alta', 'High'].includes(p.priority));
  
  return (
    <div className="animate-fade-in space-y-6">
      <div><h2 className="text-2xl font-bold text-on-surface">Oportunidades Urgentes</h2></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {urgents.map(p => (
          <div key={p.id} className="bg-surface-container-low rounded-xl p-5 shadow-elevation hover:-translate-y-1 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary-container"><Building2 size={20}/></div>
                <div><h3 className="font-bold text-lg text-on-surface">{p.company}</h3><p className="text-xs text-on-surface-variant">{p.industry}</p></div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-bold text-tertiary bg-tertiary/10 px-2 py-0.5 rounded shadow-ghost">{p.score}</span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded shadow-ghost ${p.priority === 'Urgente' || p.priority === 'High' ? 'bg-error/10 text-error' : 'bg-error/5 text-error/80'}`}>{p.priority}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-surface flex items-center justify-between">
              <div><p className="text-sm font-medium text-on-surface">{p.decisionMaker}</p><p className="text-[11px] text-on-surface-variant">{p.role}</p></div>
              <button onClick={() => navigateTo('detalle', p)} className="bg-primary hover:bg-primary/90 text-on-primary text-xs font-medium px-4 py-2 rounded-lg transition-colors">Ver Detalle</button>
            </div>
          </div>
        ))}
        {urgents.length === 0 && (
          <div className="col-span-full py-12 text-center text-on-surface-variant bg-surface-container rounded-xl">
            No hay oportunidades urgentes identificadas en este momento.
          </div>
        )}
      </div>
    </div>
  );
}
