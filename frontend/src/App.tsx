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
const Synchronization = () => { useDemoSynchronization(); return null; };

const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
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
