import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { PatientSummary } from './PatientSummary';
import { PatientView } from '../../services/contracts';
import { seedDemo } from '../../services/demo/state';

function view(): PatientView {
  const state = seedDemo(new Date('2026-11-03T15:00:00Z'));
  const patient = state.patients[0];
  return {
    patient, medications: state.medications.filter(item => item.patientId === patient.id),
    today: state.intakes.filter(item => item.patientId === patient.id), history: [],
    pressures: [], weights: [], supplies: [], movements: [], appointments: [],
    profile: state.profiles.find(item => item.patientId === patient.id) || null,
    settings: state.settings.find(item => item.patientId === patient.id)!, alerts: [], audit: [],
  };
}

describe('resumen sencillo del cuidador', () => {
  it('mantiene visibles todos los avisos críticos, aunque haya más de tres', () => {
    const current = view();
    current.alerts = Array.from({ length: 4 }, (_, index) => ({
      id: `critical-${index}`, patientId: current.patient.id, patientName: current.patient.fullName,
      type: 'PANIC_BUTTON', severity: 'CRITICAL', isResolved: false,
      title: `Solicitud escrita ${index + 1}`, description: `Mensaje sintético ${index + 1}`,
      timestamp: '2026-11-03T15:00:00Z',
    }));
    const html = renderToString(<MemoryRouter><PatientSummary view={current} /></MemoryRouter>);
    const priority = html.slice(html.indexOf('Avisos prioritarios'), html.indexOf('Sin responder hoy'));
    for (const alert of current.alerts) {
      expect(priority).toContain(alert.title);
      expect(priority).toContain(alert.description);
    }
  });

  it('muestra primero las tomas sin respuesta y conserva el control para consultar todas', () => {
    const current = view();
    current.today = current.today.slice(0, 2).map((item, index) => ({ ...item, status: index ? 'TAKEN' : 'PENDING', medicationName: index ? 'Medicamento ya respondido' : 'Medicamento pendiente' }));
    const html = renderToString(<MemoryRouter><PatientSummary view={current} /></MemoryRouter>);
    expect(html).toContain('Medicamento pendiente');
    expect(html).not.toContain('Medicamento ya respondido');
    expect(html).toMatch(/aria-pressed="true"[^>]*>Por confirmar/);
    expect(html).toContain('Todas');
  });

  it('separa los avisos críticos de los pendientes adicionales sin contarlos dos veces', () => {
    const current=view();
    current.alerts=[{id:'priority',patientId:current.patient.id,patientName:current.patient.fullName,type:'PANIC_BUTTON',severity:'CRITICAL',isResolved:false,title:'Aviso prioritario de prueba',description:'Revisión prioritaria',timestamp:'2026-11-03T15:00:00Z'}, {id:'other',patientId:current.patient.id,patientName:current.patient.fullName,type:'MISSED_MEDICATION',severity:'WARNING',isResolved:false,title:'Aviso adicional de prueba',description:'Seguimiento',timestamp:'2026-11-03T15:00:00Z'}];
    const html=renderToString(<MemoryRouter><PatientSummary view={current} /></MemoryRouter>);
    expect(html).toContain('1 pendiente de seguimiento');
    expect(html).not.toContain('2 pendientes de seguimiento');
    expect(html.indexOf('Aviso prioritario de prueba')).toBeLessThan(html.indexOf('Tomas de hoy'));
  });

  it('muestra el peso cuando es más reciente que la presión y conserva la unidad', () => {
    const current=view();
    current.pressures=[{id:'bp',patientId:current.patient.id,organizationId:current.patient.organizationId,systolic:125,diastolic:82,recordedAt:'2026-11-02T15:00:00Z',receivedAt:'2026-11-02T15:00:00Z',actorId:'patient_dacio',recordedVia:'MANUAL_PATIENT',source:'HOME',status:'UNCLASSIFIED'}];
    current.weights=[{id:'weight',patientId:current.patient.id,organizationId:current.patient.organizationId,weightKg:70.5,recordedAt:'2026-11-03T15:00:00Z',actorId:'patient_dacio',source:'HOME'}];
    const html=renderToString(<MemoryRouter><PatientSummary view={current} /></MemoryRouter>);
    const overview=html.slice(html.indexOf('Última medición'),html.indexOf('Próxima cita'));
    expect(overview).toMatch(/70[.,]5 kg/);
    expect(overview).toContain('Peso registrado');
    expect(overview).not.toContain('125 / 82');
  });

  it('muestra las respuestas disponibles al abrir un día sin tomas pendientes', () => {
    const current=view();
    current.today=current.today.slice(0,1).map(dose=>({...dose,status:'TAKEN',medicationName:'Tratamiento ya registrado'}));
    const html=renderToString(<MemoryRouter><PatientSummary view={current} /></MemoryRouter>);
    expect(html).toContain('Tratamiento ya registrado');
    expect(html).toMatch(/aria-pressed="true"[^>]*>Todas/);
  });
});
