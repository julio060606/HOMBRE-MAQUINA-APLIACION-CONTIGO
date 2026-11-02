/** Native Figma document generator. Never reports unperformed audits or participant data. */
type Palette = { surface: string; background: string; text: string; muted: string; action: string; danger: string; border: string; focus: string; soft: string };
type Mode = 'Estándar' | 'Alto contraste';
type Screen = { frame: FrameNode; content: FrameNode; links: Array<{ node: SceneNode & ReactionMixin; target: string }>; key: string };
const palettes: Record<Mode, Palette> = {
  'Estándar': { surface: '#FFFFFF', background: '#F8FAF9', text: '#172B3B', muted: '#475569', action: '#0F4C3A', danger: '#9F1239', border: '#64748B', focus: '#003D7A', soft: '#E8F5E9' },
  'Alto contraste': { surface: '#FFFFFF', background: '#FFFFFF', text: '#111111', muted: '#111111', action: '#06452F', danger: '#7F0025', border: '#111111', focus: '#003D7A', soft: '#FFFFFF' },
};
const fontRegular: FontName = { family: 'Inter', style: 'Regular' };
const fontBold: FontName = { family: 'Inter', style: 'Bold' };
const paintStyles: Record<string, PaintStyle> = {};
const textStyles: Record<number, TextStyle> = {};
const buttonMasters: Record<string, ComponentNode> = {};
const createdPages: PageNode[] = [];
const allScreens: Screen[] = [];
const baselineCommit = '4656d72365080d18b267f69d565e4d77a7ae3d56';
const pendingReactions: Array<Promise<void>> = [];

