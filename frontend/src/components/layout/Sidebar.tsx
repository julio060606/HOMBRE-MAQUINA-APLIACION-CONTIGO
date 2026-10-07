import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ENV } from '../../config/env';
const navigation = [['/dashboard','Resumen'], ['/medications','Tratamiento y existencias'], ['/appointments','Citas médicas'], ['/clinical-profile','Ficha clínica'], ['/vitals','Gráficas y mediciones'], ['/reports','Informe de seguimiento'], ['/settings','Preferencias']];
export function Sidebar() {
  const { user } = useAuth();
  return <aside className="w-full lg:w-60 shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-3 lg:p-5">
    <nav aria-label="Módulos de seguimiento" className="flex flex-wrap lg:flex-col gap-1">{navigation.map(([to,label]) => <NavLink key={to} to={to} className={({isActive}) => `px-3 py-3 rounded-xl text-sm ${isActive ? 'bg-forest-700 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'}`}>{label}</NavLink>)}
      {user?.role === 'ROLE_PATIENT' && <NavLink to="/patient-app" className="px-3 py-3 rounded-xl text-forest-800 font-semibold">Abrir mi app móvil</NavLink>}
      {ENV.USE_MOCKS && user?.role === 'ROLE_CAREGIVER' && <NavLink to="/demo/patient-lab" data-testid="nav-patient-sim" className="px-3 py-3 rounded-xl text-forest-800 bg-emerald-50 font-semibold mt-2">Probar app del paciente</NavLink>}
    </nav>
  </aside>;
}
