# Corrección de lectura al cambiar el tamaño

El resultado final es `audit.json`, generado por `node tools/apf3/verify-text-resize.mjs` con el frontend y la API locales activos. Completó 16 casos y 80 estados medidos: anchos 320/390/1280, escalas reales del producto 100/125/150/200 % y contraste alto en los extremos. Las catorce fuentes coinciden entre inicio y fin. No se confirmaron tomas, mediciones ni SOS; no hubo solicitudes de escritura de dominio.

El script activa cada tamaño mediante el control real y Enter. Utiliza Range por carácter para distinguir palabras enteras de fragmentos apilados, registra ancho útil de encabezados y comprueba objetivos de 44 px y mínimos forzados desproporcionados. Se inspeccionan encabezados, botones y summary; no se afirma que esta comprobación sea una auditoría integral de todos los textos o de WCAG. El mínimo táctil de 44 px es una elección de comodidad del proyecto, no una exigencia AA de WCAG 2.1. Las palabras que no caben físicamente por su tamaño pueden dividirse; se rechazan divisiones evitables y fragmentos severos.

`comparison.json` relaciona las mediciones anteriores y posteriores:

- El título de Opciones de lectura pasó de 60 a 364 px útiles y de 514,7 a 114,4 px de alto, conservando la fuente de 44 px.
- Los botones de toma pasaron de 128/137 a 76/76 px al 200 %, manteniendo la fuente de 32 px y un mínimo físico de 64 px.
- Los valores sintéticos 1000.0 y 500 caben con dígitos de 64 px. Solo se rellenaron para medir; no se revisaron ni guardaron.

`before-1280-200-reading*.png` y su JSON documentan el defecto anterior. `after-1280-200-reading*.png` muestran el panel corregido en el teléfono de escritorio. Las capturas definitivas por caso usan prefijos como `1280-125-standard-communication.png`. Los archivos `diagnostic-*.json` conservan fallos previos ya corregidos y no deben leerse como resultados finales. La carpeta `appointments/` contiene además la matriz específica del agente de citas sobre su fuente final.

La revisión visual final comprobó Opciones a 1280/200, Comunicarme a 1280/125 y los extremos numéricos. Esta prueba usa la escala del producto; no se presenta como zoom nativo, prueba con lector ni sesión con participantes.
