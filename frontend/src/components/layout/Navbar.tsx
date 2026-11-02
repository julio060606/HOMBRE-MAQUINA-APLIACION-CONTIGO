import { RefObject } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartHandshake, LogOut, Link2, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePatient } from '../../context/PatientContext';
import styles from './CaregiverLayout.module.css';

const roleNames = { ROLE_CAREGIVER: 'Cuidador', ROLE_PATIENT: 'Paciente', ROLE_CLINIC_ADMIN: 'Administración clínica', ROLE_SUPER_ADMIN: 'Administración' };
export function Navbar({ onOpenLinkModal, menuOpen, onToggleMenu, menuButtonRef }: {
  onOpenLinkModal: () => void; menuOpen: boolean; onToggleMenu: () => void;
  menuButtonRef: RefObject<HTMLButtonElement>;
}) {
  const { user, logout } = useAuth();
  const { patients, activePatient, setActivePatient } = usePatient();
  const navigate = useNavigate();
  const isCaregiver = user?.role === 'ROLE_CAREGIVER';
  const avatar = user?.role === 'ROLE_PATIENT'
    ? (user.patientId === 'pat_002' ? '/images/rosa_avatar.jpg' : '/images/dacio_avatar.jpg')
    : '/images/caregiver_avatar.jpg';
  return <header className={styles.topbar}>
    <div className={styles.mobileBar}>
      <Link to="/dashboard" className={styles.mobileBrand}><HeartHandshake aria-hidden="true" size={27} /><span>CONTIGO</span></Link>
      <button ref={menuButtonRef} type="button" className={styles.iconButton} aria-expanded={menuOpen} aria-controls="caregiver-navigation"
        aria-label={menuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'} onClick={onToggleMenu}>
        {menuOpen ? <X size={23} aria-hidden="true" /> : <Menu size={23} aria-hidden="true" />}
      </button>
    </div>
    <div className={styles.headerContent}>
      <div className={styles.headerIntro}><p>Tu espacio de cuidado</p><span>Acompañar también es estar informado.</span></div>
      {isCaregiver && activePatient && <label className={styles.patientPicker}>
        <span>Paciente en seguimiento</span>
        <span className={styles.selectWrap}>
          <select data-testid="select-patient-active" value={activePatient.id} onChange={event => {
            const patient = patients.find(value => value.id === event.target.value);
            if (patient) setActivePatient(patient);
          }}>{patients.map(patient => <option key={patient.id} value={patient.id}>{patient.fullName}</option>)}</select>
          <ChevronDown size={18} aria-hidden="true" />
        </span>
      </label>}
      <div className={styles.headerActions}>
        {isCaregiver && <button type="button" className={styles.linkButton} data-testid="link-patient" onClick={onOpenLinkModal}>
          <Link2 size={18} aria-hidden="true" /><span>Vincular paciente</span>
        </button>}
        <div className={styles.account} role="group" aria-label={user ? `${user.name}, ${roleNames[user.role]}` : 'Usuario'}>
          <img src={avatar} alt="" className={styles.avatar} />
          <div className={styles.accountText}><strong>{user?.name}</strong><span>{user ? roleNames[user.role] : 'Usuario'}</span></div>
        </div>
        <button type="button" className={styles.iconButton} aria-label="Cerrar sesión" title="Cerrar sesión" data-testid="btn-logout"
          onClick={() => { logout(); navigate('/login'); }}><LogOut size={20} aria-hidden="true" /></button>
      </div>
    </div>
  </header>;
}
