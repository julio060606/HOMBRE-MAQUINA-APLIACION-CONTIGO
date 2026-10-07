import { useState } from 'react';
import { PatientData, PageHeader } from '../../components/ui/PatientData';
import { useAuth } from '../../context/AuthContext';
import { ClinicalSettings } from '../../types';
import { useAction } from '../../hooks/useAction';
import { serviceFor } from '../../services/apiClient';
function Preferences({ initial }: { initial: ClinicalSettings }) {
  const { user } = useAuth(); const [settings, setSettings] = useState(initial), [saved, setSaved] = useState(false); const action = useAction();
  return <form className="panel space-y-5" onSubmit={async e => { e.preventDefault(); setSaved(false); if (user && await action.run(JSON.stringify(settings), () => serviceFor(user).preferences(initial.patientId, settings))) setSaved(true); }}>
    <h2 className="section-title">Accesibilidad y seguimiento</h2>
    {(['voiceGuideEnabled','largeText','highContrast'] as const).map((key,i) => <label key={key} className="flex items-center gap-3"><input type="checkbox" checked={settings[key]} onChange={e => setSettings({ ...settings, [key]: e.target.checked })} className="w-5 h-5" />{['Lectura por voz al confirmar','Texto grande en la app paciente','Alto contraste en la app paciente'][i]}</label>)}
    <label className="block">Minutos antes del aviso «Sin confirmar»<input type="number" className="input mt-2 max-w-xs" min="5" max="180" value={settings.notifyMissedDoseMinutes} onChange={e => setSettings({ ...settings, notifyMissedDoseMinutes: Number(e.target.value) })} /></label>
    <p className="text-slate-600">Los rangos clínicos no están configurados en esta demo. Paciente y cuidador no modifican límites médicos.</p>
    {action.error && <p role="alert" className="text-rose-800">{action.error}</p>}{saved && <p role="status">Preferencias guardadas para este paciente.</p>}<button className="btn-primary" disabled={action.busy}>{action.busy ? 'Guardando…' : 'Guardar preferencias'}</button>
  </form>;
}
export function SettingsPage() { return <PatientData>{view => <><PageHeader title="Preferencias" description="Ajustes por paciente. Los cambios de tratamiento corresponden a la clínica." /><Preferences key={view.patient.id} initial={view.settings} /></>}</PatientData>; }
