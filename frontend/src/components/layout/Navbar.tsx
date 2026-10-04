import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePatient } from '../../context/PatientContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  LogOut, 
  Smartphone, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { MobilePatientSimulatorModal } from '../simulator/MobilePatientSimulatorModal';

interface NavbarProps {
  onOpenLinkModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLinkModal }) => {
  const { user, logout } = useAuth();
  const { activePatient, patients, setActivePatient } = usePatient();
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 transition-all font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Marca Contigo */}
        <div className="flex items-center space-x-6">
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 bg-forest-700 rounded-xl flex items-center justify-center text-white shadow-xs transition-all group-hover:bg-forest-800">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M2 12h20" />
                <rect x="5" y="5" width="14" height="14" rx="3" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-semibold text-base text-slate-950 tracking-wider uppercase leading-none">
                CONTIGO
              </span>
              <span className="text-[9px] text-forest-700 font-heading font-medium tracking-widest uppercase mt-0.5">
                Portal Cuidador
              </span>
            </div>
          </Link>

          <span className="text-slate-200 font-light text-base hidden sm:inline select-none">|</span>

          {/* Selector de Paciente Activo */}
          {activePatient && (
            <div className="flex items-center space-x-2 bg-slate-50/80 border border-slate-200/70 rounded-xl px-3 py-1.5 text-xs shadow-xs">
              <span className="text-[10px] font-heading font-semibold uppercase tracking-wider text-slate-400">
                Paciente:
              </span>
              <select
                value={activePatient.id}
                onChange={(e) => {
                  const p = patients.find(pat => pat.id === e.target.value);
                  if (p) setActivePatient(p);
                }}
                data-testid="select-patient-active"
                className="bg-transparent font-heading font-medium text-slate-900 focus:outline-none cursor-pointer pr-2"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.age} años)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Acciones del Usuario & Estado Móvil */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          
          {/* Botón de Demostración del Móvil del Paciente */}
          <button
            onClick={() => setIsSimulatorOpen(true)}
            data-testid="btn-open-mobile-simulator"
            className="flex items-center gap-1.5 sm:gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-forest-700 font-heading font-semibold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-all animate-pulse hover:animate-none"
            title="Abrir simulador del celular del paciente para probar la sincronización en vivo"
          >
            <Smartphone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="hidden md:inline">Simular Móvil Paciente</span>
            <span className="md:hidden">Móvil</span>
          </button>

          <Link
            to="/clinic"
            target="_blank"
            rel="noopener noreferrer"
            title="Ver sitio web del Centro Médico Aliado"
            className="hidden lg:flex items-center gap-1.5 text-xs font-heading font-medium text-slate-600 hover:text-forest-700 uppercase tracking-wider transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-50"
          >
            <span>Centro Médico</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <span className="text-slate-200 font-light text-base select-none hidden sm:inline">|</span>

          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-forest-700 font-heading font-semibold text-xs shadow-xs">
                {user?.name?.charAt(0) || 'C'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="font-heading font-medium text-slate-900 text-xs leading-none">
                  {user?.name || 'Gerson Ramos'}
                </div>
                <div className="text-[10px] text-slate-400 font-light mt-0.5">Cuidador Principal</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              data-testid="btn-logout"
              title="Cerrar sesión"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Modal Simulador del Móvil del Paciente */}
      <MobilePatientSimulatorModal 
        isOpen={isSimulatorOpen} 
        onClose={() => setIsSimulatorOpen(false)} 
      />
    </header>
  );
};
