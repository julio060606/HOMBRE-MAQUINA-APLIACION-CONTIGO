# CONTIGO APF3 diseño actual para Figma

Paquete preparatorio local del **3 de noviembre de 2026**. Genera seis páginas, estilos, componentes y conexiones editables en Figma Design. **Todavía no se ejecutó en Figma ni creó un archivo nativo o un enlace publicado.** Su preparación puede completarse después, según lo acordado con el equipo.

La interfaz paciente coincide con la organización actual del repositorio: **una sola vista con medicamentos, medición y próximas citas**. No recrea la barra inferior de pestañas retirada. La referencia anterior permanece únicamente en la página 01.

## Contenido

| Página | Alcance |
| --- | --- |
| 00 Leyenda y resumen | Procedencia, caso sintético fijo, tareas, alcance y pendientes. |
| 01 Antes (v2.0) | Cinco capturas históricas reales y sus rutas/hashes, sin alterarlas. |
| 02 Después (v3.0 objetivo AA) | 51 frames nativos: 17 estados en estándar, alto contraste y texto de diseño al 200 %. Debajo, 15 capturas reales actuales de la API. |
| 03 Kit accesible | Estilos semánticos en dos modos, escala tipográfica y dos conjuntos de componentes con doce variantes cada uno: modo por seis estados. |
| 04 Anotaciones de accesibilidad | Especificaciones actuales de etiquetas, input de texto numérico, foco, pulso opcional, revisión, modal SOS y lectura del cuidador. |
| 05 Variante alto contraste y texto ampliado | Otros 34 frames, con flujos completos en alto contraste y texto al 200 % de diseño. |

Se generan **85 frames de interfaz** en total. Las imágenes incrustadas son capturas técnicas reales; los frames nativos son **reconstrucciones de diseño**, identificadas como tales. Ninguno es una sesión con participante. Las capturas API y la demo aislada son evidencias distintas; este paquete incrusta las 15 capturas API actuales, no las capturas del laboratorio offline.

## Crear el archivo después

1. Extraer el ZIP en una carpeta local. Abrir Figma Design de escritorio y un archivo del equipo que permita las seis páginas.
2. En Plugins de desarrollo, importar `manifest.json`. Si Figma exige un identificador, crear un plugin de desarrollo y conservar el **id asignado por Figma** al copiar el código. El manifiesto de este paquete no inventa un id.
3. Ejecutar **CONTIGO APF3 Diseño actual 3 noviembre 2026**. El código no accede a la red ni conecta a bases de datos.
4. Revisar que se hayan creado seis páginas, que los textos no se recorten y que las conexiones funcionen. El plugin conserva el contenido existente y añade páginas; repetir crea otro conjunto.
5. En la página 02, usar Presentar desde T1, T2, T3 o T4. Opciones de lectura conecta con los conjuntos estándar, alto contraste y texto ampliado de esa misma página.

## Recorridos de diseño

- **T1:** Ya la tomé o No la tomé lleva al estado correspondiente; Corregir abre un motivo ficticio ya escrito y permite elegir otra respuesta o cancelar hacia el estado previo.
- **T2:** SOS representa el alcance de la demostración, la cancelación previa y la confirmación de registro; no afirma entrega a emergencias. El frame es una aproximación del modal nativo que implementa la web y no demuestra contención de foco.
- **T3:** Cuidador consulta tratamiento, unidades y cita. El caso fijo usa Losartán 50 mg a las 08:00/20:00, 30 tabletas; Vitamina D3 2000 UI a las 14:00, 3 tabletas; Geriatría el 5 noviembre 2026 a las 10:30, hora de Lima. Es un caso sintético de diseño al 3 noviembre, anterior a registrar tomas, y **no es un dato vivo** de la API.
- **T4:** Desde el estado de error 80/120, tocar el campo Número de abajo recorre el caso corregido 120/80; Revisar medición muestra la comprobación; Corregir números vuelve conservando el caso; Guardar llega al estado de éxito.
- **Peso:** La variante incluye 72,5 kg como entrada ficticia, revisión y éxito. Pulso se deja vacío y se expresa como No registrado.

Presentar recorre casos fijos; las capas de los campos se pueden editar en el archivo, pero no son inputs HTML de entrada libre. La aplicación web permite ingresar, validar, corregir y registrar valores reales del caso de prueba.

## Kit y verificaciones pendientes

El borde estándar de controles utiliza **#74887E**, conforme al CSS actual del formulario, sobre superficies #F8FBF9 y #FFFFFF. Los estilos incluyen texto, secundario, acción, hover, activo, foco, peligro, bordes y superficies. Los componentes tienen Normal, Hover, Foco, Activo, Deshabilitado y Error en ambos modos. La ampliación de diseño al 200 % no equivale a comprobar zoom nativo del navegador.

Ejecutar Stark en el archivo creado, medir los pares efectivos de texto/fondo y control/fondo, revisar estados y guardar capturas reales y simulaciones sensoriales. **Este generador no ejecuta Stark ni produce sus resultados.** Las anotaciones tampoco acreditan anuncios reales de NVDA. La lectura completa T3 con NVDA en la aplicación actual sigue pendiente tras un bloqueo del proveedor de control nativo por verificación de URL; no se sustituye por un árbol DOM.

Antes de entregar, compartir el archivo/prototipo para **cualquiera con el enlace puede ver**, abrir el enlace en incógnito y recorrerlo sin permisos de edición. Registrar enlace real, fecha y persona que lo verificó. Hasta entonces, `status.json` mantiene `nativeFigmaCreated:false` y `starkExecuted:false`.

## Reproducibilidad y fuentes

En el repositorio:

```powershell
node tools/apf3/figma-current-2026-11-03/build.mjs
node --check output/apf3/figma-current-2026-11-03/code.js
node tools/apf3/figma-current-2026-11-03/test-mock.mjs
```

El builder usa TypeScript ya instalado en `frontend/node_modules`, la referencia de tipos Figma conservada en `tools/apf3/figma/plugin-api.reference.d.ts` y el `audit.json` actual. Comprueba que cada captura tenga la URL esperada para evitar etiquetar una pantalla de login como tratamiento. Los hashes de fuente e imágenes se conservan en `status.json`.

La carpeta `sources` conserva el generador TypeScript, declaración de assets, builder, prueba, manifiesto y referencia de tipos. El builder se reproduce desde su ruta del repositorio; la copia de fuentes se entrega para revisión y adaptación. El código del plugin es propio del proyecto, adaptado de su generador previo; los tipos externos pertenecen a [Figma Plugin Typings](https://github.com/figma/plugin-typings), publicados bajo licencia MIT. Se conserva su aviso en `sources/LICENSE-FIGMA-TYPINGS.txt`.

`mock-verification.json` es una **prueba estructural simulada**: comprueba páginas, componentes, ausencia de navegación retirada, conexiones y capturas PNG. No implementa el motor de texto/autolayout de Figma ni prueba ejecución real.

APIs oficiales consultadas el 3 noviembre 2026: [manifest](https://developers.figma.com/docs/plugins/manifest/), [Reaction](https://developers.figma.com/docs/plugins/api/Reaction/), [Action](https://developers.figma.com/docs/plugins/api/Action/) y [API de Figma](https://developers.figma.com/docs/plugins/api/figma/).
