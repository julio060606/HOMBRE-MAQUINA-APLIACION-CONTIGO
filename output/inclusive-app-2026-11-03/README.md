# Integración inclusiva del móvil y dashboard

Revisión del 3 de noviembre de 2026 en el repositorio actual. Es una evolución del código, posterior a los paquetes APF3 y de comunicación anteriores; sus evidencias no se presentan como validación automática de esta revisión.

## Cambios aplicados

La app paciente incluye sus ayudas, salida y SOS dentro de la pantalla del teléfono. Los diálogos nativos se ajustan a la porción visible de esa pantalla; el fondo se oscurece dentro del marco. Se conserva el comportamiento modal del navegador: al abrirlos, el resto del documento queda inerte, el foco permanece dentro y vuelve al disparador al cerrar.

En viewport móvil se elimina el marco decorativo para aprovechar el ancho. La pantalla tiene un solo desplazamiento para cabecera, ayudas y contenido; con texto ampliado, los controles de arriba no ocupan permanentemente el espacio de lectura.

La tarjeta de medicamento muestra primero nombre, dosis, hora e instrucciones prescritas, con foto de referencia pequeña. Las respuestas de toma tienen 64 px de altura mínima. Diagnóstico y médico siguen disponibles en «Ver detalles del medicamento», y se conserva la corrección con motivo y versionado.

El dashboard reúne las ayudas en su cabecera, usa nombres breves de navegación y presenta pendientes, cita y avisos antes de gráficas secundarias. Todos los avisos críticos se mantienen visibles; no se limitan a los tres primeros. Los datos y funciones conservan sus permisos originales.

## Fundamentos consultados

- [WAI: personas mayores y accesibilidad](https://www.w3.org/WAI/older-users/): necesidades visuales, auditivas, motoras y cognitivas se solapan; se ofrecen adaptaciones elegibles por la persona.
- [COGA: controles comprensibles](https://www.w3.org/WAI/WCAG2/supplemental/objectives/o1-understandable/): ubicación coherente, etiquetas reconocibles y relación clara entre acción y contenido.
- [COGA: contenido claro](https://www.w3.org/WAI/WCAG2/supplemental/objectives/o3-clear-content/): texto breve, espacio y separación de información. Se aplicó divulgación progresiva conservando instrucciones esenciales.
- [WAI: tamaño de objetivos mejorado](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html): referencia de 44 px de nivel AAA; las acciones principales de toma usan 64 px. No se confunde esta buena práctica con el mínimo AA ni con conformidad completa.
- [APG: diálogos modales](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): foco inicial, navegación circular, Escape y retorno al control que abrió el panel.

## Evidencias de esta revisión

- `patient-dose/`: antes y después de la tarjeta, geometría, contraste y acceso al detalle. Las capturas largas durante la transición se distinguen de la revisión integrada.
- `patient-flow/`: T1 toma/corrección y T4 errores/revisión/guardado por teclado en dos contextos privados, 390 px/100 % y 320 px/200 %. Los cambios se guardan solo en IndexedDB de demostración; las solicitudes API están bloqueadas.
- `caregiver/`: doce combinaciones de ancho, escala y contraste con navegación móvil y detalles; consultas API de datos sintéticos sin escrituras de dominio.
- `dialog-frame/`: contención, foco, navegación y capturas contextuales de las ayudas en teléfono y dashboard. Consultar `complete` y el alcance de cada JSON, incluidas limitaciones y observaciones incomplete de axe.
- `research/`: investigación técnica sobre top-layer, fondo y modales dentro del marco simulado.
- `preview/`: capturas contextuales de la app integrada, sin guardar registros.

Frontend: 78 pruebas en 14 archivos, ESLint y compilación TypeScript/Vite aprobados. La advertencia existente de tamaño del fragmento de reportes no impide compilar. Las fuentes y resultados quedan enlazados en los JSON de cada prueba.

## Alcance pendiente

Estas son comprobaciones técnicas con datos sintéticos. Falta probar con personas de 60–80 años y personas con distintas discapacidades usando sus tecnologías habituales, además de recorridos reales con lectores de pantalla, zoom nativo y vibración física. La escala del producto no equivale al zoom del navegador. No se garantiza acceso universal ni se declara conformidad WCAG completa.

No se implementa una traducción automática inventada a lengua de señas. La comunicación escrita y la lectura opcional complementan las tecnologías de apoyo del dispositivo. El SOS sigue siendo una prueba y no acredita llamada a emergencias ni recepción del aviso.
