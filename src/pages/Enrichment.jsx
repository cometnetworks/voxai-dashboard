import React, { useState, useRef } from 'react';
import { Upload, CheckCircle2, AlertCircle, XCircle, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import toast from 'react-hot-toast';

// ── Normalization helpers ──────────────────────────────────────────────────────

const CORP_SUFFIXES = /\b(s\.?\s*a\.?\s*de\s*c\.?\s*v\.?|s\.?\s*a\.?\s*b\.?\s*de\s*c\.?\s*v\.?|s\s*de\s*r\.?\s*l\.?|s\.?\s*a\.?|inc\.?|llc\.?|ltd\.?|corp\.?|s\.?\s*c\.?)\b/gi;

function normalize(str = '') {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(CORP_SUFFIXES, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function domainFromEmail(email = '') {
  if (!email.includes('@')) return '';
  return email.split('@')[1].toLowerCase().trim();
}

function normalizeDomain(domain = '') {
  return domain.toLowerCase().replace(/^www\./, '').replace(/\/$/, '').trim();
}

// ── CSV parser (handles quoted fields) ────────────────────────────────────────

function parseCSVRow(line) {
  const result = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { inQuotes = !inQuotes; continue; }
    if (line[i] === ',' && !inQuotes) { result.push(field.trim()); field = ''; continue; }
    field += line[i];
  }
  result.push(field.trim());
  return result;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const rawHeaders = parseCSVRow(lines[0]).map(h =>
    h.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  );

  // Map Apollo column name variants to canonical keys
  const aliases = {
    company_name: ['company_name', 'company', 'organization', 'compaa', 'compaia', 'empresa'],
    company_domain: ['company_domain', 'domain', 'website', 'company_website', 'dominio'],
    contact_name: ['contact_name', 'full_name', 'name', 'person_name', 'decisor', 'contacto', 'nombre'],
    title: ['title', 'job_title', 'position', 'cargo', 'puesto'],
    email: ['email', 'email_address', 'work_email', 'correo'],
    linkedin_url: ['linkedin_url', 'person_linkedin_url', 'linkedin', 'url_linkedin'],
  };

  const colIndex = {};
  for (const [canonical, variants] of Object.entries(aliases)) {
    for (const v of variants) {
      const idx = rawHeaders.indexOf(v);
      if (idx !== -1) { colIndex[canonical] = idx; break; }
    }
  }

  return lines.slice(1).map(line => {
    const vals = parseCSVRow(line);
    return {
      company_name:   vals[colIndex.company_name]   || '',
      company_domain: vals[colIndex.company_domain]  || '',
      contact_name:   vals[colIndex.contact_name]    || '',
      title:          vals[colIndex.title]           || '',
      email:          vals[colIndex.email]           || '',
      linkedin_url:   vals[colIndex.linkedin_url]    || '',
    };
  }).filter(r => r.email);
}

// ── Matching algorithm ─────────────────────────────────────────────────────────

function matchRow(csvRow, prospects) {
  const csvDomain  = normalizeDomain(csvRow.company_domain);
  const csvName    = normalize(csvRow.contact_name);
  const csvCompany = normalize(csvRow.company_name);
  const csvTitle   = normalize(csvRow.title);

  const byDomain   = (p) => csvDomain && normalizeDomain(domainFromEmail(p.email || '')) === csvDomain;
  const byPDomain  = (p) => csvDomain && normalizeDomain(p.companyDomain || '') === csvDomain;
  const domainHit  = (p) => byDomain(p) || byPDomain(p);
  const byCompany  = (p) => normalize(p.company || '') === csvCompany && csvCompany.length > 2;

  // P1: domain + contact_name
  if (csvDomain) {
    const m = prospects.find(p => domainHit(p) && normalize(p.decisionMaker || '') === csvName);
    if (m) return { prospect: m, result: 'matched', reason: 'domain+nombre' };

    // P2: domain + title
    const m2 = prospects.find(p => domainHit(p) && normalize(p.role || '') === csvTitle);
    if (m2) return { prospect: m2, result: 'matched', reason: 'domain+cargo' };

    // P4: domain único
    const domainMatches = prospects.filter(domainHit);
    if (domainMatches.length === 1) return { prospect: domainMatches[0], result: 'matched', reason: 'dominio único' };
    if (domainMatches.length > 1) return { prospect: null, result: 'needs_review', reason: 'dominio ambiguo', candidates: domainMatches };
  }

  // P3: company name + contact_name
  if (csvCompany) {
    const m3 = prospects.find(p => byCompany(p) && normalize(p.decisionMaker || '') === csvName);
    if (m3) return { prospect: m3, result: 'matched', reason: 'empresa+nombre' };

    // company name único
    const companyMatches = prospects.filter(byCompany);
    if (companyMatches.length === 1) return { prospect: companyMatches[0], result: 'matched', reason: 'empresa única' };
    if (companyMatches.length > 1) return { prospect: null, result: 'needs_review', reason: 'empresa ambigua', candidates: companyMatches };
  }

  return { prospect: null, result: 'unmatched', reason: 'sin coincidencia' };
}

// ── Component ─────────────────────────────────────────────────────────────────

const BADGE = {
  matched:      'bg-tertiary/10 text-tertiary',
  needs_review: 'bg-amber-500/10 text-amber-500',
  unmatched:    'bg-surface-container-highest text-on-surface-variant',
};
const BADGE_LABEL = { matched: 'Match', needs_review: 'Revisar', unmatched: 'Sin match' };

export default function Enrichment({ prospects }) {
  const fileRef = useRef(null);
  const [rows, setRows] = useState(null);       // processed rows after CSV parse
  const [expandedUpload, setExpandedUpload] = useState(null);
  const [reviewDecisions, setReviewDecisions] = useState({}); // rowIdx → prospectId | 'reject'

  const saveUpload     = useMutation(api.enrichment.saveUpload);
  const applyAllMatched = useMutation(api.enrichment.applyAllMatched);
  const applyMatch     = useMutation(api.enrichment.applyMatch);
  const rejectRow      = useMutation(api.enrichment.rejectRow);
  const uploads        = useQuery(api.enrichment.listUploads);

  const processFile = (file) => {
    if (!file || !file.name.endsWith('.csv')) {
      toast.error('Sube un archivo .csv exportado de Apollo');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseCSV(e.target.result);
        if (!parsed.length) { toast.error('El CSV no contiene filas válidas o le faltan columnas de email'); return; }

        const processed = parsed.map(csvRow => {
          const { prospect, result, reason, candidates } = matchRow(csvRow, prospects);
          return { csvRow, prospect, result, reason, candidates };
        });
        setRows(processed);
        toast.success(`${parsed.length} filas procesadas`, { position: 'bottom-right' });
      } catch {
        toast.error('Error al procesar el CSV');
      }
    };
    reader.readAsText(file);
  };

  const handleApplyAll = async () => {
    if (!rows) return;
    const toastId = toast.loading('Guardando y aplicando matches...');
    try {
      const matched      = rows.filter(r => r.result === 'matched');
      const needsReview  = rows.filter(r => r.result === 'needs_review');
      const unmatched    = rows.filter(r => r.result === 'unmatched');

      const uploadId = await saveUpload({
        fileName: 'apollo_export.csv',
        uploadedAt: new Date().toISOString(),
        totalRows: rows.length,
        matchedCount: matched.length,
        needsReviewCount: needsReview.length,
        unmatchedCount: unmatched.length,
        rows: rows.map(r => ({
          csvCompanyName:   r.csvRow.company_name,
          csvCompanyDomain: r.csvRow.company_domain || undefined,
          csvContactName:   r.csvRow.contact_name,
          csvTitle:         r.csvRow.title || undefined,
          csvEmail:         r.csvRow.email,
          csvLinkedinUrl:   r.csvRow.linkedin_url || undefined,
          matchResult:      r.result,
          matchReason:      r.reason || undefined,
          matchedProspectId: r.prospect?.id || undefined,
        })),
      });

      await applyAllMatched({ uploadId });

      toast.success(`${matched.length} prospectos actualizados. ${needsReview.length} pendientes de revisión.`, { id: toastId });
      setRows(null);
      setReviewDecisions({});
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  };

  const matchedCount     = rows?.filter(r => r.result === 'matched').length ?? 0;
  const reviewCount      = rows?.filter(r => r.result === 'needs_review').length ?? 0;
  const unmatchedCount   = rows?.filter(r => r.result === 'unmatched').length ?? 0;

  return (
    <div className="animate-fade-in space-y-6 pb-20">
      <div>
        <h2 className="text-2xl font-bold text-on-surface">Enriquecimiento de Contactos</h2>
        <p className="text-sm text-on-surface-variant mt-1">Sube tu CSV de Apollo para asignar emails reales a tus prospectos</p>
      </div>

      {/* Upload area */}
      {!rows && (
        <div className="bg-surface-container-low rounded-xl p-8 shadow-none">
          <input type="file" accept=".csv" className="hidden" ref={fileRef} onChange={e => { if (e.target.files?.[0]) processFile(e.target.files[0]); e.target.value = ''; }} />
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); processFile(e.dataTransfer.files?.[0]); }}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-surface-container-highest hover:border-primary-container hover:bg-surface-container rounded-xl p-12 cursor-pointer transition-all flex flex-col items-center gap-3 text-on-surface-variant"
          >
            <Upload size={36} />
            <p className="text-base font-medium text-on-surface">Arrastra tu CSV de Apollo aquí</p>
            <p className="text-sm">Columnas requeridas: <span className="font-mono text-xs bg-surface-container-highest px-2 py-0.5 rounded">email</span> · <span className="font-mono text-xs bg-surface-container-highest px-2 py-0.5 rounded">company_name</span> · <span className="font-mono text-xs bg-surface-container-highest px-2 py-0.5 rounded">contact_name</span></p>
          </div>
        </div>
      )}

      {/* Results */}
      {rows && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Match automático', count: matchedCount, color: 'text-tertiary', bg: 'bg-tertiary/10' },
              { label: 'Requiere revisión', count: reviewCount, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { label: 'Sin coincidencia', count: unmatchedCount, color: 'text-on-surface-variant', bg: 'bg-surface-container' },
            ].map(({ label, count, color, bg }) => (
              <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
                <p className={`text-2xl font-bold ${color}`}>{count}</p>
                <p className="text-xs text-on-surface-variant mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Rows table */}
          <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface text-on-surface-variant text-xs font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">CSV — Empresa / Contacto</th>
                    <th className="px-4 py-3 text-left">Email Apollo</th>
                    <th className="px-4 py-3 text-left">Prospecto matcheado</th>
                    <th className="px-4 py-3 text-left">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-surface-container/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-on-surface">{r.csvRow.company_name}</p>
                        <p className="text-xs text-on-surface-variant">{r.csvRow.contact_name} · {r.csvRow.title}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-primary-container font-mono">{r.csvRow.email}</td>
                      <td className="px-4 py-3">
                        {r.prospect ? (
                          <div>
                            <p className="font-medium text-on-surface">{r.prospect.company}</p>
                            <p className="text-xs text-on-surface-variant">{r.prospect.decisionMaker}</p>
                          </div>
                        ) : r.result === 'needs_review' ? (
                          <span className="text-xs text-amber-500 italic">{r.reason}</span>
                        ) : (
                          <span className="text-xs text-on-surface-variant italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${BADGE[r.result]}`}>
                          {r.result === 'matched' && <CheckCircle2 size={11} />}
                          {r.result === 'needs_review' && <AlertCircle size={11} />}
                          {r.result === 'unmatched' && <XCircle size={11} />}
                          {BADGE_LABEL[r.result]}
                          {r.reason && ` · ${r.reason}`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-4">
            <button onClick={() => { setRows(null); setReviewDecisions({}); }} className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleApplyAll}
              className="flex items-center gap-2 bg-primary text-on-primary font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Check size={16} /> Aplicar {matchedCount} match{matchedCount !== 1 ? 'es' : ''} automáticos
            </button>
          </div>
        </div>
      )}

      {/* Upload history */}
      {!rows && uploads && uploads.length > 0 && (
        <div className="bg-surface-container-low rounded-xl p-6 shadow-none">
          <h3 className="font-semibold text-on-surface mb-4">Historial de uploads</h3>
          <div className="space-y-2">
            {uploads.map(u => (
              <div key={u._id} className="bg-surface-container-lowest rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-on-surface">{u.fileName}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {new Date(u.uploadedAt).toLocaleString()} · {u.totalRows} filas · <span className="text-tertiary">{u.matchedCount} match</span> · <span className="text-amber-500">{u.needsReviewCount} revisión</span> · {u.unmatchedCount} sin match
                    </p>
                  </div>
                  <button onClick={() => setExpandedUpload(expandedUpload === u._id ? null : u._id)} className="text-on-surface-variant hover:text-on-surface p-1">
                    {expandedUpload === u._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
