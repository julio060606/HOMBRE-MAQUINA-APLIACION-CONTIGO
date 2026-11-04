import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, HeartHandshake, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './PublicHeader.module.css';

export function PublicHeader() {
  const { user } = useAuth();
  const { pathname, hash, key } = useLocation();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const region = useRef<HTMLElement>(null);
  const destination = user ? user.role === 'ROLE_PATIENT' ? '/patient-app' : '/dashboard' : '/login';
  const accessLabel = user ? user.role === 'ROLE_PATIENT' ? 'Mi aplicación' : 'Mi panel' : 'Iniciar sesión';
  const links = [{ to: '/landing', label: 'Inicio' }, { to: '/landing#como-funciona', label: 'Cómo funciona' }, { to: '/clinic', label: 'Clínica' }];
  useEffect(() => { setOpen(false); }, [key]);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('dialog[open]')) { setOpen(false); toggle.current?.focus(); }
    };
    const outside = (event: PointerEvent) => {
      if (!region.current?.contains(event.target as Node) && !toggle.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', escape);
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('keydown', escape); document.removeEventListener('pointerdown', outside); };
  }, [open]);
  const current = (to: string) => pathname + hash === to;
  return <header className={styles.header} data-testid="public-header">
    <div className={styles.inner}>
      <Link to="/landing" className={styles.brand} aria-label="CONTIGO, ir al inicio"><span aria-hidden="true"><HeartHandshake size={25} /></span><strong>CONTIGO</strong></Link>
      <button ref={toggle} type="button" className={styles.toggle} aria-expanded={open} aria-controls="public-navigation" onClick={() => setOpen(value => !value)}>{open ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}{open ? 'Cerrar' : 'Menú'}</button>
      <nav ref={region} id="public-navigation" className={styles.navigation} data-open={open} aria-label="Navegación principal">
        {links.map(link => <Link key={link.to} to={link.to} aria-current={current(link.to) ? 'page' : undefined} onClick={() => setOpen(false)}>{link.label}</Link>)}
        <Link to={destination} className={styles.access} aria-current={pathname === destination ? 'page' : undefined} onClick={() => setOpen(false)} data-testid="btn-landing-login-web">{accessLabel}<ArrowRight size={18} aria-hidden="true" /></Link>
      </nav>
    </div>
  </header>;
}
