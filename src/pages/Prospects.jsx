import React, { useState } from 'react';
import { Search, Download, Edit2, Trash2, Check, X as XIcon, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const filtered = prospects.filter(p => (p.company||'').toLowerCase().includes(searchTerm.toLowerCase()) || (p.industry||'').toLowerCase().includes(searchTerm.toLowerCase()));
  
  const updateField = (id, field, value) => {
    setProspects(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este prospecto?')) {
      setProspects(prev => prev.filter(p => p.id !== id));
      toast.success('Prospecto eliminado');
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditForm({ ...p });
  };

  const saveEdit = () => {
    setProspects(prev => prev.map(p => p.id === editingId ? { ...editForm } : p));
    setEditingId(null);
    toast.success('Prospecto actualizado');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div><h2 className="text-2xl font-bold dark:text-white text-slate-800">Directorio de Prospectos</h2><p className="text-sm text-slate-500 mt-1">{prospects.length} empresas encontradas</p></div>
        <button onClick={() => exportToCSV(prospects)} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 px-4 py-2 rounded-lg text-sm transition-colors text-slate-700 dark:text-slate-200"><Download size={16}/>Exportar CSV</button>
      </div>
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/60 flex items-center gap-3">
          <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input type="text" placeholder="Buscar empresa o industria..." className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white text-slate-900" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto flex-1 pb-24">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800/60">
              <tr><th className="px-4 py-3 min-w-[200px]">Compañía</th><th className="px-4 py-3 min-w-[180px]">Decisor</th><th className="px-4 py-3 min-w-[200px]">Email</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Acciones</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map(p => {
                const isEditing = editingId === p.id;
                return (
                  <tr key={p.id} className={`${isEditing ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/20'} transition-colors`}>
                    <td className="px-4 py-4">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input type="text" value={editForm.company || ''} onChange={(e) => setEditForm({...editForm, company: e.target.value})} className="w-full bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-600 rounded p-1 text-xs dark:text-white" />
                          <input type="text" value={editForm.industry || ''} onChange={(e) => setEditForm({...editForm, industry: e.target.value})} className="w-full bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-600 rounded p-1 text-xs dark:text-slate-300" />
                        </div>
                      ) : (
                        <div className="truncate max-w-[250px]"><p className="font-semibold dark:text-white text-slate-800 truncate">{p.company}</p><p className="text-xs text-slate-500 truncate">{p.industry}</p></div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input type="text" value={editForm.decisionMaker || ''} onChange={(e) => setEditForm({...editForm, decisionMaker: e.target.value})} className="w-full bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-600 rounded p-1 text-xs dark:text-white" />
                          <input type="text" value={editForm.role || ''} onChange={(e) => setEditForm({...editForm, role: e.target.value})} className="w-full bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-600 rounded p-1 text-xs dark:text-slate-300" />
                        </div>
                      ) : (
                        <div className="truncate max-w-[200px]"><p className="font-medium dark:text-slate-200 text-slate-700 truncate">{p.decisionMaker}</p><p className="text-xs text-slate-500 truncate">{p.role}</p></div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {isEditing ? (
                        <input type="email" value={editForm.email || ''} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="w-full bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-600 rounded p-1 text-xs dark:text-white" />
                      ) : (
                        <div className="truncate max-w-[200px] text-xs"><a href={`mailto:${p.email}`} className="dark:text-slate-300 text-blue-600 hover:underline">{p.email}</a></div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {isEditing ? (
                        <input type="number" value={editForm.score || 0} onChange={(e) => setEditForm({...editForm, score: parseInt(e.target.value)||0})} className="w-16 bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-600 rounded p-1 text-xs dark:text-white" />
                      ) : (
                        <span className="inline-flex bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-transparent px-2 py-1 rounded text-xs font-semibold">{p.score}</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {isEditing ? (
                        <select value={editForm.status || 'Prospecto'} onChange={(e) => setEditForm({...editForm, status: e.target.value})} className="w-full bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-600 rounded p-1 text-xs dark:text-white">
                          <option value="Prospecto">Prospecto</option><option value="Oportunidad">Oportunidad</option><option value="Propuesta">Propuesta</option><option value="Cerrado">Cerrado</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${p.status === 'Oportunidad' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-transparent' : p.status === 'Propuesta' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-200 dark:border-transparent' : p.status === 'Cerrado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-transparent' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-transparent'}`}>{p.status || 'Prospecto'}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={saveEdit} title="Guardar" className="text-emerald-600 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/40 p-1.5 rounded-lg transition-colors"><Check size={16} /></button>
                          <button onClick={cancelEdit} title="Cancelar" className="text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors"><XIcon size={16} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => navigateTo('detalle', p)} title="Ver detalle" className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1.5 rounded-lg transition-colors"><Eye size={16} /></button>
                          <button onClick={() => startEdit(p)} title="Editar" className="text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 p-1.5 rounded-lg transition-colors"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(p.id)} title="Eliminar" className="text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-lg transition-colors"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">No se encontraron prospectos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
