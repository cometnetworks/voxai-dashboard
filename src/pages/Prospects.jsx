import React, { useState } from 'react';
import { Search, Download } from 'lucide-react';

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

export default function Prospects({ prospects, setProspects, navigateTo }) {
  const [searchTerm, setSearchTerm] = useState('');
  const filtered = prospects.filter(p => (p.company||'').toLowerCase().includes(searchTerm.toLowerCase()) || (p.industry||'').toLowerCase().includes(searchTerm.toLowerCase()));
  
  const updateField = (id, field, value) => {
    setProspects(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div><h2 className="text-2xl font-bold dark:text-white text-slate-800">Directorio de Prospectos</h2><p className="text-sm text-slate-500 mt-1">{prospects.length} empresas encontradas</p></div>
        <button onClick={() => exportToCSV(prospects)} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 px-4 py-2 rounded-lg text-sm transition-colors text-slate-700 dark:text-slate-200"><Download size={16}/>Exportar CSV</button>
      </div>
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/60 flex items-center gap-3">
          <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input type="text" placeholder="Buscar empresa o industria..." className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white text-slate-900" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800/60">
              <tr><th className="px-4 py-3">Compañía</th><th className="px-4 py-3">Decisor</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Acción</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-4 py-4"><p className="font-semibold dark:text-white text-slate-800">{p.company}</p><p className="text-xs text-slate-500">{p.industry}</p></td>
                  <td className="px-4 py-4"><p className="font-medium dark:text-slate-200 text-slate-700">{p.decisionMaker}</p><p className="text-xs text-slate-500">{p.role}</p></td>
                  <td className="px-4 py-4"><input type="text" value={p.email||''} onChange={(e) => updateField(p.id, 'email', e.target.value)} className="bg-transparent border-none text-sm w-full outline-none dark:text-slate-300 text-slate-600" /></td>
                  <td className="px-4 py-4"><span className="inline-flex bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-transparent px-2 py-1 rounded text-xs font-semibold">{p.score}</span></td>
                  <td className="px-4 py-4">
                    <select value={p.status||'Prospecto'} onChange={(e) => updateField(p.id, 'status', e.target.value)} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs rounded p-1.5 focus:outline-none">
                      <option value="Prospecto">Prospecto</option><option value="Oportunidad">Oportunidad</option><option value="Propuesta">Propuesta</option><option value="Cerrado">Cerrado</option>
                    </select>
                  </td>
                  <td className="px-4 py-4"><button onClick={() => navigateTo('detalle', p)} className="text-blue-600 dark:text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">Ver detalle</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
