import React from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';

export default function Login({ onLogin }) {
  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md w-full">
        {/* Logo */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-8">
          <Sparkles size={40} className="text-white" />
        </div>

        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
          VOX AI
        </h1>
        <p className="text-sm text-slate-400 tracking-widest uppercase mb-1">
          Neural Interface v4.0
        </p>
        <p className="text-xs text-slate-500 mb-12">
          Acceso restringido • Solo personal autorizado
        </p>

        <button
          onClick={onLogin}
          className="group w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold py-3.5 px-8 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>Acceder al Dashboard</span>
          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>

        <p className="text-[11px] text-slate-600 mt-8">
          © {new Date().getFullYear()} ZCO Group — Powered by Vox AI
        </p>
      </div>
    </div>
  );
}
