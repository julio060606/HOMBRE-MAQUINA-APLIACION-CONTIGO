import fs from 'node:fs/promises';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..'),out=path.join(root,'output/apf3/evidence');
const lum=hex=>{const channels=hex.replace('#','').match(/.{2}/g).map(n=>parseInt(n,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722};
const ratio=(a,b)=>{const l=[lum(a),lum(b)].sort((x,y)=>y-x);return Number(((l[0]+.05)/(l[1]+.05)).toFixed(4))};
const pairs=[
 ['baseline','texto secundario de inicio','#94a3b8','#ffffff','DOM + axe color-contrast2.56:1; texto pequeño'],
 ['baseline','4G decorativo visible','#059669','#f8faf9','DOM + axe color-contrast3.59:1'],
 ['after','texto secundario oscurecido','#475569','#ffffff','CSS actual; revisar superficies concretas'],
 ['after','4G decorativo oscurecido','#065f46','#f8faf9','CSS actual en PhoneDeviceFrame'],
 ['baseline','límite de campo','#cbd5e1','#ffffff','Computed CSS en supplemental.json'],
 ['after','límite de campo','#64748b','#ffffff','Computed CSS en supplemental.json'],
 ['baseline','foco primario existente','#136f53','#ffffff','Computed CSS tras Tab y render; captura34 confirma foco visible'],
 ['after','foco primario uniformado','#0f4c3a','#ffffff','Computed CSS tras Tab y render; anillo blanco separador'],
 ['after','alto contraste texto','#111111','#ffffff','Tokens explícitos del modo; captura22'],
 ['after','alto contraste acción','#ffffff','#06452f','Tokens explícitos del modo; captura22']
].map(([phase,element,foreground,background,source])=>({phase,element,foreground,background,ratio:ratio(foreground,background),source}));
await fs.writeFile(path.join(out,'contrast-calculations.json'),JSON.stringify({timestamp:new Date().toISOString(),method:'WCAG sRGB relative luminance, linearized channels, (Llighter+.05)/(Ldarker+.05). Values support DOM/axe evidence; this is not Stark output.',limitations:'These pairs do not prove all colors, backgrounds, states or WCAG criteria.',pairs},null,2));console.log(JSON.stringify(pairs));
