# Declaración de accesibilidad de CONTIGO v3.0

Fecha de revisión: 2 de noviembre de 2026. Estado: parcialmente conforme y evaluación en curso. No se declara conformidad WCAG 2.1 AA completa.

El alcance es la copia local del flujo paciente y del seguimiento del cuidador. La línea base corresponde al commit `4656d72365080d18b267f69d565e4d77a7ae3d56`; los archivos modificados se identifican en `evidence/after/source-manifest.json` y `git-diff.patch`. La copia pública de Vercel no se considera actualizada por estas comprobaciones locales.

Se realizaron ejecuciones con Chrome, Playwright y axe, recorridos técnicos automatizados de teclado, revisión de código y revisión visual de capturas. Se probaron anchos de 320 píxeles CSS, cambio de orientación de la ventana, espaciado del texto, preferencias de lectura al 200 %, modos de contraste, estados de error, carga, vacío y confirmación. Los registros detallan qué condiciones se ejecutaron. Ampliar la fuente raíz no equivale a configurar el zoom nativo del navegador.

La continuación añade un recorrido de las cuatro tareas con teclado, una prueba de zoom nativo al 200 % mediante la API de Chromium en un perfil aislado y un recorrido con NVDA 2026.3 que conserva sus anuncios reales de T1, T2 y T4 y la navegación de T3. La lectura completa de los valores de existencias y cita en T3 sigue pendiente con NVDA. Estas verificaciones técnicas no incluyen participantes ni acreditan comprensión auditiva. Los métodos y sus límites constan en `evidence/keyboard-tasks`, `evidence/native-zoom/verified-native-api-final` y `evidence/nvda`.

| Principio | Criterios A y AA | Estado del alcance |
|---|---:|---|
| Perceptible | 20 | Parcial; falta cerrar la revisión manual de todos los criterios aplicables y las simulaciones Stark. |
| Operable | 17 | Parcial; existen recorridos técnicos de teclado y zoom nativo, pendientes de revisión completa y validación con participantes. |
| Comprensible | 10 | Parcial; se implementaron instrucciones, revisión y recuperación de errores, pendientes de validación con personas. |
| Robusto | 3 | Parcial; hay anuncios reales de NVDA en las tareas probadas, sin cierre de todos los criterios ni validación con participantes. |

Las limitaciones conocidas incluyen la validación pendiente con participantes, la ejecución real del paquete Figma y Stark, la revisión manual completa de los criterios aplicables, las fotografías de medicamentos sin validación clínica documentada y la dependencia de las voces disponibles en el navegador. El SOS registra una petición de prueba y no acredita entrega a servicios de emergencia. Cero incidencias automáticas detectadas no implica que todos los criterios se cumplan.

El equipo debe completar los recorridos y sesiones, actualizar la matriz, resolver las barreras residuales y volver a emitir esta declaración con evidencia. Los objetivos táctiles de 44 píxeles se utilizan como buena práctica de WCAG 2.1 AAA; no se atribuyen al nivel AA. El objetivo de 64 píxeles para botones principales procede del proyecto.

Para reportar barreras puede utilizarse [Issues del repositorio del equipo](https://github.com/julio060606/HOMBRE-MAQUINA-APLIACION-CONTIGO/issues). Se verificó que el repositorio tiene habilitado ese canal. Indicar pantalla, versión, tarea, navegador y tecnología de apoyo, sin incluir datos de salud, contraseñas o información personal. GitHub puede solicitar una cuenta.
