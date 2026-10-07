import { Link } from 'react-router-dom';
export function MobilePatientSimulatorModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  // Compatibility wrapper. The only patient interaction implementation is PatientAppContent.
  if (!isOpen) return null;
  return <div role="dialog" aria-modal="true" aria-label="Abrir laboratorio móvil" className="panel"><p>La prueba móvil ahora tiene una vista compartida con la app paciente.</p><Link to="/demo/patient-lab" onClick={onClose} className="btn-primary mt-3">Abrir laboratorio</Link><button onClick={onClose} className="btn-secondary mt-3">Cerrar</button></div>;
}
