import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('gerson.cuidador@gmail.com');
  const [password, setPassword] = useState('password123');
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
          Iniciar Sesión
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-light">
          Supervisa el bienestar, recetas y signos vitales de tu familiar.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 sm:px-10">
          
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 mb-6 flex items-center gap-2.5 text-forest-900 text-xs">
            <ShieldCheck className="w-5 h-5 text-forest-700 flex-shrink-0" />
            <span><strong className="font-heading font-semibold">Modo de Demostración:</strong> Cuenta lista para ingresar.</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  data-testid="input-login-email"
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
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  data-testid="input-login-password"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 focus:ring-1 focus:ring-forest-700 focus:border-forest-700 focus:outline-none text-xs text-slate-900 font-mono"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-light">
              <label className="flex items-center text-slate-600">
                <input type="checkbox" defaultChecked className="border-slate-300 text-forest-700 focus:ring-forest-700 mr-2" />
                Recordar sesión
              </label>
              <a href="#olvide" onClick={e => { e.preventDefault(); alert('Recuperación enviada al correo.'); }} className="text-forest-700 hover:underline font-medium">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                data-testid="btn-submit-login"
                className="w-full bg-forest-700 hover:bg-forest-800 text-white font-heading font-medium text-xs uppercase tracking-wider py-3.5 px-4 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>{isLoading ? 'Iniciando sesión...' : 'Ingresar al Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-500 font-light">
              ¿No tienes una cuenta de cuidador?{' '}
              <Link to="/register" className="font-medium text-forest-700 hover:underline">
                Regístrate gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
