import { Link, useNavigate } from 'react-router-dom';
import { HeartHandshake, ArrowRight, Lock, Mail, Loader2, Eye, EyeOff, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DEMO_USERS } from '../../services/demo/state';
import { ENV } from '../../config/env';
import { useState } from 'react';
import { User } from '../../types';

const ACTOR_AVATARS: Record<string, string> = {
  caregiver_demo: '/images/caregiver_avatar.jpg',
  patient_dacio: '/images/dacio_avatar.jpg',
  patient_rosa: '/images/rosa_avatar.jpg',
  caregiver_unlinked: '/images/caregiver_avatar.jpg',
};

export function LoginPage() {
  const { enterDemo, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  
  // Pre-filled credentials by default
  const [email, setEmail] = useState('cuidador@contigo.example');
  const [password, setPassword] = useState('Contigo2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedActorId, setSelectedActorId] = useState('caregiver_demo');
  const [loading, setLoading] = useState(false);

  const handleSelectActor = (actor: User) => {
    setSelectedActorId(actor.id);
    setEmail(actor.email);
    setPassword('Contigo2026!');
    setError('');
  };

  const directEnter = (actor: User) => {
    handleSelectActor(actor);
    try {
      if (ENV.USE_MOCKS) {
        enterDemo(actor.id);
        navigate(actor.role === 'ROLE_PATIENT' ? '/patient-app' : '/dashboard');
      } else {
        void handleApiSubmitWith(actor.email, 'Contigo2026!');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
    }
  };

  const handleApiSubmitWith = async (targetEmail: string, targetPass: string) => {
    setLoading(true);
    setError('');
    try {
      const user = await login(targetEmail, targetPass);
      navigate(user.role === 'ROLE_PATIENT' ? '/patient-app' : '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al autenticar en el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (ENV.USE_MOCKS) {
        const target =
          DEMO_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) ||
          DEMO_USERS.find((u) => u.id === selectedActorId) ||
          DEMO_USERS[0];
        enterDemo(target.id);
        navigate(target.role === 'ROLE_PATIENT' ? '/patient-app' : '/dashboard');
      } else {
        const user = await login(email, password);
        navigate(user.role === 'ROLE_PATIENT' ? '/patient-app' : '/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const activeActor = DEMO_USERS.find((u) => u.id === selectedActorId) || DEMO_USERS[0];

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full mx-auto bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden grid lg:grid-cols-12">
        {/* Left Visual Column with Image */}
        <div className="lg:col-span-5 relative bg-gradient-to-br from-forest-900 to-forest-800 text-white p-8 flex flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 opacity-25 mix-blend-overlay">
            <img
              src="/images/caregiver_senior.jpg"
              alt="Acompañamiento clínico San Pablo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative z-10">
            <Link to="/landing" className="inline-flex items-center gap-2.5 text-white font-heading text-2xl font-bold tracking-tight">
              <span className="p-2 bg-white/10 backdrop-blur-md rounded-xl inline-block border border-white/20">
                <HeartHandshake size={28} className="text-emerald-300" />
              </span>
              CONTIGO
            </Link>
            <div className="mt-8 space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                <ShieldCheck size={14} /> Red Clínica San Pablo
              </span>
              <h2 className="text-2xl font-heading font-bold text-white leading-snug">
                Acompañamiento y cuidado domiciliario
              </h2>
              <p className="text-emerald-100/90 text-sm leading-relaxed">
                Supervisión del tratamiento médico indicado por la clínica, tomas oportunas y mediciones en casa.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-white/15 space-y-3 text-xs text-emerald-100/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-300 shrink-0" />
              <span>Dosis y horarios determinados por la clínica</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-300 shrink-0" />
              <span>Tomas y mediciones verificadas por el paciente</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-300 shrink-0" />
              <span>Acompañamiento familiar y reportes de adherencia</span>
            </div>
          </div>
        </div>

        {/* Right Column: Form with Pre-filled Credentials */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-forest-700 uppercase bg-forest-50 px-3 py-1 rounded-full border border-forest-200/60 inline-flex items-center gap-1.5">
                <Sparkles size={13} /> Acceso al Sistema
              </span>
              <span className="text-xs text-slate-500">
                {ENV.USE_MOCKS ? 'Modo Demostración' : 'Modo API Backend'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mt-3">
              Iniciar Sesión
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Las credenciales ya se encuentran puestas y listas para probar la aplicación.
            </p>
          </div>

          {/* Quick Select Profile Pills with Real Photos */}
          <div className="mt-6">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Seleccionar cuenta de prueba:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {DEMO_USERS.filter((u) => u.id !== 'caregiver_unlinked').map((actor) => {
                const isSelected = selectedActorId === actor.id;
                const avatar = ACTOR_AVATARS[actor.id] || '/images/caregiver_avatar.jpg';
                return (
                  <button
                    key={actor.id}
                    type="button"
                    data-testid={`login-${actor.id}`}
                    onClick={() => handleSelectActor(actor)}
                    className={`text-left p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'border-forest-700 bg-forest-50/70 shadow-sm ring-2 ring-forest-700/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <img
                      src={avatar}
                      alt={actor.name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <strong className="block text-xs font-bold text-slate-900 truncate">
                        {actor.name.split(' ')[0]}
                      </strong>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {actor.role === 'ROLE_PATIENT' ? 'Paciente' : 'Cuidador'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Credential Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="email-input">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                <input
                  id="email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@contigo.example"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-forest-700/40 focus:border-forest-700 bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="password-input">
                  Contraseña
                </label>
                <span className="text-xs text-forest-700 font-semibold bg-forest-50 px-2 py-0.5 rounded">
                  Pre-cargada
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-300 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-forest-700/40 focus:border-forest-700 bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs font-medium">
                {error}
              </p>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-forest-700 text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-forest-800 transition shadow-md shadow-forest-900/10 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} /> Entrando al sistema…
                  </>
                ) : (
                  <>
                    <span>Entrar como {activeActor.name.split(' ')[0]}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => directEnter(activeActor)}
                className="sm:w-auto px-5 py-3.5 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition text-center text-sm"
              >
                Entrada Rápida
              </button>
            </div>
          </form>

          {/* Quick Notice for Professors/Evaluators */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Contraseña para todas las cuentas: <strong className="text-slate-800 font-mono">Contigo2026!</strong></span>
            <Link to="/landing" className="text-forest-700 hover:underline font-medium">
              Ver Landing Page
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
