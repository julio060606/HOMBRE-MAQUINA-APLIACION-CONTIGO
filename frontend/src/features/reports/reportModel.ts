import { PatientView } from '../../services/contracts';
import { adherence } from '../../domain/tracking';
import { periodStart, withinPeriod } from '../../domain/time';
export function buildReport(view: PatientView, days: number, now = new Date()) {
  const from = periodStart(days, now);
  const within = (date: string) => withinPeriod(date, days, now);
  const doses = view.history.filter(d => within(d.scheduledAt));
  const pressures = view.pressures.filter(p => within(p.recordedAt)).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  const weights = view.weights.filter(p => within(p.recordedAt)).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  const average = (values: number[]) => values.length ? Math.round(values.reduce((sum, n) => sum + n, 0) / values.length * 10) / 10 : null;
  return { patient: view.patient, profile: view.profile, medications: view.medications, supplies: view.supplies,
    appointments: view.appointments, days, from, generatedAt: now.toISOString(), doses, pressures, weights,
    adherence: adherence(doses, now.getTime()), averageSystolic: average(pressures.map(p => p.systolic)),
    averageDiastolic: average(pressures.map(p => p.diastolic)),
    averagePulse: average(pressures.flatMap(p => (p.pulse != null && typeof p.pulse === 'number' && !isNaN(p.pulse)) ? [p.pulse] : [])),
    alerts: view.alerts.filter(a => within(a.timestamp)) };
}
export type ReportModel = ReturnType<typeof buildReport>;
export interface ReportOptions { measurements: boolean; treatment: boolean; alerts: boolean }
