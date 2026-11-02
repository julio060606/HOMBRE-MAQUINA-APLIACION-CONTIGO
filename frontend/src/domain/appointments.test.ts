import { describe, expect, it } from 'vitest';
import { Appointment } from '../types';
import { upcomingAppointments } from './appointments';

describe('patient upcoming appointments', () => {
  it('shows only valid future scheduled appointments in chronological order without changing the source', () => {
    const at = (id: string, startsAt: string, status: Appointment['status'] = 'SCHEDULED') => ({ id, startsAt, status } as Appointment);
    const source = [at('later', '2026-11-04T10:00:00-05:00'), at('cancelled', '2026-11-03T10:00:00-05:00', 'CANCELLED'),
      at('past', '2026-11-01T10:00:00-05:00'), at('first', '2026-11-03T09:00:00-05:00'), at('invalid', 'bad-date')];
    expect(upcomingAppointments(source, Date.parse('2026-11-02T00:00:00-05:00')).map(item => item.id)).toEqual(['first', 'later']);
    expect(source[0].id).toBe('later');
  });
});
