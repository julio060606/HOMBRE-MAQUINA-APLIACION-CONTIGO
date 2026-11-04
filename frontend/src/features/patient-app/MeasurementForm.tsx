import { useEffect, useId, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Activity, ArrowRight, Check, CheckCircle2, ChevronDown, HeartPulse, Scale } from 'lucide-react';
import { User } from '../../types';
import { serviceFor } from '../../services/apiClient';
import { useAction } from '../../hooks/useAction';
import { PressureInput } from '../../services/contracts';
import { measurementFormInput } from '../../domain/validation';
import styles from './MeasurementForm.module.css';

type FormInput = z.infer<typeof measurementFormInput>;
type MeasurementField = 'systolic' | 'diastolic' | 'pulse' | 'weight';
const blank = { systolic: '', diastolic: '', pulse: '', weight: '' };
const fieldLabels: Record<MeasurementField, string> = {
  systolic: 'Número de arriba',
  diastolic: 'Número de abajo',
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
    const unit = name === 'weight' ? 'kg' : name === 'pulse' ? 'latidos/min' : 'mmHg';
    return <div className={styles.field}>
      <label htmlFor={fieldId} className={styles.fieldLabel}>{fieldLabels[name]}{(name === 'systolic' || name === 'diastolic') && <span aria-hidden="true">{name === 'systolic' ? 'SYS' : 'DIA'}</span>}</label>
      <div className={`${styles.inputBox} ${errors[name] ? styles.inputInvalid : ''}`}>
      <input id={fieldId} type="text" inputMode={name === 'weight' ? 'decimal' : 'numeric'} autoComplete="off"
        enterKeyHint={name === 'systolic' ? 'next' : 'done'} placeholder="—"
        className={styles.numberInput}
        required={!optional} {...register(name, { onChange: () => setSaved(false) })} data-testid={`input-${name}`}
        onKeyDown={event => { if (name === 'systolic' && event.key === 'Enter') { event.preventDefault(); setFocus('diastolic'); } }}
        aria-invalid={!!errors[name]} aria-describedby={`${fieldId}-unit${errors[name] ? ` ${errorId}` : ''}`} />
        <span id={`${fieldId}-unit`} className={styles.unit}>{unit}</span>
      </div>
      {errors[name] && <p id={errorId} className={styles.fieldError}>{errors[name]?.message}</p>}
    </div>;
  };

  return <section className={`measurement-form ${styles.card}`} aria-labelledby={`${prefix}-title`} aria-busy={action.busy}>
    <header className={styles.header}><span className={styles.headerIcon} aria-hidden="true"><HeartPulse size={23} /></span><div>
      <h3 id={`${prefix}-title`} className={styles.title}>Registrar medición</h3><p className={styles.subtitle}>Una lectura de tu equipo, paso a paso.</p>
    </div></header>
    {!saved && <ol className={styles.steps} aria-label="Pasos para registrar una medición"><li aria-current={!review ? 'step' : undefined}><span aria-hidden="true">{review ? <Check size={14} /> : '1'}</span>Ingresa los valores</li><li aria-current={review ? 'step' : undefined}><span aria-hidden="true">2</span>Revisa y guarda</li></ol>}
    {saved ? <div className={styles.success}>
      <CheckCircle2 className="w-10 h-10 text-emerald-800 mx-auto" aria-hidden="true" />
      <p ref={savedMessage} tabIndex={-1} role="status" className="font-semibold text-emerald-900">Medición guardada. Tu cuidador ya puede consultarla.</p>
      <button type="button" className={`btn-secondary ${styles.fullButton}`} onClick={() => { setSaved(false); requestAnimationFrame(() => setFocus(type === 'weight' ? 'weight' : 'systolic')); }}>Registrar otra medición</button>
    </div> : review ? <div className={styles.review} data-testid="measurement-review">
      <div><h4 ref={reviewHeading} tabIndex={-1} className={styles.reviewTitle}>¿Los valores son correctos?</h4>
      <p className={styles.subtitle}>Compáralos con la pantalla de tu equipo.</p></div>
      <div className={styles.reading}>
        <p className="font-semibold">{review.type === 'pressure' ? 'Presión arterial' : 'Peso'}</p>
        <p className="text-3xl font-bold tabular-nums">{review.type === 'pressure' ? `${review.systolic} / ${review.diastolic}` : review.weight}<span className="block text-base font-normal">{review.type === 'pressure' ? 'mmHg' : 'kg'}</span></p>
        {review.type === 'pressure' && <p>{review.pulse.trim() ? `Pulso: ${review.pulse} latidos/min` : 'Pulso: no registrado'}</p>}
      </div>
      <button type="button" className={`btn-primary ${styles.fullButton}`} disabled={action.busy} data-testid="btn-confirm-vitals" onClick={() => void submit(review)}>{action.busy ? 'Guardando…' : 'Guardar medición'}<Check size={18} aria-hidden="true" /></button>
      <button type="button" className={`btn-secondary ${styles.fullButton}`} disabled={action.busy} onClick={edit}>Corregir números</button>
      {action.error && <p role="alert" className="text-rose-900">{action.error} Puedes volver a intentar guardar.</p>}
    </div> : <form className={styles.form} onSubmit={handleSubmit(value => setReview(value))} noValidate aria-describedby={hintId}>
      <input type="hidden" {...register('type')} />
      <fieldset className={styles.typeFieldset}>
        <legend className="sr-only">Elige qué vas a registrar</legend>
        <div className={styles.typeOptions} data-testid="measurement-type">
          {([{ value: 'pressure', label: 'Presión', icon: Activity }, { value: 'weight', label: 'Peso', icon: Scale }] as const).map(({ value, label, icon: Icon }) => <button key={value} type="button" aria-pressed={type === value}
            data-testid={`measurement-${value}`} onClick={() => chooseType(value)}
            className={styles.typeOption}>
            <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />{label}{type === value && <Check size={15} aria-hidden="true" />}
          </button>)}
        </div>
      </fieldset>
      <p id={hintId} className={styles.instruction}>{type === 'pressure' ? 'Copia los dos números de tu tensiómetro.' : 'Copia el peso que muestra tu balanza.'}</p>
      {Object.keys(errors).length > 0 && <p role="alert" className="font-semibold text-rose-900">Revisa los números marcados para continuar.</p>}
      {type === 'pressure' ? <>
        <div className={styles.pressureFields}>{field('systolic')}{field('diastolic')}</div>
        <details ref={pulseDetails} className={styles.pulse}>
          <summary><HeartPulse size={18} aria-hidden="true" /><span>{pulse?.trim() ? `Pulso: ${pulse} · cambiar` : 'Añadir pulso'}<small>Opcional</small></span><ChevronDown size={17} className={styles.pulseChevron} aria-hidden="true" /></summary>
          <div className={styles.pulseContent}>{field('pulse', true)}</div>
        </details>
      </> : <>
        {field('weight')}
        <p className={styles.instruction}>Puedes usar coma o punto decimal.</p>
      </>}
      <button type="submit" className={`btn-primary ${styles.fullButton}`} data-testid="btn-save-vitals">Revisar medición<ArrowRight size={18} aria-hidden="true" /></button>
      <p className={styles.footerHint}>Primero revisas los valores. Después decides guardarlos.</p>
    </form>}
  </section>;
}
