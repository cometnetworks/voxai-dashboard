import React, { useState } from 'react';
import { Send, Trash2, CheckCircle2, Clock, AlertCircle, Settings2, ChevronDown, ChevronUp, Sparkles, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const DAILY_LIMIT_KEY = 'vox_daily_limit';

function getDailyLimit() {
  const v = localStorage.getItem(DAILY_LIMIT_KEY);
  return v ? parseInt(v) : 10;
}

function sentToday(prospects) {
  const today = new Date().toISOString().split('T')[0];
  return prospects.filter(p => p.emailSentAt && p.emailSentAt.startsWith(today)).length;
}

function canSend(prospect, prospects, limit) {
  if (!prospect.email)      return { ok: false, reason: 'Sin email' };
  if (!prospect.draftEmail) return { ok: false, reason: 'Sin draft' };
  if (prospect.bounced)     return { ok: false, reason: 'Bounce histórico' };
  if (prospect.doNotSend)   return { ok: false, reason: 'Do Not Send' };
  if (sentToday(prospects) >= limit) return { ok: false, reason: `Límite diario (${limit}) alcanzado` };
  if (prospect.lastSentAt) {
    const daysSince = (Date.now() - new Date(prospect.lastSentAt).getTime()) / 86400000;
    if (daysSince < 30) return { ok: false, reason: `Enviado hace ${Math.floor(daysSince)}d (espera 30)` };
  }
  return { ok: true };
}

const STATUS_COLORS = {
  ready_to_send: 'bg-primary/10 text-primary',
  enriched:      'bg-amber-500/10 text-amber-500',
  sent:          'bg-tertiary/10 text-tertiary',
  failed:        'bg-error/10 text-error',
  discarded:     'bg-surface-container-highest text-on-surface-variant',
};

// ── Inline draft editor row ────────────────────────────────────────────────────
function DraftEditor({ prospect, prospects, dailyLimit, onSave, onSend, onDiscard, sending }) {
  const [expanded, setExpanded]   = useState(false);
  const [subject, setSubject]     = useState(prospect.draftSubject || '');
  const [body, setBody]           = useState(prospect.draftEmail   || '');
  const [generating, setGenerating] = useState(false);
  const [dirty, setDirty]         = useState(false);

  const check    = canSend({ ...prospect, draftEmail: body }, prospects, dailyLimit);
  const isSending = sending.has(prospect.id);

  const handleSubject = (v) => { setSubject(v); setDirty(true); };
  const handleBody    = (v) => { setBody(v);    setDirty(true); };

  const handleGenerate = async () => {
    const groqKey       = import.meta.env.VITE_GROQ_API_KEY;
    const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!groqKey && !openRouterKey) { toast.error('Configura VITE_GROQ_API_KEY'); return; }

    setGenerating(true);
    const toastId = toast.loading('Generando draft con IA...', { position: 'bottom-right' });

    const prompt = `Genera un email de prospección frío B2B en español para:
- Empresa: ${prospect.company}
- Industria: ${prospect.industry || 'No especificada'}
- Decisor: ${prospect.decisionMaker} — ${prospect.role}
- Trigger: ${prospect.trigger || 'No especificado'}
- Pain Points: ${(prospect.painPoints || []).join('; ')}
- Tech Stack: ${prospect.techStack || 'No especificado'}
- Caso de uso Vox: ${prospect.useCase || 'No especificado'}

Reglas:
1. Primer párrafo: conecta con algo específico de la empresa (trigger, años en mercado, posicionamiento)
2. Segundo párrafo: identifica 1-2 pain points concretos y enlázalos con el reto de conseguir pipeline
3. Tercer párrafo: presenta Vox Media Agency con 2 beneficios concretos en bullets (• )
4. CTA: solicita 15-20 minutos esta semana o la próxima
5. Cierre: "Saludos,\\nEquipo Vox Media Agency"
6. Tono: profesional, directo, sin exageraciones
7. Máximo 250 palabras en el cuerpo

Devuelve SOLO JSON válido: { "subject": "...", "body": "..." }`;

    try {
      const makeReq = (url, key, model) => fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json',
          ...(url.includes('openrouter') ? { 'HTTP-Referer': window.location.href, 'X-Title': 'VoxAI Dashboard' } : {}) },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.4, response_format: { type: 'json_object' } }),
      });

      let res = groqKey
        ? await makeReq('https://api.groq.com/openai/v1/chat/completions', groqKey, 'llama-3.3-70b-versatile')
        : null;
      if ((!res || res.status === 429) && openRouterKey)
        res = await makeReq('https://openrouter.ai/api/v1/chat/completions', openRouterKey, 'meta-llama/llama-3.3-70b-instruct');
      if (!res || !res.ok) throw new Error(`Error IA (${res?.status})`);

      const data   = await res.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      setSubject(parsed.subject || '');
      setBody(parsed.body || '');
      setDirty(true);
      toast.success('Draft generado', { id: toastId });
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    onSave(prospect.id, subject, body);
    setDirty(false);
    toast.success('Draft guardado');
  };

  const handleSend = () => {
    if (dirty) {
      onSave(prospect.id, subject, body);
    }
    onSend({ ...prospect, draftSubject: subject, draftEmail: body });
  };

  return (
    <div className="border-b border-surface-container last:border-0">
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container/40 transition-colors cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-on-surface text-sm truncate">{prospect.company}</p>
          <p className="text-xs text-on-surface-variant truncate">{prospect.decisionMaker} · {prospect.role}</p>
        </div>
        <div className="hidden sm:block text-xs font-mono text-primary-container truncate max-w-[160px]">
          {prospect.email || <span className="text-error italic">Sin email</span>}
        </div>
        <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${STATUS_COLORS[prospect.outreachStatus] || 'bg-surface-container text-on-surface-variant'}`}>
          {prospect.outreachStatus || 'extracted'}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {body
            ? <span className="text-[10px] text-tertiary font-semibold bg-tertiary/10 px-2 py-0.5 rounded-full">Draft ✓</span>
            : <span className="text-[10px] text-error font-semibold bg-error/10 px-2 py-0.5 rounded-full">Sin draft</span>}
          {expanded ? <ChevronUp size={14} className="text-on-surface-variant" /> : <ChevronDown size={14} className="text-on-surface-variant" />}
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 bg-surface-container/30">
          {/* Email field (readonly display) */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-on-surface-variant w-16 shrink-0">Para:</span>
            <span className="font-mono text-primary-container">{prospect.email || <span className="text-error italic">Sin email — edita en la ficha del prospecto</span>}</span>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Asunto</label>
            <input
              value={subject}
              onChange={e => handleSubject(e.target.value)}
              placeholder="Asunto del email..."
              className="w-full bg-surface-container-lowest border border-surface-container-highest rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary transition-colors"
              onClick={e => e.stopPropagation()}
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Cuerpo</label>
            <textarea
              value={body}
              onChange={e => handleBody(e.target.value)}
              placeholder="Escribe o genera el cuerpo del email..."
              rows={7}
              className="w-full bg-surface-container-lowest border border-surface-container-highest rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary transition-colors resize-y"
              onClick={e => e.stopPropagation()}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={e => { e.stopPropagation(); handleGenerate(); }}
                disabled={generating}
                className="flex items-center gap-1.5 text-xs font-semibold bg-surface-container border border-surface-container-highest text-on-surface-variant hover:text-primary hover:border-primary px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {generating ? <Clock size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {generating ? 'Generando...' : 'Generar con IA'}
              </button>
              {dirty && (
                <button
                  onClick={e => { e.stopPropagation(); handleSave(); }}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-surface-container border border-surface-container-highest text-on-surface-variant hover:text-tertiary hover:border-tertiary px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Save size={12} /> Guardar
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={e => { e.stopPropagation(); onDiscard(prospect); }}
                className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                title="Descartar"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); handleSend(); }}
                disabled={!prospect.email || !body.trim() || isSending || !check.ok}
                title={check.ok ? 'Enviar email' : check.reason}
                className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-on-primary px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSending ? <Clock size={12} className="animate-spin" /> : <Send size={12} />}
                {isSending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>

          {!check.ok && (
            <p className="text-[11px] text-error flex items-center gap-1"><AlertCircle size={11} />{check.reason}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function SendQueue({ prospects, setProspects }) {
  const [dailyLimit, setDailyLimit] = useState(getDailyLimit);
  const [editingLimit, setEditingLimit] = useState(false);
  const [tempLimit, setTempLimit]   = useState(dailyLimit);
  const [filter, setFilter]         = useState('ready_to_send');
  const [sending, setSending]       = useState(new Set());

  const todaySent = sentToday(prospects);
  const remaining = Math.max(0, dailyLimit - todaySent);

  const readyProspects  = prospects.filter(p => p.outreachStatus === 'ready_to_send' || p.outreachStatus === 'enriched');
  const sentProspects   = prospects.filter(p => ['sent', 'delivered', 'opened', 'replied'].includes(p.outreachStatus));
  const failedProspects = prospects.filter(p => ['failed', 'bounced'].includes(p.outreachStatus));

  const displayed = filter === 'ready_to_send' ? readyProspects
    : filter === 'sent' ? sentProspects
    : failedProspects;

  const saveLimit = () => {
    const val = Math.max(1, Math.min(100, tempLimit));
    setDailyLimit(val);
    localStorage.setItem(DAILY_LIMIT_KEY, String(val));
    setEditingLimit(false);
  };

  const saveDraft = (prospectId, subject, body) => {
    setProspects(prev => prev.map(p =>
      p.id === prospectId
        ? { ...p, draftSubject: subject, draftEmail: body,
            outreachStatus: p.email && body.trim() ? 'ready_to_send' : p.outreachStatus }
        : p
    ));
  };

  const sendEmail = async (prospect) => {
    const check = canSend(prospect, prospects, dailyLimit);
    if (!check.ok) { toast.error(check.reason); return; }

    setSending(s => new Set(s).add(prospect.id));
    const toastId = toast.loading(`Enviando a ${prospect.email}...`, { position: 'bottom-right' });
    try {
      const resp = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: prospect.email, subject: prospect.draftSubject, body: prospect.draftEmail }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Error al enviar');

      setProspects(prev => prev.map(p =>
        p.id === prospect.id
          ? { ...p, emailSent: true, emailSentAt: new Date().toISOString(),
              lastSentAt: new Date().toISOString(), outreachStatus: 'sent',
              resendMessageId: data.id }
          : p
      ));
      toast.success(`Email enviado a ${prospect.decisionMaker}`, { id: toastId });
    } catch (err) {
      toast.error(err.message, { id: toastId });
      setProspects(prev => prev.map(p =>
        p.id === prospect.id ? { ...p, outreachStatus: 'failed' } : p
      ));
    } finally {
      setSending(s => { const n = new Set(s); n.delete(prospect.id); return n; });
    }
  };

  const sendBatch = async () => {
    const eligible = readyProspects.filter(p => canSend(p, prospects, dailyLimit).ok).slice(0, remaining);
    if (!eligible.length) { toast.error('No hay prospectos elegibles o se alcanzó el límite diario'); return; }
    toast(`Enviando lote de ${eligible.length} emails...`, { icon: '📤' });
    for (const p of eligible) await sendEmail(p);
  };

  const discard = (prospect) => {
    setProspects(prev => prev.map(p =>
      p.id === prospect.id ? { ...p, outreachStatus: 'discarded' } : p
    ));
    toast('Prospecto descartado de la cola', { icon: '🗑' });
  };

  // Sent/failed table (read-only, no inline editor needed)
  const readOnlyTable = (
    <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface text-on-surface-variant text-xs font-semibold uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Empresa / Decisor</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {displayed.map(prospect => (
              <tr key={prospect.id} className="hover:bg-surface-container/50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-on-surface">{prospect.company}</p>
                  <p className="text-xs text-on-surface-variant">{prospect.decisionMaker} · {prospect.role}</p>
                </td>
                <td className="px-4 py-3 text-xs font-mono text-primary-container">{prospect.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[prospect.outreachStatus] || 'bg-surface-container text-on-surface-variant'}`}>
                    {prospect.outreachStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-on-surface-variant">
                  {prospect.emailSentAt ? new Date(prospect.emailSentAt).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Cola de Envío</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {todaySent} enviados hoy · <span className="text-primary font-medium">{remaining} restantes</span> de {dailyLimit} límite diario
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editingLimit ? (
            <div className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2">
              <span className="text-xs text-on-surface-variant">Límite:</span>
              <input type="number" min={1} max={100} value={tempLimit}
                onChange={e => setTempLimit(parseInt(e.target.value) || 1)}
                className="w-16 bg-surface-container-lowest rounded px-2 py-1 text-xs text-on-surface outline-none" />
              <button onClick={saveLimit} className="text-xs text-tertiary font-semibold">OK</button>
            </div>
          ) : (
            <button onClick={() => setEditingLimit(true)}
              className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface bg-surface-container-low rounded-lg px-3 py-2 transition-colors">
              <Settings2 size={14} /> Límite: {dailyLimit}/día
            </button>
          )}
          {filter === 'ready_to_send' && readyProspects.length > 0 && (
            <button onClick={sendBatch}
              className="flex items-center gap-2 bg-primary text-on-primary font-semibold text-sm px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors">
              <Send size={14} /> Enviar lote ({Math.min(remaining, readyProspects.filter(p => canSend(p, prospects, dailyLimit).ok).length)})
            </button>
          )}
        </div>
      </div>

      {/* Daily progress bar */}
      <div className="bg-surface-container-low rounded-xl p-4 shadow-none">
        <div className="flex justify-between text-xs text-on-surface-variant mb-2">
          <span>Progreso del día</span>
          <span>{todaySent}/{dailyLimit}</span>
        </div>
        <div className="w-full bg-surface-container-highest rounded-full h-2">
          <div className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${Math.min(100, (todaySent / dailyLimit) * 100)}%` }} />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-surface-container-low rounded-xl p-1 w-fit">
        {[
          { key: 'ready_to_send', label: `En cola (${readyProspects.length})` },
          { key: 'sent',          label: `Enviados (${sentProspects.length})` },
          { key: 'failed',        label: `Fallidos (${failedProspects.length})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === key ? 'bg-primary text-on-primary shadow-ghost' : 'text-on-surface-variant hover:text-on-surface'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Queue list */}
      {displayed.length === 0 ? (
        <div className="bg-surface-container-low rounded-xl py-16 text-center text-on-surface-variant text-sm shadow-none">
          {filter === 'ready_to_send'
            ? 'No hay prospectos en cola. Sube un reporte o enriquece contactos.'
            : 'Sin registros en esta sección.'}
        </div>
      ) : filter === 'ready_to_send' ? (
        <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-none divide-y divide-surface-container">
          {displayed.map(prospect => (
            <DraftEditor
              key={prospect.id}
              prospect={prospect}
              prospects={prospects}
              dailyLimit={dailyLimit}
              onSave={saveDraft}
              onSend={sendEmail}
              onDiscard={discard}
              sending={sending}
            />
          ))}
        </div>
      ) : readOnlyTable}
    </div>
  );
}
