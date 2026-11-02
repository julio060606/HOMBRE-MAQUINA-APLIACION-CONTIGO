# Generar el archivo editable de Figma de CONTIGO APF3

Este paquete local genera páginas, textos, tarjetas, componentes y conexiones nativas de Figma. **No se ha ejecutado ni publicado en Figma desde esta sesión.** El código pasó comprobación de tipos contra la API oficial; las comprobaciones con una API simulada solo verifican estructura y destinos. No sustituyen la inspección del archivo real.

## Archivos necesarios

- `manifest.json`: definición del plugin de desarrollo, sin acceso a red.
- `code.js`: generador sin dependencias de ejecución; contiene diez capturas reales de la línea base.
- `estado.json`: procedencia de las capturas y pendientes.
- `LEEME.md`: esta guía.

## Importar y ejecutar

1. Abre la aplicación de escritorio de Figma y crea un archivo de diseño vacío del equipo.
2. Ve al menú de plugins, sección **Development / Desarrollo**, y elige **Import plugin from manifest / Importar plugin desde manifest**. Selecciona `manifest.json` de esta carpeta.
3. Ejecuta **CONTIGO APF3 Generador de prototipo editable** desde Desarrollo. No requiere npm, navegador local, credenciales ni conexión con datos clínicos.
4. Si Figma exige un ID propio, crea un plugin de desarrollo nuevo desde **Create new plugin**, conserva el `id` que Figma te asigne y añádelo al manifest de este paquete. No uses un ID inventado ni el de otro autor. Alternativamente, sustituye el `code.js` del plugin creado por el de esta carpeta y conserva `api`, `main`, `editorType`, `documentAccess` y `networkAccess` de este manifest.
5. Espera la notificación de generación. La página `00 Leyenda y resumen` explica los flujos y límites. Si aparece un error, revisa la consola de desarrollo; las páginas parciales se conservan para diagnosticarlo.
6. Revisa visualmente los seis nombres de página, el ajuste de texto, los componentes y las conexiones en el panel Prototype. Este paso todavía está pendiente. El generador no elimina ni reemplaza contenido existente: una segunda ejecución añade otras seis páginas.

Si tu cuenta limita la cantidad de páginas, utiliza el espacio educativo disponible para el curso o el archivo de equipo que admita las seis páginas exigidas. No presentes una generación parcial como entrega completa.

## Contenido generado

| Página | Contenido |
|---|---|
| 00 Leyenda y resumen | Alcance, caso sintético, procedencia, tareas y pendientes. |
| 01 Antes (v2.0) | Diez capturas técnicas reales del commit `4656d72365080d18b267f69d565e4d77a7ae3d56`, con ruta de evidencia. Son imágenes de referencia. |
| 02 Después (v3.0 objetivo AA) | 63 frames editables: 21 vistas y estados en modo estándar, alto contraste y texto ampliado. Incluye paciente y cuidador. |
| 03 Kit accesible | Estilos de color por modo, seis estilos tipográficos, doce variantes de botón y seis de campo numérico. |
| 04 Anotaciones de accesibilidad | Orden de foco y lectura, nombres, roles, alternativas y estados. Son especificaciones de diseño. |
| 05 Variante alto contraste y texto ampliado | Otros 42 frames para recorrer las dos variantes con sus estados. |

Las 21 vistas y estados por conjunto incluyen Inicio, Tratamiento, toma positiva, toma negativa, corrección, medición, error, revisión, guardado, SOS previo, SOS registrado, Citas, Mi salud, Mi cuidador, Ajustes, carga, error de conexión, vacío y tres vistas del cuidador. Las capturas de la v2.0 se mantienen como imágenes. El resto usa capas y componentes editables.

## Recorrer el prototipo

Abre `02 Después (v3.0 objetivo AA)` y pulsa Presentar. Se crean cuatro puntos de inicio con conexiones **ON_CLICK / NAVIGATE**, sin animaciones obligatorias.

