import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DoseCard } from './DoseCard';
import { MedicationImage } from '../../components/ui/MedicationImage';
import { PatientSummary } from '../dashboard/PatientSummary';
import { PatientView } from '../../services/contracts';
import { PillIntake, User } from '../../types';
import { MemoryRouter } from 'react-router-dom';
import { buildReport } from '../reports/reportModel';

describe('R14: Balanced touch targets on DoseCard', () => {
  const dummyDose: PillIntake = {
    id: 'dose_1',
    patientId: 'pat_001',
    organizationId: 'clinic_demo',
    medicationId: 'med_001',
    medicationName: 'Losartán',
    dosage: '50 mg',
    scheduledTime: '08:00',
    scheduledDate: '2026-10-07',
    scheduledAt: '2026-10-07T08:00:00Z',
    status: 'PENDING',
    version: 1,
  };

  const dummyActor: User = {
    id: 'patient_dacio',
    email: 'dacio@contigo.example',
    name: 'Dacio Ramos',
    role: 'ROLE_PATIENT',
    organizationId: 'clinic_demo',
    patientId: 'pat_001',
  };

  it('renders both Ya la tomé and No la tomé with balanced touch targets (min-h-[52px])', () => {
    const html = renderToString(<DoseCard dose={dummyDose} actor={dummyActor} />);

    expect(html).toContain('Ya la tomé');
    expect(html).toContain('No la tomé');
    expect(html).toContain('dose-taken');
    expect(html).toContain('dose-not-taken');
    expect(html).toContain('min-h-[52px]');
  });
});

describe('R03: Honest Medication Image placeholders', () => {
  it('does NOT fallback to Losartán when medicine is unknown or image missing', () => {
    const html = renderToString(<MedicationImage name="Atorvastatina 20mg" />);
    
    // Should show honest Imagen no disponible
    expect(html).toContain('Imagen no disponible');
    // Must NOT contain any image reference to losartan
    expect(html).not.toContain('losartan');
    expect(html).not.toContain('<img');
  });
});

describe('R13: Null pulse formatting in PatientSummary and reportModel', () => {
  it('displays "No registrado" instead of "0 lpm" or "null bpm" when pulse is null', () => {
    const mockView = {
      patient: { id: 'pat_001', fullName: 'Dacio Ramos', age: 76, organizationId: 'clinic_demo' },
      profile: { id: 'prof_001', patientId: 'pat_001', heightCm: 168, weightKg: 72, source: 'CLINIC' },
      today: [],
      history: [],
      pressures: [
        {
          id: 'bp_1',
          patientId: 'pat_001',
          organizationId: 'clinic_demo',
          systolic: 120,
          diastolic: 80,
          pulse: null,
          recordedAt: '2026-10-07T08:00:00Z',
          receivedAt: '2026-10-07T08:00:00Z',
          actorId: 'patient_dacio',
          recordedVia: 'MANUAL_PATIENT',
          source: 'HOME',
          status: 'UNCLASSIFIED',
        },
      ],
      weights: [],
      medications: [],
      supplies: [],
      appointments: [],
      alerts: [],
      settings: {
        patientId: 'pat_001',
        notifyMissedDoseMinutes: 30,
        voiceVolumeLevel: 50,
        repeatAlarmCount: 1,
        voiceGuideEnabled: true,
        easyModeEnabled: true,
        highContrast: false,
        largeText: false,
      },
    };

    const html = renderToString(
      <MemoryRouter>
        <PatientSummary view={mockView as unknown as PatientView} />
      </MemoryRouter>
    );

    expect(html).toContain('Pulso:');
    expect(html).toContain('No registrado');
    expect(html).not.toContain('0 bpm');
    expect(html).not.toContain('null bpm');

    // Also test buildReport
    const report = buildReport(mockView as unknown as PatientView, 30, new Date('2026-10-07T12:00:00Z'));
    expect(report.averagePulse).toBeNull();
  });
});

describe('App root shell and providers integration', () => {
  it('renders app shell with providers without triggering AppErrorBoundary', async () => {
    const { AppErrorBoundary } = await import('../../components/ui/AppErrorBoundary');
    const { AuthProvider } = await import('../../context/AuthContext');
    const { PatientProvider } = await import('../../context/PatientContext');
    const { ToastProvider } = await import('../../context/ToastContext');
    const { AppRoutes } = await import('../../routes/AppRoutes');
    const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query');
    const { ThemeProvider } = await import('@mui/material/styles');
    const { contigoTheme } = await import('../../app/theme');

    const qc = new QueryClient();
    const html = renderToString(
      <AppErrorBoundary>
        <QueryClientProvider client={qc}>
          <ThemeProvider theme={contigoTheme}>
            <MemoryRouter initialEntries={['/login']}>
              <AuthProvider>
                <PatientProvider>
                  <ToastProvider>
                    <AppRoutes />
                  </ToastProvider>
                </PatientProvider>
              </AuthProvider>
            </MemoryRouter>
          </ThemeProvider>
        </QueryClientProvider>
      </AppErrorBoundary>
    );

    expect(html).not.toContain('No se pudo mostrar esta pantalla');
    expect(html).toContain('Cargando módulo…');
  });
});


