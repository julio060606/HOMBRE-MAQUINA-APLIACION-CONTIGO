import { RefObject } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HeartHandshake, LogOut, Link2, Menu, X, ChevronDown, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePatient } from '../../context/PatientContext';
import { ReadingOptions } from './ReadingOptions';
import styles from './CaregiverLayout.module.css';
import { caregiverPageName } from './caregiverNavigation';

const roleNames = { ROLE_CAREGIVER: 'Cuidador', ROLE_PATIENT: 'Paciente', ROLE_CLINIC_ADMIN: 'Administración clínica', ROLE_SUPER_ADMIN: 'Administración' };
export function Navbar({ onOpenLinkModal, menuOpen, onToggleMenu, menuButtonRef }: {
  onOpenLinkModal: () => void; menuOpen: boolean; onToggleMenu: () => void;
  menuButtonRef: RefObject<HTMLButtonElement>;
}) {
  const { user, logout } = useAuth();
  const { patients, activePatient, setActivePatient } = usePatient();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isCaregiver = user?.role === 'ROLE_CAREGIVER';
  const canSelectPatient = user?.role !== 'ROLE_PATIENT';
  return <header className={styles.topbar}>
    <div className={styles.mobileBar}>
      <Link to="/dashboard" className={styles.mobileBrand}><HeartHandshake aria-hidden="true" size={27} /><span>CONTIGO<small>{caregiverPageName(pathname)}</small></span></Link>
      <button ref={menuButtonRef} type="button" className={styles.menuButton} aria-expanded={menuOpen} aria-controls="caregiver-navigation"
        aria-label={menuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'} onClick={onToggleMenu}>
        {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}<span>Menú</span>
      </button>
    </div>
    <div className={styles.headerContent}>
      {canSelectPatient && activePatient && <label className={styles.patientPicker}>
        <span>Paciente en seguimiento</span>
        <span className={styles.selectWrap}>
          <select data-testid="select-patient-active" value={activePatient.id} onChange={event => {
            const patient = patients.find(value => value.id === event.target.value);
            if (patient) setActivePatient(patient);
          }}>{patients.map(patient => <option key={patient.id} value={patient.id}>{patient.fullName}</option>)}</select>
          <ChevronDown size={18} aria-hidden="true" />
        </span>
      </label>}
      <details className={styles.accountMenu}>
        <summary><UserRound size={19} aria-hidden="true" /><span>Mi cuenta</span><ChevronDown size={16} aria-hidden="true" /></summary>
        <div className={styles.accountOptions}>
          <div className={styles.accountIdentity}><strong>{user?.name}</strong><span>{user ? roleNames[user.role] : 'Usuario'}</span></div>
          {isCaregiver && <button type="button" className={styles.linkButton} data-testid="link-patient" onClick={onOpenLinkModal}><Link2 size={18} aria-hidden="true" /><span>Vincular paciente</span></button>}
          <button type="button" className={styles.logoutButton} data-testid="btn-logout" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={19} aria-hidden="true" /><span>Cerrar sesión</span>
          </button>
        </div>
      </details>
    </div>
    <div className={styles.accessTools}><ReadingOptions placement="caregiver" /></div>
  </header>;
}
