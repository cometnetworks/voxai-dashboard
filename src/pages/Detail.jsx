import React, { useState, useEffect } from 'react';
import { ChevronRight, Building2, AlertCircle, Target, GitMerge, Briefcase, Users, Mail, Sparkles, Activity, MessageSquare, Phone, Linkedin, Clock, StickyNote, Send, CheckCircle2, X, Edit2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function Detail({ prospect, setProspects, navigateTo }) {
  const [aiSummary, setAiSummary] = useState(prospect?.aiSummary || '');
  const [isGenerating, setIsGenerating] = useState(false);

  // Notes — local state for immediate feedback, synced to Convex
  const [notes, setNotes] = useState('');
  const notesValue        = useQuery(api.notes.get, prospect?.id ? { prospectId: prospect.id } : 'skip');
  const saveNote          = useMutation(api.notes.set);

  // Populate local state once Convex returns the saved note
  useEffect(() => {
    if (notesValue !== undefined) setNotes(notesValue);
  }, [notesValue]);

  // Editing state
  const updateProspect = useMutation(api.prospects.update);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const toggleEdit = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setEditForm({ ...prospect });
      setIsEditing(true);
    }
  };

  const saveEdit = async () => {
    const loading = toast.loading('Guardando...');
    try {
      const { id, _id, _creationTime, prospectId, ...data } = editForm;
      await updateProspect({ id: prospect.id, data });
      if (setProspects) {
        setProspects(prev => prev.map(p => p.id === prospect.id ? { ...prospect, ...data } : p));
        // Need to update the main prospect obj locally too for immediate view sync inside this component:
        Object.assign(prospect, { ...editForm });
      }
      setIsEditing(false);
      toast.success('Prospecto actualizado', { id: loading });
    } catch (err) {
      toast.error('Error al actualizar', { id: loading });
    }
  };

  // Draft generation state
  const [localDraftSubject, setLocalDraftSubject] = useState(prospect?.draftSubject || '');
  const [localDraftEmail,   setLocalDraftEmail]   = useState(prospect?.draftEmail   || '');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  // Keep local draft in sync if prospect prop changes (e.g. after enrichment)
  useEffect(() => {
    setLocalDraftSubject(prospect?.draftSubject || '');
    setLocalDraftEmail(prospect?.draftEmail   || '');
  }, [prospect?.id]);

  const handleGenerateDraft = async () => {
    const groqKey       = import.meta.env.VITE_GROQ_API_KEY;
    const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!groqKey && !openRouterKey) { toast.error('Configura VITE_GROQ_API_KEY o VITE_OPENROUTER_API_KEY'); return; }

    setIsGeneratingDraft(true);
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
5. Cierre: "Saludos,\nEquipo Vox Media Agency"
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

      const data    = await res.json();
      const parsed  = JSON.parse(data.choices[0].message.content);
      const subject = parsed.subject || '';
      const body    = parsed.body || '';

      setLocalDraftSubject(subject);
      setLocalDraftEmail(body);

      if (setProspects) {
        setProspects(prev => prev.map(p =>
          p.id === prospect.id ? { ...p, draftSubject: subject, draftEmail: body } : p
        ));
      }
      toast.success('Draft generado', { id: toastId });
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  // Email sending state
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendTo, setSendTo] = useState('');
  const [sendSubject, setSendSubject] = useState('');
  const [sendBody, setSendBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  const openSendModal = () => {
    setSendTo(prospect.email || '');
    setSendSubject(prospect.draftSubject || '');
    setSendBody(prospect.draftEmail || '');
    setShowSendModal(true);
  };

  const handleSendEmail = async () => {
    if (!sendTo.trim()) { toast.error('Ingresa el email del destinatario'); return; }
    if (!sendSubject.trim()) { toast.error('El asunto no puede estar vacío'); return; }
    if (!sendBody.trim()) { toast.error('El cuerpo del email no puede estar vacío'); return; }

    setIsSending(true);
    const toastId = toast.loading('Enviando email...', { position: 'bottom-right' });
    try {
      const resp = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: sendTo.trim(), subject: sendSubject.trim(), body: sendBody.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Error al enviar');

      // Mark prospect as sent
      if (setProspects) {
        setProspects(prev => prev.map(p =>
          p.id === prospect.id
            ? { ...p, email: sendTo.trim(), emailSent: true, emailSentAt: new Date().toISOString() }
            : p
        ));
      }
      // Update local email field if it was empty
      prospect.email = sendTo.trim();
      prospect.emailSent = true;
      prospect.emailSentAt = new Date().toISOString();

      toast.success(`Email enviado a ${sendTo.trim()}`, { id: toastId });
      setShowSendModal(false);
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsSending(false);
    }
  };

  if (!prospect) return <div className="text-center py-20 text-slate-500">Selecciona un prospecto.</div>;
  
  // Build dynamic Activity Timeline
  const activityTimeline = [];
  if (prospect._creationTime) {
    activityTimeline.push({
      date: new Date(prospect._creationTime).toISOString(),
      title: 'Prospecto Creado',
      desc: 'Importado a la base de datos',
      icon: <Target size={14} className="text-tertiary" />
    });
  }
  if (prospect.emailSentAt) {
    activityTimeline.push({
      date: prospect.emailSentAt,
      title: 'Email de Prospección Enviado',
      desc: `A la dirección: ${prospect.email}`,
      icon: <Send size={14} className="text-primary-container" />
    });
  }
  if (prospect.bounced) {
    activityTimeline.push({
      date: prospect.lastSentAt || prospect.emailSentAt || new Date().toISOString(),
      title: 'Email Rebotado',
      desc: 'El servidor rechazó el correo (hard bounce)',
      icon: <X size={14} className="text-error" />
    });
  }
  if (prospect.outreachStatus === 'replied') {
    activityTimeline.push({
      date: new Date().toISOString(),
      title: 'Respuesta Recibida',
      desc: 'El prospecto ha respondido al correo',
      icon: <MessageSquare size={14} className="text-primary" />
    });
  }
  if (prospect.status === 'Oportunidad') {
    activityTimeline.push({
      date: new Date().toISOString(), // Fallback if no timeline date exists for status change
      title: 'Calificado como Oportunidad',
      desc: 'El prospecto avanzó en el pipeline',
      icon: <Sparkles size={14} className="text-amber-500" />
    });
  }

  // Sort timeline by date descending
  activityTimeline.sort((a, b) => new Date(b.date) - new Date(a.date));

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
            {prospect.profileImage ? (
              <img src={prospect.profileImage} alt={prospect.decisionMaker} className="w-16 h-16 rounded-xl object-cover shadow-lg shadow-primary/20 shrink-0" />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                <Building2 size={32} className="text-on-primary"/>
              </div>
            )}
            <div className="min-w-[200px]">
              {isEditing ? (
                <>
                  <input type="text" value={editForm.company || ''} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-1 mb-1 font-bold text-xl outline-none focus:border-primary" placeholder="Compañía" />
                  <input type="text" value={editForm.industry || ''} onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-1 text-sm outline-none focus:border-primary" placeholder="Industria" />
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-on-surface">{prospect.company}</h1>
                  <p className="text-sm text-on-surface-variant mt-1">{prospect.industry}</p>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0 xl:justify-end">
            {isEditing ? (
               <div className="flex flex-col sm:flex-row items-end gap-3 text-sm">
                 <div className="flex flex-col gap-2">
                   <div className="flex items-center justify-end gap-2">
                     <label className="text-on-surface-variant text-xs">Status</label>
                     <select value={editForm.status || 'Prospecto'} onChange={e => setEditForm({...editForm, status: e.target.value})} className="bg-surface-container-lowest border border-outline-variant/30 text-on-surface rounded px-2 py-1 outline-none">
                       <option value="Prospecto">Prospecto</option>
                       <option value="Oportunidad">Oportunidad</option>
                       <option value="Propuesta">Propuesta</option>
                       <option value="Cerrado">Cerrado</option>
                     </select>
                   </div>
                   <div className="flex items-center justify-end gap-2">
                     <label className="text-on-surface-variant text-xs">Prioridad</label>
                     <select value={editForm.priority || 'Baja'} onChange={e => setEditForm({...editForm, priority: e.target.value})} className="bg-surface-container-lowest border border-outline-variant/30 text-on-surface rounded px-2 py-1 outline-none">
                       <option value="Baja">Baja</option>
                       <option value="Media">Media</option>
                       <option value="Alta">Alta</option>
                       <option value="Urgente">Urgente</option>
                     </select>
                   </div>
                   <div className="flex items-center justify-end gap-2">
                     <label className="text-on-surface-variant text-xs">Score</label>
                     <input type="number" value={editForm.score || 0} onChange={e => setEditForm({...editForm, score: parseInt(e.target.value)||0})} className="w-20 bg-surface-container-lowest border border-outline-variant/30 text-on-surface rounded px-2 py-1 outline-none" />
                   </div>
                 </div>
                 <div className="flex flex-col gap-2 ml-4">
                    <button onClick={saveEdit} className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
                      <Check size={16} /> Guardar
                    </button>
                    <button onClick={toggleEdit} className="bg-surface-container-highest text-on-surface px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-container-highest/80 transition-colors text-center">
                      Cancelar
                    </button>
                 </div>
               </div>
            ) : (
              <>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${prospect.status === 'Oportunidad' ? 'bg-error/10 text-error' : prospect.status === 'Propuesta' ? 'bg-primary/20 text-primary-container' : prospect.status === 'Cerrado' ? 'bg-tertiary/20 text-tertiary' : 'bg-primary/10 text-primary'}`}>{prospect.status || 'Prospecto'}</span>
                <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-ghost ${['Urgente', 'High'].includes(prospect.priority) ? 'bg-error/10 text-error' : prospect.priority === 'Alta' ? 'bg-error/5 text-error/80' : 'bg-surface text-on-surface-variant'}`}>{prospect.priority}</span>
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-tertiary/10 text-tertiary shadow-ghost">{prospect.score}/100</span>
                <button onClick={toggleEdit} title="Editar prospecto" className="ml-2 text-on-surface-variant hover:text-primary-container p-2 rounded-lg bg-surface-container hover:bg-surface-container-highest transition-colors">
                  <Edit2 size={16} />
                </button>
              </>
            )}
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
            {isEditing ? (
              <div className="space-y-2 mb-3">
                <input type="text" value={editForm.decisionMaker || ''} onChange={e => setEditForm({...editForm, decisionMaker: e.target.value})} className="w-full text-lg font-semibold bg-surface-container text-on-surface border border-outline-variant/30 rounded px-2 py-1 outline-none focus:border-primary" placeholder="Nombre" />
                <input type="text" value={editForm.role || ''} onChange={e => setEditForm({...editForm, role: e.target.value})} className="w-full text-sm bg-surface-container text-on-surface border border-outline-variant/30 rounded px-2 py-1 outline-none focus:border-primary" placeholder="Cargo" />
              </div>
            ) : (
              <>
                <p className="text-lg font-semibold text-on-surface">{prospect.decisionMaker}</p>
                <p className="text-sm text-on-surface-variant mb-3">{prospect.role}</p>
              </>
            )}
            
            <div className="space-y-2 mt-4">
              {isEditing ? (
                <div className="space-y-3 pb-2 text-sm">
                  <div>
                    <label className="text-xs text-on-surface-variant font-medium">Email</label>
                    <input type="email" value={editForm.email || ''} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full bg-surface-container text-on-surface border border-outline-variant/30 rounded px-2 py-1.5 outline-none focus:border-primary" placeholder="Email" />
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant font-medium">Teléfono</label>
                    <input type="tel" value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-surface-container text-on-surface border border-outline-variant/30 rounded px-2 py-1.5 outline-none focus:border-primary" placeholder="Teléfono" />
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant font-medium">LinkedIn Persona</label>
                    <input type="url" value={editForm.linkedin || ''} onChange={e => setEditForm({...editForm, linkedin: e.target.value})} className="w-full bg-surface-container text-on-surface border border-outline-variant/30 rounded px-2 py-1.5 outline-none focus:border-primary" placeholder="URL LinkedIn de la persona" />
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant font-medium">LinkedIn Empresa</label>
                    <input type="url" value={editForm.companyLinkedin || ''} onChange={e => setEditForm({...editForm, companyLinkedin: e.target.value})} className="w-full bg-surface-container text-on-surface border border-outline-variant/30 rounded px-2 py-1.5 outline-none focus:border-primary" placeholder="URL LinkedIn de la empresa" />
                  </div>
                </div>
              ) : (
                <>
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
                  <div className="flex flex-col gap-2 pt-2">
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Social</p>
                    {prospect.linkedin ? (
                      <a href={prospect.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-primary-container hover:underline">
                        <Linkedin size={14}/> Perfil LinkedIn
                      </a>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-on-surface-variant/50 italic">
                        <Linkedin size={14}/> Pendiente de reporte
                      </span>
                    )}
                    {prospect.companyLinkedin ? (
                      <a href={prospect.companyLinkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary-container">
                        <Building2 size={14}/> Empresa LinkedIn
                      </a>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-on-surface-variant/50 italic">
                        <Building2 size={14}/> Pendiente de reporte
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-6 shadow-none">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase flex items-center gap-2"><Mail size={16}/> Email Sugerido (IA)</h3>
            <div className="flex items-center gap-2">
              {prospect.emailSent && (
                <span className="flex items-center gap-1 text-xs font-semibold text-tertiary bg-tertiary/10 px-2 py-1 rounded-full">
                  <CheckCircle2 size={12}/> Enviado
                </span>
              )}
              {localDraftEmail && (
                <button onClick={() => copyToClipboard(localDraftEmail, 'Email sugerido')} className="text-xs text-on-surface-variant hover:text-primary-container transition-colors">Copiar</button>
              )}
              <button
                onClick={openSendModal}
                className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-on-primary px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Send size={12}/> {prospect.emailSent ? 'Reenviar' : 'Enviar Email'}
              </button>
            </div>
          </div>
          {localDraftEmail ? (
            <div className="bg-surface-container-lowest p-4 rounded-lg">
              <div className="mb-3 pb-3 border-b border-surface flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="font-semibold text-sm text-on-surface"><span className="text-on-surface-variant mr-2">Asunto:</span> {localDraftSubject}</p>
                <button onClick={() => copyToClipboard(localDraftSubject, 'Asunto')} className="text-xs text-on-surface-variant hover:text-primary-container self-end sm:self-auto">Copiar Asunto</button>
              </div>
              <p className="text-sm text-on-surface-variant whitespace-pre-wrap leading-relaxed">{localDraftEmail}</p>
            </div>
          ) : (
            <div className="bg-surface-container-lowest p-6 rounded-lg flex flex-col items-center gap-3 text-center">
              <Sparkles size={28} className="text-on-surface-variant/40" />
              <p className="text-sm text-on-surface-variant">Este prospecto no tiene draft de email.</p>
              <button
                onClick={handleGenerateDraft}
                disabled={isGeneratingDraft}
                className="flex items-center gap-2 bg-primary text-on-primary text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Sparkles size={14} />
                {isGeneratingDraft ? 'Generando...' : 'Generar Draft con IA'}
              </button>
              <p className="text-xs text-on-surface-variant/60">Basado en trigger, pain points y caso de uso del prospecto</p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-surface-container-low rounded-xl p-6 shadow-elevation">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase flex items-center gap-2 mb-5"><Clock size={16} className="text-primary-container"/> Activity Timeline</h3>
        <div className="space-y-4">
          {activityTimeline.length === 0 ? (
            <div className="text-sm text-on-surface-variant italic text-center py-6">
              No hay actividad reciente registrada para este prospecto.
            </div>
          ) : (
            <div className="relative border-l border-surface-container-highest ml-3 space-y-6 pb-2">
              {activityTimeline.map((item, i) => (
                <div key={i} className="relative pl-6">
                  <div className="absolute -left-[13px] top-1 bg-surface-container-low p-1 rounded-full border border-surface-container-highest">
                    <div className="bg-surface-container-highest rounded-full p-1.5 flex items-center justify-center shadow-ghost">
                      {item.icon}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">{item.title}</h4>
                    <p className="text-xs text-on-surface-variant mt-1">{item.desc}</p>
                    <span className="text-[10px] text-on-surface-variant/70 font-medium uppercase mt-2 inline-block pt-1 border-t border-surface-container-highest max-w-[200px]">
                      {new Date(item.date).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Private Notes */}
      <div className="bg-surface-container-low rounded-xl p-6 shadow-elevation">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase flex items-center gap-2 mb-4"><StickyNote size={16} className="text-amber-500"/> Notas Privadas</h3>
        <textarea
          value={notes}
          onChange={e => {
            setNotes(e.target.value);
            saveNote({ prospectId: prospect.id, content: e.target.value });
          }}
          placeholder="Escribe notas privadas sobre este prospecto..."
          className="w-full bg-surface-container-lowest rounded-lg p-4 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-1 focus:ring-primary/30 resize-y min-h-[100px] transition-shadow"
        />
      </div>

      {/* Send Email Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setShowSendModal(false)}>
          <div className="bg-surface-container-low rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container-highest">
              <div className="flex items-center gap-2">
                <Send size={18} className="text-primary-container"/>
                <h2 className="font-bold text-on-surface">Enviar Email a {prospect.company}</h2>
              </div>
              <button onClick={() => setShowSendModal(false)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-highest transition-colors">
                <X size={18}/>
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              {/* To */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">Para</label>
                <input
                  type="email"
                  value={sendTo}
                  onChange={e => setSendTo(e.target.value)}
                  placeholder="email@empresa.com"
                  className="w-full bg-surface-container-lowest rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-1 focus:ring-primary/40 transition-shadow"
                />
                {!prospect.email && (
                  <p className="text-[11px] text-amber-500 mt-1">Este prospecto no tiene email — búscalo en Apollo y pégalo aquí.</p>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">Asunto</label>
                <input
                  type="text"
                  value={sendSubject}
                  onChange={e => setSendSubject(e.target.value)}
                  className="w-full bg-surface-container-lowest rounded-lg px-3 py-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary/40 transition-shadow"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">Cuerpo</label>
                <textarea
                  value={sendBody}
                  onChange={e => setSendBody(e.target.value)}
                  rows={10}
                  className="w-full bg-surface-container-lowest rounded-lg px-3 py-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary/40 resize-y transition-shadow leading-relaxed"
                />
              </div>

              {/* From notice */}
              <p className="text-[11px] text-on-surface-variant bg-surface-container-highest rounded-lg px-3 py-2">
                Enviado desde <span className="font-semibold text-on-surface">miguel@outreach.voxmedia.com.mx</span> · Reply-To <span className="font-semibold text-on-surface">miguel@voxmedia.com.mx</span>
              </p>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-surface-container-highest flex items-center justify-between gap-3">
              <button onClick={() => setShowSendModal(false)} className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSendEmail}
                disabled={isSending}
                className="flex items-center gap-2 bg-primary text-on-primary text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Send size={14}/>
                {isSending ? 'Enviando...' : 'Confirmar y Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
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
