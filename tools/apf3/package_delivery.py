"""Package final APF3 annexes without QA intermediates or personal consent data."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output' / 'apf3'

def package():
    if (OUT/'current-config.json').exists():
        return package_current()
    reports = list(OUT.glob('APF3_Grupo*_CONTIGO.pdf'))
    slides = list(OUT.glob('APF3_Grupo*_CONTIGO.pptx'))
    if len(reports) != 1 or len(slides) != 1:
        raise RuntimeError('Debe existir un informe y una presentación finales sin versiones ambiguas')
    stem = reports[0].stem.replace('_CONTIGO', '')
    required = [OUT/'APF3_Matriz_y_validacion_CONTIGO.xlsx',
                OUT/'APF3_Protocolo_y_fichas_CONTIGO.pdf',
                OUT/'APF3_Declaracion_IA.md', OUT/'Declaracion_de_accesibilidad.md',
                OUT/'dependency-audit.json',
                OUT/'findings.json', OUT/'comparison.json',
                OUT/'evidence'/'code-review.json',
                OUT/'evidence'/'contrast-calculations.json',
                OUT/'evidence'/'applicability-review.json',
                OUT/'evidence'/'baseline'/'audit.json',
                OUT/'evidence'/'after'/'audit.json',
                OUT/'evidence'/'after'/'source-manifest.json',
                OUT/'evidence'/'after'/'frontend-checks.json']
    for path in required:
        if not path.is_file():
            raise FileNotFoundError(path)
    phases = ['baseline', 'after', 'keyboard-tasks', 'native-zoom/verified-native-api-final', 'contrast-review', 'nvda']
    evidence = [p for phase in phases
                for p in (OUT/'evidence'/phase).rglob('*') if p.is_file()]
    native_guide = OUT/'evidence'/'native-zoom'/'README.md'
    if native_guide.is_file():
        evidence.append(native_guide)
    files = sorted(set(required + evidence))
    manifest = {'purpose': 'Anexos técnicos y formularios sin sesiones fabricadas',
                'status': 'Validación con participantes y Figma/Stark pendientes. Consultar alcance real de las comprobaciones técnicas en los registros de evidencia.',
                'files': [{'path': p.relative_to(OUT).as_posix(), 'bytes': p.stat().st_size,
                           'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]}
    manifest_path = OUT/'anexos-manifest.json'
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    zip_path = OUT/f'{stem}_Anexos.zip'
    with ZipFile(zip_path, 'w', compression=ZIP_DEFLATED, compresslevel=6) as archive:
        for path in files:
            archive.write(path, path.relative_to(OUT).as_posix())
        archive.write(manifest_path, manifest_path.name)
    with ZipFile(zip_path) as archive:
        if archive.testzip() is not None:
            raise RuntimeError('Fallo de integridad del ZIP')
        actual = set(archive.namelist())
        expected = {p.relative_to(OUT).as_posix() for p in files} | {manifest_path.name}
        if actual != expected:
            raise RuntimeError('El ZIP no coincide con los archivos previstos')
    print(json.dumps({'zip': str(zip_path), 'files': len(files)+1,
                      'bytes': zip_path.stat().st_size}, ensure_ascii=False))

def package_current():
    names=['APF3_CONTIGO_Informe.pdf','APF3_CONTIGO_Presentacion.pptx','APF3_CONTIGO_Matriz.xlsx','APF3_CONTIGO_Instrumentos.pdf','APF3_Declaracion_IA.md','Declaracion_de_accesibilidad.md','ENTREGA.md','current-config.json','findings.json','deliverables-data.json']
    required=[OUT/name for name in names]
    for file in required:
        if not file.is_file():raise FileNotFoundError(file)
    current=OUT/'evidence/current-2026-11-03'
    evidence=[p for p in current.rglob('*') if p.is_file() and p.suffix.lower() in ['.json','.png','.md','.txt'] and '/qa/' not in p.as_posix()]
    figma=OUT/'figma-current-2026-11-03'
    current_figma=[p for p in figma.rglob('*') if p.is_file() and p.suffix.lower() in ['.json','.js','.html','.md','.zip']]
    files=sorted(set(required+evidence+current_figma))
    source_names=['PUBLICACION.md','README_APF3.md','tools/apf3/build_deliverables_data.py','tools/apf3/build_deliverables_pdf.py','tools/apf3/build_deliverables_office.mjs','tools/apf3/current_delivery_data.py','tools/apf3/current_delivery_pdf.py','tools/apf3/current_delivery_office.mjs','tools/apf3/current_delivery_docs.py','tools/apf3/package_delivery.py','tools/apf3/verify-current-api.mjs','tools/apf3/audit-current-api.mjs','tools/apf3/capture-current-detail.mjs','tools/apf3/verify-current-flows.mjs','tools/runtime/Verify-CurrentStorage.ps1','tools/runtime/Build-PublicFrontend.ps1','tools/runtime/Test-PublicDeployment.ps1','frontend/src/styles/index.css','frontend/src/features/patient-app/MeasurementForm.module.css','frontend/src/features/dashboard/PatientSummary.tsx','frontend/src/features/accessibility/AccessibilityPage.tsx']
    extras=[];omitted=[]
    for name in source_names:
        file=ROOT/name
        if not file.is_file():continue
        text=file.read_text(encoding='utf-8-sig')
        if re.search(r'Contigo20\d{2}!',text) or re.search(r'(?:password|passwd|apiKey|secret)\s*[:=]\s*[\'"][^\'"]+[\'"]',text,re.I):
            omitted.append({'path':name,'reason':'No se empaqueta fuente con valor literal de credencial, aunque sea de demostración.'});continue
        extras.append((file,'fuentes/'+name))
    manifest={'revision':'current-2026-11-03','purpose':'Un único corte técnico actual; datos sintéticos, sin resultados humanos inventados','status':'Evaluación parcial. Figma/Stark, lector completo actual, participantes y acceso público pendientes según registros. Evidencia histórica excluida del ZIP actual.','files':[{'path':p.relative_to(OUT).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]}
    manifest['sourceScope']='Selección explícita de generadores, publicación y cuatro archivos UI; no es copia completa del repositorio. No incluye .env, .runtime, node_modules ni valores literales de credenciales.'
    manifest['omittedSources']=omitted
    manifest['files'] += [{'path':name,'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()} for file,name in extras]
    manifest_path=OUT/'anexos-manifest.json';manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    target=OUT/'APF3_CONTIGO_Anexos.zip'
    with ZipFile(target,'w',compression=ZIP_DEFLATED,compresslevel=6) as z:
        for file in files:z.write(file,file.relative_to(OUT).as_posix())
        for file,name in extras:z.write(file,name)
        z.write(manifest_path,manifest_path.name)
    with ZipFile(target) as z:
        if z.testzip() is not None:raise RuntimeError('ZIP inválido')
        if any('/history/' in n or n.startswith('history/') for n in z.namelist()):raise RuntimeError('Evidencia histórica mezclada en paquete actual')
    print(json.dumps({'zip':str(target),'files':len(files)+len(extras)+1,'sources':len(extras),'omittedSources':len(omitted),'bytes':target.stat().st_size},ensure_ascii=False))

if __name__ == '__main__':
    package()
