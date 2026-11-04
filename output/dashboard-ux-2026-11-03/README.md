# Dashboard: navegación, contenido y presentación

Revisión del 3 de noviembre de 2026 sobre el proyecto local. El resumen reúne tomas del día, última medición y próxima cita, con enlaces directos a sus secciones. La última medición considera presión y peso según su fecha; conserva la unidad y el pulso registrado o «No registrado» cuando corresponde. No interpreta clínicamente las lecturas.

Se eliminaron el bloque duplicado de detalles de cita y las métricas repetidas dentro del desplegable de evolución. La lista comienza por las tomas por confirmar cuando existen; si todas tienen respuesta, muestra los registros disponibles. El filtro es independiente para cada paciente.

Los avisos críticos se conservan todos visibles y separados de «Para revisar». Este último cuenta solamente existencias y avisos adicionales. Las solicitudes SOS activas mantienen su acceso de atención; sin solicitudes, el indicador ocupa una fila compacta. No se archivaron ni modificaron avisos reales durante esta revisión.

El menú lateral permanece disponible al desplazarse en escritorio, muestra la sección actual y ofrece volver al landing. El menú móvil abre con foco en el enlace de la sección actual, admite Escape y se cierra al navegar. La ubicación «Mi panel / sección» ofrece retorno al resumen. El selector de paciente está disponible también para las cuentas administrativas autorizadas.

## Verificación

`audit.json`: `complete: true`, siete controles funcionales, trece vistas comprobadas, diez fuentes con hashes estables, sin errores JavaScript ni intentos de escritura clínica.

- Doce vistas con datos de la API: anchos 320, 390 y 1440 px; texto al 100 y 200 %; contraste habitual y alto contraste. Se despliega la gráfica de presión y se comprueba el menú por teclado. Sin desbordamiento horizontal ni violaciones detectadas por axe.
- Una vista adicional a 320 px/200 % con cuatro alertas críticas, existencias agotadas y peso reciente. Es un escenario GET modificado en el contexto privado de prueba: no se insertan esos datos en las bases. Se comprueban el recuento y las unidades, sin desbordes ni violaciones detectadas por axe.
- Otro escenario GET de SOS en espera conserva visible «Atender solicitud» a 320 px/200 %. Se comprueba su presentación y ancho; no se inicia una conversación ni se envía una solicitud real.
- Navegación entre Mediciones, Resumen y landing con sesión y paciente conservados; título y foco de la sección; actualización manual mediante lectura real; filtro y cambio de paciente sin mezcla de datos.

Los resultados incompletos de axe se conservan en el informe para evaluación manual. Estos controles técnicos con Chrome headless no certifican WCAG ni sustituyen pruebas con personas o lectores de pantalla. Se comprobó la presentación de SOS; la prueba anterior de audio y mensajes conserva su propio corte en `output/live-sos-2026-11-03`.

Para reproducir con los servicios locales activos:

```powershell
node tools/apf3/verify-dashboard-ux.mjs
```

`dashboard-desktop.png` muestra el resumen. Las capturas restantes incluyen sus dimensiones y preferencias en el nombre. `diagnostic-lazy-route-race.json` corresponde a una espera insuficiente del primer script, que consultaba la selección antes de terminar la carga de Mediciones. Se corrigió la espera para exigir el título de esa sección. `previous-before-completed-day.json` es el corte anterior aprobado. No deben confundirse con el informe final.

Las entregas PDF, presentaciones y anexos anteriores no se regeneraron con esta mejora de la aplicación.
