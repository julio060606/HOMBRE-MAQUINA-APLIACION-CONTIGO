import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, User, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-emerald-100 selection:text-emerald-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        
        {/* Logotipo Vectorial de Contigo */}
        <Link to="/landing" className="inline-flex items-center space-x-3 mb-4 group">
          <div className="w-10 h-10 bg-forest-700 flex items-center justify-center text-white shadow-sm transition-all group-hover:bg-forest-800">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter">
              <path d="M12 2v20M2 12h20" />
              <rect x="5" y="5" width="14" height="14" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-heading font-semibold text-lg text-slate-950 tracking-wider uppercase leading-none">
              CONTIGO
            </span>
            <span className="text-[10px] text-forest-700 font-heading font-medium tracking-widest uppercase mt-0.5">
              Portal del Cuidador
            </span>
          </div>
        </Link>

        <h2 className="text-2xl font-heading font-light text-slate-950 tracking-tight">
          Crea tu Cuenta de Cuidador
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-light">
          Comienza a supervisar la salud de tu ser querido en minutos.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-heading font-medium text-slate-700 uppercase tracking-wider mb-1">
                Tu Nombre Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  data-testid="input-register-name"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 focus:ring-1 focus:ring-forest-700 focus:border-forest-700 focus:outline-none text-xs text-slate-900 font-normal"
                  placeholder="Ej: Gerson Ramos"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-heading font-medium text-slate-700 uppercase tracking-wider mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  data-testid="input-register-email"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 focus:ring-1 focus:ring-forest-700 focus:border-forest-700 focus:outline-none text-xs text-slate-900 font-normal"
                  placeholder="ejemplo@correo.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-heading font-medium text-slate-700 uppercase tracking-wider mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  data-testid="input-register-password"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 focus:ring-1 focus:ring-forest-700 focus:border-forest-700 focus:outline-none text-xs text-slate-900 font-mono"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                data-testid="btn-submit-register"
                className="w-full bg-forest-700 hover:bg-forest-800 text-white font-heading font-medium text-xs uppercase tracking-wider py-3.5 px-4 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>{isLoading ? 'Registrando...' : 'Crear Cuenta y Continuar'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-500 font-light">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="font-medium text-forest-700 hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
