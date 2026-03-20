import React from 'react';
import { Users, Target, AlertCircle, Building2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard({ prospects, navigateTo }) {
  const total = prospects.length;
  const avgScore = total ? Math.round(prospects.reduce((acc, p) => acc + (p.score || 0), 0) / total) : 0;
  const urgents = prospects.filter(p => ['Urgente', 'Alta', 'High'].includes(p.priority)).length;

  const statusMap = {
    'Prospecto': { count: prospects.filter(p => p.status === 'Prospecto' || !p.status).length, color: '#3b82f6' }, // blue-500
    'Oportunidad': { count: prospects.filter(p => p.status === 'Oportunidad').length, color: '#f59e0b' }, // amber-500
    'Propuesta': { count: prospects.filter(p => p.status === 'Propuesta').length, color: '#a855f7' }, // purple-500
    'Cerrado': { count: prospects.filter(p => p.status === 'Cerrado').length, color: '#10b981' }, // emerald-500
  };

  const chartData = Object.keys(statusMap).map(key => ({
    name: key,
    value: statusMap[key].count,
    color: statusMap[key].color
  })).filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white text-slate-900">Dashboard General</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Visión general del pipeline de investigación IA</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard title="Total Prospectos" value={total} sub="Extraídos por IA" icon={<Users className="text-blue-500" />} />
        <KPICard title="Score Promedio" value={`${avgScore}/100`} sub="Conversión estimada" icon={<Target className="text-emerald-500" />} />
        <KPICard title="Alta Prioridad" value={urgents} sub="Requieren acción" icon={<AlertCircle className="text-red-500" />} alert />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800/60 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold dark:text-white text-slate-800 mb-6">Distribución por Status</h3>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={400} minHeight={200}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 flex-wrap mt-2">
                {chartData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </div>
          ) : (
             <div className="h-64 flex items-center justify-center text-slate-500">No hay datos suficientes</div>
          )}
        </div>

        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800/60 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold dark:text-white text-slate-800">Top Urgentes</h3>
            <button onClick={() => navigateTo('oportunidades')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Ver todos</button>
          </div>
          <div className="space-y-3">
            {prospects.filter(p => ['Urgente', 'Alta', 'High'].includes(p.priority)).sort((a,b)=>b.score-a.score).slice(0,4).map(p => (
              <div key={p.id} onClick={() => navigateTo('detalle', p)} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/50 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400"><Building2 size={16} /></div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold dark:text-white text-slate-800 truncate">{p.company}</p>
                    <p className="text-xs text-slate-500 truncate">{p.industry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-1 rounded">{p.score}/100</span>
                </div>
              </div>
            ))}
            {prospects.filter(p => ['Urgente', 'Alta', 'High'].includes(p.priority)).length === 0 && (
               <div className="text-sm text-slate-500 text-center py-4">No hay prospectos urgentes</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, sub, icon, alert }) {
  return (
    <div className={`bg-white/80 dark:bg-[#111827]/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 shadow-sm relative overflow-hidden transition-all hover:shadow-md`}>
      {alert && <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 dark:bg-red-500/5 rounded-bl-full blur-xl" />}
      <div className="flex justify-between items-start mb-4">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <div className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded-lg">{icon}</div>
      </div>
      <h4 className="text-3xl font-bold dark:text-white text-slate-900 mb-1">{value}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-500">{sub}</p>
    </div>
  );
}
