import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronDown, Eye, EyeOff, Loader2, UserRound } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DEMO_USERS } from '../../services/demo/state';
import { ENV } from '../../config/env';
import { PublicHeader } from '../../components/layout/PublicHeader';
import styles from './LoginPage.module.css';

const accounts = DEMO_USERS.filter(user => user.id !== 'caregiver_unlinked');

export function LoginPage() {
  const { user, enterDemo, login, logout } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialAccount = accounts.find(account => account.id === params.get('cuenta')) ?? accounts.find(account => account.id === 'caregiver_demo')!;
  const [email, setEmail] = useState(initialAccount.email);
  const [password, setPassword] = useState('Contigo2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pending = useRef(false);
  const active = useRef(true);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const accountDetails = useRef<HTMLDetailsElement>(null);
  const emailInput = useRef<HTMLInputElement>(null);
  const selectedAccount = accounts.find(account => account.email.toLowerCase() === email.trim().toLowerCase());
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true; setLoading(true); setError('');
    try {
      if (ENV.USE_MOCKS) {
        const account = accounts.find(value => value.email.toLowerCase() === email.trim().toLowerCase());
        if (!account) throw new Error('Elige una de las cuentas de prueba disponibles para el modo sin conexión.');
        const actor = enterDemo(account.id);
        if (active.current) navigate(actor.role === 'ROLE_PATIENT' ? '/patient-app' : '/dashboard', { replace:true });
      } else {
        const actor = await login(email, password);
        if (active.current) navigate(actor.role === 'ROLE_PATIENT' ? '/patient-app' : '/dashboard', { replace:true });
      }
    } catch (cause) { if (active.current) setError(cause instanceof Error ? cause.message : 'No se pudo iniciar sesión. Vuelve a intentarlo.'); }
    finally { pending.current = false; if (active.current) setLoading(false); }
  }

  return <div className={styles.page}>
    <PublicHeader />
    <main className={styles.main} data-page-path="/login">
      <div className={styles.cardWrap}>
        <Link to="/landing" className={styles.back}><ArrowLeft size={18} aria-hidden="true" />Volver al inicio</Link>
        <section className={styles.card} aria-labelledby="login-title">
          <h1 id="login-title">Iniciar sesión</h1>
          {user ? <div className={styles.session}>
            <p>Tu sesión de <strong>{user.name}</strong> sigue abierta.</p>
            <Link className={styles.primary} to={user.role === 'ROLE_PATIENT' ? '/patient-app' : '/dashboard'}>Volver a {user.role === 'ROLE_PATIENT' ? 'mi aplicación' : 'mi panel'}<ArrowRight size={19} aria-hidden="true" /></Link>
            <button type="button" className={styles.changeAccount} onClick={() => { logout(); setError(''); }}>Cerrar sesión y usar otra cuenta</button>
          </div> : <>
            <p className={styles.intro}>Entra a tu espacio de cuidado.</p>
            <form className={styles.form} onSubmit={event => void submit(event)} aria-busy={loading}>
              <div className={styles.field}><label htmlFor="email-input">Correo electrónico</label><input ref={emailInput} id="email-input" type="email" name="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={email} disabled={loading} onChange={event => { setEmail(event.target.value); setError(''); }} /></div>
              <div className={styles.field}><label htmlFor="password-input">Contraseña</label><div className={styles.passwordField}><input id="password-input" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} disabled={loading} onChange={event => { setPassword(event.target.value); setError(''); }} /><button type="button" disabled={loading} aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}</button></div></div>
              {error && <p ref={errorRef} tabIndex={-1} role="alert" className={styles.error}>{error}</p>}
              <button type="submit" className={styles.primary} disabled={loading}>{loading ? <><Loader2 className={styles.spinner} size={20} aria-hidden="true" />Entrando…</> : <>Entrar<ArrowRight size={19} aria-hidden="true" /></>}</button>
            </form>
            <details ref={accountDetails} className={styles.accounts}>
              <summary>Cambiar cuenta de prueba<ChevronDown size={18} aria-hidden="true" /></summary>
              <p>Elige una cuenta para completar los campos.</p>
              <div className={styles.accountList}>{accounts.map(account => <button key={account.id} type="button" data-testid={`login-${account.id}`} disabled={loading} aria-pressed={selectedAccount?.id === account.id} onClick={() => { setEmail(account.email); setPassword('Contigo2026!'); setShowPassword(false); setError(''); if (accountDetails.current) accountDetails.current.open = false; emailInput.current?.focus(); }}><UserRound size={19} aria-hidden="true" /><span><strong>{account.role === 'ROLE_PATIENT' ? account.name.split(' ')[0] : 'Cuidador'}</strong><span>{account.role === 'ROLE_PATIENT' ? 'Aplicación del paciente' : 'Panel de seguimiento'}</span></span></button>)}</div>
              <p className={styles.passwordHint}>Clave de demostración: <strong>Contigo2026!</strong></p>
            </details>
          </>}
        </section>
        <p className={styles.note}>Demostración académica · datos ficticios</p>
      </div>
    </main>
  </div>;
}
