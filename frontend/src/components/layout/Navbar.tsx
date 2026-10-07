import { Link, useNavigate } from 'react-router-dom';
import { HeartHandshake, LogOut, Link2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePatient } from '../../context/PatientContext';
export function Navbar({ onOpenLinkModal }: { onOpenLinkModal?: () => void }) {
  const { user, logout } = useAuth(); const { patients, activePatient, setActivePatient } = usePatient(); const navigate = useNavigate();
  return <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex flex-wrap items-center gap-4 justify-between">
    <Link to="/dashboard" className="font-heading font-bold text-xl text-forest-800 flex items-center gap-2"><HeartHandshake /> CONTIGO</Link>
    <div className="flex flex-wrap items-center gap-3 min-w-0">
      {user?.role === 'ROLE_CAREGIVER' && activePatient && <label className="text-sm">Paciente <select className="input ml-2 max-w-52" data-testid="select-patient-active" value={activePatient.id} onChange={e => { const p = patients.find(v => v.id === e.target.value); if (p) setActivePatient(p); }}>{patients.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}</select></label>}
      {user?.role === 'ROLE_CAREGIVER' && <button className="btn-secondary" data-testid="link-patient" onClick={onOpenLinkModal}><Link2 size={18} /> Vincular paciente</button>}
      <div className="flex items-center gap-2">
        <img
          src={user?.role === 'ROLE_PATIENT' ? (user.patientId === 'pat_002' ? '/images/rosa_avatar.jpg' : '/images/dacio_avatar.jpg') : '/images/caregiver_avatar.jpg'}
          alt={user?.name || 'Usuario'}
          className="w-8 h-8 rounded-full object-cover border border-slate-300 shadow-xs"
        />
        <span className="text-sm font-medium text-slate-700 hidden sm:inline">{user?.name}</span>
      </div>
      <button className="btn-secondary" aria-label="Cerrar sesión" data-testid="btn-logout" onClick={() => { logout(); navigate('/login'); }}><LogOut size={18} /></button>
    </div>
  </header>;
}
