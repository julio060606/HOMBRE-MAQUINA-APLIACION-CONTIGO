import { useEffect, useRef, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Download, FileText } from 'lucide-react';
import { PatientData, PageHeader } from '../../components/ui/PatientData';
import { PatientView } from '../../services/contracts';
import { buildReport, ReportOptions } from './reportModel';
import { ReportDocument } from './ReportDocument';
import { formatDate } from '../../domain/time';
import { errorMessage } from '../../hooks/useAction';
function ReportBuilder({ view }: { view: PatientView }) {
  const [days, setDays] = useState(30), [options, setOptions] = useState<ReportOptions>({ measurements: true, treatment: true, alerts: true });
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [saved, setSaved] = useState(false);
  const lock = useRef(false), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const report = buildReport(view, days);
  const download = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setSaved(false);
    try {
      const blob = await pdf(<ReportDocument model={buildReport(view, days)} options={options} />).toBlob();
      if (!mounted.current) return;
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = `Contigo_demo_${view.patient.id}_${days}dias.pdf`;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000); setSaved(true);
    } catch (e) { if (mounted.current) setError(errorMessage(e)); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  };
  return <>
    <PageHeader title="Reporte de seguimiento" description="Exporta los registros disponibles del paciente en un PDF informativo." />
    <div className="grid lg:grid-cols-3 gap-6"><section className="panel space-y-4">
      <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs mb-1">
        <img
          src="/images/doctor_report.jpg"
          alt="Revisión médica de reporte clínico"
          className="w-full h-32 object-cover"
        />
      </div>
      <h2 className="section-title">Contenido del reporte</h2>
      <label className="block">Período<select className="input mt-2" value={days} disabled={busy} onChange={e => { setDays(Number(e.target.value)); setSaved(false); }} data-testid="report-period">{[7,30,90].map(d => <option key={d} value={d}>Últimos {d} días</option>)}</select></label>
      {(['treatment','measurements','alerts'] as const).map((key, i) => <label key={key} className="flex items-center gap-3"><input className="w-5 h-5" type="checkbox" disabled={busy} checked={options[key]} onChange={e => { setOptions({ ...options, [key]: e.target.checked }); setSaved(false); }} />{['Tratamiento y tomas','Presión, pulso y peso','Avisos'][i]}</label>)}
      <button className="btn-primary w-full" onClick={() => void download()} disabled={busy} data-testid="btn-download-pdf-report"><Download size={18} />{busy ? 'Generando PDF…' : 'Descargar PDF'}</button>
      {error && <p role="alert" className="text-rose-800">{error}</p>}{saved && <p role="status" className="text-forest-800">PDF generado. Se inició la descarga en tu navegador.</p>}
      <p className="text-sm text-slate-600">Datos sintéticos de demostración. Este resumen no incluye firma ni certificación médica.</p>
    </section><section className="panel lg:col-span-2 space-y-5">
      <div className="flex items-center gap-3"><FileText className="text-forest-700" /><h2 className="section-title">Resumen de los datos a exportar</h2></div>
      <div className="bg-forest-50 p-4"><p className="font-heading text-xl font-semibold">{report.patient.fullName}</p><p>{formatDate(report.from)} — {formatDate(report.generatedAt)}</p></div>
      {options.treatment && <div><h3 className="font-semibold">Tratamiento y adherencia declarada</h3><p className="mt-2">{report.adherence.duePercent === null ? 'Sin dosis evaluables.' : `${report.adherence.duePercent}% sobre ${report.adherence.due} dosis cuyo horario ya llegó.`}</p><p>{report.medications.length} recetas disponibles. {report.doses.length} dosis en el período.</p></div>}
      {options.measurements && <div><h3 className="font-semibold">Mediciones registradas</h3><p className="mt-2">{report.pressures.length} mediciones de presión y {report.weights.length} registros de peso doméstico.</p><p>Presión promedio: {report.averageSystolic === null ? 'Sin registros' : `${report.averageSystolic}/${report.averageDiastolic} mmHg`}. Pulso promedio: {report.averagePulse ?? 'Sin registros'}{report.averagePulse === null ? '' : ' lpm'}.</p></div>}
      <div><h3 className="font-semibold">Citas y avisos</h3><p className="mt-2">{report.appointments.length} citas disponibles. {options.alerts ? `${report.alerts.length} avisos en el período.` : 'Avisos excluidos.'}</p></div>
      <p className="text-sm text-slate-600">El PDF incluye fechas, origen de las mediciones y valores exactos. «Sin confirmar» y «No la tomé» aparecen como estados distintos.</p>
    </section></div>
  </>;
}
export function ReportsPage() { return <PatientData>{view => <ReportBuilder key={view.patient.id} view={view} />}</PatientData>; }
