"""Package final APF3 annexes without QA intermediates or personal consent data."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output' / 'apf3'

def package():
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

if __name__ == '__main__':
    package()
