import { useEffect, useId, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Activity, CheckCircle2, Scale } from 'lucide-react';
import { User } from '../../types';
import { serviceFor } from '../../services/apiClient';
import { useAction } from '../../hooks/useAction';
import { PressureInput } from '../../services/contracts';
import { measurementFormInput } from '../../domain/validation';

type FormInput = z.infer<typeof measurementFormInput>;
type MeasurementField = 'systolic' | 'diastolic' | 'pulse' | 'weight';
const blank = { systolic: '', diastolic: '', pulse: '', weight: '' };
const fieldLabels: Record<MeasurementField, string> = {
  systolic: 'Arriba (SYS)',
  diastolic: 'Abajo (DIA)',
  pulse: 'Pulso (opcional)',
  weight: 'Peso en kg',
};

export function MeasurementForm({ actor, patientId }: { actor: User; patientId: string }) {
  const { register, handleSubmit, reset, control, setFocus, setValue, clearErrors, formState: { errors } } = useForm<FormInput>({
    resolver: zodResolver(measurementFormInput), defaultValues: { type: 'pressure', ...blank },
  });
  const type = useWatch({ control, name: 'type' });
  const pulse = useWatch({ control, name: 'pulse' });
  const [saved, setSaved] = useState(false);
  const [review, setReview] = useState<FormInput | null>(null);
  const action = useAction();
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  const savedMessage = useRef<HTMLParagraphElement>(null);
  const pulseDetails = useRef<HTMLDetailsElement>(null);
  const pending = useRef<{ fingerprint: string; input: PressureInput }>();
  const prefix = useId();
  const hintId = `${prefix}-instructions`;
  const number = (value: string) => value.trim() ? Number(value) : NaN;
  const weightNumber = (value: string) => number(value.replace(',', '.'));

  useEffect(() => { if (review) reviewHeading.current?.focus(); }, [review]);
  useEffect(() => { if (saved) savedMessage.current?.focus(); }, [saved]);
  useEffect(() => {
    if (errors.pulse && pulseDetails.current) { pulseDetails.current.open = true; setFocus('pulse'); }
  }, [errors.pulse, setFocus]);

  const submit = async (value: FormInput) => {
    const fingerprint = JSON.stringify(value);
    const input = pending.current?.fingerprint === fingerprint ? pending.current.input : {
      systolic: number(value.systolic), diastolic: number(value.diastolic),
      pulse: value.pulse.trim() ? number(value.pulse) : undefined, recordedAt: new Date().toISOString(),
    };
    pending.current = { fingerprint, input };
    const success = await action.run(fingerprint, id => value.type === 'weight'
      ? serviceFor(actor).weight(patientId, weightNumber(value.weight), id)
      : serviceFor(actor).pressure(patientId, input, id));
    if (success) {
      reset({ type: value.type, ...blank });
      pending.current = undefined;
      setReview(null);
      setSaved(true);
    }
  };

  const edit = () => {
    setReview(null);
    requestAnimationFrame(() => setFocus(type === 'weight' ? 'weight' : 'systolic'));
  };
  const chooseType = (value: FormInput['type']) => {
    setValue('type', value);
    clearErrors();
    setSaved(false);
  };
  const field = (name: MeasurementField, optional = false) => {
    const fieldId = `${prefix}-${name}`;
    const errorId = `${fieldId}-error`;
    return <div className="min-w-0">
      <label htmlFor={fieldId} className="block text-sm font-semibold text-slate-800">{fieldLabels[name]}</label>
      <input id={fieldId} type="text" inputMode={name === 'weight' ? 'decimal' : 'numeric'} autoComplete="off"
        enterKeyHint={name === 'systolic' ? 'next' : 'done'} placeholder="—"
        className={`input mt-2 min-h-16 text-center text-3xl font-bold tabular-nums ${errors[name] ? 'border-2 !border-rose-700' : ''}`}
        required={!optional} {...register(name, { onChange: () => setSaved(false) })} data-testid={`input-${name}`}
        onKeyDown={event => { if (name === 'systolic' && event.key === 'Enter') { event.preventDefault(); setFocus('diastolic'); } }}
        aria-invalid={!!errors[name]} aria-describedby={`${prefix}-${name === 'pulse' ? 'pulse-units' : 'units'}${errors[name] ? ` ${errorId}` : ''}`} />
      {errors[name] && <p id={errorId} className="text-rose-900 text-sm mt-2">{errors[name]?.message}</p>}
    </div>;
  };

  return <section className="panel space-y-4 measurement-form" aria-labelledby={`${prefix}-title`}>
    <h3 id={`${prefix}-title`} className="section-title">Registrar medición</h3>
    {saved ? <div className="space-y-4">
      <CheckCircle2 className="w-10 h-10 text-emerald-800" aria-hidden="true" />
      <p ref={savedMessage} tabIndex={-1} role="status" className="font-semibold text-emerald-900">Medición guardada. Tu cuidador ya puede consultarla.</p>
      <button type="button" className="btn-secondary min-h-16 w-full" onClick={() => { setSaved(false); requestAnimationFrame(() => setFocus(type === 'weight' ? 'weight' : 'systolic')); }}>Registrar otra medición</button>
    </div> : review ? <div className="space-y-4" data-testid="measurement-review">
      <h4 ref={reviewHeading} tabIndex={-1} className="text-lg font-bold">Revisa tu medición</h4>
      <p className="text-slate-600">Debe coincidir con lo que muestra tu equipo.</p>
      <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-center space-y-2">
        <p className="font-semibold">{review.type === 'pressure' ? 'Presión arterial' : 'Peso'}</p>
        <p className="text-3xl font-bold tabular-nums">{review.type === 'pressure' ? `${review.systolic} / ${review.diastolic}` : review.weight}<span className="block text-base font-normal">{review.type === 'pressure' ? 'mmHg' : 'kg'}</span></p>
        {review.type === 'pressure' && <p>{review.pulse.trim() ? `Pulso: ${review.pulse} latidos/min` : 'Pulso: no registrado'}</p>}
      </div>
      <button type="button" className="btn-primary min-h-16 w-full" disabled={action.busy} data-testid="btn-confirm-vitals" onClick={() => void submit(review)}>{action.busy ? 'Guardando…' : 'Guardar medición'}</button>
      <button type="button" className="btn-secondary min-h-11 w-full" disabled={action.busy} onClick={edit}>Corregir números</button>
      {action.error && <p role="alert" className="text-rose-900">{action.error} Puedes volver a intentar guardar.</p>}
    </div> : <form className="space-y-4" onSubmit={handleSubmit(value => setReview(value))} noValidate aria-describedby={hintId}>
      <input type="hidden" {...register('type')} />
      <fieldset>
        <legend className="sr-only">Elige qué vas a registrar</legend>
        <div className="grid grid-cols-2 gap-2" data-testid="measurement-type">
          {([{ value: 'pressure', label: 'Presión', icon: Activity }, { value: 'weight', label: 'Peso', icon: Scale }] as const).map(({ value, label, icon: Icon }) => <button key={value} type="button" aria-pressed={type === value}
            data-testid={`measurement-${value}`} onClick={() => chooseType(value)}
            className={`min-h-16 rounded-xl border-2 px-1 py-3 font-bold flex flex-wrap items-center justify-center gap-1 ${type === value ? 'bg-forest-700 text-white border-forest-700' : 'bg-white text-slate-700 border-slate-400'}`}>
            <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />{label}
          </button>)}
        </div>
      </fieldset>
      <p id={hintId} className="text-slate-600 text-sm">{type === 'pressure' ? 'Copia los dos números de tu tensiómetro.' : 'Copia el peso que muestra tu balanza.'}</p>
      {Object.keys(errors).length > 0 && <p role="alert" className="font-semibold text-rose-900">Revisa los números marcados para continuar.</p>}
      {type === 'pressure' ? <>
        <div className="grid grid-cols-2 gap-3">{field('systolic')}{field('diastolic')}</div>
        <p id={`${prefix}-units`} className="text-sm text-slate-600">Presión en mmHg.</p>
        <details ref={pulseDetails} className="border-t border-slate-200 pt-2">
          <summary className="cursor-pointer py-2 font-semibold text-forest-800">{pulse?.trim() ? `Pulso: ${pulse} · cambiar` : 'Añadir pulso (opcional)'}</summary>
          <div className="pt-2">{field('pulse', true)}<p id={`${prefix}-pulse-units`} className="text-sm text-slate-600 mt-2">Latidos por minuto.</p></div>
        </details>
      </> : <>
        {field('weight')}
        <p id={`${prefix}-units`} className="text-sm text-slate-600">Kilogramos · puedes usar coma o punto decimal.</p>
      </>}
      <button type="submit" className="btn-primary min-h-16 w-full" data-testid="btn-save-vitals">Continuar</button>
    </form>}
  </section>;
}
