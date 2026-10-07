import { useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from '../../types';
import { serviceFor } from '../../services/apiClient';
import { useAction } from '../../hooks/useAction';
import { PressureInput } from '../../services/contracts';
import { measurementFormInput } from '../../domain/validation';
type FormInput = z.infer<typeof measurementFormInput>;
const blank = { systolic: '', diastolic: '', pulse: '', weight: '' };
export function MeasurementForm({ actor, patientId }: { actor: User; patientId: string }) {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormInput>({
    resolver: zodResolver(measurementFormInput), defaultValues: { type: 'pressure', ...blank },
  });
  const type = useWatch({ control, name: 'type' });
  const [saved, setSaved] = useState(false), action = useAction();
  const pending = useRef<{ fingerprint: string; input: PressureInput }>();
  const number = (value: string) => value.trim() ? Number(value) : NaN;
  const submit = async (value: FormInput) => {
    setSaved(false);
    const fingerprint = JSON.stringify(value);
    const input = pending.current?.fingerprint === fingerprint ? pending.current.input : {
      systolic: number(value.systolic), diastolic: number(value.diastolic), pulse: value.pulse.trim() ? number(value.pulse) : undefined,
      recordedAt: new Date().toISOString(),
    };
    pending.current = { fingerprint, input };
    const success = await action.run(fingerprint, id => type === 'weight'
      ? serviceFor(actor).weight(patientId, number(value.weight), id) : serviceFor(actor).pressure(patientId, input, id));
    if (success) { reset({ type: value.type, ...blank }); pending.current = undefined; setSaved(true); }
  };
  const field = (name: 'systolic'|'diastolic'|'pulse'|'weight', label: string, optional = false) => <label className="block">
    {label}<input type="number" inputMode={name === 'weight' ? 'decimal' : 'numeric'} className="input mt-2"
      step={name === 'weight' ? '0.1' : '1'} min={name === 'weight' ? '0.1' : '1'} max={name === 'weight' ? '1000' : '500'}
      required={!optional} {...register(name, { onChange: () => setSaved(false) })} data-testid={`input-${name}`}
      aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `measurement-error-${name}` : undefined} />
    {errors[name] && <span id={`measurement-error-${name}`} role="alert" className="text-rose-800 block mt-2">{errors[name]?.message}</span>}
  </label>;
  return <section className="panel"><h2 className="section-title">Registrar mi medición</h2>
    <p className="text-slate-600 mt-2">Ingrese lo que muestra su tensiómetro o balanza. La aplicación registra la lectura; no realiza una medición.</p>
    <form className="grid gap-4 mt-5" onSubmit={handleSubmit(submit)} noValidate>
      <label>Tipo de registro<select className="input mt-2" {...register('type', { onChange: () => setSaved(false) })} data-testid="measurement-type"><option value="pressure">Presión y pulso</option><option value="weight">Peso en casa</option></select></label>
      {type === 'pressure' ? <>{field('systolic','Presión sistólica (mmHg)')}{field('diastolic','Presión diastólica (mmHg)')}{field('pulse','Pulso (bpm, opcional)',true)}</> : field('weight','Peso (kg)')}
      {action.error && <p role="alert" className="text-rose-800">{action.error}</p>}{saved && <p role="status" className="text-forest-800">Medición guardada. El seguimiento ya puede consultarla.</p>}
      <button className="btn-primary" disabled={action.busy} data-testid="btn-save-vitals">{action.busy ? 'Guardando…' : 'Guardar mi lectura'}</button>
      <p className="text-slate-600 text-sm">No hay rangos clínicos configurados por un profesional para esta demostración. No se asigna un diagnóstico al valor.</p>
    </form>
  </section>;
}
