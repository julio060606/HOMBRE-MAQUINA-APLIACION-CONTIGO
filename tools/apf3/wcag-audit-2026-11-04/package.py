from pathlib import Path
import hashlib
import json
import zipfile
import xml.etree.ElementTree as ET
from pypdf import PdfReader

root = Path(__file__).resolve().parents[3]
audit = root / 'output/wcag-audit-2026-11-04'
out = root / 'outputs/wcag-audit-2026-11-04'
data = json.loads((audit / 'auditoria-datos.json').read_text(encoding='utf-8'))
pdf = root / 'output/pdf/CONTIGO_Auditoria_WCAG_2.1_AA_2026-11-04.pdf'
xlsx = out / 'CONTIGO_Auditoria_WCAG_2.1_AA_2026-11-04.xlsx'
assert len(data['criteria']) == len({c['id'] for c in data['criteria']}) == 50
assert len([c for c in data['criteria'] if c['core']]) == 26
assert sum(data['stats']['statuses'].values()) == 50
assert len(PdfReader(pdf).pages) == 8
assert all((audit / e['file']).is_file() for e in data['evidence'])
assert all(hashlib.sha256((root / p).read_bytes()).hexdigest() == h for p,h in data['sourceHashes'].items())

ns = {'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(xlsx) as book:
    workbook = ET.fromstring(book.read('xl/workbook.xml'))
    assert len(workbook.find('s:sheets', ns)) == 6
    sheet = ET.fromstring(book.read('xl/worksheets/sheet1.xml'))
    cells = {e.attrib['r']:e for e in sheet.findall('.//s:c', ns)}
    for ref, expected in {'B6':50,'B8':28,'B9':5,'B10':7,'B11':10,'B12':5,'B13':1}.items():
        value = cells[ref].find('s:v', ns)
        assert value is not None and float(value.text) == expected, (ref, value.text if value is not None else None)
    for name in book.namelist():
        if name.startswith('xl/worksheets/sheet') and name.endswith('.xml'):
            xml = ET.fromstring(book.read(name))
            errors = [c.attrib['r'] for c in xml.findall('.//s:c', ns) if c.attrib.get('t')=='e']
            assert not errors, (name, errors)

files = [(pdf,pdf.name),(xlsx,xlsx.name),(audit/'LEEME.md','LEEME.md'),(audit/'auditoria-datos.json','auditoria-datos.json')]
for file in sorted((audit/'evidence').iterdir()):
    if file.is_file():
        target = 'attempts/runner-failure.png' if file.name=='runner-failure.png' else 'evidence/'+file.name
        files.append((file,target))
for file in sorted(audit.glob('initial-*.json')):
    files.append((file,'attempts/'+file.name))
manifest = [{'path':target,'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()} for file,target in files]
archive = out/'CONTIGO_Auditoria_WCAG_2.1_AA_Evidencias_2026-11-04.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as package:
    for file,target in files:
        package.write(file,target)
    package.writestr('manifest.json',json.dumps(manifest,ensure_ascii=False,indent=2))
with zipfile.ZipFile(archive) as package:
    assert package.testzip() is None
    assert len(package.namelist()) == len(set(package.namelist()))
    assert all(hashlib.sha256(package.read(entry['path'])).hexdigest()==entry['sha256'] for entry in manifest)

qa = {'pdfPages':8,'xlsxSheets':6,'criteria':50,'core':26,'detailRelations':len(data['details']),'catalogEntries':len(data['evidence']),'allCatalogFilesExist':True,'summaryFormulaCachesVerified':True,'xlsxErrors':0,'sourcesUnchanged':len(data['sourceHashes']),'zipEntries':len(manifest)+1,'zipBytes':archive.stat().st_size,'files':[str(pdf),str(xlsx),str(archive)]}
(audit/'qa/final-validation.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(qa,ensure_ascii=False))
