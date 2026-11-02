import { useState } from 'react';
import { ClinicalSettings, User } from '../../types';
import { useAction } from '../../hooks/useAction';
import { serviceFor } from '../../services/apiClient';
import { speechService } from '../../services/speechService';

export function PatientPreferences({ actor, initial, onSaved }: { actor: User; initial: ClinicalSettings; onSaved: () => void }) {
  const [settings, setSettings] = useState(initial);
  const [saved, setSaved] = useState(false);
  const action = useAction();
  return <form className="patient-accessibility panel space-y-4" onSubmit={async event => {
    event.preventDefault();
    setSaved(false);
    if (await action.run(JSON.stringify(settings), () => serviceFor(actor).preferences(initial.patientId, settings))) {
      if (!settings.voiceGuideEnabled) speechService.stop();
      setSaved(true);
      onSaved();
    }
  }}>
    <p>Elige cómo quieres leer esta aplicación. Guarda los cambios para aplicarlos. También puedes usar el zoom de tu navegador.</p>
    <fieldset className="space-y-3"><legend className="font-bold mb-3">Lectura y confirmaciones</legend>
      {(['highContrast', 'largeText', 'voiceGuideEnabled'] as const).map((key, index) => <label key={key} className="flex items-start gap-3 min-h-11 py-2 cursor-pointer">
        <input type="checkbox" className="w-6 h-6 shrink-0" checked={settings[key]} onChange={event => { setSaved(false); setSettings({ ...settings, [key]: event.target.checked }); }} />
        <span>{['Alto contraste', 'Texto ampliado', 'Escuchar las confirmaciones'][index]}</span>
      </label>)}
    </fieldset>
    <p>Las confirmaciones siempre aparecen por escrito, aunque desactives la voz.</p>
    {action.error && <p role="alert" className="text-rose-900">{action.error} Revisa tu conexión y vuelve a guardar.</p>}
    {saved && <p role="status" className="font-semibold text-emerald-900">Ajustes guardados y aplicados a tu aplicación.</p>}
    <button type="submit" className="btn-primary w-full min-h-16" disabled={action.busy}>{action.busy ? 'Guardando ajustes…' : 'Guardar ajustes'}</button>
  </form>;
}
