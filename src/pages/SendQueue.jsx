import React, { useState } from 'react';
import { Send, Pause, Trash2, CheckCircle2, Clock, AlertCircle, Settings2 } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
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
  if (!prospect.email)       return { ok: false, reason: 'Sin email' };
  if (!prospect.draftEmail)  return { ok: false, reason: 'Sin draft' };
  if (prospect.bounced)      return { ok: false, reason: 'Bounce histórico' };
  if (prospect.doNotSend)    return { ok: false, reason: 'Do Not Send' };
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

export default function SendQueue({ prospects, setProspects }) {
  const [dailyLimit, setDailyLimit] = useState(getDailyLimit);
  const [editingLimit, setEditingLimit] = useState(false);
  const [tempLimit, setTempLimit] = useState(dailyLimit);
  const [filter, setFilter] = useState('ready_to_send');
  const [sending, setSending] = useState(new Set());

  const todaySent = sentToday(prospects);
  const remaining = Math.max(0, dailyLimit - todaySent);

  const readyProspects = prospects.filter(p =>
    p.outreachStatus === 'ready_to_send' || p.outreachStatus === 'enriched'
  );
  const sentProspects = prospects.filter(p => ['sent', 'delivered', 'opened', 'replied'].includes(p.outreachStatus));
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
          ? { ...p, emailSent: true, emailSentAt: new Date().toISOString(), lastSentAt: new Date().toISOString(), outreachStatus: 'sent', resendMessageId: data.id }
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
          {/* Daily limit editor */}
          {editingLimit ? (
            <div className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2">
              <span className="text-xs text-on-surface-variant">Límite:</span>
              <input type="number" min={1} max={100} value={tempLimit} onChange={e => setTempLimit(parseInt(e.target.value) || 1)}
                className="w-16 bg-surface-container-lowest rounded px-2 py-1 text-xs text-on-surface outline-none" />
              <button onClick={saveLimit} className="text-xs text-tertiary font-semibold">OK</button>
            </div>
          ) : (
            <button onClick={() => setEditingLimit(true)} className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface bg-surface-container-low rounded-lg px-3 py-2 transition-colors">
              <Settings2 size={14} /> Límite: {dailyLimit}/día
            </button>
          )}
          {readyProspects.length > 0 && (
            <button onClick={sendBatch} className="flex items-center gap-2 bg-primary text-on-primary font-semibold text-sm px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors">
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
          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (todaySent / dailyLimit) * 100)}%` }} />
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

      {/* Queue table */}
      {displayed.length === 0 ? (
        <div className="bg-surface-container-low rounded-xl py-16 text-center text-on-surface-variant text-sm shadow-none">
          {filter === 'ready_to_send'
            ? 'No hay prospectos listos para enviar. Sube un CSV de Apollo para enriquecer contactos.'
            : 'Sin registros en esta sección.'}
        </div>
      ) : (
        <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface text-on-surface-variant text-xs font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Empresa / Decisor</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Draft</th>
                  {filter === 'ready_to_send' && <th className="px-4 py-3 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {displayed.map(prospect => {
                  const check = canSend(prospect, prospects, dailyLimit);
                  const isSending = sending.has(prospect.id);
                  return (
                    <tr key={prospect.id} className="hover:bg-surface-container/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-on-surface">{prospect.company}</p>
                        <p className="text-xs text-on-surface-variant">{prospect.decisionMaker} · {prospect.role}</p>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-primary-container">
                        {prospect.email || <span className="text-error italic">Sin email</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[prospect.outreachStatus] || 'bg-surface-container text-on-surface-variant'}`}>
                          {prospect.outreachStatus || 'extracted'}
                        </span>
                        {!check.ok && filter === 'ready_to_send' && (
                          <p className="text-[10px] text-error mt-1 flex items-center gap-1"><AlertCircle size={10} />{check.reason}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        {prospect.draftEmail
                          ? <p className="text-xs text-on-surface-variant line-clamp-2">{prospect.draftEmail}</p>
                          : <span className="text-xs text-error italic">Sin draft</span>}
                      </td>
                      {filter === 'ready_to_send' && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => sendEmail(prospect)}
                              disabled={!check.ok || isSending}
                              title={check.ok ? 'Enviar ahora' : check.reason}
                              className="flex items-center gap-1 text-xs font-semibold bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {isSending ? <Clock size={12} className="animate-spin" /> : <Send size={12} />}
                              {isSending ? 'Enviando...' : 'Enviar'}
                            </button>
                            <button onClick={() => discard(prospect)} title="Descartar" className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
