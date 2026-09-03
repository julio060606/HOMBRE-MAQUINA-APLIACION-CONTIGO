import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Pill, 
  Activity, 
  FileText, 
  Sliders, 
  Smartphone,
  ShieldCheck
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/dashboard', label: 'Panel del Cuidador', icon: LayoutDashboard, testId: 'nav-dashboard' },
    { to: '/medications', label: 'Medicamentos & Recetas', icon: Pill, testId: 'nav-medications' },
    { to: '/vitals', label: 'Presión & Biometría', icon: Activity, testId: 'nav-vitals' },
    { to: '/reports', label: 'Reporte Médico PDF', icon: FileText, testId: 'nav-reports' },
    { to: '/settings', label: 'Ajustes & Umbrales', icon: Sliders, testId: 'nav-settings' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/70 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 select-none font-sans">
      <div>
        <div className="text-[10px] font-heading font-semibold text-slate-400 uppercase tracking-widest px-3 mb-3">
          Módulos Clínicos
        </div>
        <nav className="space-y-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                data-testid={item.testId}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 text-xs font-heading uppercase tracking-wider rounded-2xl transition-all duration-200 ${
                    isActive
                      ? 'bg-forest-700 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Sincronización Móvil Card */}
      <div className="bg-gradient-to-br from-slate-50 to-emerald-50/30 border border-slate-200/70 rounded-2xl p-4 mt-6">
        <div className="flex items-center space-x-2 text-slate-900 font-heading font-semibold text-xs mb-1 uppercase tracking-wider">
          <Smartphone className="w-4 h-4 text-forest-700" />
          <span>Sincronización Activa</span>
        </div>
        <p className="text-[11px] text-slate-500 font-light leading-relaxed">
          Tus recetas y ajustes clínicos se replican instantáneamente en la app móvil del paciente.
        </p>
      </div>
    </aside>
  );
};
