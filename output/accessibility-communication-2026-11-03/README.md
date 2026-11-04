# Comunicación y ayudas de acceso de CONTIGO

Revisión del 3 de noviembre de 2026, posterior al paquete APF3 de `output/apf3`. Esta carpeta registra la implementación nueva; las evidencias y documentos anteriores conservan su alcance y no acreditan automáticamente estos cambios.

## Uso

- **Comunicarme**, en la barra superior: elegir una frase o escribir hasta 240 caracteres, mostrarla en grande y permitir que una persona cercana escriba una respuesta. La lectura en voz alta es opcional. Los textos del tablero no se guardan en almacenamiento ni se envían a la API; se borran al cerrar o cambiar de página. La voz usa el motor del navegador y no se presupone funcionamiento offline.
- **Opciones de lectura**: modo sin sonido (cancela voz y sonidos de CONTIGO), vibración opcional, controles más grandes y reducción de animaciones, además de texto ampliado y alto contraste. Solo estas preferencias se conservan en el dispositivo; también funcionan en sesión si el almacenamiento está bloqueado.
- **SOS de prueba**: frases rápidas o texto opcional para el cuidador. El mensaje se guarda únicamente al confirmar, permanece en el aviso y puede consultarlo un cuidador autorizado. No confirma que haya sido leído ni contacta emergencias. En caso de error el texto se conserva para reintentar. Cancelar o cambiar de paciente borra el borrador.
- **Avisos visibles**: instrucciones, errores y confirmaciones escritos, objetivos de interacción ampliables y navegación por teclado. El sonido nunca es necesario para registrar las respuestas.

## Implementación

`CommunicationBoard` se integra globalmente en `ReadingOptions`. Las preferencias se comparten y sincronizan entre pestañas; `speechService` respeta el silencio incluso antes de ejecutar una locución pendiente. `useAction` solicita vibración solo cuando se ha activado expresamente. Su ausencia o rechazo no interrumpe la acción.

Frontend y backend admiten `POST /api/v1/patients/{patientId}/alerts/sos` con `{operationId, message?}`. El texto admite hasta 240 caracteres tras quitar espacios exteriores, conserva acentos y saltos de línea y rechaza controles invisibles. El backend conserva permisos, reintentos y compatibilidad con solicitudes sin mensaje; repetir una operación con otros datos devuelve conflicto. Utiliza la descripción de alerta existente, sin migración de base de datos.

## Verificación y límites

- Frontend: 76 pruebas, ESLint y compilación TypeScript/Vite aprobados.
- Backend: 21 pruebas de integración aisladas en H2, incluidas ocho nuevas sobre mensaje, límites, permisos y reintentos. La API local recompilada anuncia el contrato nuevo en OpenAPI y devuelve `UP` con almacenamiento PostgreSQL.
- `communication-board.json` y `communication-board-keyboard.json`: estados de editor y mensaje grande en anchos 320/390/430, escalas del producto 100/200 % y ambos contrastes; selección, edición, respuesta, borrado, ciclo Tab/Mayús+Tab, Escape y retorno de foco. Las observaciones automáticas incompletas se conservan en los JSON; cero infracciones detectadas no equivale a conformidad completa.
- `sos/interaction.json`: demostración privada temporal con API bloqueada; prueba cancelación, errores, reintento sin duplicados y lectura del mensaje por el cuidador. Las escrituras pertenecen únicamente a IndexedDB de ese contexto, no a PostgreSQL local.
- `options/interaction.json`: consentimiento de vibración, solicitud simulada, persistencia de preferencias, dimensiones de controles y restauración. La vibración física y la calidad de las voces no se han verificado en un teléfono real.

La vibración no está disponible en todos los navegadores y dispositivos: [documentación de Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate). La voz depende de [SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis). Las pruebas se ejecutan sin audio ni dispositivos personales.

Falta validar estas herramientas con personas sordas, con dificultades para hablar y con otras necesidades de acceso, y completar el recorrido con lector de pantalla y zoom nativo de la versión nueva. No se incluye traducción automática a lengua de señas ni se atribuye validación con usuarios. Las pruebas técnicas no sustituyen esas sesiones.

## Reproducción

Con el proyecto levantado en 3001, ejecutar `node tools/apf3/verify-access-options.mjs`. El script del tablero está en `tools/apf3/verify-communication-board.mjs`. El SOS se comprueba con `tools/apf3/verify-written-sos.mjs` sobre un Vite de demostración temporal en 3014, con `VITE_USE_MOCKS=true` solo en ese proceso y todas las solicitudes API bloqueadas. No cambiar el `.env` del proyecto central.

No se reinician datos del usuario. Los servicios locales continúan en 3001/8081/55432.
