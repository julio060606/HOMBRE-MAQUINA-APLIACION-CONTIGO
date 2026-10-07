import { Document, Page, Text, View, StyleSheet, Svg, Polyline, Line, Font } from '@react-pdf/renderer';
import { ReportModel, ReportOptions } from './reportModel';
import { formatDate } from '../../domain/time';
import { DOSE_LABELS } from '../../components/ui/DoseList';
const fontSource = typeof window === 'undefined'
  ? decodeURIComponent(new URL('../../../public/fonts/DejaVuSans.ttf', import.meta.url).pathname).replace(/^\/([A-Za-z]:\/)/, '$1')
  : `${import.meta.env.BASE_URL}fonts/DejaVuSans.ttf`;
Font.register({ family: 'ContigoReport', src: fontSource });
const styles = StyleSheet.create({
  page: { padding: 36, paddingBottom: 50, fontFamily: 'ContigoReport', fontSize: 10, color: '#182a32', lineHeight: 1.5 },
  title: { fontSize: 20, color: '#136F53', marginBottom: 6 },
  subtitle: { fontSize: 10, color: '#435866', marginBottom: 14 },
  heading: { fontSize: 13, marginTop: 15, marginBottom: 7, color: '#136F53' },
  band: { backgroundColor: '#edf6f2', padding: 12, marginBottom: 8 },
  row: { borderBottomWidth: 0.5, borderBottomColor: '#d4dddd', paddingVertical: 6 },
  muted: { color: '#526574', fontSize: 9 },
  footer: { position: 'absolute', bottom: 22, left: 36, right: 36, fontSize: 8, color: '#526574' },
});
function PressureFigure({ model }: { model: ReportModel }) {
  if (!model.pressures.length) return <Text>No hay mediciones de presión en este período.</Text>;
  const values = model.pressures.flatMap(p => [p.systolic, p.diastolic]);
  const min = Math.min(...values) - 10, max = Math.max(...values) + 10;
  const start = Date.parse(model.pressures[0].recordedAt), end = Date.parse(model.pressures[model.pressures.length - 1].recordedAt);
  const points = (field: 'systolic' | 'diastolic') => model.pressures.map(p => {
    const x = end === start ? 255 : 10 + (Date.parse(p.recordedAt) - start) / (end - start) * 490;
    return `${x},${110 - (p[field] - min) / (max - min) * 100}`;
  }).join(' ');
  return <View wrap={false}>
    <Text style={styles.muted}>Presión sistólica (verde) y diastólica (azul), en mmHg. Cada punto representa una medición.</Text>
    <Text style={styles.muted}>Escala vertical del gráfico: {min} a {max} mmHg.</Text>
    {model.pressures.length > 1 && <Svg width={510} height={125} viewBox="0 0 510 125">
      <Line x1={10} y1={115} x2={500} y2={115} stroke="#a0b0b6" strokeWidth={1} />
      <Polyline points={points('systolic')} fill="none" stroke="#136F53" strokeWidth={2} />
      <Polyline points={points('diastolic')} fill="none" stroke="#0284C7" strokeWidth={2} />
    </Svg>}
    <Text style={styles.muted}>Desde {formatDate(model.pressures[0].recordedAt)} hasta {formatDate(model.pressures[model.pressures.length - 1].recordedAt)}. Los valores exactos se incluyen abajo.</Text>
  </View>;
}
export function ReportDocument({ model, options }: { model: ReportModel; options: ReportOptions }) {
  return <Document title={`Contigo - ${model.patient.fullName}`} author="Contigo · demostración" language="es-PE">
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>CONTIGO · Resumen de seguimiento</Text>
      <Text style={styles.subtitle}>Demostración con datos sintéticos. Resumen informativo para revisión; no incluye certificación ni firma médica.</Text>
      <View style={styles.band}><Text>Paciente: {model.patient.fullName} · {model.patient.age} años</Text>
        <Text>Identificador: {model.patient.externalPatientId}</Text>
        <Text>Período: {formatDate(model.from)} — {formatDate(model.generatedAt)} · zona America/Lima</Text>
        <Text>Generado: {formatDate(model.generatedAt)}</Text></View>
      <Text style={styles.heading}>Ficha suministrada por la clínica</Text>
      <Text>Talla: {model.profile?.heightCm === undefined ? 'Sin registro' : `${model.profile.heightCm} cm`} · Peso clínico: {model.profile?.weightKg === undefined ? 'Sin registro' : `${model.profile.weightKg} kg`}</Text>
      {model.profile && <Text style={styles.muted}>Fecha de medición: {formatDate(model.profile.measuredAt)}</Text>}
      {options.treatment && <>
        <Text style={styles.heading}>Tratamiento y respuestas del paciente</Text>
        <Text>Adherencia declarada sobre dosis cuyo horario ya llegó: {model.adherence.duePercent === null ? 'Sin dosis evaluables' : `${model.adherence.duePercent}%`} ({model.adherence.taken} tomadas de {model.adherence.due} dosis evaluables).</Text>
        <Text style={styles.muted}>«Sin confirmar» indica ausencia de respuesta; se distingue de «No la tomé». Las dosis canceladas se excluyen del cálculo. Solo se evalúan los registros disponibles.</Text>
        {model.medications.map(m => <View key={m.id} style={styles.row} wrap={false}>
          <Text>{m.name} · {m.dosage} · {m.isActive ? 'Activo' : 'Inactivo'} · horarios: {m.times.join(', ')}</Text>
          <Text style={styles.muted}>Origen: clínica · vigencia {m.startDate} a {m.endDate ?? 'sin fecha de fin'} · versión {m.version}</Text>
          <Text>{m.instructions}</Text><Text>Existencias estimadas: {model.supplies.find(s => s.medicationId === m.id)?.quantity ?? 'desconocidas'} {m.stockUnit ?? ''}</Text>
        </View>)}
        {!model.doses.length && <Text>No hay dosis disponibles en este período.</Text>}
        {model.doses.map(d => <View key={d.id} style={styles.row} wrap={false}><Text>{formatDate(d.scheduledAt)} · {d.medicationName} · {DOSE_LABELS[d.status]}</Text>{d.reason && <Text style={styles.muted}>Motivo: {d.reason}</Text>}</View>)}
      </>}
      {options.measurements && <>
        <Text style={styles.heading}>Presión, pulso y peso doméstico</Text>
        <Text>Promedio de presión: {model.averageSystolic === null ? 'Sin registros' : `${model.averageSystolic}/${model.averageDiastolic} mmHg`} · Pulso promedio: {model.averagePulse === null ? 'Sin registros' : `${model.averagePulse} lpm`}</Text>
        <PressureFigure model={model} />
        {model.pressures.map(p => <View key={p.id} style={styles.row} wrap={false}><Text>{formatDate(p.recordedAt)} · {p.systolic}/{p.diastolic} mmHg · pulso {p.pulse ?? 'sin registro'} · {p.source === 'HOME' ? 'Doméstico' : 'Clínica'}</Text></View>)}
        {!model.weights.length && <Text style={styles.row}>Sin registros de peso doméstico en el período.</Text>}
        {model.weights.map(w => <Text key={w.id} style={styles.row}>{formatDate(w.recordedAt)} · Peso doméstico: {w.weightKg} kg</Text>)}
        <Text style={styles.muted}>Sin clasificación clínica automática. El peso doméstico no reemplaza al dato de la ficha clínica.</Text>
      </>}
      <Text style={styles.heading}>Citas registradas por la clínica</Text>
      {!model.appointments.length && <Text>Sin citas disponibles.</Text>}
      {model.appointments.map(a => <Text key={a.id} style={styles.row}>{formatDate(a.startsAt)} · {a.specialty} · {a.doctor} · {a.location} · {a.status === 'SCHEDULED' ? 'Programada' : a.status === 'CANCELLED' ? 'Cancelada' : 'Realizada'}</Text>)}
      {options.alerts && <><Text style={styles.heading}>Avisos del período</Text>{!model.alerts.length && <Text>Sin avisos registrados en el período.</Text>}{model.alerts.map(a => <Text key={a.id} style={styles.row}>{formatDate(a.timestamp)} · {a.title} · {a.description}</Text>)}</>}
      <Text style={styles.footer} fixed>Contigo · resumen informativo · demostración con datos sintéticos</Text>
    </Page>
  </Document>;
}
