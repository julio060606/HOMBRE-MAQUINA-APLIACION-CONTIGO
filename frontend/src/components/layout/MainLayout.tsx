import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { LinkPatientModal } from '../../features/onboarding/LinkPatientModal';
import styles from './CaregiverLayout.module.css';

export function MainLayout() {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();
  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  return (
    <div className={styles.shell}>
      <Navbar onOpenLinkModal={() => setIsLinkModalOpen(true)} menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen(value => !value)} menuButtonRef={menuButton} />
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <div className={styles.content}><Outlet /></div>
      </main>
      <LinkPatientModal isOpen={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} />
    </div>
  );
}
