import React, { useState, useRef } from 'react';
import { Clock, FileText, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { extractTextFromPdf, analyzeProspectsWithAI } from '../parser';

export default function Reports({ setProspects, reportsHistory, setReportsHistory }) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef(null);

  const processFile = async (file) => {
    setIsUploading(true);
    setProgress(10);
    const toastId = toast.loading('Procesando PDF con IA...', { position: 'bottom-right' });
    
    try {
      const text = await extractTextFromPdf(file);
      setProgress(40);
      toast.loading('Analizando prospectos...', { id: toastId });
      
      const newProspects = await analyzeProspectsWithAI(text);
      setProgress(90);
      
      const newValidProspects = Array.isArray(newProspects) ? newProspects : [newProspects];
      if (newValidProspects.length === 0) throw new Error("No properties validos encontrados");

      setProspects(prev => [...newValidProspects, ...prev]);
      setReportsHistory([{ id: Date.now(), name: file.name, date: new Date().toISOString(), count: newValidProspects.length }, ...reportsHistory]);
      
      setProgress(100);
      toast.success(`Reporte procesado: ${newValidProspects.length} prospecto(s) extraído(s).`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error al procesar el PDF', { id: toastId });
    } finally {
      setTimeout(() => { setIsUploading(false); setProgress(0); }, 1000);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files?.[0]) {
      await processFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold dark:text-white text-slate-800">Cargar Reportes IA</h2>
        <p className="text-sm text-slate-500 mt-1">Sube tus PDFs de Sales Navigator para extraer prospectos automáticamente</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800/60 rounded-xl p-6 shadow-sm">
          <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" />
          <div 
            onDragOver={e => e.preventDefault()} 
            onDrop={handleDrop} 
            onClick={() => !isUploading && fileInputRef.current?.click()} 
            className={`border-2 border-dashed ${isUploading ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/5' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-600'} rounded-xl p-10 text-center cursor-pointer transition-all duration-200`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center justify-center">
                <Clock className="animate-spin text-blue-500 mb-4" size={40}/>
                <p className="text-lg font-medium dark:text-white text-slate-800">Procesando con IA...</p>
                <div className="w-full max-w-xs bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mt-4">
                  <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-sm text-slate-500 mt-2">{progress}% completado</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-500 dark:text-slate-400">
                  <FileText size={32}/>
                </div>
                <p className="text-lg font-medium dark:text-white text-slate-800">Arrastra tu reporte PDF aquí</p>
                <p className="text-sm text-slate-500 mt-1">o haz clic para explorar tus archivos</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800/60 rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-4">Historial de Reportes</h3>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {reportsHistory.length === 0 ? (
               <div className="text-center py-12 text-slate-500 text-sm">No hay reportes procesados aún.</div>
            ) : (
              reportsHistory.map(r => (
                <div key={r.id} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 p-4 rounded-lg flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                  <div className="flex items-start gap-3">
                    <FileText className="text-slate-400 mt-1 shrink-0" size={18} />
                    <div>
                      <p className="text-sm font-semibold dark:text-slate-200 text-slate-800 line-clamp-1">{r.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(r.date).toLocaleDateString()} a las {new Date(r.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • <span className="font-medium text-blue-600 dark:text-blue-400">{r.count} prospectos</span></p>
                    </div>
                  </div>
                  <CheckCircle className="text-emerald-500 shrink-0 ml-2" size={20} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
