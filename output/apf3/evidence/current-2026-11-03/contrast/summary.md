# Contraste y lectura del formulario de medición

Revisión técnica sobre la copia actual de CONTIGO en http://127.0.0.1:3001. Fecha: 2026-11-03T20:42:35.653Z.

Se modificó únicamente el módulo CSS del formulario. Los bordes esenciales usan ahora #74887e. Se mantuvieron los colores, tarjetas, disposición y tipografía del diseño existente; los bordes decorativos claros permanecen. El estado inválido conserva el borde de error incluso al recibir foco.

| Control | Antes | Después |
| --- | ---: | ---: |
| inputBoundary | 2.72:1 | 3.62:1 |
| typeUnselected | 2.97:1 | 3.77:1 |
| typeSelected | 5.60:1 | 5.60:1 |
| optionalPulse | 1.28:1 | 3.77:1 |

Los límites de entrada, selector sin seleccionar y pulso superan 3:1 respecto de sus superficies. El foco tiene anillo de 3 px, separación de 3 px y contraste 9.93:1 en modo estándar y 10.78:1 en alto contraste. El borde del error enfocado tiene contraste 8.02:1 y se acompaña de texto y aria-invalid.

Se probaron 12 combinaciones: anchos de 320, 390 y 430 px, escala de lectura 100 % y 200 %, con y sin alto contraste. Se midió el ancho tipográfico frente al área útil de cada entrada y su desplazamiento interno. Las 48 comprobaciones conservaron visibles todos los caracteres de presión 500/499, pulso 500 y peso 1000.0. Las entradas mantienen 64 px al 200 %. El ajuste adapta el espacio lateral de la tarjeta, sin reducir los dígitos. No hubo desbordamiento horizontal del documento.

La revisión y la acción Corregir números conservaron los valores en todas las combinaciones. No se activó Guardar medición. La protección de red bloquea cualquier escritura fuera de autenticación y no se detectaron intentos de escritura de mediciones. No se modificaron datos de salud en la base de datos.

Estas pruebas técnicas no son sesiones con participantes, no usan Stark ni lector de pantalla y no acreditan conformidad global AA. El 200 % corresponde a la opción de lectura de la aplicación, no al zoom nativo del navegador. inspect.json conserva un diagnóstico anterior; usar after.json como evidencia final.

SHA256 de after.json: 178763742e5ddec410c08326a446fef9b9ed86faf49727c2870d685c32b73864.
