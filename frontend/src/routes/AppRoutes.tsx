import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
const ClinicPortalPage = lazy(() => import('../features/landing/ClinicPortalPage').then(m => ({ default: m.ClinicPortalPage })));
const ContigoLandingPage = lazy(() => import('../features/landing/ContigoLandingPage').then(m => ({ default: m.ContigoLandingPage })));
const LoginPage = lazy(() => import('../features/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../features/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const MainLayout = lazy(() => import('../components/layout/MainLayout').then(m => ({ default: m.MainLayout })));
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const MedicationsPage = lazy(() => import('../features/medications/MedicationsPage').then(m => ({ default: m.MedicationsPage })));
const VitalsPage = lazy(() => import('../features/vitals/VitalsPage').then(m => ({ default: m.VitalsPage })));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const PatientSimulatorPage = lazy(() => import('../features/simulator/PatientSimulatorPage').then(m => ({ default: m.PatientSimulatorPage })));
const PatientAppPage = lazy(() => import('../features/patient-app/PatientAppPage').then(m => ({ default: m.PatientAppPage })));
const AppointmentsPage = lazy(() => import('../features/appointments/AppointmentsPage').then(m => ({ default: m.AppointmentsPage })));
const ClinicalProfilePage = lazy(() => import('../features/clinical-profile/ClinicalProfilePage').then(m => ({ default: m.ClinicalProfilePage })));
import { useAuth } from '../context/AuthContext';
import { ENV } from '../config/env';
import { ReactNode } from 'react';
const ReportsPage = lazy(() => import('../features/reports/ReportsPage').then(m => ({ default: m.ReportsPage })));
function ProtectedRoute({ children, patient = false, demo = false }: { children: ReactNode; patient?: boolean; demo?: boolean }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (patient && user.role !== 'ROLE_PATIENT') return <Navigate to="/dashboard" replace />;
  if (demo && (!ENV.USE_MOCKS || user.role !== 'ROLE_CAREGIVER')) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
export function AppRoutes() {
  return <Suspense fallback={<div className="panel m-6" role="status">Cargando módulo…</div>}><Routes>
    <Route path="/clinic" element={<ClinicPortalPage />} /><Route path="/landing" element={<ContigoLandingPage />} /><Route path="/" element={<Navigate to="/clinic" replace />} />
    <Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} />
    <Route path="/patient-app/*" element={<ProtectedRoute patient><PatientAppPage /></ProtectedRoute>} />
    <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
      <Route path="/dashboard" element={<DashboardPage />} /><Route path="/medications" element={<MedicationsPage />} />
      <Route path="/appointments" element={<AppointmentsPage />} /><Route path="/clinical-profile" element={<ClinicalProfilePage />} />
      <Route path="/vitals" element={<VitalsPage />} /><Route path="/reports" element={<ReportsPage />} /><Route path="/settings" element={<SettingsPage />} />
      <Route path="/demo/patient-lab" element={<ProtectedRoute demo><PatientSimulatorPage /></ProtectedRoute>} />
      <Route path="/patient-simulator" element={<Navigate to={ENV.USE_MOCKS ? '/demo/patient-lab' : '/dashboard'} replace />} />
    </Route><Route path="*" element={<Navigate to="/clinic" replace />} />
  </Routes></Suspense>;
}
