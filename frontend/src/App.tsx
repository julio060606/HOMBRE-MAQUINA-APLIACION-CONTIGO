import React, { useEffect, useRef } from 'react';
import { BrowserRouter, useLocation, useNavigationType } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { contigoTheme } from './app/theme';
import { AuthProvider } from './context/AuthContext';
import { PatientProvider } from './context/PatientContext';
import { ToastProvider } from './context/ToastContext';
import { AppRoutes } from './routes/AppRoutes';
import { useDemoSynchronization } from './hooks/usePatientView';
import { AppErrorBoundary } from './components/ui/AppErrorBoundary';
import { ReadingOptions } from './components/layout/ReadingOptions';
import { RouteAccessibility } from './components/layout/RouteAccessibility';
const Synchronization = () => { useDemoSynchronization(); return null; };

const ScrollToTop: React.FC = () => {
  const { pathname, hash, key } = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(new Map<string, { left: number; top: number }>());
  const leaving = useRef<string>();

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useEffect(() => {
    leaving.current = undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const save = () => {
      if (leaving.current === key) return;
      positions.current.set(key, { left: window.scrollX, top: window.scrollY });
      if (positions.current.size > 100) positions.current.delete(positions.current.keys().next().value!);
    };
    const beforeLink = (event: MouseEvent) => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest('a[href]') as HTMLAnchorElement | null;
      if (!link || link.origin !== window.location.origin || link.target === '_blank' || link.hasAttribute('download')) return;
      // Save before the shorter destination can clamp the outgoing page's scroll position.
      save(); leaving.current = key;
      timer = setTimeout(() => { leaving.current = undefined; }, 1500);
    };
    window.addEventListener('scroll', save, { passive: true });
    document.addEventListener('click', beforeLink, true);
    return () => { window.removeEventListener('scroll', save); document.removeEventListener('click', beforeLink, true); if (timer) clearTimeout(timer); };
  }, [key]);

  useEffect(() => {
    const restore = navigationType === 'POP' && ['/landing', '/login', '/clinic', '/accessibility'].includes(pathname) ? positions.current.get(key) : undefined;
    if (hash || restore) {
      const scrollToSection = () => {
        const main = ['/landing', '/login', '/clinic', '/accessibility'].includes(pathname)
          ? [...document.querySelectorAll<HTMLElement>('main[data-page-path]')].find(element => element.dataset.pagePath === pathname)
          : [...document.querySelectorAll<HTMLElement>('main')].find(element => element.getClientRects().length > 0);
        if (!main || !main.getClientRects().length) return false;
        if (restore) { window.scrollTo({ ...restore, behavior: 'instant' }); return true; }
        const element = document.getElementById(hash.slice(1));
        if (!element || !main.contains(element)) return false;
        element.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('site-reduced-motion') ? 'instant' : 'smooth' });
        return true;
      };
      if (scrollToSection()) return;
      // The target may belong to a route whose lazy module is still loading.
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      const observer = new MutationObserver(() => {
        if (scrollToSection()) observer.disconnect();
      });
      observer.observe(document.getElementById('root')!, { childList: true, subtree: true });
      return () => observer.disconnect();
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash, key, navigationType]);

  return null;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutos
    },
  },
});

export const App: React.FC = () => {
  return (
    <AppErrorBoundary><QueryClientProvider client={queryClient}>
      <ThemeProvider theme={contigoTheme}>
        <CssBaseline />
        <BrowserRouter>
          <ScrollToTop />
          <RouteAccessibility />
          <ReadingOptions />
          <AuthProvider>
            <PatientProvider>
              <Synchronization />
              <ToastProvider>
                <AppRoutes />
              </ToastProvider>
            </PatientProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider></AppErrorBoundary>
  );
};
