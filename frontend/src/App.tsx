import React, { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
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
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const scrollToSection = () => {
        const element = document.getElementById(hash.slice(1));
        if (!element) return false;
        element.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
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
  }, [pathname, hash]);

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