function rgb(hex: string): RGB {
  const raw = hex.replace('#', '');
  return { r: parseInt(raw.slice(0, 2), 16) / 255, g: parseInt(raw.slice(2, 4), 16) / 255, b: parseInt(raw.slice(4, 6), 16) / 255 };
}
function fill(hex: string): SolidPaint { return { type: 'SOLID', color: rgb(hex) }; }
function column(name: string, width: number, palette: Palette, padding = 20, gap = 12): FrameNode {
  const node = figma.createFrame();
  node.name = name; node.layoutMode = 'VERTICAL'; node.primaryAxisSizingMode = 'AUTO'; node.counterAxisSizingMode = 'FIXED';
  node.resize(width, 100); node.paddingTop = padding; node.paddingBottom = padding; node.paddingLeft = padding; node.paddingRight = padding;
  node.itemSpacing = gap; node.fills = [fill(palette.surface)]; node.clipsContent = false;
  return node;
}
function stretch(node: SceneNode & LayoutMixin): void { node.layoutAlign = 'STRETCH'; }
function text(parent: FrameNode | ComponentNode, value: string, size = 16, bold = false, color = palettes.Estándar.text): TextNode {
  const node = figma.createText(); node.name = value.slice(0, 72); node.fontName = bold ? fontBold : fontRegular;
  node.fontSize = size; node.lineHeight = { unit: 'PERCENT', value: 150 }; node.characters = value;
  node.fills = [fill(color)]; node.textAutoResize = 'HEIGHT';
  node.resize(Math.max(80, parent.width - parent.paddingLeft - parent.paddingRight), Math.max(24, size * 1.5));
  parent.appendChild(node); stretch(node); return node;
}
function action(parent: FrameNode, label: string, target: string | undefined, screen?: Screen, mode: Mode = 'Estándar', state = 'Normal', big = false): InstanceNode {
  const master = buttonMasters[`${mode}:${state}`] || buttonMasters[`${mode}:Normal`];
  const node = master.createInstance(); parent.appendChild(node); stretch(node);
  const labelNode = node.findOne(child => child.type === 'TEXT') as TextNode;
  labelNode.characters = label; labelNode.name = `Etiqueta visible y nombre accesible: ${label}`;
  if (big) { labelNode.fontSize = 24; node.paddingTop = 18; node.paddingBottom = 18; }
  node.name = `Botón / ${label}`;
  node.setPluginData('a11y', JSON.stringify({ role: 'button', accessibleName: label, minimumTarget: '64px proyecto; 44px buena práctica AAA', keyboard: 'Tab, Enter o Espacio' }));
  if (target && screen) screen.links.push({ node, target });
  return node;
}
function card(parent: FrameNode, title: string, content: string, palette: Palette, large = false): FrameNode {
  const node = column(title, parent.width - parent.paddingLeft - parent.paddingRight, palette, 16, 8);
  node.cornerRadius = 16; node.strokes = [fill(palette.border)]; node.strokeWeight = 1;
  parent.appendChild(node); stretch(node); text(node, title, large ? 28 : 20, true, palette.text); text(node, content, large ? 24 : 16, false, palette.muted); return node;
}
function input(parent: FrameNode, label: string, value: string, palette: Palette, error = '', large = false): FrameNode {
  const node = column(`Campo / ${label}`, parent.width - parent.paddingLeft - parent.paddingRight, palette, 12, 8);
  parent.appendChild(node); stretch(node); node.strokes = [fill(error ? palette.danger : palette.border)]; node.strokeWeight = error ? 2 : 1; node.cornerRadius = 10;
  text(node, label, large ? 24 : 16, true, palette.text); text(node, value || 'Sin ingresar', large ? 28 : 20, false, palette.text);
  if (error) text(node, `Error: ${error}`, large ? 24 : 16, true, palette.danger);
  node.setPluginData('a11y', JSON.stringify({ role: 'spinbutton', label, value, ariaInvalid: !!error, describedby: error || 'Copia la lectura y no escribas la unidad.' }));
  return node;
}
async function page(name: string): Promise<PageNode> {
  const result = figma.createPage(); result.name = name; result.setPluginData('contigoApf3Generated', '1');
  await figma.setCurrentPageAsync(result); createdPages.push(result); return result;
}
function section(pageNode: PageNode, title: string, width = 1120): FrameNode {
  const frame = column(title, width, palettes.Estándar, 32, 16); pageNode.appendChild(frame); text(frame, title, 32, true); return frame;
}
function place(screen: Screen, index: number): void {
  screen.frame.x = (index % 5) * 490; screen.frame.y = Math.floor(index / 5) * 1050;
}
function screen(pageNode: PageNode, key: string, title: string, mode: Mode = 'Estándar', large = false): Screen {
  const palette = palettes[mode];
  const frame = column(`${key} · ${title}`, 390, palette, 16, 12); pageNode.appendChild(frame);
  frame.resize(390, 900); frame.primaryAxisSizingMode = 'FIXED'; frame.clipsContent = true; frame.cornerRadius = 24;
  frame.fills = [fill(palette.background)]; frame.strokes = [fill(palette.border)]; frame.strokeWeight = 1;
  text(frame, 'CONTIGO · Demostración', large ? 24 : 16, true, palette.text);
  const tools = column('Ayuda y lectura siempre visibles', 358, palette, 0, 8); frame.appendChild(tools); stretch(tools);
  const body = column('Región desplazable de contenido', 358, palette, 0, 12); frame.appendChild(body); stretch(body); body.layoutGrow = 1; body.primaryAxisSizingMode = 'FIXED'; body.clipsContent = true; body.overflowDirection = 'VERTICAL';
  const content = column('Contenido / orden de lectura', 358, palette, 4, 12); body.appendChild(content); stretch(content);
  const result: Screen = { frame, content, key, links: [] };
  action(tools, 'SOS de prueba', 'sos-review', result, mode, 'Error', large);
  action(tools, 'Ajustes de lectura', 'settings', result, mode, 'Normal', large);
  text(content, title, large ? 32 : 26, true, palette.text);
  frame.setPluginData('a11y', JSON.stringify({ title, role: 'region', mode, textScale: large ? '150% diseño' : '100%', focus: 'Tras navegar, enfocar encabezado de vista. Orden: SOS, Ajustes, contenido, navegación.', reading: 'Título, datos, instrucciones, acción, estado.', caveat: 'Especificación de diseño; roles y foco reales se prueban en web.' }));
  allScreens.push(result); return result;
}
function finish(screenNode: Screen, mode: Mode = 'Estándar', large = false, nav = true): void {
  if (!nav) return;
  const navigation = column('Navegación paciente / equivalente web 3 por 2', 358, palettes[mode], 0, 6);
  screenNode.frame.appendChild(navigation); stretch(navigation);
  const rows = [[['Inicio', 'home'], ['Tratamiento', 'treatment'], ['Medición', 'measure']], [['Citas', 'appointments'], ['Mi salud', 'health'], ['Mi cuidador', 'caregiver']]];
  for (const row of rows) {
    const rowFrame = column('Fila de navegación', 358, palettes[mode], 0, 6); navigation.appendChild(rowFrame); stretch(rowFrame);
    rowFrame.layoutMode = 'HORIZONTAL'; rowFrame.primaryAxisSizingMode = 'FIXED'; rowFrame.counterAxisSizingMode = 'AUTO';
    for (const [label, target] of row) {
      const button = action(rowFrame, label, target, screenNode, mode, 'Normal', large); button.layoutGrow = 1; button.layoutAlign = 'INHERIT'; button.resize(112, large ? 90 : 64);
      const labelNode = button.findOne(child => child.type === 'TEXT') as TextNode; labelNode.fontSize = large ? 16 : 14;
    }
  }
}
function dose(screenNode: Screen, status: 'PENDING' | 'TAKEN' | 'NOT_TAKEN', mode: Mode, large: boolean): void {
  const palette = palettes[mode];
  const node = card(screenNode.content, 'Losartán · 50 mg', 'Dosis de las 08:00 · Caso sintético del APF2. La clínica determina la pauta.', palette, large);
  text(node, 'Imagen no disponible en este diseño. Verifica siempre nombre, dosis y hora.', large ? 24 : 16, false, palette.muted);
  if (status === 'PENDING') {
    action(node, 'Ya la tomé', 'dose-taken', screenNode, mode, 'Normal', large);
    action(node, 'No la tomé', 'dose-not-taken', screenNode, mode, 'Normal', large);
  } else {
    text(node, status === 'TAKEN' ? 'Toma declarada: tomada' : 'Toma declarada: no tomada', large ? 24 : 18, true, palette.text);
    text(node, 'La respuesta quedó registrada. Puedes corregirla.', large ? 24 : 16, false, palette.muted);
    action(node, 'Corregir respuesta', 'dose-correct', screenNode, mode, 'Normal', large);
  }
}
async function buildScreenSet(pageNode: PageNode, mode: Mode = 'Estándar', large = false, xOffset = 0): Promise<Record<string, Screen>> {
  const palette = palettes[mode], list: Record<string, Screen> = {};
  const add = (key: string, title: string) => { const node = screen(pageNode, key, title, mode, large); list[key] = node; place(node, Object.keys(list).length - 1); node.frame.x += xOffset; return node; };
  let s = add('home', 'Hola, Dacio'); dose(s, 'PENDING', mode, large); action(s.content, 'Ingresar lectura de presión o peso', 'measure', s, mode, 'Normal', large); card(s.content, 'Próxima cita', 'Geriatría · 04/11/2026 · 10:30, Lima. Caso de diseño congelado el 02/11/2026.', palette, large); finish(s, mode, large);
  s = add('treatment', 'Mi tratamiento de hoy'); text(s.content, 'Revisa nombre, dosis y hora. Tu respuesta no cambia la receta.', large ? 24 : 16); dose(s, 'PENDING', mode, large); finish(s, mode, large);
  s = add('dose-taken', 'Respuesta guardada'); dose(s, 'TAKEN', mode, large); action(s.content, 'Entendido, volver a Inicio', 'home', s, mode, 'Normal', large); finish(s, mode, large);
  s = add('dose-not-taken', 'Respuesta guardada'); dose(s, 'NOT_TAKEN', mode, large); action(s.content, 'Entendido, volver a Inicio', 'home', s, mode, 'Normal', large); finish(s, mode, large);
  s = add('dose-correct', 'Corregir mi respuesta'); input(s.content, 'Motivo obligatorio', 'Me equivoqué al pulsar', palette, '', large); text(s.content, 'Ejemplo de diseño. La web permite escribir el motivo.', large ? 24 : 16); action(s.content, 'Ya la tomé', 'dose-taken', s, mode, 'Normal', large); action(s.content, 'No la tomé', 'dose-not-taken', s, mode, 'Normal', large); action(s.content, 'Cancelar corrección', 'treatment', s, mode, 'Normal', large); finish(s, mode, large);
  s = add('measure', 'Registrar mi medición'); text(s.content, 'Paso 1 de 2 · Copia la lectura de tu tensiómetro. Este prototipo usa un caso de prueba fijo; no mide tu salud.', large ? 24 : 16); input(s.content, 'Presión sistólica (arriba, mmHg)', '120', palette, '', large); input(s.content, 'Presión diastólica (abajo, mmHg)', '80', palette, '', large); input(s.content, 'Pulso (opcional)', '', palette, '', large); action(s.content, 'Revisar mi lectura', 'measure-review', s, mode, 'Normal', large); action(s.content, 'Probar recuperación de error T4', 'measure-error', s, mode, 'Normal', large); finish(s, mode, large);
  s = add('measure-error', 'Revisar los campos'); text(s.content, 'No se guardó la lectura. El mensaje indica causa y sugerencia.', large ? 24 : 16, true, palette.danger); input(s.content, 'Presión diastólica (abajo, mmHg)', '130', palette, 'Debe ser menor que la sistólica. Comprueba el número de abajo e ingrésalo otra vez.', large); action(s.content, 'Corregir a 80 en este caso de prueba', 'measure', s, mode, 'Foco', large); finish(s, mode, large);
  s = add('measure-review', 'Revisa tu lectura'); text(s.content, 'Paso 2 de 2 · Todavía no se guardó.', large ? 24 : 16, true, palette.text); card(s.content, 'Lectura ingresada', 'Sistólica:120 mmHg\nDiastólica:80 mmHg\nPulso:No registrado', palette, large); action(s.content, 'Volver y corregir', 'measure', s, mode, 'Normal', large); action(s.content, 'Confirmar y guardar mi lectura', 'measure-saved', s, mode, 'Normal', large); finish(s, mode, large);
  s = add('measure-saved', 'Medición guardada'); card(s.content, 'Registro disponible', 'Tu cuidador ya puede consultar la lectura. No se asignó diagnóstico.', palette, large); action(s.content, 'Registrar otra lectura', 'measure', s, mode, 'Normal', large); finish(s, mode, large);
  s = add('sos-review', 'SOS de demostración'); text(s.content, 'No llama a emergencias, no envía ubicación ni confirma recepción de otra persona. Una petición registrada permanece en el historial.', large ? 24 : 18, true, palette.text); action(s.content, 'Cancelar y volver', 'home', s, mode, 'Foco', large); action(s.content, 'Registrar petición de prueba', 'sos-saved', s, mode, 'Error', large); finish(s, mode, large);
  s = add('sos-saved', 'Petición de prueba registrada'); text(s.content, 'No se contactó a servicios de emergencia. Este estado confirma el registro, no su entrega.', large ? 24 : 18, true, palette.text); action(s.content, 'Entendido, volver', 'home', s, mode, 'Normal', large); finish(s, mode, large);
  s = add('appointments', 'Mis citas'); card(s.content, 'Geriatría · Programada', '04/11/2026 · 10:30, Lima\nProfesional de demostración\nConsultorio de prueba\nOrigen:clínica sintética. No permite reprogramar.', palette, large); finish(s, mode, large);
  s = add('health', 'Mi salud'); card(s.content, 'Datos con procedencia', 'Las tomas son declaraciones. Las mediciones domésticas se distinguen de la importación clínica sintética. Ausencia de pulso:No registrado.', palette, large); action(s.content, 'Consultar cuidador (T3)', 'dashboard', s, mode, 'Normal', large); finish(s, mode, large);
  s = add('caregiver', 'Mi cuidador'); card(s.content, 'Código temporal', 'Genera un código válido por10 minutos. Si necesitas más tiempo, genera uno nuevo. No compartas datos reales en esta demostración.', palette, large); action(s.content, 'Volver a Inicio', 'home', s, mode, 'Normal', large); finish(s, mode, large);
  s = add('settings', 'Ajustes de lectura'); text(s.content, 'Las alertas siempre aparecen por escrito. Elige una variante de diseño; la web guarda estas preferencias.', large ? 24 : 16); action(s.content, 'Activar alto contraste', '@contrast', s, mode, 'Normal', large); action(s.content, 'Activar texto ampliado', '@large', s, mode, 'Normal', large); action(s.content, 'Volver al modo estándar', '@standard', s, mode, 'Normal', large); finish(s, mode, large);
  s = add('loading', 'Cargando información'); text(s.content, 'Estado:Consultando tu información. El lector de pantalla debe anunciarlo con role=status.', large ? 24 : 16); action(s.content, 'Continuar recorrido de diseño', 'home', s, mode, 'Normal', large); finish(s, mode, large);
  s = add('connection-error', 'No se pudo conectar'); text(s.content, 'Tus cambios no se confirmaron. Revisa la conexión y vuelve a intentar. Conserva los datos ingresados.', large ? 24 : 16, true, palette.danger); action(s.content, 'Reintentar', 'home', s, mode, 'Normal', large); finish(s, mode, large);
  s = add('empty', 'No hay dosis programadas hoy'); text(s.content, 'Este estado vacío se distingue de un error. Revisa Tratamiento para consultar los registros disponibles.', large ? 24 : 16); action(s.content, 'Ver tratamiento', 'treatment', s, mode, 'Normal', large); finish(s, mode, large);
  s = add('dashboard', 'Seguimiento del cuidador'); text(s.content, 'Rol:Cuidador · Paciente:Dacio Ramos. Consulta la pauta; no prescribe ni responde por el paciente.', large ? 24 : 16); card(s.content, 'Tratamiento y existencias', 'Caso inicial sintético:Losartán50 mg ·08:00 y20:00 ·30 tabletas antes de registrar tomas. El valor cambia con los movimientos.', palette, large); card(s.content, 'Próxima cita', 'Geriatría ·04/11/2026 ·10:30, Lima\nClínica de demostración.', palette, large); action(s.content, 'Ver tratamiento y existencias', 'caregiver-treatment', s, mode, 'Normal', large); action(s.content, 'Ver próxima cita', 'caregiver-appointments', s, mode, 'Normal', large); action(s.content, 'Volver a vista paciente', 'home', s, mode, 'Normal', large); finish(s, mode, large, false);
  s = add('caregiver-treatment', 'Tratamiento y existencias'); card(s.content, 'Losartán ·50 mg', 'Pauta:08:00 y20:00\nCantidad inicial:30 tabletas\nOrigen:receta clínica sintética\nExistencias:conteos y tomas declaradas.', palette, large); action(s.content, 'Ver próxima cita', 'caregiver-appointments', s, mode, 'Normal', large); action(s.content, 'Volver al resumen', 'dashboard', s, mode, 'Normal', large); finish(s, mode, large, false);
  s = add('caregiver-appointments', 'Próxima cita del paciente'); card(s.content, 'Geriatría · Programada', '04/11/2026 ·10:30, Lima\nOrigen:clínica sintética\nConsulta sin reprogramación.', palette, large); action(s.content, 'Volver al resumen', 'dashboard', s, mode, 'Normal', large); finish(s, mode, large, false);
  for (const item of Object.values(list)) {
    for (const link of item.links) {
      let destination = list[link.target];
      if (link.target.startsWith('@')) destination = list.home;
      if (!destination) throw new Error(`Destino no encontrado:${link.target}`);
      pendingReactions.push(link.node.setReactionsAsync([{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', navigation: 'NAVIGATE', destinationId: destination.frame.id, transition: null, resetScrollPosition: true }] }]));
    }
  }
  return list;
}

async function buildKit(pageNode: PageNode): Promise<void> {
  const board = section(pageNode, 'Kit accesible de CONTIGO');
  text(board, 'Objetivo WCAG2.1 AA. Ratios y simulaciones Stark pendientes de ejecución en Figma. El kit expresa decisiones de diseño, no una certificación.', 18);
  for (const [name, palette] of Object.entries(palettes)) {
    text(board, `Modo ${name}`, 24, true);
    for (const [token, value] of Object.entries(palette)) {
      const style = figma.createPaintStyle(); style.name = `CONTIGO/${name}/${token}`; style.paints = [fill(value)]; style.description = `Token semántico ${token}. Medir el par usado con Stark antes de declarar conformidad.`;
      paintStyles[`${name}:${token}`] = style;
      const swatch = column(`${token} ${value}`, 1056, palette, 12, 8); board.appendChild(swatch); stretch(swatch); swatch.strokes = [fill(palette.border)];
      const rectangle = figma.createRectangle(); rectangle.name = `Muestra ${token}`; rectangle.resize(80, 44); rectangle.fills = [fill(value)]; swatch.appendChild(rectangle);
      text(swatch, `${token}: ${value}`, 16, true, palette.text);
    }
  }
  text(board, 'Escala tipográfica editable', 24, true);
  for (const size of [14, 16, 20, 24, 32, 48]) {
    const style = figma.createTextStyle(); style.name = `CONTIGO/Texto/${size}`; style.fontName = fontRegular; style.fontSize = size; style.lineHeight = { unit: 'PERCENT', value: 150 }; textStyles[size] = style;
    const example = text(board, `${size}px · Lectura clara con altura de línea150%`, size); await example.setTextStyleIdAsync(style.id);
  }
  const variants: ComponentNode[] = [];
  for (const mode of ['Estándar', 'Alto contraste'] as Mode[]) {
    const palette = palettes[mode];
    for (const [index, state] of ['Normal', 'Hover', 'Foco', 'Activo', 'Deshabilitado', 'Error'].entries()) {
      const node = figma.createComponent(); pageNode.appendChild(node); node.name = `Modo=${mode}, Estado=${state}`;
      node.layoutMode = 'VERTICAL'; node.primaryAxisSizingMode = 'AUTO'; node.counterAxisSizingMode = 'FIXED'; node.resize(350, 64);
      node.paddingTop = 18; node.paddingBottom = 18; node.paddingLeft = 16; node.paddingRight = 16; node.itemSpacing = 0; node.cornerRadius = 12;
      node.fills = [fill(state === 'Error' ? palette.danger : state === 'Deshabilitado' ? palette.surface : state === 'Hover' ? '#0A3327' : state === 'Activo' ? '#06452F' : palette.action)];
      node.strokes = [fill(state === 'Foco' ? palette.focus : state === 'Deshabilitado' ? palette.border : palette.action)]; node.strokeWeight = state === 'Foco' ? 4 : 2;
      const label = text(node, state === 'Deshabilitado' ? 'Continuar (no disponible)' : 'Continuar', 16, true, state === 'Deshabilitado' ? palette.muted : '#FFFFFF'); label.textAlignHorizontal = 'CENTER';
      node.description = `Estado:${state}. Nombre accesible igual a etiqueta. Rol button. Enter y Espacio. Foco visible por contorno. Deshabilitado:disabled real en web. Error con texto además de color.`;
      node.x = (index % 3) * 390; node.y = 100 + Math.floor(index / 3) * 140 + (mode === 'Alto contraste' ? 400 : 0);
      buttonMasters[`${mode}:${state}`] = node; variants.push(node);
    }
  }
  const set = figma.combineAsVariants(variants, pageNode); set.name = 'CONTIGO/Botón accesible'; set.x = 1250; set.y = 0;
  const fieldVariants: ComponentNode[] = [];
  for (const state of ['Normal', 'Hover', 'Foco', 'Activo', 'Deshabilitado', 'Error']) {
    const component = figma.createComponent(); pageNode.appendChild(component); component.name = `Estado=${state}`;
    component.layoutMode = 'VERTICAL'; component.primaryAxisSizingMode = 'AUTO'; component.counterAxisSizingMode = 'FIXED'; component.resize(350, 100); component.paddingTop = 12; component.paddingBottom = 12; component.paddingLeft = 12; component.paddingRight = 12; component.itemSpacing = 8;
    component.fills = [fill('#FFFFFF')]; component.strokes = [fill(state === 'Error' ? '#9F1239' : state === 'Foco' ? '#003D7A' : '#64748B')]; component.strokeWeight = state === 'Foco' || state === 'Error' ? 3 : 1;
    text(component, 'Presión sistólica (mmHg)', 16, true); text(component, state === 'Deshabilitado' ? 'No disponible mientras se guarda' : '120', 20);
    if (state === 'Error') text(component, 'Error:ingresa un número y comprueba la lectura.', 16, false, '#9F1239');
    component.description = 'Especificación:label asociado, role spinbutton, aria-invalid y aria-describedby en error; no usar placeholder como etiqueta.';
    fieldVariants.push(component);
  }
  const fieldSet = figma.combineAsVariants(fieldVariants, pageNode); fieldSet.name = 'CONTIGO/Campo numérico'; fieldSet.x = 1250; fieldSet.y = 1000;
}

async function buildBaseline(pageNode: PageNode): Promise<void> {
  const intro = section(pageNode, 'Antes v2.0 · Capturas reales de la copia local');
  text(intro, `Commit base:${baselineCommit}. Capturas del02/11/2026, datos sintéticos. Son referencias raster sin edición interna; las pantallas v3.0 se generan con objetos editables. No son resultados de usuarios.`, 18);
  let rowY = 300, rowHeight = 0;
  for (const [index, asset] of BASELINE_ASSETS.entries()) {
    if (index > 0 && index % 3 === 0) { rowY += rowHeight + 80; rowHeight = 0; }
    rowHeight = Math.max(rowHeight, 1240 * asset.height / asset.width + 160);
    const wrapper = column(asset.name, 1280, palettes.Estándar, 20, 12); pageNode.appendChild(wrapper); wrapper.x = (index % 3) * 1360; wrapper.y = rowY;
    text(wrapper, asset.name, 24, true); text(wrapper, asset.file, 14); const image = figma.createImage(figma.base64Decode(asset.base64));
    const rectangle = figma.createRectangle(); rectangle.name = `Captura real de línea base / ${asset.name}`; rectangle.resize(1240, 1240 * asset.height / asset.width); rectangle.fills = [{ type: 'IMAGE', imageHash: image.hash, scaleMode: 'FIT' }]; wrapper.appendChild(rectangle);
    rectangle.setPluginData('evidence', JSON.stringify({ source: asset.file, commit: baselineCommit, kind: 'Captura técnica real de datos sintéticos, no test con participantes' }));
  }
}
async function buildAnnotations(pageNode: PageNode): Promise<void> {
  const rows = [
    ['Inicio y tratamiento', 'SOS,Ajustes,escuchar,título,medicamento,dosis,hora,respuestas,navegación. Corregir incluye medicamento y hora en el nombre. Imagen ausente se comunica con texto. Estados tomada/no tomada usan texto e icono.'],
    ['Medición y errores', 'Orden:tipo,sistólica,diastólica,pulso,revisar. Label persistente/unidad y opcionalidad. Error:aria-invalid,describedby,resumen de enlaces a campos; foco al primer error. Revisar no persiste.'],
    ['Revisión y confirmación', 'Encabezado de paso recibe foco. Leer valores exactos y pulso no registrado. Volver conserva entradas;Confirmar guarda. Éxito role=status sin exigir audio.'],
    ['SOS', 'Diálogo nativo con título/explicación. Cancelar recibe foco inicial. Tab contenido en diálogo,Escape cancela si no está registrando y foco vuelve al activador. Confirmación dice registro,no entrega.'],
    ['Citas y seguimiento cuidador', 'Leer especialidad,estado,fecha,hora Lima,profesional,origen. No truncar. Rol cuidador consulta;no prescribe ni registra tomas del paciente. Navegación consistente.'],
    ['Ajustes y variantes', 'Casillas nativas y etiquetas completas. Guardar devuelve estado textual. Alto contraste mediante tokens, texto ampliado sin recortar. Comprobar200% real en navegador, no inferir desde Figma.'],
    ['Carga,error y vacío', 'Carga role=status. Error explica causa y reintento conservando datos. Vacío indica ausencia,no cero. Reintentar accesible por teclado. Mantener ayuda disponible.'],
  ];
  for (const [index, row] of rows.entries()) {
    const node = section(pageNode, row[0], 760); node.x = (index % 2) * 820; node.y = Math.floor(index / 2) * 600; text(node, row[1], 20);
    text(node, 'Estas anotaciones especifican el diseño. Verificar comportamiento real en web con teclado y lector de pantalla; registrar versión, herramienta y evidencia.', 16);
    text(node, 'WCAG:1.1.1,1.3.1,2.1.1,2.4.3,2.4.7,2.5.3,3.3.1–3.3.4,4.1.2 y4.1.3 según el control.', 16);
  }
}
async function main(): Promise<void> {
  await figma.loadFontAsync(fontRegular); await figma.loadFontAsync(fontBold);
  const overview = await page('00 Leyenda y resumen');
  const before = await page('01 Antes (v2.0)');
  const after = await page('02 Después (v3.0 objetivo AA)');
  const kit = await page('03 Kit accesible');
  const notes = await page('04 Anotaciones de accesibilidad');
  const variants = await page('05 Variante alto contraste y texto ampliado');
  await figma.setCurrentPageAsync(kit); await buildKit(kit);
  await figma.setCurrentPageAsync(before); await buildBaseline(before);
  await figma.setCurrentPageAsync(after);
  const standard = await buildScreenSet(after);
  const highContrast = await buildScreenSet(after, 'Alto contraste', false, 2600);
  const enlarged = await buildScreenSet(after, 'Estándar', true, 5200);
  await Promise.all(pendingReactions);
  for (const set of [standard, highContrast, enlarged]) {
    const toggles = { '@contrast': highContrast.home, '@large': enlarged.home, '@standard': standard.home };
    for (const link of set.settings.links) if (link.target in toggles) pendingReactions.push(link.node.setReactionsAsync([{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', navigation: 'NAVIGATE', destinationId: toggles[link.target as keyof typeof toggles].frame.id, transition: null }] }]));
  }
  after.flowStartingPoints = [{ nodeId: standard.home.frame.id, name: 'T1 Toma y corrección' }, { nodeId: standard.treatment.frame.id, name: 'T2 SOS de prueba' }, { nodeId: standard.dashboard.frame.id, name: 'T3 Consulta cuidador' }, { nodeId: standard['measure-error'].frame.id, name: 'T4 Recuperación de error' }];
  await figma.setCurrentPageAsync(variants);
  const contrastSet = await buildScreenSet(variants, 'Alto contraste');
  const largeSet = await buildScreenSet(variants, 'Estándar', true, 2600);
  variants.flowStartingPoints = [{ nodeId: contrastSet.home.frame.id, name: 'Alto contraste' }, { nodeId: largeSet.home.frame.id, name: 'Texto ampliado' }];
  await figma.setCurrentPageAsync(notes); await buildAnnotations(notes);
  await figma.setCurrentPageAsync(overview);
  const summary = section(overview, 'CONTIGO APF3 Accesibilidad universal');
  text(summary, 'Documento generado como base editable de diseño. No certifica conformidad AA ni reemplaza las pruebas con usuarios. Las referencias v2.0 son capturas técnicas reales; las vistas v3.0 son diseños nativos derivados de la aplicación.', 20);
  text(summary, 'Recorrido:abre02 Después y pulsa Presentar. T1:Ya la tomé→estado→Corregir.T2:SOS→Cancelar o Registrar.T3:resumen cuidador→tratamiento→cita.T4:error→corregir→revisión→guardar. Ajustes cambia variantes en la misma página.', 20);
  text(summary, 'Caso sintético fijo:02/11/2026,Dacio Ramos,Losartán50mg,08:00 y20:00,existencias iniciales30tabletas,cita04/11/2026a10:30Lima. Las cifras de diseño no son resultados de auditoría ni de participantes.', 18);
  text(summary, 'Leyenda:ANTES=captura real de código base.DESPUÉS=diseño editable.ESTADO=simulación navegable del flujo.ANOTACIÓN=especificación de accesibilidad.PENDIENTE=requiere ejecución/documentación humana o de herramienta.', 18);
  text(summary, 'Pendientes de cierre:ejecutar Stark y guardar ratios/simulaciones;inspeccionar visualmente este archivo generado;probar prototipo en Figma;publicar enlace con permiso de lectura y comprobarlo en incógnito;registrar sesiones con consentimiento;ejecutar lector de pantalla y zoom real200%.', 18, true);
  text(summary, 'La tipografía,los textos,las tarjetas,los componentes y las reacciones son editables. No modifica ni elimina páginas existentes. Reejecutar crea otras6páginas;hazlo en un archivo vacío o elimina manualmente solo la copia anterior.', 16);
  text(summary, 'Fuentes oficiales API:https://developers.figma.com/docs/plugins/manifest/ · /api/Reaction/ · /api/Action/ · /api/properties/figma-combineasvariants/. Evidencia base:output/apf3/evidence/baseline.', 14);
  await Promise.all(pendingReactions);
  overview.selection = [summary]; figma.viewport.scrollAndZoomIntoView([summary]);
  figma.root.setPluginData('contigoApf3LastGeneration', JSON.stringify({ pages: createdPages.map(item => item.name), screens: allScreens.length, baselineCommit, status: 'Generado en Figma; revisión visual, Stark, permisos y validación humana pendientes.' }));
  figma.notify(`CONTIGO:6páginas y${allScreens.length}pantallas editables generadas. Revisa el resultado y ejecuta Stark.`);
  figma.closePlugin('Diseño generado. No se afirma conformidad ni validación con participantes.');
}
main().catch(error => {
  figma.notify(`Generación interrumpida:${error instanceof Error ? error.message : String(error)}. Las páginas creadas se conservaron para revisar.`, { error: true, timeout: 12000 });
  figma.closePlugin('No se completó la generación. Consulta la consola de desarrollo y el README.');
});
