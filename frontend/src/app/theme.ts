import type { Shadows } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

/**
 * Sistema de Diseño y Tema Base de CONTIGO (Portal Web)
 * 
 * Filosofía estética: High-End HealthTech / Modern SaaS Geriátrico.
 * - Tipografía de títulos / acentos: Plus Jakarta Sans (500, 600, 700, 800)
 * - Tipografía de cuerpo / tablas / inputs: Inter (400, 500, 600, 700)
 * - Paleta cromática: Verde Bosque de Cuidado (#0F4C3A) + Cian Clínico Vital (#0284C7)
 * - Bordes suaves (12px / 16px) y sombras multicapa difusas.
 */

// Paleta Primaria y Secundaria
const PRIMARY_FOREST = {
  main: '#0F4C3A',       // Verde Bosque Profundo (Identidad, confianza y serenidad)
  light: '#1B6A53',
  dark: '#0A3327',
  contrastText: '#FFFFFF',
};

const SECONDARY_CYAN = {
  main: '#0284C7',       // Cian Clínico / Azul Vital (Tecnología y claridad médica)
  light: '#38BDF8',
  dark: '#0369A1',
  contrastText: '#FFFFFF',
};

export const contigoTheme = createTheme({
  palette: {
    mode: 'light',
    primary: PRIMARY_FOREST,
    secondary: SECONDARY_CYAN,
    success: {
      main: '#10B981',   // Dosis confirmadas, adherencia alta, presión normal
      light: '#D1FAE5',
      dark: '#047857',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F59E0B',   // Dosis pendientes, avisos de tolerancia
      light: '#FEF3C7',
      dark: '#B45309',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#E11D48',   // Botón de pánico, presión crítica fuera de rango
      light: '#FFE4E6',
      dark: '#9F1239',
      contrastText: '#FFFFFF',
    },
    text: {
      primary: '#111827',     // Máximo contraste WCAG AAA
      secondary: '#4B5563',   // Gris azulado legible
      disabled: '#9CA3AF',
    },
    background: {
      default: '#F8F9FA',     // Fondo neutro limpio anti-deslumbramiento
      paper: '#FFFFFF',       // Superficie de tarjetas y modales
    },
    divider: '#E5E7EB',
  },

  typography: {
    fontFamily: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'].join(','),
    h1: {
      fontFamily: ['"Plus Jakarta Sans"', 'sans-serif'].join(','),
      fontWeight: 800,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontFamily: ['"Plus Jakarta Sans"', 'sans-serif'].join(','),
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontFamily: ['"Plus Jakarta Sans"', 'sans-serif'].join(','),
      fontWeight: 700,
      letterSpacing: '-0.015em',
    },
    h4: {
      fontFamily: ['"Plus Jakarta Sans"', 'sans-serif'].join(','),
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontFamily: ['"Plus Jakarta Sans"', 'sans-serif'].join(','),
      fontWeight: 600,
    },
    h6: {
      fontFamily: ['"Plus Jakarta Sans"', 'sans-serif'].join(','),
      fontWeight: 600,
    },
    subtitle1: {
      fontFamily: ['"Plus Jakarta Sans"', 'sans-serif'].join(','),
      fontWeight: 600,
      fontSize: '1rem',
    },
    subtitle2: {
      fontFamily: ['"Plus Jakarta Sans"', 'sans-serif'].join(','),
      fontWeight: 600,
      fontSize: '0.875rem',
    },
    body1: {
      fontFamily: ['"Inter"', 'sans-serif'].join(','),
      fontSize: '0.9375rem',
      lineHeight: 1.6,
      color: '#1F2937',
    },
    body2: {
      fontFamily: ['"Inter"', 'sans-serif'].join(','),
      fontSize: '0.8125rem',
      lineHeight: 1.5,
      color: '#4B5563',
    },
    button: {
      fontFamily: ['"Plus Jakarta Sans"', 'sans-serif'].join(','),
      fontWeight: 600,
      textTransform: 'none', // Nunca mayúsculas forzadas
      letterSpacing: '0.01em',
    },
    caption: {
      fontFamily: ['"Inter"', 'sans-serif'].join(','),
      fontSize: '0.75rem',
      color: '#6B7280',
    },
  },

  shape: {
    borderRadius: 14, // Radio estándar de 14px para modernidad y ergonomía
  },

  shadows: [
    'none',
    '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
    '0 1px 3px 0 rgba(16, 24, 40, 0.1), 0 1px 2px -1px rgba(16, 24, 40, 0.1)',
    '0 4px 6px -1px rgba(16, 24, 40, 0.1), 0 2px 4px -2px rgba(16, 24, 40, 0.1)',
    '0 10px 15px -3px rgba(16, 24, 40, 0.08), 0 4px 6px -4px rgba(16, 24, 40, 0.04)',
    '0 20px 25px -5px rgba(16, 24, 40, 0.08), 0 8px 10px -6px rgba(16, 24, 40, 0.04)',
    '0 25px 50px -12px rgba(16, 24, 40, 0.15)',
    ...Array(18).fill('none'), // Relleno para satisfacer el array de 25 sombras de MUI
  ] as Shadows,

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F8F9FA',
          color: '#111827',
        },
      },
    },

    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 20px',
          fontWeight: 600,
          transition: 'all 0.2s ease-in-out',
        },
        containedPrimary: {
          backgroundColor: PRIMARY_FOREST.main,
          '&:hover': {
            backgroundColor: PRIMARY_FOREST.dark,
            boxShadow: '0 4px 12px rgba(15, 76, 58, 0.25)',
          },
        },
        containedSecondary: {
          backgroundColor: SECONDARY_CYAN.main,
          '&:hover': {
            backgroundColor: SECONDARY_CYAN.dark,
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
          },
        },
        outlined: {
          borderColor: '#E5E7EB',
          borderWidth: '1.5px',
          '&:hover': {
            borderColor: '#CBD5E1',
            backgroundColor: '#F8FAFC',
            borderWidth: '1.5px',
          },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04), 0 1px 2px rgba(16, 24, 40, 0.02)',
          backgroundColor: '#FFFFFF',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          '&:hover': {
            boxShadow: '0 8px 16px -4px rgba(16, 24, 40, 0.08)',
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
        elevation1: {
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
        },
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#FFFFFF',
            '& fieldset': {
              borderColor: '#D1D5DB',
              borderWidth: '1.5px',
            },
            '&:hover fieldset': {
              borderColor: '#9CA3AF',
            },
            '&.Mui-focused fieldset': {
              borderColor: PRIMARY_FOREST.main,
              borderWidth: '2px',
            },
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: ['"Plus Jakarta Sans"', 'sans-serif'].join(','),
          fontWeight: 600,
          borderRadius: 8,
          fontSize: '0.75rem',
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24,
          padding: '8px',
          boxShadow: '0 25px 50px -12px rgba(16, 24, 40, 0.2)',
        },
      },
    },
  },
});
