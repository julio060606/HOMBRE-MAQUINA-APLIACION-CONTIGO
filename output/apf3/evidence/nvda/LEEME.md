# Registro técnico con NVDA 2026.3

Se ejecutó una copia portátil real de NVDA 2026.3 con configuración aislada. `summary.json` describe versión, navegador, origen, métodos, proceso y alcance; `browser-actions.json` conserva los 22 pasos; `nvda-speaking-verbatim.log` conserva 63 secuencias originales de salida de NVDA con sus marcas de tiempo, incluidas las de inicio.

La interacción del navegador se realizó por Playwright/CDP sobre `http://127.0.0.1:3001`. Hubo foco programático y eventos de teclado. Los anuncios proceden del lector nativo y no de llamadas de prueba a su función de hablar. Este registro no acredita que una persona haya descubierto los controles o comprendido el contenido sin ayuda.

Se observaron la respuesta de toma y su confirmación (T1), el diálogo SOS, cancelación y registro (T2), y error, corrección, revisión y guardado de medición (T4). En T3 se observaron navegación y encabezados del cuidador: la lectura completa de los valores de existencias y cita sigue pendiente. No se probaron gestos de modo exploración de NVDA mediante los ganchos del teclado del sistema.

Las ocho imágenes son capturas reales del navegador. No son capturas del escritorio ni del visualizador de voz. El texto del lector se acredita mediante su log y no mediante esas imágenes.

El log completo permaneció en una carpeta temporal aislada. La exportación se revisó para conservar únicamente anuncios de la demostración local y del inicio de NVDA. `extraction.json` conserva el hash del original y el método de extracción. Se verificó el cierre de la copia de NVDA creada para esta prueba sin modificar la configuración personal.

No hubo participantes reclutados, consentimientos ni resultados de tiempo, SUS o SEQ. Tampoco se emitió un juicio sobre usabilidad acústica o conformidad integral WCAG. Los instrumentos para esas sesiones se entregan por separado, sin completar.

La preparación y reproducción están documentadas en `tools/apf3/screen-reader/README.md` dentro del repositorio. El resumen distingue las comprobaciones ejecutadas de las que siguen pendientes.
