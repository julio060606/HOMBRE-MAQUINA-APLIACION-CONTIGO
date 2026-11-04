import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { LinkPatientModal } from '../../features/onboarding/LinkPatientModal';
import { SupportInbox } from '../../features/support/SupportInbox';
import styles from './CaregiverLayout.module.css';
import { caregiverPageName } from './caregiverNavigation';

export function MainLayout() {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();
  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const frame = requestAnimationFrame(() => {
      const menu = document.getElementById('caregiver-navigation');
      (menu?.querySelector<HTMLAnchorElement>('nav a[aria-current="page"]') || menu?.querySelector<HTMLAnchorElement>('nav a'))?.focus();
    });
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('dialog[open]')) { setMenuOpen(false); menuButton.current?.focus(); }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('keydown', closeOnEscape); };
  }, [menuOpen]);

  return (
    <div className={styles.shell}>
      <Navbar onOpenLinkModal={() => setIsLinkModalOpen(true)} menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen(value => !value)} menuButtonRef={menuButton} />
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <div className={styles.content}><nav className={styles.breadcrumb} aria-label="Ubicación actual"><Link to="/dashboard">Mi panel</Link><ChevronRight size={15} aria-hidden="true" /><span aria-current="page">{caregiverPageName(pathname)}</span></nav><SupportInbox /><Outlet /></div>
      </main>
      <LinkPatientModal isOpen={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} />
    </div>
  );
}
