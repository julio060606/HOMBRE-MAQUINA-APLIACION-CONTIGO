import { Link, NavLink } from 'react-router-dom';
import { ArrowUpRight, HeartHandshake, ShieldCheck, Smartphone, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ENV } from '../../config/env';
import styles from './CaregiverLayout.module.css';
import { caregiverNavigation } from './caregiverNavigation';
export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { user } = useAuth();
  return <aside id="caregiver-navigation" className={styles.sidebar} data-open={open}>
    <Link to="/dashboard" className={styles.brand} onClick={onNavigate}>
      <span className={styles.brandMark}><HeartHandshake size={27} aria-hidden="true" /></span>
      <span><strong>CONTIGO</strong><span>Cuidado que conecta</span></span>
    </Link>
    <nav aria-label="Módulos de seguimiento" className={styles.navigation}>
      {caregiverNavigation.map(group => <div className={styles.navGroup} key={group.title}>
        <p className={styles.groupTitle}>{group.title}</p>
        {group.items.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={onNavigate}
          className={({ isActive }) => `${styles.navLink}${isActive ? ` ${styles.active}` : ''}`}>
          <Icon size={21} aria-hidden="true" /><span>{label}</span>
        </NavLink>)}
      </div>)}
      {user?.role === 'ROLE_PATIENT' && <NavLink to="/patient-app" onClick={onNavigate} className={styles.navLink}><Smartphone size={21} aria-hidden="true" /><span>Abrir mi app móvil</span></NavLink>}
      {ENV.USE_MOCKS && user?.role === 'ROLE_CAREGIVER' && <NavLink to="/demo/patient-lab" data-testid="nav-patient-sim" onClick={onNavigate} className={styles.navLink}><UserRound size={21} aria-hidden="true" /><span>Probar app del paciente</span></NavLink>}
    </nav>
    <div className={styles.sidebarFooter}><Link to="/landing" className={styles.homeLink} onClick={onNavigate}>Inicio de CONTIGO<ArrowUpRight size={17} aria-hidden="true" /></Link><details className={styles.projectNote}><summary><ShieldCheck size={20} aria-hidden="true" /><span>Sobre esta demostración</span></summary><p>{ENV.USE_MOCKS ? 'Demostración local con datos sintéticos.' : 'Datos sintéticos de una clínica ficticia.'}</p></details></div>
  </aside>;
}
