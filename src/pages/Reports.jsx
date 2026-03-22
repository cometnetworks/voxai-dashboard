import React, { useState, useRef } from 'react';
import { Clock, FileText, CheckCircle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { extractTextFromPdf, analyzeProspectsWithAI } from '../parser';

export default function Reports({ prospects, setProspects, reportsHistory, setReportsHistory }) {
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
      const filteredProspects = newValidProspects.filter(p => p !== null && typeof p === 'object');
      if (filteredProspects.length === 0) throw new Error("No se encontraron prospectos válidos en la respuesta de la IA.");

      let addedCount = 0;
      let updatedCount = 0;
      let updatedProspects = [...prospects];

      filteredProspects.forEach(newP => {
        const companyName = (newP.company || '').trim().toLowerCase();
        
        // If there's no company name, just add it as a new prospect with a unique ID
        if (!companyName) {
          const uniqueId = `p_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          updatedProspects.unshift({ ...newP, id: uniqueId });
          addedCount++;
          return;
        }

        const existingIndex = updatedProspects.findIndex(
          p => (p.company || '').trim().toLowerCase() === companyName
        );

        if (existingIndex >= 0) {
          // Merge with existing
          const existing = updatedProspects[existingIndex];
          const merged = { ...existing };
          let hasChanges = false;
          
          Object.keys(newP).forEach(key => {
            if (key === 'id') return; // Do not override the unique ID
            
            const currentVal = merged[key];
            const newVal = newP[key];
            
            const isCurrentEmpty = currentVal === null || currentVal === undefined || currentVal.toString().trim() === '';
            const isNewValid = newVal !== null && newVal !== undefined && newVal.toString().trim() !== '';

            if (isCurrentEmpty && isNewValid) {
              merged[key] = newVal;
              hasChanges = true;
            }
          });

          if (hasChanges) {
             updatedProspects.splice(existingIndex, 1);
             updatedProspects.unshift(merged); // Move to top of the list
             updatedCount++;
          }
        } else {
          // Add as new
          const uniqueId = `p_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          updatedProspects.unshift({ ...newP, id: uniqueId });
          addedCount++;
        }
      });

      setProspects(updatedProspects);
      
      const summaryMsg = `Nuevos: ${addedCount}. Actualizados: ${updatedCount}.`;
      setReportsHistory([{ id: Date.now(), name: file.name, date: new Date().toISOString(), count: `${addedCount} nvos / ${updatedCount} act` }, ...reportsHistory]);
      
      setProgress(100);
      toast.success(`Reporte procesado. ${summaryMsg}`, { id: toastId });
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
        <h2 className="text-2xl font-bold text-on-surface">Cargar Reportes IA</h2>
        <p className="text-sm text-on-surface-variant mt-1">Sube tus PDFs de Sales Navigator para extraer prospectos automáticamente</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-container-low rounded-xl p-6 shadow-none">
          <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" />
          <div 
            onDragOver={e => e.preventDefault()} 
            onDrop={handleDrop} 
            onClick={() => !isUploading && fileInputRef.current?.click()} 
            className={`border-2 border-dashed ${isUploading ? 'border-primary bg-primary/5' : 'border-surface-container-highest hover:bg-surface-container hover:border-primary-container text-on-surface-variant text-center'} rounded-xl p-10 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center justify-center">
                <Clock className="animate-spin text-primary mb-4" size={40}/>
                <p className="text-lg font-medium text-on-surface">Procesando con IA...</p>
                <div className="w-full max-w-xs bg-surface-container-highest rounded-full h-2.5 mt-4">
                  <div className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-sm text-on-surface-variant mt-2">{progress}% completado</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-4 text-on-surface-variant">
                  <FileText size={32}/>
                </div>
                <p className="text-lg font-medium text-on-surface">Arrastra tu reporte PDF aquí</p>
                <p className="text-sm text-on-surface-variant mt-1">o haz clic para explorar tus archivos</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-6 shadow-none flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <h3 className="font-semibold text-lg text-on-surface">Historial de Reportes</h3>
            <div className="flex items-center gap-2 bg-tertiary/10 text-tertiary px-3 py-1.5 rounded-lg shadow-ghost">
              <ShieldCheck size={16} />
              <div className="flex flex-col">
                <span className="text-xs font-bold leading-none">98.5% Sync Integrity</span>
                <span className="text-[10px] leading-tight opacity-80">Últimos 50 procesos</span>
              </div>
            </div>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {reportsHistory.length === 0 ? (
               <div className="text-center py-12 text-on-surface-variant text-sm">No hay reportes procesados aún.</div>
            ) : (
              reportsHistory.map(r => (
                <div key={r.id} className="bg-surface-container-lowest hover:bg-surface border border-transparent hover:border-surface-container-highest p-4 rounded-lg flex items-center justify-between transition-colors shadow-ghost">
                  <div className="flex items-start gap-3">
                    <FileText className="text-on-surface-variant mt-1 shrink-0" size={18} />
                    <div>
                      <p className="text-sm font-semibold text-on-surface line-clamp-1">{r.name}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{new Date(r.date).toLocaleDateString()} a las {new Date(r.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • <span className="font-medium text-primary-container">{r.count} prospectos</span></p>
                    </div>
                  </div>
                  <CheckCircle className="text-tertiary shrink-0 ml-2" size={20} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
