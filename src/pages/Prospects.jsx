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

  const newImported = filtered.filter(p => p.isNewImport);
  const oldImported = filtered.filter(p => !p.isNewImport);

  const renderRow = (p) => {
    const isEditing = editingId === p.id;
    return (
      <tr key={p.id} className={`${isEditing ? 'bg-primary/5' : 'hover:bg-surface-container'} transition-colors`}>
        <td className="px-4 py-4">
          {isEditing ? (
            <div className="space-y-2">
              <input type="text" value={editForm.company || ''} onChange={(e) => setEditForm({...editForm, company: e.target.value})} className="w-full bg-surface-container-lowest rounded p-1.5 text-xs text-on-surface focus:outline-none focus:shadow-ghost" />
              <input type="text" value={editForm.industry || ''} onChange={(e) => setEditForm({...editForm, industry: e.target.value})} className="w-full bg-surface-container-lowest rounded p-1.5 text-xs text-on-surface focus:outline-none focus:shadow-ghost" />
            </div>
          ) : (
            <div className="truncate max-w-[250px]"><p className="font-semibold text-on-surface truncate">{p.company} {p.isNewImport && <span className="ml-2 inline-block px-1.5 py-0.5 bg-tertiary/20 text-tertiary text-[10px] rounded-full uppercase tracking-wider font-bold">Nuevo</span>}</p><p className="text-xs text-on-surface-variant truncate">{p.industry}</p></div>
          )}
        </td>
        <td className="px-4 py-4">
          {isEditing ? (
            <div className="space-y-2">
              <input type="text" value={editForm.decisionMaker || ''} onChange={(e) => setEditForm({...editForm, decisionMaker: e.target.value})} className="w-full bg-surface-container-lowest rounded p-1.5 text-xs text-on-surface focus:outline-none focus:shadow-ghost" />
              <input type="text" value={editForm.role || ''} onChange={(e) => setEditForm({...editForm, role: e.target.value})} className="w-full bg-surface-container-lowest rounded p-1.5 text-xs text-on-surface focus:outline-none focus:shadow-ghost" />
            </div>
          ) : (
            <div className="truncate max-w-[200px]"><p className="font-medium text-on-surface truncate">{p.decisionMaker}</p><p className="text-xs text-on-surface-variant truncate">{p.role}</p></div>
          )}
        </td>
        <td className="px-4 py-4">
          {isEditing ? (
            <input type="email" value={editForm.email || ''} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="w-full bg-surface-container-lowest rounded p-1.5 text-xs text-on-surface focus:outline-none focus:shadow-ghost" />
          ) : (
            <div className="truncate max-w-[200px] text-xs"><a href={`mailto:${p.email}`} className="text-primary-container hover:underline">{p.email}</a></div>
          )}
        </td>
        <td className="px-4 py-4">
          {isEditing ? (
            <input type="number" value={editForm.score || 0} onChange={(e) => setEditForm({...editForm, score: parseInt(e.target.value)||0})} className="w-16 bg-surface-container-lowest rounded p-1.5 text-xs text-on-surface focus:outline-none focus:shadow-ghost" />
          ) : (
            <span className="inline-flex bg-tertiary/10 text-tertiary px-2 py-1 rounded text-xs font-semibold">{p.score}</span>
          )}
        </td>
        <td className="px-4 py-4">
          {isEditing ? (
            <select value={editForm.status || 'Prospecto'} onChange={(e) => setEditForm({...editForm, status: e.target.value})} className="w-full bg-surface-container-lowest rounded p-1.5 text-xs text-on-surface focus:outline-none focus:shadow-ghost">
              <option value="Prospecto">Prospecto</option><option value="Oportunidad">Oportunidad</option><option value="Propuesta">Propuesta</option><option value="Cerrado">Cerrado</option>
            </select>
          ) : (
            <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${p.status === 'Oportunidad' ? 'bg-error/10 text-error' : p.status === 'Propuesta' ? 'bg-primary/20 text-primary-container' : p.status === 'Cerrado' ? 'bg-tertiary/20 text-tertiary' : 'bg-primary/10 text-primary'}`}>{p.status || 'Prospecto'}</span>
          )}
        </td>
        <td className="px-4 py-4 text-right">
          {isEditing ? (
            <div className="flex items-center justify-end gap-2">
              <button onClick={saveEdit} title="Guardar" className="text-tertiary hover:bg-surface-container-highest p-1.5 rounded-lg transition-colors"><Check size={16} /></button>
              <button onClick={cancelEdit} title="Cancelar" className="text-on-surface-variant hover:bg-surface-container-highest p-1.5 rounded-lg transition-colors"><XIcon size={16} /></button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-1">
              <button onClick={() => navigateTo('detalle', p)} title="Ver detalle" className="text-on-surface-variant hover:text-primary-container hover:bg-surface-container-highest p-1.5 rounded-lg transition-colors"><Eye size={16} /></button>
              <button onClick={() => startEdit(p)} title="Editar" className="text-on-surface-variant hover:text-primary-container hover:bg-surface-container-highest p-1.5 rounded-lg transition-colors"><Edit2 size={16} /></button>
              <button onClick={() => handleDelete(p.id)} title="Eliminar" className="text-on-surface-variant hover:text-error hover:bg-error/10 p-1.5 rounded-lg transition-colors"><Trash2 size={16} /></button>
            </div>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div><h2 className="text-2xl font-bold text-on-surface">Directorio de Prospectos</h2><p className="text-sm text-on-surface-variant mt-1">{prospects.length} empresas encontradas</p></div>
        <button onClick={() => exportToCSV(prospects)} className="flex items-center gap-2 bg-surface hover:bg-surface-container px-4 py-2 rounded-lg text-sm transition-colors text-on-surface shadow-elevation"><Download size={16}/>Exportar CSV</button>
      </div>
      <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-none flex flex-col min-h-[500px]">
        <div className="p-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18}/>
            <input type="text" placeholder="Buscar empresa o industria..." className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest rounded-lg text-sm focus:outline-none focus:shadow-ghost text-on-surface transition-shadow" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto flex-1 pb-24">
          
          {newImported.length > 0 && (
            <div className="mb-6">
              <div className="bg-tertiary/10 border-b border-tertiary/20 px-4 py-3">
                <h3 className="text-tertiary font-bold flex items-center gap-2 text-sm">
                  <Check size={16} /> Prospectos Recientes (Último reporte)
                </h3>
              </div>
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-surface text-on-surface-variant font-medium">
                  <tr><th className="px-4 py-4 min-w-[200px]">Compañía</th><th className="px-4 py-4 min-w-[180px]">Decisor</th><th className="px-4 py-4 min-w-[200px]">Email</th><th className="px-4 py-4">Score</th><th className="px-4 py-4">Status</th><th className="px-4 py-4 text-right">Acciones</th></tr>
                </thead>
                <tbody className="[&>*:nth-child(even)]:bg-surface/40">
                  {newImported.map(renderRow)}
                </tbody>
              </table>
            </div>
          )}

          {oldImported.length > 0 && (
            <div>
              {newImported.length > 0 && (
                <div className="bg-surface-container-highest px-4 py-3 border-y border-surface">
                  <h3 className="text-on-surface font-bold text-sm">Todos los Prospectos</h3>
                </div>
              )}
              <table className="w-full text-left text-sm whitespace-nowrap">
                {newImported.length === 0 && (
                  <thead className="bg-surface text-on-surface-variant font-medium">
                    <tr><th className="px-4 py-4 min-w-[200px]">Compañía</th><th className="px-4 py-4 min-w-[180px]">Decisor</th><th className="px-4 py-4 min-w-[200px]">Email</th><th className="px-4 py-4">Score</th><th className="px-4 py-4">Status</th><th className="px-4 py-4 text-right">Acciones</th></tr>
                  </thead>
                )}
                <tbody className="[&>*:nth-child(even)]:bg-surface/40">
                  {oldImported.map(renderRow)}
                </tbody>
              </table>
            </div>
          )}
          
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-500">No se encontraron prospectos</div>
          )}
        </div>
      </div>
    </div>
  );
}
