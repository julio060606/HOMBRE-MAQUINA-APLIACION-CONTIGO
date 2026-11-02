import { Appointment } from '../types';
export function upcomingAppointments(appointments: Appointment[], now = Date.now()): Appointment[] {
  return appointments.filter(item => item.status === 'SCHEDULED' && Date.parse(item.startsAt) >= now)
    .sort((left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt));
}
