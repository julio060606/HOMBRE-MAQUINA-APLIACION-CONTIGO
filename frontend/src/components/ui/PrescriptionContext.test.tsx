import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrescriptionContext } from './PrescriptionContext';
import { ClinicalSyncNotice } from './ClinicalSyncNotice';

describe('prescription provenance', () => {
  it('displays the prescribed diagnosis and doctor exactly as supplied, with an explicit missing-data state', () => {
    const source = renderToStaticMarkup(<PrescriptionContext diagnosis="Diagnóstico sintético de la receta" doctor="Dra. de prueba" />);
    expect(source).toContain('Diagnóstico sintético de la receta');
    expect(source).toContain('Dra. de prueba');
    expect(renderToStaticMarkup(<PrescriptionContext />)).toContain('No informado por la clínica ficticia');
  });
  it('warns when source updates failed instead of describing cached data as current', () => {
    expect(renderToStaticMarkup(<ClinicalSyncNotice state={{ status: 'SYNCED' }} />)).toBe('');
    expect(renderToStaticMarkup(<ClinicalSyncNotice state={{ status: 'FAILED' }} />)).toContain('última actualización desde la clínica ficticia falló');
    expect(renderToStaticMarkup(<ClinicalSyncNotice state={{ status: 'UNKNOWN' }} />)).toContain('No se pudo verificar');
  });
});
