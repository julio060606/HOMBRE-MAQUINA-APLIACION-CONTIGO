# Citas: reflujo al cambiar el tamaño de texto

Revisión del 3 de noviembre de 2026. Fuente limitada a `AppointmentList.tsx` y su nuevo `AppointmentList.module.css`.

Se conservan especialidad, estado, fecha, hora de Lima, médico, lugar, indicaciones y procedencia. Fecha y hora se muestran en bloques separados con elementos `<time dateTime>`. La procedencia y el alcance de consulta quedan en «Sobre esta cita», que se puede abrir y cerrar con Enter.

El padding de la tarjeta permanece en 16 px y los espacios en 10–16 px. La tipografía usa rem y respeta los cuatro tamaños: especialidad de 18, 22.5, 27 y 36 px; fecha/hora de 17, 21.25, 25.5 y 34 px. Las columnas de horario dependen del espacio necesario para el texto; al ampliar pasan a filas completas. No hay truncado, ellipsis ni reducción mediante clamp.

La matriz `appointments-qa.json` registra 16 combinaciones: viewport móvil de 320 px y escritorio de 1280 px con interior de teléfono de 410 px, cuatro escalas (100/125/150/200 %) y dos contrastes. Las capturas son del viewport completo con contexto del aplicativo, no de un locator largo recortado.

Resultado técnico: 16 casos completos, cero desbordes horizontales, cero violations y cero incomplete de axe en la tarjeta. Las fechas y horas conservaron sus valores y atributos. «Geriatría» y los grupos de fecha permanecen legibles al 200 %. También se comprobó el desplegable mediante teclado. No hubo intentos de escritura de dominio; solo lecturas API y las sesiones sintéticas propias.

Pasaron `tsc --noEmit`, ESLint específico, la prueba existente del dominio de citas y `git diff --check`. Las dos huellas de fuente final están en el JSON. Se conservan las fuentes anterior y posterior para revisión.

Reproducción con la app central en 3001:

```powershell
node output/text-resize-2026-11-03/appointments/verify-appointments.mjs
```

Son pruebas técnicas con navegador privado, no sesiones con participantes ni lectura nativa de pantalla. La escala del producto no acredita zoom nativo del navegador.
