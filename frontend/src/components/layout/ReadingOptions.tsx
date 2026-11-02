import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

type ReadingPreferences = { contrast: boolean; scale: string };
const defaults: ReadingPreferences = { contrast: false, scale: '100' };
function readPreferences(): ReadingPreferences {
  try {
    const stored = JSON.parse(localStorage.getItem('contigo-reading-options') || 'null');
    return { contrast: stored?.contrast === true, scale: ['100', '125', '150', '200'].includes(stored?.scale) ? stored.scale : '100' };
  } catch { return defaults; }
}

export function ReadingOptions() {
  const { pathname } = useLocation();
  const publicPage = pathname === '/clinic' || pathname === '/landing';
  const [preferences, setPreferences] = useState(readPreferences);
  useEffect(() => {
    document.documentElement.classList.toggle('site-high-contrast', preferences.contrast);
    document.documentElement.style.fontSize = `${Number(preferences.scale)}%`;
    try { localStorage.setItem('contigo-reading-options', JSON.stringify(preferences)); } catch { /* Preferences still work in this session. */ }
  }, [preferences]);
  const caregiverPage = ['/dashboard', '/medications', '/appointments', '/clinical-profile', '/vitals', '/reports', '/settings'].includes(pathname);
  return <div className={`reading-options${publicPage ? ' public-reading-options' : ''}${pathname === '/clinic' ? ' clinic-reading-options' : ''}${caregiverPage ? ' caregiver-reading-options' : ''}`}>
    <a className="skip-link" href="#main-content" onClick={() => document.getElementById('main-content')?.focus()}>Saltar al contenido principal</a>
    <details>
      <summary>Opciones de lectura</summary>
      <div className="reading-options-fields">
        <label><input type="checkbox" checked={preferences.contrast} onChange={e => setPreferences({ ...preferences, contrast: e.target.checked })} /> Alto contraste en este dispositivo</label>
        <label>Tamaño del texto <select value={preferences.scale} onChange={e => setPreferences({ ...preferences, scale: e.target.value })}>
          {['100', '125', '150', '200'].map(value => <option key={value} value={value}>{value} %</option>)}
        </select></label>
        <button type="button" className="btn-secondary" onClick={() => setPreferences(defaults)}>Restablecer lectura</button>
        <p>También puedes ampliar con el zoom de tu navegador. Estas opciones no cambian tu tratamiento.</p>
      </div>
    </details>
    <Link to="/accessibility">Accesibilidad y ayuda</Link>
  </div>;
}
