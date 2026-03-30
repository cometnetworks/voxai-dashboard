import React, { useState } from 'react';
import { Search, Download, Edit2, Trash2, Check, X as XIcon, Eye, ChevronUp, ChevronDown, ChevronsUpDown, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

// Normaliza string: quita acentos, minúsculas, quita sufijos corporativos
const normCompany = (s = '') =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
   .toLowerCase()
   .replace(/\b(s\.?a\.?\s?de\s?c\.?v\.?|s\.?a\.?b\.?\s?de\s?c\.?v\.?|s\s?de\s?r\.?l\.?|s\.?a\.?|inc\.?|llc\.?|ltd\.?|corp\.?|s\.?c\.?)\b/gi, '')
   .replace(/[^a-z0-9]/g, '')
   .trim();

const exportToCSV = (data) => {
  const headers = ['Compañía', 'Industria', 'Decisor', 'Cargo', 'Email', 'Score', 'Prioridad', 'Status'];
  const rows = data.map(p => [p.company, p.industry, p.decisionMaker, p.role, p.email, p.score, p.priority, p.status]);
  const csvContent = "data:text/csv;charset=utf-8,"
    + headers.join(",") + "\n"
    + rows.map(e => e.map(item => `"${item ?? ''}"`).join(",")).join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", `prospectos_vox_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function Prospects({ prospects, setProspects, navigateTo }) {
  const [searchTerm, setSearchTerm]   = useState('');
  const [sortBy, setSortBy]           = useState('company');
  const [sortDir, setSortDir]         = useState('asc');
  const [editingId, setEditingId]     = useState(null);
  const [editForm, setEditForm]       = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const updateProspect = useMutation(api.prospects.update);
  const removeProspect = useMutation(api.prospects.remove);

  // ── Sort ──────────────────────────────────────────────────────────────────────
  const handleColSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  let filtered = prospects.filter(p =>
    norm(p.company).includes(norm(searchTerm)) ||
    norm(p.industry).includes(norm(searchTerm)) ||
    norm(p.decisionMaker).includes(norm(searchTerm))
  );

  filtered = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'score') {
      cmp = (a.score || 0) - (b.score || 0);
    } else if (sortBy === 'company') {
      cmp = norm(a.company) < norm(b.company) ? -1 : norm(a.company) > norm(b.company) ? 1 : 0;
    } else if (sortBy === 'decisionMaker') {
      cmp = norm(a.decisionMaker) < norm(b.decisionMaker) ? -1 : norm(a.decisionMaker) > norm(b.decisionMaker) ? 1 : 0;
    } else if (sortBy === 'status') {
      cmp = norm(a.status) < norm(b.status) ? -1 : norm(a.status) > norm(b.status) ? 1 : 0;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    // Optimistic update — remove from UI immediately
    setProspects(prev => prev.filter(p => p.id !== id));
    setConfirmDeleteId(null);
    const toastId = toast.loading('Eliminando...');
    try {
      await removeProspect({ id });
      toast.success('Prospecto eliminado', { id: toastId });
    } catch (e) {
      toast.error('Error al eliminar', { id: toastId });
    }
  };

  // ── Limpiar duplicados ────────────────────────────────────────────────────────
  const handleDedup = async () => {
    const groups = new Map();
    for (const p of prospects) {
      const key = normCompany(p.company);
      if (!key) continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p);
    }

    const toDelete = [];
    for (const group of groups.values()) {
      if (group.length <= 1) continue;
      // Keep the one with the most non-null fields (most complete)
      const scored = group.map(p => ({
        p,
        score: Object.values(p).filter(v => v !== null && v !== undefined && v !== '').length,
      }));
      scored.sort((a, b) => b.score - a.score);
      // Delete all except the best
      toDelete.push(...scored.slice(1).map(x => x.p.id));
    }

    if (!toDelete.length) { toast.success('No se encontraron duplicados'); return; }

    const toastId = toast.loading(`Eliminando ${toDelete.length} duplicados...`);
    try {
      // Optimistic update
      setProspects(prev => prev.filter(p => !toDelete.includes(p.id)));
      // Delete from Convex
      await Promise.all(toDelete.map(id => removeProspect({ id })));
      toast.success(`${toDelete.length} duplicados eliminados`, { id: toastId });
    } catch (e) {
      toast.error('Error al limpiar duplicados', { id: toastId });
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────────
  const startEdit = (p) => { setEditingId(p.id); setEditForm({ ...p }); };
  const saveEdit = async () => {
    const toastId = toast.loading('Guardando...');
    try {
      const { id, _id, _creationTime, prospectId, isNewImport, ...data } = editForm;
      await updateProspect({ id: editingId, data });
      setProspects(prev => prev.map(p => p.id === editingId ? { ...p, ...data } : p));
      setEditingId(null);
      toast.success('Guardado', { id: toastId });
    } catch (e) {
      toast.error('Error al guardar', { id: toastId });
    }
  };
  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <ChevronsUpDown size={13} className="opacity-30 ml-1 inline-block" />;
    return sortDir === 'asc'
      ? <ChevronUp size={13} className="text-primary-container ml-1 inline-block" />
      : <ChevronDown size={13} className="text-primary-container ml-1 inline-block" />;
  };

  // Count duplicates for badge
  const dupCount = (() => {
    const seen = new Map();
    for (const p of prospects) {
      const k = normCompany(p.company);
      if (!k) continue;
      seen.set(k, (seen.get(k) || 0) + 1);
    }
    return [...seen.values()].filter(c => c > 1).reduce((acc, c) => acc + c - 1, 0);
  })();

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Directorio de Prospectos</h2>
          <p className="text-sm text-on-surface-variant mt-1">{filtered.length} de {prospects.length} empresas</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {dupCount > 0 && (
            <button
              onClick={handleDedup}
              className="flex items-center gap-2 bg-error/10 hover:bg-error/20 text-error px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              <Sparkles size={15} /> Limpiar {dupCount} duplicado{dupCount !== 1 ? 's' : ''}
            </button>
          )}
          <button onClick={() => exportToCSV(prospects)} className="flex items-center gap-2 bg-surface hover:bg-surface-container px-4 py-2 rounded-lg text-sm transition-colors text-on-surface shadow-elevation">
            <Download size={16} /> Exportar CSV
          </button>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-xl overflow-hidden flex flex-col min-h-[500px]">
        {/* Controles */}
        <div className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
            <input
              type="text"
              placeholder="Buscar empresa, industria o decisor..."
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest rounded-lg text-sm focus:outline-none focus:shadow-ghost text-on-surface transition-shadow"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={sortBy === 'company' && sortDir === 'asc' ? 'company_asc'
              : sortBy === 'company' && sortDir === 'desc' ? 'company_desc'
              : sortBy === 'score' && sortDir === 'desc' ? 'score_desc'
              : sortBy === 'score' && sortDir === 'asc' ? 'score_asc'
              : sortBy === 'status' ? 'status_asc'
              : 'company_asc'}
            onChange={e => {
              const [col, dir] = e.target.value.split('_');
              setSortBy(col);
              setSortDir(dir);
            }}
            className="w-full sm:w-auto bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="company_asc">Empresa (A → Z)</option>
            <option value="company_desc">Empresa (Z → A)</option>
            <option value="score_desc">Mayor Score</option>
            <option value="score_asc">Menor Score</option>
            <option value="status_asc">Status (A-Z)</option>
          </select>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto flex-1 pb-24">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500">No se encontraron prospectos</div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-surface text-on-surface-variant font-medium sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-4 min-w-[200px] cursor-pointer select-none hover:text-on-surface" onClick={() => handleColSort('company')}>
                    Compañía <SortIcon col="company" />
                  </th>
                  <th className="px-4 py-4 min-w-[180px] cursor-pointer select-none hover:text-on-surface" onClick={() => handleColSort('decisionMaker')}>
                    Decisor <SortIcon col="decisionMaker" />
                  </th>
                  <th className="px-4 py-4 min-w-[200px]">Email</th>
                  <th className="px-4 py-4 cursor-pointer select-none hover:text-on-surface" onClick={() => handleColSort('score')}>
                    Score <SortIcon col="score" />
                  </th>
                  <th className="px-4 py-4 cursor-pointer select-none hover:text-on-surface" onClick={() => handleColSort('status')}>
                    Status <SortIcon col="status" />
                  </th>
                  <th className="px-4 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="[&>*:nth-child(even)]:bg-surface/40">
                {filtered.map(p => {
                  const isEditing   = editingId === p.id;
                  const isConfirming = confirmDeleteId === p.id;
                  return (
                    <tr key={p.id} className={`${isEditing ? 'bg-primary/5' : 'hover:bg-surface-container'} transition-colors`}>
                      <td className="px-4 py-4">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input type="text" value={editForm.company || ''} onChange={e => setEditForm({ ...editForm, company: e.target.value })} className="w-full bg-surface-container-lowest rounded p-1.5 text-xs text-on-surface focus:outline-none" />
                            <input type="text" value={editForm.industry || ''} onChange={e => setEditForm({ ...editForm, industry: e.target.value })} className="w-full bg-surface-container-lowest rounded p-1.5 text-xs text-on-surface focus:outline-none" />
                          </div>
                        ) : (
                          <div className="truncate max-w-[250px]">
                            <p className="font-semibold text-on-surface truncate">{p.company}</p>
                            <p className="text-xs text-on-surface-variant truncate">{p.industry}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input type="text" value={editForm.decisionMaker || ''} onChange={e => setEditForm({ ...editForm, decisionMaker: e.target.value })} className="w-full bg-surface-container-lowest rounded p-1.5 text-xs text-on-surface focus:outline-none" />
                            <input type="text" value={editForm.role || ''} onChange={e => setEditForm({ ...editForm, role: e.target.value })} className="w-full bg-surface-container-lowest rounded p-1.5 text-xs text-on-surface focus:outline-none" />
                          </div>
                        ) : (
                          <div className="truncate max-w-[200px]">
                            <p className="font-medium text-on-surface truncate">{p.decisionMaker}</p>
                            <p className="text-xs text-on-surface-variant truncate">{p.role}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {isEditing ? (
                          <input type="email" value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full bg-surface-container-lowest rounded p-1.5 text-xs text-on-surface focus:outline-none" />
                        ) : (
                          <div className="truncate max-w-[200px] text-xs">
                            <a href={`mailto:${p.email}`} className="text-primary-container hover:underline">{p.email}</a>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {isEditing ? (
                          <input type="number" value={editForm.score || 0} onChange={e => setEditForm({ ...editForm, score: parseInt(e.target.value) || 0 })} className="w-16 bg-surface-container-lowest rounded p-1.5 text-xs text-on-surface focus:outline-none" />
                        ) : (
                          <span className="inline-flex bg-tertiary/10 text-tertiary px-2 py-1 rounded text-xs font-semibold">{p.score}</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {isEditing ? (
                          <select value={editForm.status || 'Prospecto'} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="w-full bg-surface-container-lowest rounded p-1.5 text-xs text-on-surface focus:outline-none">
                            <option>Prospecto</option>
                            <option>Oportunidad</option>
                            <option>Propuesta</option>
                            <option>Cerrado</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${p.status === 'Oportunidad' ? 'bg-error/10 text-error' : p.status === 'Propuesta' ? 'bg-primary/20 text-primary-container' : p.status === 'Cerrado' ? 'bg-tertiary/20 text-tertiary' : 'bg-primary/10 text-primary'}`}>
                            {p.status || 'Prospecto'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={saveEdit} className="text-tertiary hover:bg-surface-container-highest p-1.5 rounded-lg transition-colors"><Check size={16} /></button>
                            <button onClick={cancelEdit} className="text-on-surface-variant hover:bg-surface-container-highest p-1.5 rounded-lg transition-colors"><XIcon size={16} /></button>
                          </div>
                        ) : isConfirming ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-error font-medium">¿Eliminar?</span>
                            <button onClick={() => handleDelete(p.id)} className="text-xs font-semibold text-on-primary bg-error px-2 py-1 rounded-lg hover:bg-error/80 transition-colors">Sí</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-on-surface-variant hover:text-on-surface px-2 py-1 rounded-lg transition-colors">No</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => navigateTo('detalle', p)} title="Ver detalle" className="text-on-surface-variant hover:text-primary-container hover:bg-surface-container-highest p-1.5 rounded-lg transition-colors"><Eye size={16} /></button>
                            <button onClick={() => startEdit(p)} title="Editar" className="text-on-surface-variant hover:text-primary-container hover:bg-surface-container-highest p-1.5 rounded-lg transition-colors"><Edit2 size={16} /></button>
                            <button onClick={() => setConfirmDeleteId(p.id)} title="Eliminar" className="text-on-surface-variant hover:text-error hover:bg-error/10 p-1.5 rounded-lg transition-colors"><Trash2 size={16} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
