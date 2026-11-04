import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PatientAppContent } from './PatientAppContent';
import { PhoneDeviceFrame } from '../../components/simulator/PhoneDeviceFrame';
import styles from './PatientShell.module.css';

export function PatientAppPage() {
  const { user, logout } = useAuth();
  if (!user?.patientId || user.role !== 'ROLE_PATIENT') {
    return (
      <main className="panel m-6 max-w-md mx-auto">
        <h1 className="section-title">Acceso del paciente</h1>
        <p className="mt-2 text-slate-600">Inicie sesión con un usuario con rol de paciente.</p>
        <Link to="/login" className="btn-primary mt-4 inline-block">
          Entrar con una cuenta paciente
        </Link>
      </main>
    );
  }

  return (
    <main className={styles.previewPage}>
      <PhoneDeviceFrame width={430} fitViewport>
        <PatientAppContent key={user.id} actor={user} patientId={user.patientId} onLogout={logout} />
      </PhoneDeviceFrame>
    </main>
  );
}
