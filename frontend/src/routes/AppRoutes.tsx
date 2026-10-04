import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ClinicPortalPage } from '../features/landing/ClinicPortalPage';
import { ContigoLandingPage } from '../features/landing/ContigoLandingPage';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { MainLayout } from '../components/layout/MainLayout';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { MedicationsPage } from '../features/medications/MedicationsPage';
import { VitalsPage } from '../features/vitals/VitalsPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { PatientSimulatorPage } from '../features/simulator/PatientSimulatorPage';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 00. Entrada Institucional & Landing */}
      <Route path="/clinic" element={<ClinicPortalPage />} />
      <Route path="/landing" element={<ContigoLandingPage />} />
      <Route path="/" element={<Navigate to="/clinic" replace />} />

      {/* 01. Autenticación Cuidador */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* 02. Portal Web del Cuidador (Rutas Protegidas con MainLayout) */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/medications" element={<MedicationsPage />} />
        <Route path="/vitals" element={<VitalsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/patient-simulator" element={<PatientSimulatorPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/clinic" replace />} />
    </Routes>
  );
};
