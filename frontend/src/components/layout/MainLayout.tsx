import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { LinkPatientModal } from '../../features/onboarding/LinkPatientModal';

export const MainLayout: React.FC = () => {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <Navbar onOpenLinkModal={() => setIsLinkModalOpen(true)} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
      <LinkPatientModal isOpen={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} />
    </div>
  );
};
