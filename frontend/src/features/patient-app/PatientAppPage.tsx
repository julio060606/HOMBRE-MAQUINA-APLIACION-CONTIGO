import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PatientAppContent } from './PatientAppContent';
import { PhoneDeviceFrame } from '../../components/simulator/PhoneDeviceFrame';

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
    <main className="bg-slate-900/10 min-h-screen py-6 px-4">
      <div className="max-w-md mx-auto flex justify-between items-center px-3 py-2 mb-3 text-sm bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200">
        <span className="font-semibold text-slate-800">Contigo · App Paciente</span>
        <button
          className="text-slate-600 hover:text-rose-600 font-medium text-xs underline cursor-pointer"
          onClick={logout}
        >
          Cerrar sesión
        </button>
      </div>
      <PhoneDeviceFrame width={400}>
        <PatientAppContent key={user.id} actor={user} patientId={user.patientId} standalone />
      </PhoneDeviceFrame>
    </main>
  );
}
