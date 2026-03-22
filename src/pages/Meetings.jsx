import React, { useState } from 'react';
import { Video, Calendar, ExternalLink, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Meetings({ prospects, meetings, setMeetings }) {
  const [newLink, setNewLink] = useState('');
  const [selectedP, setSelectedP] = useState(prospects[0]?.id || '');
  const [date, setDate] = useState('');
  const [prepState, setPrepState] = useState({});

  const handleSmartPrep = (mId, prospect) => {
    if (!prospect) return;
    setPrepState(prev => ({...prev, [mId]: { loading: true }}));
    setTimeout(() => {
      setPrepState(prev => ({
        ...prev, 
        [mId]: {
          loading: false,
          summary: `Historial: ${prospect.company} está evaluando opciones. Objetivo: Cierre y presupuesto. Puntos Clave de Nexo IA:\n1. Destacar ahorro de tiempo con Onboarding guiado.\n2. Minimizar riesgo con SLA del 99.9%.\n3. Ofrecer piloto restrictivo de 14 días.`
        }
      }));
      toast.success('Preparación IA lista');
    }, 2000);
  };

  const addMeeting = (e) => {
    e.preventDefault();
    if(!newLink || !selectedP || !date) return;
    setMeetings([{id: Date.now(), prospectId: selectedP, link: newLink, date: date, notes: ''}, ...meetings]);
    setNewLink(''); 
    setDate('');
    toast.success('Reunión agendada exitosamente', { position: 'bottom-right' });
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-on-surface">Reuniones Confirmadas</h2>
        <p className="text-sm text-on-surface-variant mt-1">Gestiona tus próximas videollamadas con prospectos</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-surface-container-low rounded-xl p-6 shadow-none h-fit sticky top-24">
          <h3 className="font-semibold text-lg text-on-surface mb-6 flex items-center gap-2">
            <Video size={20} className="text-primary-container"/> Agendar Nueva Reunión
          </h3>
          <form onSubmit={addMeeting} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1.5 ml-1">Prospecto</label>
              <select value={selectedP} onChange={e=>setSelectedP(e.target.value)} required className="w-full bg-surface-container-lowest rounded-lg p-2.5 text-sm text-on-surface outline-none focus:shadow-ghost transition-shadow">
                {prospects.map(p=><option key={p.id} value={p.id}>{p.company}</option>)}
                {prospects.length === 0 && <option value="" disabled>No hay prospectos disponibles</option>}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1.5 ml-1">Fecha y Hora</label>
              <input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} required className="w-full bg-surface-container-lowest rounded-lg p-2.5 text-sm text-on-surface outline-none focus:shadow-ghost transition-shadow" />
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1.5 ml-1">Enlace (Google Meet / Zoom)</label>
              <input type="url" placeholder="https://meet.google.com/..." value={newLink} onChange={e=>setNewLink(e.target.value)} required className="w-full bg-surface-container-lowest rounded-lg p-2.5 text-sm text-on-surface outline-none focus:shadow-ghost transition-shadow" />
            </div>
            <button type="submit" disabled={prospects.length === 0} className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-on-primary font-medium p-2.5 rounded-lg transition-colors mt-2">
              Agendar Reunión
            </button>
          </form>
        </div>
        
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-lg text-on-surface mb-2">Próximos Eventos</h3>
          {meetings.length === 0 ? (
            <div className="bg-surface-container border border-dashed border-surface-container-highest rounded-xl p-12 text-center">
              <Calendar className="mx-auto text-on-surface-variant mb-3" size={32} />
              <p className="text-on-surface font-medium">No hay reuniones agendadas</p>
              <p className="text-on-surface-variant text-sm mt-1">Usa el formulario para agendar una nueva videollamada.</p>
            </div>
          ) : (
            meetings.sort((a,b) => new Date(a.date) - new Date(b.date)).map(m => {
              const prospect = prospects.find(p => p.id === m.prospectId);
              const meetingDate = new Date(m.date);
              const isPast = meetingDate < new Date();
              return (
                <div key={m.id} className={`${isPast ? 'bg-surface/50 opacity-70' : 'bg-surface shadow-elevation hover:-translate-y-1'} rounded-xl p-5 flex flex-col gap-4 transition-all`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg ${isPast ? 'bg-surface-container-highest text-on-surface-variant' : 'bg-primary-container/20 text-primary-container'} flex items-center justify-center shrink-0`}>
                        <Calendar size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-on-surface leading-tight">
                          {prospect ? prospect.company : 'Prospecto Eliminado'}
                        </h4>
                        <p className="text-sm text-on-surface-variant mt-1">
                          {meetingDate.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a las {meetingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {prospect && <p className="text-xs text-on-surface-variant mt-1">Con: {prospect.decisionMaker}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2">
                      <a href={m.link} target="_blank" rel="noreferrer" className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors sm:w-auto w-full ${isPast ? 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container' : 'bg-primary text-on-primary hover:bg-primary/90'}`}>
                        <span>Entrar</span>
                        <ExternalLink size={16} />
                      </a>
                      {!isPast && prospect && !prepState[m.id]?.summary && (
                        <button onClick={() => handleSmartPrep(m.id, prospect)} disabled={prepState[m.id]?.loading} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-tertiary/10 text-tertiary hover:bg-tertiary/20 transition-colors sm:w-auto w-full disabled:opacity-50">
                          <Sparkles size={16} />
                          {prepState[m.id]?.loading ? 'Analizando...' : 'Preparación IA'}
                        </button>
                      )}
                    </div>
                  </div>
                  {prepState[m.id]?.summary && (
                    <div className="mt-2 bg-surface-container-low p-4 rounded-lg border border-tertiary/20">
                      <h5 className="text-xs font-bold text-tertiary uppercase flex items-center gap-2 mb-2"><Sparkles size={14}/> Insight Prep AI</h5>
                      <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{prepState[m.id].summary}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
