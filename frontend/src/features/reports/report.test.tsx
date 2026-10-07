import { describe, expect, it } from 'vitest';
import { renderToBuffer } from '@react-pdf/renderer';
import { seedDemo, DEMO_USERS } from '../../services/demo/state';
import { createDemoService } from '../../services/demo/service';
import { buildReport } from './reportModel';
import { ReportDocument } from './ReportDocument';
const now = new Date('2026-10-07T15:00:00Z');
const state = seedDemo(now);
const service = createDemoService(DEMO_USERS[0], { transact: async fn => fn(structuredClone(state)) });
describe('reporte real', () => {
  it('calcula promedios y excluye dosis futuras y registros fuera del período', async () => {
    const view = await service.view('pat_001');
    const report = buildReport(view, 7, now);
    expect(report.pressures).toHaveLength(6);
    expect(report.doses).toHaveLength(1);
    expect(report.adherence.duePercent).toBe(0);
    expect(report.averageSystolic).toBe(122.5);
    expect(buildReport({ ...view, pressures: [], history: [], weights: [] }, 7, now)).toMatchObject({ averageSystolic: null, averagePulse: null, adherence: { duePercent: null } });
  });
  it('genera bytes de un PDF válido con los datos del paciente', async () => {
    const model = buildReport(await service.view('pat_001'), 30, now);
    const buffer = await renderToBuffer(<ReportDocument model={model} options={{ measurements: true, treatment: true, alerts: true }} />);
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(2000);
    expect(buffer.toString('latin1')).toContain('/Type /Page');
  });
});
