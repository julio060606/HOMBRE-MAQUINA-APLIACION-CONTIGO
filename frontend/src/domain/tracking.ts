import { Medication, PillIntake, StockMovement, Supply } from '../types';
import { atLima, localDate, shiftDate } from './time';

export function canAddDose(existing: PillIntake[], dose: PillIntake): boolean {
  return !existing.some(d => d.id === dose.id || (d.patientId === dose.patientId && d.medicationId === dose.medicationId &&
    d.scheduledAt === dose.scheduledAt && (d.status === 'TAKEN' || d.status === 'NOT_TAKEN')));
}

export function makeDoses(meds: Medication[], date = localDate()): PillIntake[] {
  return meds.filter(m => {
    const endDate = m.endDate ?? (m.durationDays ? shiftDate(m.startDate, m.durationDays - 1) : undefined);
    if (!m.isActive || date < m.startDate || (endDate && date > endDate)) return false;
    if (m.frequencyType === 'INTERVAL') return false;
    const day = new Date(`${date}T12:00:00-05:00`).getUTCDay() || 7;
    return m.frequencyType !== 'SPECIFIC_DAYS' || m.specificDays?.includes(day);
  }).flatMap(m => m.times.map(time => ({
    id: `${m.id}:${m.version}:${date}:${time}`, medicationId: m.id,
    patientId: m.patientId, organizationId: m.organizationId,
    medicationName: m.name, dosage: m.dosage, imageUrl: m.imageUrl,
    scheduledTime: time, scheduledDate: date, scheduledAt: atLima(date, time),
    status: 'PENDING' as const, version: 1, prescriptionVersion: m.version,
    unitsPerDose: m.unitsPerDose, stockUnit: m.stockUnit, instructions: m.instructions,
  })).filter(d => !m.effectiveFrom || Date.parse(d.scheduledAt) >= Date.parse(m.effectiveFrom)))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}
export function doseState(dose: PillIntake, now = Date.now(), tolerance = 30): PillIntake {
  return dose.status === 'PENDING' && now > Date.parse(dose.scheduledAt) + tolerance * 60000
    ? { ...dose, status: 'UNCONFIRMED' } : dose;
}
export function adherence(doses: PillIntake[], now = Date.now()) {
  const eligible = doses.filter(d => d.status !== 'CANCELLED');
  const due = eligible.filter(d => Date.parse(d.scheduledAt) <= now);
  const taken = eligible.filter(d => d.status === 'TAKEN').length;
  const dueTaken = due.filter(d => d.status === 'TAKEN').length;
  return {
    total: eligible.length, taken, due: due.length,
    duePercent: due.length ? Math.round(dueTaken / due.length * 100) : null,
    dayPercent: eligible.length ? Math.round(taken / eligible.length * 100) : null,
  };
}
export function supplyFor(med: Medication, movements: StockMovement[]): Supply {
  const records = movements.filter(m => m.medicationId === med.id && m.patientId === med.patientId);
  const known = records.some(m => m.kind === 'INITIAL');
  const quantity = known ? records.reduce((sum, m) => sum + m.quantity, 0) : null;
  const daily = med.frequencyType === 'DAILY' && med.unitsPerDose ? med.unitsPerDose * med.times.length : 0;
  const daysRemaining = quantity !== null && quantity >= 0 && daily > 0 ? Math.floor(quantity / daily) : null;
  const state = quantity === null ? 'UNKNOWN' : quantity < 0 ? 'DISCREPANCY' : quantity === 0
    ? 'EMPTY' : daysRemaining !== null && daysRemaining <= 3 ? 'LOW' : 'AVAILABLE';
  return { medicationId: med.id, patientId: med.patientId, unit: med.stockUnit || 'unidad', quantity, daysRemaining, state };
}
