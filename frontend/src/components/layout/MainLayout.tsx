import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ENV } from '../../config/env';
import { LinkPatientModal } from '../../features/onboarding/LinkPatientModal';

export const MainLayout: React.FC = () => {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-950 text-sm" role="status">{ENV.USE_MOCKS ? "Demostración · datos sintéticos · integración clínica real pendiente" : "Modo API · backend Spring Boot activo · integración clínica externa sujeta a credenciales"}</div>
      <Navbar onOpenLinkModal={() => setIsLinkModalOpen(true)} />
      <div className="flex flex-1 flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-7 max-w-7xl mx-auto w-full min-w-0">
          <Outlet />
        </main>
      </div>
      <LinkPatientModal isOpen={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} />
    </div>
  );
};
