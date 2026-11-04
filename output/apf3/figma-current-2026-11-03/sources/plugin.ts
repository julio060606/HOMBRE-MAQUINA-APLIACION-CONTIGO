/** CONTIGO APF3 current single-view design. Project-owned code; official Figma types are referenced separately. */
type Mode = 'Estándar' | 'Alto contraste';
type Palette = { surface: string; background: string; text: string; muted: string; action: string; actionHover: string; actionActive: string; onAction: string; danger: string; controlBorder: string; cardBorder: string; focus: string; field: string };
type NativeScreen = { key: string; frame: FrameNode; content: FrameNode; links: Array<{ node: SceneNode & ReactionMixin; target: string }> };
const palettes: Record<Mode, Palette> = {
  'Estándar': { surface: '#FFFFFF', background: '#F8FAF9', text: '#172B3B', muted: '#506472', action: '#136F53', actionHover: '#0F4C3A', actionActive: '#06452F', onAction: '#FFFFFF', danger: '#9F1239', controlBorder: '#74887E', cardBorder: '#DCE6E2', focus: '#0F4C3A', field: '#F8FBF9' },
  'Alto contraste': { surface: '#FFFFFF', background: '#FFFFFF', text: '#111111', muted: '#111111', action: '#06452F', actionHover: '#00351F', actionActive: '#111111', onAction: '#FFFFFF', danger: '#7F0025', controlBorder: '#111111', cardBorder: '#333333', focus: '#003D7A', field: '#FFFFFF' },
};
const keys = ['patient-home', 'patient-recorded', 'patient-not-taken', 'patient-correction-taken', 'patient-correction-not-taken', 'measurement-input', 'measurement-error', 'measurement-review', 'measurement-saved', 'weight-input', 'weight-review', 'sos-review', 'sos-result', 'caregiver-summary', 'caregiver-treatment', 'caregiver-appointments', 'reading-options'];
const font: FontName = { family: 'Inter', style: 'Regular' };
const bold: FontName = { family: 'Inter', style: 'Bold' };
const masters: Record<string, ComponentNode> = {};
const styles: Record<string, PaintStyle> = {};
const pending: Array<Promise<void>> = [];
const pages: PageNode[] = [];
const nativeScreens: NativeScreen[] = [];

