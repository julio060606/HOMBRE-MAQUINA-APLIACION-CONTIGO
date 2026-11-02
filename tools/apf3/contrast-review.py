"""Conservative contrast lower bounds from rendered ink-free bounding boxes."""
from pathlib import Path
import json, re, math, itertools
from PIL import Image,ImageChops,ImageDraw

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'output/apf3/evidence/contrast-review'
report=json.loads((OUT/'raw-measurements.json').read_text(encoding='utf-8'))
report['metadata']['analysisMethodVersion']=2
report['metadata']['method']='Original locator screenshot, temporary foreground-only transparency/visibility probe, exact inline-style restoration and conservative sRGB minimum over text-layout rectangles expanded1pixel. No average ratios. SVG uses a full-page probe with recorded document coordinates.'
def rgba(css):
    match=re.fullmatch(r'rgba?\(([^)]+)\)',css.strip())
    if not match: raise ValueError('Unsupported CSS colour '+css)
    values=[float(x.strip()) for x in match.group(1).split(',')]
    return values[:3],values[3] if len(values)>3 else 1.0
def luminance(rgb):
    channels=[v/255 for v in rgb]
    linear=[v/12.92 if v<=0.04045 else ((v+0.055)/1.055)**2.4 for v in channels]
    return sum(a*b for a,b in zip(linear,[0.2126,0.7152,0.0722]))
def contrast(a,b):
    x,y=sorted([luminance(a),luminance(b)])
    return (y+0.05)/(x+0.05)
for node in report['nodes']:
    try:
        rgb,alpha=rgba(node[node['foregroundProperty']])
        font=float(node['fontSize'].removesuffix('px'))
        weight=int(node['fontWeight']) if node['fontWeight'].isnumeric() else (700 if node['fontWeight']=='bold' else 400)
        threshold=3.0 if font>=24 or (font>=18.6666667 and weight>=700) else 4.5
        original=Image.open(ROOT/node['original']).convert('RGB');restored=Image.open(ROOT/node['restored']).convert('RGB')
        difference=ImageChops.difference(original,restored)
        difference_max=max(max(p) for p in difference.getdata())
        if node.get('backgroundFullPage'):
            full=Image.open(ROOT/node['backgroundFullPage']).convert('RGB')
            x=math.floor(node['pageX']);y=math.floor(node['pageY'])
            image=full.crop((x,y,x+original.width,y+original.height));image.save(ROOT/node['backgroundProbe'])
        else:image=Image.open(ROOT/node['backgroundProbe']).convert('RGB')
        mask=Image.new('L',image.size);draw=ImageDraw.Draw(mask)
        for r in node['textLayoutRectangles']:
            draw.rectangle((max(0,math.floor(r['x'])-1),max(0,math.floor(r['y'])-1),min(image.width-1,math.ceil(r['x']+r['width'])+1),min(image.height-1,math.ceil(r['y']+r['height'])+1)),fill=255)
        pixels={p for p,m in zip(image.getdata(),mask.getdata()) if m}
        minimum=22; maximum=0; minimum_background=None; below=0; colour_count=0
        for pixel in pixels:
            foreground=[alpha*f+(1-alpha)*b for f,b in zip(rgb,pixel)]
            ratio=contrast(foreground,pixel)
            if ratio<minimum:minimum=ratio;minimum_background=pixel
            maximum=max(maximum,ratio);below+=1 if ratio<threshold else 0;colour_count+=1
        conservative=minimum
        if difference_max<=2 and difference_max>0:
            # Account for the observed GPU/compositing rounding difference rather than treating it as exact restoration.
            for pixel in pixels:
                for candidate in itertools.product(*[(max(0,v-difference_max),min(255,v+difference_max)) for v in pixel]):
                    foreground=[alpha*f+(1-alpha)*b for f,b in zip(rgb,candidate)]
                    conservative=min(conservative,contrast(foreground,candidate))
        ancestor_opacity=any(float(x['opacity'])<1 for x in node['ancestors'])
        overlapping=not all(x['withinTarget'] for x in node['pointHits'])
        # elementFromPoint on SVG can hit its SVG parent. That is not an overlay by itself.
        if node['tag']=='tspan':overlapping=any(not x['withinTarget'] and x['tag'] not in ['svg','text','tspan'] for x in node['pointHits'])
        conditions=[]
        if ancestor_opacity: conditions.append('Ancestor opacity below1, simple ink compositing model is insufficient.')
        if not node['inlineStylesRestored'] or difference_max>2:conditions.append('Restoration is not verified within maximum2RGB-level rendering tolerance.')
        if overlapping:conditions.append('At least one bounding-box sample hit another element; inspect clipping/overlap.')
        result='Conservative bounding-box contrast passes' if conservative>=threshold and not conditions else 'Manual review required'
        node['contrast']={'method':'For every unique rendered background pixel in text-layout rectangles expanded1pixel, composite computed CSS foreground RGBA and calculate WCAG sRGB luminance ratio; report minimum, not average. SVG text uses visibility:hidden and a full-page background probe cropped to the recorded document coordinates. If restored pixels differ by at most2RGB levels, conservatively vary background channels by the observed maximum difference.','threshold':threshold,'computedInk':rgb,'inkAlpha':alpha,'minimumRatio':minimum,'conservativeMinimumWithRenderingTolerance':conservative,'maximumRatio':maximum,'minimumBackgroundRGB':minimum_background,'uniqueBackgroundColours':colour_count,'boundingBoxPixels':image.width*image.height,'sampledPixels':sum(1 for m in mask.getdata() if m),'coloursBelowThreshold':below,'restorationMaximumRGBDifference':difference_max,'conditions':conditions,'result':result}
    except Exception as error:node['contrast']={'result':'Not evaluated','reason':str(error)}
summary={'nodesMeasured':len(report['nodes']),'conservativePass':sum(x['contrast']['result']=='Conservative bounding-box contrast passes' for x in report['nodes']),'reviewRequired':sum(x['contrast']['result']!='Conservative bounding-box contrast passes' for x in report['nodes'])}
report['metadata']['interpretation']='Manual review required is inconclusive, not a WCAG failure. Twelve current samples cannot establish a conservative pass: two login restorations exceed the recorded RGB tolerance and ten SVG text-layout rectangles retain foreground/overlap pixels. Do not infer global contrast conformance from the31passing samples.'
report['summary']=summary
(OUT/'results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
rows=['# Revisión técnica de contrastes indeterminados','',report['metadata']['method'],'','Esta revisión no es Stark ni una auditoría completa de WCAG. Los originales y las sondas de fondo se conservan por separado.','', '| Nodo | Texto | Ratio mínimo | Umbral | Resultado |','|---|---|---:|---:|---|']
for node in report['nodes']:
    c=node['contrast'];minimum=c.get('minimumRatio');rows.append('| '+node['id']+' | '+node['text'].replace('|','/')+' | '+(f'{minimum:.3f}' if minimum is not None else 'NR')+' | '+str(c.get('threshold','NR'))+' | '+c['result']+' |')
(OUT/'LEEME.md').write_text('\n'.join(rows)+'\n',encoding='utf-8')
print(json.dumps(summary))
