# Tarjeta de medicamento simplificada

Revisión del 3 de noviembre de 2026. Cambios limitados a DoseCard.tsx y DoseCard.module.css.

La tarjeta prioriza hora, estado escrito, medicamento, dosis e instrucciones de la receta. Las acciones Ya la tomé y No la tomé tienen altura mínima64px y aparecen antes de los metadatos. La fotografía de referencia ocupa76×68px. Diagnóstico y médico siguen disponibles en Ver detalles del medicamento, sin alterar su origen ni deducir datos.

La corrección conserva motivo obligatorio, reintentos, validación, cancelación y foco. Los errores y confirmaciones permanecen escritos; la voz continúa siendo opcional y usa el servicio existente.

En captura de390px, la tarjeta cerrada pasó de727px a518px de alto. Esta comparación corresponde a los mismos datos sintéticos y no mide rendimiento humano.

Pruebas:4 pruebas existentes de patientApp y ESLint específico aprobados. El script verify-dose-card.mjs recorre12 combinaciones(ancho320/390/430,escala100/200,estándar/alto contraste), comprueba botones>=64px, ausencia de desborde, teclado entre respuestas y detalle, y apertura/cierre del detalle con Enter. Detectó0violations y0incomplete de axe en la tarjeta;0intentos de escritura de dominio. Las únicas operaciones no GET admitidas fueron las sesiones de prueba propias.

ALCANCE: se ejecutó mientras el padre integraba el contenedor móvil. Las capturas al200% muestran posibles recortes/superposición del contenedor exterior en desarrollo; no deben presentarse como aceptación final de la app integrada. La revisión final del shell corresponde al padre. No hubo pruebas con participantes ni lectura nativa de pantalla.

Referencias de diseño consultadas:
- WAI, contenido claro y comprensible: https://www.w3.org/WAI/WCAG2/supplemental/objectives/o3-clear-content/
- WAI, accesibilidad para personas mayores: https://www.w3.org/WAI/older-users/developing/

Se aplicaron bloques breves, espacios claros y tipografía relativa. No se declara conformidad WCAG completa ni facilidad validada para todos los perfiles.