function rgb(value: string): RGB { return { r: parseInt(value.slice(1, 3), 16) / 255, g: parseInt(value.slice(3, 5), 16) / 255, b: parseInt(value.slice(5, 7), 16) / 255 }; }
function fill(value: string): SolidPaint { return { type: 'SOLID', color: rgb(value) }; }
function color(node: SceneNode & GeometryMixin, mode: Mode, token: keyof Palette): void {
  node.fills = [fill(palettes[mode][token])];
  if (styles[`${mode}/${token}`]) pending.push(node.setFillStyleIdAsync(styles[`${mode}/${token}`].id));
}
function column(parent: PageNode | FrameNode | ComponentNode, name: string, width: number, mode: Mode = 'Estándar', padding = 20, gap = 12): FrameNode {
  const node = figma.createFrame(); parent.appendChild(node); node.name = name; node.layoutMode = 'VERTICAL'; node.primaryAxisSizingMode = 'AUTO'; node.counterAxisSizingMode = 'FIXED'; node.resize(width, 100);
  node.paddingTop = padding; node.paddingBottom = padding; node.paddingLeft = padding; node.paddingRight = padding; node.itemSpacing = gap; node.clipsContent = false; color(node, mode, 'surface');
  if (parent.type !== 'PAGE') node.layoutAlign = 'STRETCH'; return node;
}
function text(parent: FrameNode | ComponentNode, value: string, size = 16, strong = false, mode: Mode = 'Estándar', token: keyof Palette = 'text'): TextNode {
  const node = figma.createText(); parent.appendChild(node); node.fontName = strong ? bold : font; node.fontSize = size; node.lineHeight = { unit: 'PERCENT', value: 150 }; node.characters = value;
  node.resize(Math.max(60, parent.width - parent.paddingLeft - parent.paddingRight), size * 1.5); node.textAutoResize = 'HEIGHT'; node.layoutAlign = 'STRETCH'; node.name = value.slice(0, 80); color(node, mode, token); return node;
}
function note(node: BaseNode, value: Record<string, unknown>): void { node.setPluginData('contigoAccessibility', JSON.stringify(value)); }
function card(parent: FrameNode, title: string, body: string, mode: Mode, scale: number): FrameNode {
  const node = column(parent, title, parent.width - parent.paddingLeft - parent.paddingRight, mode, 16, 10);
  node.cornerRadius = 16; node.strokes = [fill(palettes[mode].cardBorder)]; node.strokeWeight = 1;
  text(node, title, 18 * scale, true, mode); if (body) text(node, body, 16 * scale, false, mode, 'muted'); return node;
}
function button(parent: FrameNode, label: string, target: string | undefined, screen: NativeScreen | undefined, mode: Mode, scale = 1, state = 'Normal'): InstanceNode {
  const node = masters[`${mode}/${state}`].createInstance(); parent.appendChild(node); node.layoutAlign = 'STRETCH'; node.name = `Botón / ${label}`;
  node.resize(parent.width - parent.paddingLeft - parent.paddingRight, 64);
  node.primaryAxisSizingMode = 'AUTO';
  const labelNode = node.findOne(child => child.type === 'TEXT') as TextNode; labelNode.characters = label; labelNode.fontSize = 16 * scale;
  note(node, { role: 'button', accessibleName: label, keyboard: 'Tab, Enter o Espacio', targetSize: '64 px diseño; 44 px es buena práctica AAA, no requisito AA de WCAG 2.1.' });
  if (target && screen) screen.links.push({ node, target }); return node;
}
function field(parent: FrameNode, label: string, value: string, unit: string, mode: Mode, scale: number, error = ''): FrameNode {
  const node = column(parent, `Campo / ${label}`, parent.width - parent.paddingLeft - parent.paddingRight, mode, 12, 8); node.cornerRadius = 14;
  node.strokes = [fill(error ? palettes[mode].danger : palettes[mode].controlBorder)]; node.strokeWeight = error ? 2 : 1; color(node, mode, 'field');
  text(node, label, 14 * scale, true, mode); const valueNode = text(node, value || '—', 32 * scale, true, mode); valueNode.textAlignHorizontal = 'CENTER';
  const unitNode = text(node, unit, 12 * scale, false, mode, 'muted'); unitNode.textAlignHorizontal = 'CENTER';
  if (error) text(node, error, 14 * scale, false, mode, 'danger');
  note(node, { role: 'textbox', label, inputMode: unit === 'kg' ? 'decimal' : 'numeric', value, description: unit, invalid: !!error, caveat: 'Especificación de diseño. El campo web actual es input de texto; en Presentar se recorren casos fijos.' }); return node;
}
async function page(name: string): Promise<PageNode> { const node = figma.createPage(); node.name = name; pages.push(node); await figma.setCurrentPageAsync(node); return node; }
function board(parent: PageNode, title: string, lines: string[], x = 0, y = 0, width = 1100): FrameNode {
  const node = column(parent, title, width, 'Estándar', 32, 16); node.x = x; node.y = y; text(node, title, 30, true); for (const line of lines) text(node, line, 18); return node;
}
function createScreen(parent: PageNode, key: string, title: string, mode: Mode, scale: number, offset: number, index: number): NativeScreen {
  const frame = column(parent, `${key} · ${mode} · ${scale * 100}% · ${title}`, 390, mode, 16, 12); frame.x = offset + (index % 4) * 470; frame.y = Math.floor(index / 4) * 1150;
  frame.resize(390, 960); frame.primaryAxisSizingMode = 'FIXED'; frame.clipsContent = true; frame.cornerRadius = 18; frame.strokes = [fill(palettes[mode].cardBorder)]; color(frame, mode, 'background');
  const screen: NativeScreen = { key, frame, content: frame, links: [] };
  button(frame, 'Opciones de lectura', 'reading-options', screen, mode, scale);
  const body = column(frame, 'Contenido desplazable de la vista actual', 358, mode, 0, 16); body.layoutGrow = 1; body.primaryAxisSizingMode = 'FIXED'; body.clipsContent = true; body.overflowDirection = 'VERTICAL';
  const content = column(body, 'Contenido / orden de lectura', 358, mode, 4, 16); screen.content = content;
  text(content, title, 24 * scale, true, mode);
  note(frame, { id: key, mode, textScale: `${scale * 100}% diseño`, source: 'Interfaz actual del repositorio al 3 noviembre 2026', role: 'region', retiredNavigation: false, caveat: 'Diseño nativo editable. No es captura ni validación Stark o experiencia de participante.' });
  nativeScreens.push(screen); return screen;
}
function medication(screen: NativeScreen, state: string, mode: Mode, scale: number): void {
  const node = card(screen.content, 'Losartán', 'Dosis recetada: 50 mg · 08:00. Indicación de la clínica ficticia.', mode, scale);
  text(node, 'Diseño: representación validada de la fotografía pendiente. La evidencia raster conserva lo mostrado por la web.', 14 * scale, false, mode, 'muted');
  if (state.startsWith('patient-correction')) {
    const previousTaken = state.endsWith('-taken') && !state.endsWith('not-taken');
    text(node, `Respuesta anterior: ${previousTaken ? 'tomada' : 'no tomada'}.`, 16 * scale, true, mode);
    field(node, 'Motivo de la corrección (obligatorio)', 'Me equivoqué al tocar.', 'Ejemplo ficticio escrito para el diseño', mode, scale);
    text(node, 'Escribe por qué cambias tu respuesta. Después elige la respuesta correcta. Puedes cancelar para conservar el registro anterior.', 14 * scale, false, mode);
    button(node, 'Ya la tomé', 'patient-recorded', screen, mode, scale); button(node, 'No la tomé', 'patient-not-taken', screen, mode, scale);
    button(node, 'Cancelar corrección', previousTaken ? 'patient-recorded' : 'patient-not-taken', screen, mode, scale);
  } else if (state === 'patient-recorded' || state === 'patient-not-taken') {
    text(node, state === 'patient-recorded' ? 'Toma confirmada' : 'Marcada como no tomada', 16 * scale, true, mode);
    button(node, 'Corregir', state === 'patient-recorded' ? 'patient-correction-taken' : 'patient-correction-not-taken', screen, mode, scale);
  } else { button(node, 'Ya la tomé', 'patient-recorded', screen, mode, scale); button(node, 'No la tomé', 'patient-not-taken', screen, mode, scale); }
}
function measurement(screen: NativeScreen, state: string, mode: Mode, scale: number): void {
  const node = card(screen.content, 'Registrar medición', 'Una lectura de tu equipo, paso a paso.', mode, scale);
  if (state === 'measurement-saved') {
    text(node, 'Medición guardada. Tu cuidador ya puede consultarla.', 18 * scale, true, mode); button(node, 'Registrar otra medición', 'patient-home', screen, mode, scale); note(node, { role: 'status', focus: 'Mensaje al guardar', caveat: 'Estado ficticio de diseño, no se escribe en ninguna base de datos.' }); return;
  }
  const review = state === 'measurement-review' || state === 'weight-review';
  const weight = state.startsWith('weight-');
  text(node, review ? '1 Ingresa los valores · 2 Revisa y guarda (actual)' : '1 Ingresa los valores (actual) · 2 Revisa y guarda', 12 * scale, true, mode, 'muted');
  if (review) {
    text(node, '¿Los valores son correctos?', 18 * scale, true, mode); text(node, 'Compáralos con la pantalla de tu equipo.', 14 * scale, false, mode, 'muted');
    card(node, weight ? 'Peso' : 'Presión arterial', weight ? '72,5 kg' : '120 / 80 mmHg · Pulso: no registrado', mode, scale);
    button(node, 'Guardar medición', 'measurement-saved', screen, mode, scale); button(node, 'Corregir números', weight ? 'weight-input' : 'measurement-input', screen, mode, scale);
    note(node, { role: 'region', focus: '¿Los valores son correctos?', previousValuesPreserved: true, caveat: 'Caso fijo de diseño. En web Revisar aún no guarda.' }); return;
  }
  button(node, 'Presión', 'measurement-input', screen, mode, scale); button(node, 'Peso', 'weight-input', screen, mode, scale);
  text(node, weight ? 'Copia el peso que muestra tu balanza.' : 'Copia los dos números de tu tensiómetro.', 14 * scale, false, mode, 'muted');
  if (weight) { field(node, 'Peso en kg', '72,5', 'kg', mode, scale); text(node, 'Puedes usar coma o punto decimal.', 14 * scale, false, mode, 'muted'); }
  else {
    const invalid = state === 'measurement-error'; const filled = invalid || state === 'measurement-input';
    if (invalid) text(node, 'Revisa los números marcados para continuar.', 16 * scale, true, mode, 'danger');
    field(node, 'Número de arriba · SYS', invalid ? '80' : filled ? '120' : '', 'mmHg', mode, scale);
    const lower = field(node, 'Número de abajo · DIA', invalid ? '120' : filled ? '80' : '', 'mmHg', mode, scale, invalid ? 'El número de abajo debe ser menor que el de arriba. Revisa ambos.' : '');
    if (invalid) { screen.links.push({ node: lower, target: 'measurement-input' }); note(lower, { designAction: 'Tocar este campo recorre el caso corregido 120/80; no es entrada libre ni prueba humana.' }); }
    const optional = card(node, 'Añadir pulso · Opcional', 'En la web se despliega el campo. Este caso lo deja vacío y comunica Pulso: no registrado.', mode, scale); note(optional, { role: 'disclosure', defaultExpanded: false, caveat: 'Anotación, comprobar con teclado en web.' });
  }
  button(node, 'Revisar medición', weight ? 'weight-review' : state === 'measurement-input' ? 'measurement-review' : 'measurement-error', screen, mode, scale);
  text(node, 'Primero revisas los valores. Después decides guardarlos.', 12 * scale, false, mode, 'muted');
}
function patient(screen: NativeScreen, state: string, mode: Mode, scale: number): void {
  button(screen.content, 'SOS de prueba', 'sos-review', screen, mode, scale, 'Error');
  button(screen.content, 'Escuchar', undefined, undefined, mode, scale);
  if (state === 'patient-recorded' || state === 'patient-not-taken') card(screen.content, 'Respuesta registrada', `Losartán, 08:00: registraste que ${state === 'patient-recorded' ? 'la tomaste' : 'no la tomaste'}. Puedes corregirla en Tomas registradas hoy.`, mode, scale);
  text(screen.content, 'Mis medicamentos', 20 * scale, true, mode); medication(screen, state, mode, scale);
  button(screen.content, 'Tomas registradas hoy', 'patient-recorded', screen, mode, scale);
  text(screen.content, 'Mis mediciones', 20 * scale, true, mode); measurement(screen, state, mode, scale);
  text(screen.content, 'Mis próximas citas', 20 * scale, true, mode);
  card(screen.content, 'Geriatría · Programada', 'Caso sintético fijo: 5 nov. 2026, 10:30 · hora de Lima. Profesional de demostración. Origen: clínica ficticia.', mode, scale);
  text(screen.content, 'Vista única actual: medicamentos, medición y citas en el mismo contenido. No hay barra inferior de pestañas.', 12 * scale, false, mode, 'muted');
}
async function buildSet(parent: PageNode, mode: Mode, scale: number, offset: number, allowStandard: boolean): Promise<Record<string, NativeScreen>> {
  const list: Record<string, NativeScreen> = {};
  const titles: Record<string, string> = { 'patient-home': 'Hola, Dacio', 'patient-recorded': 'Hola, Dacio', 'patient-not-taken': 'Hola, Dacio', 'patient-correction-taken': 'Hola, Dacio', 'patient-correction-not-taken': 'Hola, Dacio', 'measurement-input': 'Hola, Dacio', 'measurement-error': 'Hola, Dacio', 'measurement-review': 'Hola, Dacio', 'measurement-saved': 'Hola, Dacio', 'weight-input': 'Hola, Dacio', 'weight-review': 'Hola, Dacio', 'sos-review': 'SOS de demostración', 'sos-result': 'SOS de demostración', 'caregiver-summary': 'Seguimiento de Dacio Ramos', 'caregiver-treatment': 'Tratamiento y existencias', 'caregiver-appointments': 'Citas médicas', 'reading-options': 'Opciones de lectura' };
  keys.forEach((key, index) => { list[key] = createScreen(parent, key, titles[key], mode, scale, offset, index); });
  for (const key of keys) {
    const s = list[key];
    if (key.startsWith('patient-') || key.startsWith('measurement-') || key.startsWith('weight-')) patient(s, key, mode, scale);
    else if (key === 'sos-review') {
      text(s.content, 'Esta prueba registra una petición en Contigo. No llama a emergencias, no envía ubicación ni confirma que otra persona recibió el aviso.', 16 * scale, false, mode);
      text(s.content, 'Puedes cancelar antes de registrar. Una petición ya registrada permanece en el historial.', 16 * scale, false, mode);
      button(s.content, 'Cancelar y volver', 'patient-home', s, mode, scale); button(s.content, 'Registrar petición de prueba', 'sos-result', s, mode, scale, 'Error');
      note(s.frame, { role: 'dialog', initialFocus: 'Cancelar y volver', nativeWeb: 'dialog.showModal(); Escape cancela si no hay envío y devuelve foco al activador', prototypeApproximation: 'El diseño representa el estado modal como un frame conectado; no acredita contención de foco.' });
    } else if (key === 'sos-result') { text(s.content, 'Petición de prueba registrada. No se contactó a servicios de emergencia.', 18 * scale, true, mode); button(s.content, 'Entendido, volver', 'patient-home', s, mode, scale); }
    else if (key === 'caregiver-summary') {
      text(s.content, 'Caso sintético fijo de diseño al 3 de noviembre de 2026. No es lectura viva de la API.', 14 * scale, false, mode, 'muted');
      card(s.content, 'Tratamiento y existencias', 'Losartán 50 mg y Vitamina D3 2000 UI. Las tomas son declaraciones, no ingestión verificada.', mode, scale);
      button(s.content, 'Tratamiento y existencias', 'caregiver-treatment', s, mode, scale); button(s.content, 'Citas médicas', 'caregiver-appointments', s, mode, scale);
    } else if (key === 'caregiver-treatment') {
      card(s.content, 'Losartán · 50 mg', '08:00 / 20:00 · Cantidad disponible: 30 tabletas. Origen sintético de clínica y dispensación.', mode, scale);
      card(s.content, 'Vitamina D3 · 2000 UI', '14:00 · Cantidad disponible: 3 tabletas. Origen sintético de clínica y dispensación.', mode, scale);
      text(s.content, 'Caso fijo de diseño anterior a registrar tomas. Las existencias reales actuales solo se afirman en las capturas de la API con su fecha.', 14 * scale, false, mode, 'muted');
      button(s.content, 'Citas médicas', 'caregiver-appointments', s, mode, scale); button(s.content, 'Resumen del cuidador', 'caregiver-summary', s, mode, scale);
    } else if (key === 'caregiver-appointments') {
      card(s.content, 'Geriatría · Programada', '5 nov. 2026, 10:30 · hora de Lima. Profesional de demostración. Consultorio de prueba. Origen: clínica ficticia del proyecto.', mode, scale);
      text(s.content, 'Fecha fija del caso de diseño al 3 noviembre 2026. No es una cita real, un dato vivo ni resultado de participante.', 14 * scale, false, mode, 'muted');
      button(s.content, 'Tratamiento y existencias', 'caregiver-treatment', s, mode, scale); button(s.content, 'Resumen del cuidador', 'caregiver-summary', s, mode, scale);
    } else {
      text(s.content, 'Controles equivalentes a las opciones de lectura de la web actual. La navegación cambia al conjunto de frames de esta misma página.', 16 * scale, false, mode);
      button(s.content, 'Alto contraste', '@contrast', s, mode, scale); button(s.content, 'Texto al 200 %', '@large', s, mode, scale);
      if (allowStandard) button(s.content, 'Texto al 100 % y modo estándar', '@standard', s, mode, scale);
      text(s.content, 'Una variante de diseño al 200 % no prueba zoom nativo, NVDA ni Stark. En la web hay tamaños 100, 125, 150 y 200 %.', 14 * scale, false, mode, 'muted');
    }
  }
  for (const s of Object.values(list)) for (const link of s.links) if (!link.target.startsWith('@')) pending.push(link.node.setReactionsAsync([{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', navigation: 'NAVIGATE', destinationId: list[link.target].frame.id, transition: null }] }]));
  return list;
}
async function kit(parent: PageNode): Promise<void> {
  const intro = board(parent, 'Kit accesible actual', ['Tokens extraídos del diseño actual y CSS de medición. Bordes de controles #74887E; no son ratios producidos por Stark.', 'Componentes editables con estados Normal, Hover, Foco, Activo, Deshabilitado y Error. Tipografía Inter, altura de línea 150 % y variante de diseño 200 %.']);
  for (const mode of ['Estándar', 'Alto contraste'] as Mode[]) for (const [token, value] of Object.entries(palettes[mode])) {
    const style = figma.createPaintStyle(); style.name = `CONTIGO actual/${mode}/${token}`; style.paints = [fill(value)]; style.description = 'Token de diseño. Verificar el par efectivo con Stark y la aplicación.'; styles[`${mode}/${token}`] = style;
    text(intro, `${mode} / ${token}: ${value}`, 14);
  }
  for (const size of [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 64]) { const style = figma.createTextStyle(); style.name = `CONTIGO actual/Texto/${size}`; style.fontName = font; style.fontSize = size; style.lineHeight = { unit: 'PERCENT', value: 150 }; }
  const buttons: ComponentNode[] = [], fields: ComponentNode[] = [];
  for (const mode of ['Estándar', 'Alto contraste'] as Mode[]) for (const [index, state] of ['Normal', 'Hover', 'Foco', 'Activo', 'Deshabilitado', 'Error'].entries()) {
    const palette = palettes[mode]; const component = figma.createComponent(); parent.appendChild(component); component.name = `Modo=${mode}, Estado=${state}`; component.layoutMode = 'VERTICAL'; component.primaryAxisSizingMode = 'AUTO'; component.counterAxisSizingMode = 'FIXED'; component.resize(350, 64); component.paddingLeft = 16; component.paddingRight = 16; component.paddingTop = 20; component.paddingBottom = 20; component.cornerRadius = 14;
    color(component, mode, state === 'Error' ? 'danger' : state === 'Deshabilitado' ? 'surface' : state === 'Hover' ? 'actionHover' : state === 'Activo' ? 'actionActive' : 'action'); component.strokes = [fill(state === 'Foco' ? palette.focus : palette.controlBorder)]; component.strokeWeight = state === 'Foco' ? 4 : 1;
    const label = text(component, state === 'Deshabilitado' ? 'Guardando…' : 'Continuar', 16, true, mode, state === 'Deshabilitado' ? 'muted' : 'onAction'); label.textAlignHorizontal = 'CENTER';
    component.x = (index % 3) * 390; component.y = Math.floor(index / 3) * 160 + (mode === 'Alto contraste' ? 420 : 0); masters[`${mode}/${state}`] = component; buttons.push(component);
    const inputComponent = figma.createComponent(); parent.appendChild(inputComponent); inputComponent.name = `Modo=${mode}, Estado=${state}`; inputComponent.layoutMode = 'VERTICAL'; inputComponent.primaryAxisSizingMode = 'AUTO'; inputComponent.counterAxisSizingMode = 'FIXED'; inputComponent.resize(350, 140); inputComponent.paddingTop = 12; inputComponent.paddingBottom = 12; inputComponent.paddingLeft = 12; inputComponent.paddingRight = 12; inputComponent.itemSpacing = 8; inputComponent.cornerRadius = 14; color(inputComponent, mode, 'field'); inputComponent.strokes = [fill(state === 'Error' ? palette.danger : state === 'Foco' ? palette.focus : palette.controlBorder)]; inputComponent.strokeWeight = state === 'Foco' || state === 'Error' ? 3 : 1;
    text(inputComponent, 'Número de arriba · SYS', 14, true, mode); text(inputComponent, '120', 32, true, mode); text(inputComponent, 'mmHg', 12, false, mode, 'muted'); if (state === 'Error') text(inputComponent, 'Revisa este número en tu equipo y escríbelo de nuevo.', 14, false, mode, 'danger'); fields.push(inputComponent);
  }
  const buttonSet = figma.combineAsVariants(buttons, parent); buttonSet.name = 'CONTIGO actual/Botón'; buttonSet.x = 1240; buttonSet.y = 0;
  const fieldSet = figma.combineAsVariants(fields, parent); fieldSet.name = 'CONTIGO actual/Campo texto numérico'; fieldSet.x = 1240; fieldSet.y = 1000;
}
function gallery(parent: PageNode, group: 'before' | 'current', y: number): void {
  const assets = CAPTURE_ASSETS.filter(asset => asset.group === group); let rowY = y, rowHeight = 0;
  assets.forEach((asset, index) => {
    if (index && index % 3 === 0) { rowY += rowHeight + 70; rowHeight = 0; }
    const wrapper = column(parent, `CAPTURA REAL / ${asset.id}`, 1280, 'Estándar', 20, 12); wrapper.x = (index % 3) * 1360; wrapper.y = rowY;
    text(wrapper, asset.name, 24, true); text(wrapper, `${asset.file}\nURL observada: ${asset.url}\nSHA256: ${asset.sha256}`, 14);
    const image = figma.createImage(figma.base64Decode(asset.base64)); const rectangle = figma.createRectangle(); wrapper.appendChild(rectangle); rectangle.name = `Evidencia raster / ${asset.id}`; rectangle.resize(1240, 1240 * asset.height / asset.width); rectangle.fills = [{ type: 'IMAGE', imageHash: image.hash, scaleMode: 'FIT' }];
    note(rectangle, { source: asset.file, hash: asset.sha256, observedUrl: asset.url, evidence: 'Captura real, sin sustituir contenido por una reconstrucción nativa.' }); rowHeight = Math.max(rowHeight, 1240 * asset.height / asset.width + 250);
  });
}
async function connectModes(sets: Array<Record<string, NativeScreen>>, standard: Record<string, NativeScreen> | null, high: Record<string, NativeScreen>, large: Record<string, NativeScreen>): Promise<void> {
  const targets: Record<string, NativeScreen> = { '@contrast': high['patient-home'], '@large': large['patient-home'] }; if (standard) targets['@standard'] = standard['patient-home'];
  for (const set of sets) for (const link of set['reading-options'].links) if (targets[link.target]) pending.push(link.node.setReactionsAsync([{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', navigation: 'NAVIGATE', destinationId: targets[link.target].frame.id, transition: null }] }]));
}
async function main(): Promise<void> {
  await figma.loadFontAsync(font); await figma.loadFontAsync(bold);
  const overview = await page('00 Leyenda y resumen'), before = await page('01 Antes (v2.0)'), after = await page('02 Después (v3.0 objetivo AA)'), kitPage = await page('03 Kit accesible'), notes = await page('04 Anotaciones de accesibilidad'), variants = await page('05 Variante alto contraste y texto ampliado');
  await figma.setCurrentPageAsync(kitPage); await kit(kitPage);
  await figma.setCurrentPageAsync(before); board(before, 'Referencia anterior v2.0', ['Capturas reales históricas preservadas. Las etiquetas anteriores y las pestañas retiradas solo aparecen aquí como evidencia de la línea base.']); gallery(before, 'before', 300);
  await figma.setCurrentPageAsync(after);
  const normal = await buildSet(after, 'Estándar', 1, 0, true), high = await buildSet(after, 'Alto contraste', 1, 2100, true), large = await buildSet(after, 'Estándar', 2, 4200, true);
  await connectModes([normal, high, large], normal, high, large);
  after.flowStartingPoints = [{ nodeId: normal['patient-home'].frame.id, name: 'T1 Respuesta y corrección en vista única' }, { nodeId: normal['sos-review'].frame.id, name: 'T2 Alcance y cancelación SOS' }, { nodeId: normal['caregiver-summary'].frame.id, name: 'T3 Tratamiento, unidades y próxima cita' }, { nodeId: normal['measurement-error'].frame.id, name: 'T4 Error, revisión, corregir y éxito' }];
  board(after, 'CAPTURAS REALES ACTUALES de la API', [`Origen y modo: ${PACKAGE_METADATA.currentMode}. Fecha de captura: ${PACKAGE_METADATA.captureTimestamp}. Las imágenes siguientes son evidencia raster; los frames anteriores son diseños editables.`, 'Las fechas y existencias de las reconstrucciones nativas son un caso fijo. Para datos vivos, la referencia es cada captura con su fecha.'], 0, 6000); gallery(after, 'current', 6500);
  await figma.setCurrentPageAsync(variants); const highV = await buildSet(variants, 'Alto contraste', 1, 0, false), largeV = await buildSet(variants, 'Estándar', 2, 2100, false); await connectModes([highV, largeV], null, highV, largeV);
  variants.flowStartingPoints = [{ nodeId: highV['patient-home'].frame.id, name: 'Alto contraste' }, { nodeId: largeV['patient-home'].frame.id, name: 'Texto al 200 % diseño' }];
  await figma.setCurrentPageAsync(notes);
  board(notes, 'Anotaciones de la interfaz actual', [
    'Paciente: una sola vista con Mis medicamentos, Tomas registradas hoy, Mis mediciones y Mis próximas citas. No recrear la barra inferior de pestañas retirada.',
    'Medición: h3 Registrar medición; selector por botones Presión/Peso con aria-pressed. Labels visibles Número de arriba, Número de abajo, Peso en kg; inputs text con inputMode numérico/decimal. SYS/DIA son apoyo visual, no reemplazan las etiquetas.',
    'Pulso: details cerrado inicialmente, summary Añadir pulso / Opcional. Si el pulso es inválido, abrir el detalle y enfocar el campo; vacío se conserva como No registrado.',
    'Error actual: texto por campo con aria-invalid y aria-describedby; aviso general Revisa los números marcados para continuar; foco de validación al primer campo. El diseño no promete un resumen de errores que ya no existe.',
    'Enter desde Número de arriba lleva a Número de abajo. El primer botón solo revisa. La revisión enfoca ¿Los valores son correctos?; Corregir números conserva datos; Guardar medición registra; éxito role=status.',
    'SOS: dialog nativo titulado, alcance explícito, Cancelar y volver con foco inicial, Escape cancela mientras no se guarda y retorna al activador. Confirmación acredita registro, sin entrega a emergencias.',
    'Tomas: nombre accesible conserva Ya la tomé / No la tomé y agrega medicamento y hora. Corregir enfoca el motivo; Cancelar conserva el estado anterior y vuelve al control.',
    'Cuidador: T3 consulta nombre, dosis, horario, existencias y cita próxima en hora de Lima. No modificar recetas ni registrar reposiciones durante esta lectura.',
    'Color: borde de control estándar #74887E sobre #F8FBF9 / #FFFFFF. El kit especifica colores; Stark y los pares efectivos se comprueban en Figma por separado.',
    'Pendientes: ejecución real del plugin y revisión visual, Stark, publicación y permiso de lectura en incógnito. NVDA actual T3 no se completó porque el proveedor de control nativo bloqueó la verificación de URL. No usar DOM como voz.'
  ]);
  await figma.setCurrentPageAsync(overview); const summary = board(overview, 'CONTIGO APF3 actual al 3 noviembre 2026', [
    'Paquete local preparatorio. Hasta ejecutar el plugin no existe un archivo Figma creado por este paquete. Objetivo WCAG 2.1 AA, sin declaración de conformidad total.',
    'Los frames NATIVOS son reconstrucciones editables del diseño actual. Las secciones CAPTURAS REALES preservan las imágenes técnicas, rutas, URLs y hashes. No son testimonios ni sesiones con participantes.',
    'Interfaz paciente vigente: vista única de medicamentos, medición en dos pasos y próximas citas. Las antiguas pestañas solo se conservan en la página 01 de evidencia histórica.',
    'Caso fijo de diseño al 3 noviembre 2026: Losartán 50 mg a las 08:00/20:00, 30 tabletas; Vitamina D3 2000 UI a las 14:00, 3 tabletas; cita Geriatría 5 noviembre 2026 a las 10:30, Lima. No son datos vivos.',
    'T4 diseño: desde error 80/120, toca el campo Número de abajo para recorrer el caso corregido 120/80; luego Revisar medición, Corregir números o Guardar. Presentar no permite entrada libre; la web sí valida escritura.',
    'T1 conserva estados tomada/no tomada, dos correcciones con motivo ficticio y cancelaciones hacia la respuesta anterior. T2 representa el alcance del SOS sin contacto real. T3 consulta un caso sintético fijo.',
    'No se producen ratios Stark, resultados SUS/SEQ, tiempos humanos, consentimientos ni participantes. La evidencia técnica de la API y la demo aislada tienen orígenes distintos y se identifican por separado.',
    'Antes de entregar: ejecutar en Figma, revisar diseño y conexiones, guardar mediciones Stark, publicar solo lectura, probar incógnito y registrar el enlace real. El paquete no concede permisos ni publica.'
  ]);
  await Promise.all(pending); note(figma.root, { status: 'Generador ejecutado: revisión visual y publicación pendientes', pages: pages.map(p => p.name), screens: nativeScreens.length, expectedScopeIds: keys, generatedFrom: PACKAGE_METADATA.generatedAt });
  overview.selection = [summary]; figma.viewport.scrollAndZoomIntoView([summary]); figma.closePlugin(`Preparadas ${pages.length} páginas y ${nativeScreens.length} pantallas nativas. Revisar Figma y ejecutar Stark; no se afirma validación.`);
}
main().catch(error => { figma.notify(`Generación incompleta: ${error instanceof Error ? error.message : String(error)}. Las páginas parciales se conservan.`, { error: true }); figma.closePlugin('Generación incompleta; revisar consola y LEEME.'); });
