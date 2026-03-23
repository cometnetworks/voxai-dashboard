import React from 'react';
import { Moon, Sun, Zap, Lock, Bell, Link2, BookOpen, MessageCircle, Code } from 'lucide-react';

export default function Settings({ isDark, toggleTheme }) {
  return (
    <div className="animate-fade-in space-y-6 pb-20 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-on-surface">Configuración</h2>
        <p className="text-sm text-on-surface-variant mt-1">Personaliza tu experiencia en Vox AI</p>
      </div>

      {/* Appearance */}
      <Section title="Apariencia" icon={<Moon size={18} className="text-primary-container" />}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-on-surface">Modo Oscuro</p>
            <p className="text-xs text-on-surface-variant">Alternar entre tema claro y oscuro</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors duration-200 ${isDark ? 'bg-primary justify-end' : 'bg-surface-container-highest justify-start'}`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center">
              {isDark ? <Moon size={12} className="text-primary" /> : <Sun size={12} className="text-amber-500" />}
            </div>
          </button>
        </div>
      </Section>

      {/* AI Preferences */}
      <Section title="Preferencias de IA" icon={<Zap size={18} className="text-tertiary" />}>
        <div>
          <div className="flex justify-between mb-2">
            <p className="text-sm font-medium text-on-surface">Intensidad de Alertas IA</p>
            <span className="text-xs font-bold text-tertiary">Media</span>
          </div>
          <div className="w-full bg-surface-container-highest rounded-full h-2">
            <div className="bg-tertiary h-2 rounded-full w-1/2"></div>
          </div>
          <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
            <span>Mínima</span>
            <span>Máxima</span>
          </div>
        </div>
      </Section>

      {/* Account */}
      <Section title="Cuenta" icon={<Lock size={18} className="text-error" />}>
        <SettingRow icon={<Lock size={16} />} label="Contraseña y Seguridad" detail="Último cambio: hace 4 meses" />
        <SettingRow icon={<Bell size={16} />} label="Centro de Notificaciones" detail="Gestionar alertas de email y push" />
        <SettingRow icon={<Link2 size={16} />} label="Cuentas Vinculadas" detail="Slack, Google, Azure AD" />
      </Section>

      {/* Help */}
      <Section title="Ayuda y Soporte" icon={<BookOpen size={18} className="text-primary-container" />}>
        <SettingRow icon={<BookOpen size={16} />} label="Documentación" chevron />
        <SettingRow icon={<MessageCircle size={16} />} label="Foro de la Comunidad" chevron />
        <SettingRow icon={<Code size={16} />} label="Referencia API" chevron />
      </Section>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-6 shadow-elevation">
      <h3 className="text-xs font-bold text-on-surface-variant uppercase flex items-center gap-2 mb-5">{icon} {title}</h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function SettingRow({ icon, label, detail, chevron }) {
  return (
    <div className="flex items-center justify-between py-2 group cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="text-on-surface-variant">{icon}</div>
        <div>
          <p className="text-sm font-medium text-on-surface">{label}</p>
          {detail && <p className="text-xs text-on-surface-variant">{detail}</p>}
        </div>
      </div>
      {chevron && <span className="text-on-surface-variant group-hover:text-on-surface transition-colors">›</span>}
    </div>
  );
}