- **T1:** Inicio → Ya la tomé → estado guardado → Corregir respuesta → respuesta corregida. Las dos respuestas tienen el mismo tamaño.
- **T2:** Localiza SOS de prueba en cualquier vista → revisa el alcance → Cancela o registra la petición → lee la confirmación. El diseño nunca afirma entrega a emergencias.
- **T3:** Seguimiento del cuidador → tratamiento y existencias → próxima cita → resumen.
- **T4:** Medición con error → corrección del caso fijo → revisar → volver y corregir o confirmar → guardado.
- **Variantes:** Ajustes → alto contraste, texto ampliado o modo estándar. Las conexiones de la página 02 cambian entre conjuntos de esa misma página.

Figma representa un caso fijo. Los campos son capas editables en el archivo, no entradas libres en el modo Presentar. La web implementada permite ingresar y validar valores; úsala para probar teclado, lector de pantalla, errores con datos distintos y zoom real.

## Caso de demostración y límites

Los nombres y valores son sintéticos y derivan del estado de demostración del repositorio. El diseño congela el caso el 2 de noviembre de 2026: Dacio Ramos, Losartán 50 mg a las 08:00 y 20:00, existencias iniciales de 30 tabletas antes de registrar tomas y cita de Geriatría del 4 de noviembre de 2026 a las 10:30 de Lima. La web recalcula fechas y existencias: no mezcles estados iniciales y posteriores en una sesión de evaluación.

Las lecturas 120/80 son un caso escrito para recorrer la validación del diseño; no son datos de participantes ni mediciones clínicas reales. Los resultados de SUS, SEQ, tiempos y éxito **no se generan**.

La variante de texto representa una ampliación de diseño al 150 %. No acredita la comprobación de zoom del navegador al 200 %. El archivo no certifica WCAG AA ni comprueba foco real, anuncios de lector, recepción de eventos o servicios de emergencia.

## Ejecutar Stark y conservar evidencia

1. Abre Stark en el archivo real generado; registra fecha, versión y modo revisado.
2. Selecciona los pares de texto/fondo y componente/fondo del flujo crítico. Conserva las capturas y los ratios que Stark mida. La referencia objetivo es 4.5:1 para texto normal y 3:1 para texto grande y componentes aplicables.
3. Revisa ambos modos y los estados normal, hover, foco, activo, deshabilitado y error.
4. Ejecuta las simulaciones de protanopia, deuteranopia y tritanopia; documenta si texto, iconos y etiquetas mantienen la información. Identifica estas comprobaciones como simulaciones.
5. Guarda los archivos en `output/apf3/evidence/figma-stark/` y enlázalos en la matriz WCAG. Ese directorio y sus resultados se crearán cuando las pruebas se ejecuten; no se han fabricado capturas Stark.
6. Revisa los recorridos web con teclado, zoom real al 200 % y un lector de pantalla. Usa el protocolo y registra evidencia; las anotaciones de este archivo no reemplazan esas pruebas.

## Compartir la entrega

Tras la revisión, configura el archivo para que cualquiera con el enlace pueda **verlo**. Copia el enlace del prototipo y compruébalo en una ventana de incógnito sin permisos de edición. Recorre T1–T4 y activa las variantes. Registra el enlace, la fecha, quién lo verificó y los problemas residuales. No marques la entrega Figma como completa antes de esta comprobación.

## Reproducir el paquete desde el repositorio

Desde la raíz del repositorio:

```powershell
node tools/apf3/figma/build.mjs
node --check output/apf3/figma/code.js
node tools/apf3/figma/test-mock.mjs
```

La reconstrucción utiliza el TypeScript instalado en `frontend/node_modules` y las capturas de la línea base. El plugin final no depende de esas herramientas. La prueba simulada escribe `mock-verification.json` y declara expresamente que no ha ejecutado Figma.

Fuentes oficiales consultadas el 2 de noviembre de 2026:

- [Manifest del plugin](https://developers.figma.com/docs/plugins/manifest/)
- [Crear un plugin de desarrollo](https://help.figma.com/hc/en-us/articles/360042786733-Create-a-classic-plugin-for-development)
- [Reacciones nativas](https://developers.figma.com/docs/plugins/api/Reaction/)
- [Acciones de prototipo](https://developers.figma.com/docs/plugins/api/Action/)
- [Componentes con variantes](https://developers.figma.com/docs/plugins/api/properties/figma-combineasvariants/)
- [Tipos oficiales de la API](https://github.com/figma/plugin-typings/blob/master/plugin-api.d.ts)
