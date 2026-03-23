import React, { useState } from 'react';
import { ChevronRight, Building2, AlertCircle, Target, GitMerge, Briefcase, Users, Mail, Sparkles, Activity, MessageSquare, Phone, Linkedin, Clock, StickyNote } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Detail({ prospect, navigateTo }) {
  const [aiSummary, setAiSummary] = useState(prospect?.aiSummary || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [notes, setNotes] = useState(() => {
    try { return localStorage.getItem(`vox_notes_${prospect?.id}`) || ''; } catch { /* ignore */ }
  });

  if (!prospect) return <div className="text-center py-20 text-slate-500">Selecciona un prospecto.</div>;
  
  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado al portapapeles`, { position: 'bottom-right' });
  };
  
  // AI Profiling Mocks
  const score = prospect.score || 0;
  const productFit = Math.min(100, score + 4);
  const budgetReadiness = Math.max(0, score - 2);
  const urgency = ['Urgente', 'Alta', 'High'].includes(prospect.priority) ? 'High' : 'Medium';
  const sentiment = score > 88 ? 'Highly Positive' : score > 75 ? 'Neutral' : 'Critical';
  const sentimentColor = score > 88 ? 'text-tertiary' : score > 75 ? 'text-amber-500' : 'text-error';
  const nextAction = prospect.status === 'Propuesta' ? 'Programar llamada de cierre y enviar proposal final.' : prospect.status === 'Oportunidad' ? 'Agendar demostración técnica del producto.' : 'Enviar secuencia de prospección cold-email.';

  const handleGenerateSummary = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setAiSummary(`Análisis de IA: ${prospect.company} muestra un nivel de encaje del ${productFit}% debido a su stack actual (${prospect.techStack}). Resaltan sus dolores en "${prospect.painPoints?.[0] || 'múltiples áreas'}". Tienen una urgencia de decisión de nivel ${urgency}. La probabilidad de cierre mejora significativamente si contactamos a ${prospect.decisionMaker}.`);
      setIsGenerating(false);
      toast.success('Resumen AI generado con éxito');
    }, 1500);
  };

  return (
    <div className="animate-fade-in space-y-6 pb-20">
      <button onClick={() => navigateTo('prospectos')} className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors">
        <ChevronRight className="rotate-180" size={16}/> Volver a prospectos
      </button>

      <div className="bg-surface-container-low rounded-xl p-6 relative overflow-hidden shadow-none">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <Building2 size={32} className="text-on-primary"/>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-on-surface">{prospect.company}</h1>
              <p className="text-sm text-on-surface-variant mt-1">{prospect.industry}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${prospect.status === 'Oportunidad' ? 'bg-error/10 text-error' : prospect.status === 'Propuesta' ? 'bg-primary/20 text-primary-container' : prospect.status === 'Cerrado' ? 'bg-tertiary/20 text-tertiary' : 'bg-primary/10 text-primary'}`}>{prospect.status || 'Prospecto'}</span>
            <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-ghost ${['Urgente', 'High'].includes(prospect.priority) ? 'bg-error/10 text-error' : prospect.priority === 'Alta' ? 'bg-error/5 text-error/80' : 'bg-surface text-on-surface-variant'}`}>{prospect.priority}</span>
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-tertiary/10 text-tertiary shadow-ghost">{prospect.score}/100</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-surface-container-low rounded-xl p-6 shadow-elevation transition-all hover:-translate-y-1">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase flex items-center gap-2 mb-4"><Activity size={16} className="text-primary-container"/> Detailed Lead Score</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-on-surface">Product Fit</span><span className="text-tertiary font-bold">{productFit}%</span></div>
              <div className="w-full bg-surface-container-highest rounded-full h-1.5"><div className="bg-tertiary h-1.5 rounded-full" style={{width: `${productFit}%`}}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-on-surface">Budget Readiness</span><span className="text-primary-container font-bold">{budgetReadiness}%</span></div>
              <div className="w-full bg-surface-container-highest rounded-full h-1.5"><div className="bg-primary-container h-1.5 rounded-full" style={{width: `${budgetReadiness}%`}}></div></div>
            </div>
            <div className="pt-2">
              <span className="text-xs text-on-surface-variant">Decision Urgency: <span className="font-bold text-on-surface">{urgency}</span></span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-6 shadow-elevation transition-all hover:-translate-y-1">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase flex items-center gap-2 mb-4"><MessageSquare size={16} className={sentimentColor}/> Sentiment Analysis</h3>
          <div className="flex flex-col items-center justify-center py-2">
            <div className={`px-4 py-2 rounded-lg font-bold text-sm tracking-wide ${sentimentColor.replace('text-', 'bg-').replace('-500', '-500/10')} ${sentimentColor} mb-2`}>{sentiment}</div>
            <p className="text-xs text-on-surface-variant text-center">Basado en lenguaje de las últimas interacciones detectadas.</p>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-6 shadow-elevation transition-all hover:-translate-y-1">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase flex items-center gap-2 mb-4"><Sparkles size={16} className="text-amber-500"/> Next Best Action</h3>
          <p className="text-sm font-medium text-on-surface leading-snug">{nextAction}</p>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-xl p-6 shadow-elevation border border-primary/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2"><Sparkles size={20} className="text-primary-container"/> AI Fit Score Summary</h3>
          {!aiSummary && (
            <button onClick={handleGenerateSummary} disabled={isGenerating} className="px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              {isGenerating ? 'Generando...' : 'Generar AI Summary'}
            </button>
          )}
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-lg min-h-[80px] flex items-center">
          {aiSummary ? (
            <p className="text-sm text-on-surface leading-relaxed">{aiSummary}</p>
          ) : (
            <p className="text-sm text-on-surface-variant italic w-full text-center">El resumen predictivo de IA no ha sido generado para este prospecto.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InsightCard title="TRIGGER" icon={<AlertCircle size={18} className="text-orange-500"/>} content={prospect.trigger}/>
        <InsightCard title="DOLORES" icon={<Target size={18} className="text-error"/>} content={<ul className="list-disc pl-5 space-y-1">{(prospect.painPoints||[]).map((p,i)=><li key={i}>{p}</li>)}</ul>}/>
        <InsightCard title="USO VOX" icon={<GitMerge size={18} className="text-primary-container"/>} content={prospect.useCase}/>
        <InsightCard title="STACK" icon={<Briefcase size={18} className="text-tertiary"/>} content={prospect.techStack}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-container-low rounded-xl p-6 shadow-none">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase flex items-center gap-2"><Users size={16}/> Decisor Principal</h3>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-lg">
            <p className="text-lg font-semibold text-on-surface">{prospect.decisionMaker}</p>
            <p className="text-sm text-on-surface-variant mb-3">{prospect.role}</p>
            
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={16} className="text-on-surface-variant"/>
                  <a href={`mailto:${prospect.email}`} className="text-primary-container hover:underline">{prospect.email}</a>
                </div>
                <button onClick={() => copyToClipboard(prospect.email, 'Email')} className="text-xs text-on-surface-variant hover:text-primary-container opacity-0 group-hover:opacity-100 transition-opacity">Copiar</button>
              </div>
              {prospect.phone && (
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={16} className="text-on-surface-variant"/>
                    <a href={`tel:${prospect.phone}`} className="text-primary-container hover:underline">{prospect.phone}</a>
                  </div>
                  <button onClick={() => copyToClipboard(prospect.phone, 'Teléfono')} className="text-xs text-on-surface-variant hover:text-primary-container opacity-0 group-hover:opacity-100 transition-opacity">Copiar</button>
                </div>
              )}
              <div className="flex items-center gap-3 pt-2">
                {prospect.linkedin && (
                  <a href={prospect.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-primary-container hover:underline">
                    <Linkedin size={14}/> Perfil LinkedIn
                  </a>
                )}
                {prospect.companyLinkedin && (
                  <a href={prospect.companyLinkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary-container">
                    <Building2 size={14}/> Empresa LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-6 shadow-none">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase flex items-center gap-2"><Mail size={16}/> Email Sugerido (IA)</h3>
            <button onClick={() => copyToClipboard(prospect.draftEmail, 'Email sugerido')} className="text-xs text-primary-container hover:underline">Copiar Todo</button>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-lg">
            <div className="mb-3 pb-3 border-b border-surface flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="font-semibold text-sm text-on-surface"><span className="text-on-surface-variant mr-2">Asunto:</span> {prospect.draftSubject}</p>
              <button onClick={() => copyToClipboard(prospect.draftSubject, 'Asunto')} className="text-xs text-on-surface-variant hover:text-primary-container self-end sm:self-auto">Copiar Asunto</button>
            </div>
            <p className="text-sm text-on-surface-variant whitespace-pre-wrap leading-relaxed">{prospect.draftEmail}</p>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-surface-container-low rounded-xl p-6 shadow-elevation">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase flex items-center gap-2 mb-5"><Clock size={16} className="text-primary-container"/> Activity Timeline</h3>
        <div className="space-y-4">
          {[
            { action: 'Email abierto', detail: 'Propuesta Enterprise Q3', time: 'Hace 2h', dot: 'bg-tertiary' },
            { action: 'Llamada programada', detail: 'Mañana • 10:30 AM', time: 'Próximamente', dot: 'bg-primary-container' },
            { action: 'Reunión intro', detail: 'Completada', time: 'Hace 3 días', dot: 'bg-on-surface-variant' },
          ].map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-2.5 h-2.5 rounded-full ${item.dot} mt-1.5`}></div>
                {i < 2 && <div className="w-px flex-1 bg-surface-container-highest mt-1"></div>}
              </div>
              <div className="pb-3">
                <p className="text-sm font-medium text-on-surface">{item.action}</p>
                <p className="text-xs text-on-surface-variant">{item.detail}</p>
                <p className="text-[10px] text-on-surface-variant/60 mt-0.5">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Private Notes */}
      <div className="bg-surface-container-low rounded-xl p-6 shadow-elevation">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase flex items-center gap-2 mb-4"><StickyNote size={16} className="text-amber-500"/> Notas Privadas</h3>
        <textarea
          value={notes}
          onChange={e => {
            setNotes(e.target.value);
            try { localStorage.setItem(`vox_notes_${prospect.id}`, e.target.value); } catch { /* ignore */ }
          }}
          placeholder="Escribe notas privadas sobre este prospecto..."
          className="w-full bg-surface-container-lowest rounded-lg p-4 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-1 focus:ring-primary/30 resize-y min-h-[100px] transition-shadow"
        />
      </div>
    </div>
  );
}

function InsightCard({ title, icon, content }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-6 shadow-elevation transition-all hover:-translate-y-1">
      <h3 className="text-[11px] font-bold text-on-surface-variant uppercase flex items-center gap-2 mb-4">{icon} {title}</h3>
      <div className="text-sm text-on-surface leading-relaxed font-medium">{content}</div>
    </div>
  );
}
