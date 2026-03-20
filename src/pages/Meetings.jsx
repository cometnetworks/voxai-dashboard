import React, { useState } from 'react';
import { Video, Calendar, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Meetings({ prospects, meetings, setMeetings }) {
  const [newLink, setNewLink] = useState('');
  const [selectedP, setSelectedP] = useState(prospects[0]?.id || '');
  const [date, setDate] = useState('');

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
        <h2 className="text-2xl font-bold dark:text-white text-slate-800">Reuniones Confirmadas</h2>
        <p className="text-sm text-slate-500 mt-1">Gestiona tus próximas videollamadas con prospectos</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800/60 rounded-xl p-6 shadow-sm h-fit sticky top-24">
          <h3 className="font-semibold text-lg dark:text-white text-slate-800 mb-6 flex items-center gap-2">
            <Video size={20} className="text-blue-500"/> Agendar Nueva Reunión
          </h3>
          <form onSubmit={addMeeting} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Prospecto</label>
              <select value={selectedP} onChange={e=>setSelectedP(e.target.value)} required className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700/50 rounded-lg p-2.5 text-sm dark:text-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow">
                {prospects.map(p=><option key={p.id} value={p.id}>{p.company}</option>)}
                {prospects.length === 0 && <option value="" disabled>No hay prospectos disponibles</option>}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Fecha y Hora</label>
              <input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} required className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700/50 rounded-lg p-2.5 text-sm dark:text-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Enlace (Google Meet / Zoom)</label>
              <input type="url" placeholder="https://meet.google.com/..." value={newLink} onChange={e=>setNewLink(e.target.value)} required className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700/50 rounded-lg p-2.5 text-sm dark:text-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow" />
            </div>
            <button type="submit" disabled={prospects.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium p-2.5 rounded-lg transition-colors mt-2">
              Agendar Reunión
            </button>
          </form>
        </div>
        
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-lg dark:text-white text-slate-800 mb-2">Próximos Eventos</h3>
          {meetings.length === 0 ? (
            <div className="bg-white/50 dark:bg-[#111827]/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-12 text-center">
              <Calendar className="mx-auto text-slate-400 mb-3" size={32} />
              <p className="text-slate-500 font-medium">No hay reuniones agendadas</p>
              <p className="text-slate-400 text-sm mt-1">Usa el formulario para agendar una nueva videollamada.</p>
            </div>
          ) : (
            meetings.sort((a,b) => new Date(a.date) - new Date(b.date)).map(m => {
              const prospect = prospects.find(p => p.id === m.prospectId);
              const meetingDate = new Date(m.date);
              const isPast = meetingDate < new Date();
              return (
                <div key={m.id} className={`bg-white/80 dark:bg-[#111827]/80 backdrop-blur-sm border ${isPast ? 'border-slate-200 dark:border-slate-800/40 opacity-70' : 'border-slate-200 dark:border-slate-700/60 shadow-sm hover:border-blue-500/30'} rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg ${isPast ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'} flex items-center justify-center shrink-0`}>
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg dark:text-white text-slate-800 leading-tight">
                        {prospect ? prospect.company : 'Prospecto Eliminado'}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {meetingDate.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a las {meetingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {prospect && <p className="text-xs text-slate-400 mt-1">Con: {prospect.decisionMaker}</p>}
                    </div>
                  </div>
                  <a href={m.link} target="_blank" rel="noreferrer" className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors sm:w-auto w-full ${isPast ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700' : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'}`}>
                    <span>Unirse a la sala</span>
                    <ExternalLink size={16} />
                  </a>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
