import React from 'react';
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

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { activePatient, patients, setActivePatient } = usePatient();
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
            <div className="w-9 h-9 bg-forest-700 flex items-center justify-center text-white shadow-sm transition-all group-hover:bg-forest-800">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter">
                <path d="M12 2v20M2 12h20" />
                <rect x="5" y="5" width="14" height="14" strokeWidth="1.5" />
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

          <span className="text-slate-300 font-light text-base hidden sm:inline select-none">|</span>

          {/* Selector de Paciente Activo */}
          {activePatient && (
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs">
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
        <div className="flex items-center space-x-4">
          
          <Link
            to="/clinic"
            target="_blank"
            rel="noopener noreferrer"
            title="Ver sitio web del Centro Médico Aliado"
            className="hidden md:flex items-center gap-1.5 text-xs font-heading font-medium text-slate-600 hover:text-blue-900 uppercase tracking-wider transition-colors"
          >
            <span>Centro Médico</span>
            <ExternalLink className="w-3 h-3 text-blue-800" />
          </Link>

          <span className="text-slate-300 font-light text-base select-none">|</span>

          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-heading font-semibold text-xs">
                {user?.fullName?.charAt(0) || 'C'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="font-heading font-medium text-slate-900 text-xs leading-none">
                  {user?.fullName || 'Gerson Ramos'}
                </div>
                <div className="text-[10px] text-slate-400 font-light mt-0.5">Cuidador Principal</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              data-testid="btn-logout"
              title="Cerrar sesión"
              className="p-2 text-slate-400 hover:text-rose-700 hover:bg-slate-100 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
