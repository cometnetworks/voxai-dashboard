import React from 'react';
import { Users, Target, AlertCircle, Building2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard({ prospects, navigateTo }) {
  const total = prospects.length;
  const avgScore = total ? Math.round(prospects.reduce((acc, p) => acc + (p.score || 0), 0) / total) : 0;
  const urgents = prospects.filter(p => ['Urgente', 'Alta', 'High'].includes(p.priority)).length;

  const statusMap = {
    'Nuevo': { count: prospects.filter(p => p.status === 'Prospecto' || !p.status).length, color: '#3b82f6' },
    'Calificado': { count: prospects.filter(p => p.status === 'Oportunidad').length, color: '#f59e0b' },
    'En Proceso': { count: prospects.filter(p => p.status === 'Propuesta').length, color: '#a855f7' },
    'Cerrado': { count: prospects.filter(p => p.status === 'Cerrado').length, color: '#10b981' },
  };

  const chartData = Object.keys(statusMap).map(key => ({
    name: key,
    value: statusMap[key].count,
    color: statusMap[key].color
  })).filter(d => d.value > 0);

  // AI Mocks
  const activeDeals = prospects.filter(p => ['Oportunidad', 'Propuesta'].includes(p.status)).length;
  const forecastValue = activeDeals * 15500; // Mock average deal size $15.5k

  const aiRisks = prospects.map(p => {
    if (p.status === 'Oportunidad' && p.score < 90) return { ...p, riskType: 'Cooling Off', riskDesc: 'Interacción < 40% histórico', color: 'text-amber-500', bg: 'bg-amber-500/10' };
    if (p.status === 'Propuesta' && p.score < 90) return { ...p, riskType: 'Stagnant', riskDesc: '> 14 días en Legal/Review', color: 'text-error', bg: 'bg-error/10' };
    return null;
  }).filter(Boolean).slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Dashboard General</h2>
          <p className="text-sm text-on-surface-variant mt-1">Visión general del pipeline de investigación IA</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Prospectos" value={total} sub="Extraídos por IA" icon={<Users className="text-blue-500" />} />
        <KPICard title="Score Promedio" value={`${avgScore}/100`} sub="Conversión estimada" icon={<Target className="text-emerald-500" />} />
        <KPICard title="Alta Prioridad" value={urgents} sub="Requieren acción" icon={<AlertCircle className="text-error" />} alert />
        <KPICard title="Revenue Forecast (30d)" value={`$${(forecastValue/1000).toFixed(1)}k`} sub="± 15% Confianza AI" icon={<Building2 className="text-purple-500" />} />
      </div>

      {prospects.some(p => p.isNewImport) && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mt-6 shadow-elevation">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Importaciones Recientes (Último Reporte)
            </h3>
            <button onClick={() => navigateTo('prospectos')} className="text-sm text-primary hover:underline font-medium">Ir al Directorio</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prospects.filter(p => p.isNewImport).slice(0, 3).map(p => (
              <div key={p.id} onClick={() => navigateTo('detalle', p)} className="bg-surface rounded-lg p-4 cursor-pointer hover:bg-surface-container-high transition-colors border border-outline-variant/30">
                <div className="font-semibold text-on-surface truncate text-base">{p.company}</div>
                <div className="text-xs text-on-surface-variant truncate mt-1">{p.decisionMaker || 'Sin contacto'} • {p.industry}</div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Nuevo</span>
                  <span className="text-xs font-bold text-tertiary bg-tertiary/10 px-2 py-0.5 rounded">Score: {p.score}</span>
                </div>
              </div>
            ))}
            {prospects.filter(p => p.isNewImport).length > 3 && (
              <div onClick={() => navigateTo('prospectos')} className="bg-surface/50 rounded-lg p-4 cursor-pointer hover:bg-surface-container-high transition-colors border border-dashed border-outline-variant/50 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-bold text-on-surface-variant">+{prospects.filter(p => p.isNewImport).length - 3}</span>
                <span className="text-xs text-on-surface-variant mt-1">Ver todos los nuevos</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-surface-container-low rounded-xl p-6">
          <h3 className="text-lg font-semibold text-on-surface mb-6">Distribución por Status</h3>
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
                    contentStyle={{ backgroundColor: 'var(--color-surface-container-highest)', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 flex-wrap mt-2">
                {chartData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-on-surface-variant">
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

        <div className="space-y-6">
          <div className="bg-surface-container-low rounded-xl p-6 shadow-elevation">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-on-surface">Top Urgentes</h3>
              <button onClick={() => navigateTo('oportunidades')} className="text-sm text-primary-container hover:underline">Ver todos</button>
            </div>
            <div className="space-y-3">
              {prospects.filter(p => ['Urgente', 'Alta', 'High'].includes(p.priority)).sort((a,b)=>b.score-a.score).slice(0,3).map(p => (
                <div key={p.id} onClick={() => navigateTo('detalle', p)} className="flex items-center justify-between p-3 rounded-lg bg-surface hover:bg-surface-container cursor-pointer transition-colors shadow-none">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary-container"><Building2 size={16} /></div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-semibold text-on-surface truncate">{p.company}</p>
                      <p className="text-xs text-on-surface-variant truncate">{p.industry}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-tertiary bg-surface-container-highest px-2 py-1 rounded">{p.score}/100</span>
                  </div>
                </div>
              ))}
              {prospects.filter(p => ['Urgente', 'Alta', 'High'].includes(p.priority)).length === 0 && (
                 <div className="text-sm text-on-surface-variant text-center py-4">No hay prospectos urgentes</div>
              )}
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl p-6 shadow-elevation border border-error/10">
            <h3 className="text-lg font-semibold text-on-surface mb-2 flex items-center gap-2">
              <AlertCircle size={18} className="text-error" /> Risk Engine
            </h3>
            <p className="text-xs text-on-surface-variant mb-4">Detección predictiva de anomalías</p>
            <div className="space-y-3">
              {aiRisks.length > 0 ? aiRisks.map(r => (
                <div key={`risk-${r.id}`} onClick={() => navigateTo('detalle', r)} className="flex items-start gap-3 p-3 rounded-lg bg-surface hover:bg-surface-container cursor-pointer transition-colors">
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${r.bg.replace('/10', '')}`} />
                  <div>
                    <h4 className="text-sm font-semibold text-on-surface leading-tight">{r.company}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${r.bg} ${r.color}`}>{r.riskType}</span>
                      <span className="text-xs text-on-surface-variant">{r.riskDesc}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-on-surface-variant text-center py-4">No se detectaron riesgos activos.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, sub, icon, alert }) {
  return (
    <div className={`bg-surface-container-low rounded-xl p-5 relative overflow-hidden transition-all hover:-translate-y-1 shadow-elevation`}>
      {alert && <div className="absolute top-0 right-0 w-16 h-16 bg-error/10 rounded-bl-full blur-xl" />}
      <div className="flex justify-between items-start mb-4">
        <p className="text-sm font-medium text-on-surface-variant">{title}</p>
        <div className="p-2 bg-surface rounded-lg">{icon}</div>
      </div>
      <h4 className="text-3xl font-bold text-on-surface mb-1">{value}</h4>
      <p className="text-xs text-on-surface-variant">{sub}</p>
    </div>
  );
}
