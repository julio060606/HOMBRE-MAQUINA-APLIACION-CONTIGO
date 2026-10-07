import { z } from 'zod';
const recordedAt = z.string().datetime({ offset: true }).refine(
  value => Date.parse(value) <= Date.now() + 60000, 'La fecha no puede estar en el futuro.',
);
export const pressureInput = z.object({
  // Technical digit-entry bounds; these are not diagnostic or clinical alert ranges.
  systolic: z.number().finite().positive().int().max(500, 'Revise el número ingresado.'),
  diastolic: z.number().finite().positive().int().max(500, 'Revise el número ingresado.'),
  pulse: z.number().finite().positive().int().max(500).optional(),
  recordedAt, notes: z.string().max(500).optional(),
}).refine(v => v.systolic > v.diastolic, {
  message: 'Revise la lectura: la sistólica debe ser mayor que la diastólica.', path: ['diastolic'],
});
export const weightInput = z.object({ weightKg: z.number().finite().positive().max(1000), recordedAt });
export const movementInput = z.object({
  kind: z.enum(['RESTOCK', 'ADJUSTMENT']), quantity: z.number().finite().nonnegative().max(100000),
  reason: z.string().trim().min(3, 'Indique el motivo del conteo o reposición.').max(300),
}).refine(v => v.kind !== 'RESTOCK' || v.quantity > 0, { message: 'La reposición debe agregar una cantidad mayor que cero.' });
export const measurementFormInput = z.object({
  type: z.enum(['pressure','weight']), systolic: z.string(), diastolic: z.string(), pulse: z.string(), weight: z.string(),
}).superRefine((value, ctx) => {
  const number = (text: string) => text.trim() ? Number(text) : NaN;
  const result = value.type === 'pressure'
    ? pressureInput.safeParse({ systolic: number(value.systolic), diastolic: number(value.diastolic),
      pulse: value.pulse.trim() ? number(value.pulse) : undefined, recordedAt: new Date().toISOString() })
    : weightInput.safeParse({ weightKg: number(value.weight), recordedAt: new Date().toISOString() });
  if (!result.success) for (const issue of result.error.issues) ctx.addIssue({ code: 'custom',
    path: issue.path[0] === 'weightKg' ? ['weight'] : issue.path,
    message: issue.code === 'custom' ? issue.message : 'Ingrese un número válido en la unidad indicada.',
  });
});
