# CONTIGO APF3

Este trabajo continúa el repositorio del grupo y conserva el caso Clínica San Pablo. La versión base está identificada por el commit `4656d72365080d18b267f69d565e4d77a7ae3d56`. Los cambios de la aplicación se encuentran en la copia local. No se ha publicado una nueva versión ni se han subido estos cambios a GitHub.

La revisión móvil solicitada posteriormente simplifica `/patient-app` a medicamentos y mediciones en una sola vista. Se retiraron la navegación inferior, el botón Ajustes, el acceso al dashboard y las vistas móviles de citas, salud y cuidador. Las respuestas previas pueden corregirse desde «Tomas registradas hoy». El SOS conserva su acceso superior y las opciones generales de lectura siguen disponibles.

Los informes y las evidencias del APF3 ya generados describen la revisión anterior con navegación por pestañas. No acreditan automáticamente esta nueva interfaz. Su comprobación específica se conserva en `output/apf3/evidence/mobile-simplified` y se puede repetir con `node tools/apf3/verify-mobile-simplified.mjs`. Los scripts históricos que recorren las pestañas corresponden a la revisión anterior.

## Probar la aplicación en Windows

Desde PowerShell, dentro de `frontend`:

```powershell
npm.cmd ci
npm.cmd run dev -- --host 127.0.0.1 --port 3001
```

Abrir <http://127.0.0.1:3001/login>. El modo de demostración se activa de manera predeterminada y solo utiliza datos sintéticos. Elegir una cuenta de paciente o cuidador y pulsar «Entrada Rápida». El SOS registra una petición de prueba; no contacta servicios de emergencia.

La opción «Opciones de lectura» permite ampliar el texto hasta el 200 % o utilizar alto contraste en el dispositivo. La app paciente tiene acceso al SOS, operación con teclado y revisión antes de guardar mediciones. El cuidador revisa y confirma los movimientos de existencias antes de registrarlos.

## Archivos del APF3

Los entregables se guardan en `output/apf3`: informe PDF, presentación PPTX, matriz XLSX, protocolo y fichas, evidencias técnicas y paquete de Figma. El nombre de grupo permanece `PorConfirmar` hasta que el equipo lo indique. Las imágenes de `qa` se utilizan para revisión interna y no forman parte de la entrega.

La matriz y los documentos distinguen las comprobaciones técnicas ejecutadas de los criterios que todavía necesitan revisión manual. Las capturas de `evidence/baseline` corresponden a la versión original y las de `evidence/after` a la aplicación modificada. La evidencia es local: no demuestra que la URL de Vercel tenga estos cambios.

## Reproducir la auditoría técnica

Con la aplicación en ejecución:

```powershell
cd tools/apf3
npm.cmd ci
node audit.mjs http://127.0.0.1:3001 after
node supplemental.mjs http://127.0.0.1:3001 after
```

Los scripts usan Chrome, Playwright y axe. Crean sesiones aisladas con datos sintéticos y registran las condiciones y limitaciones en JSON. Para obtener el «antes», ejecutar el proyecto desde una copia del commit base en otro puerto y pasar `baseline` como último argumento. No reemplazar el código actual por la versión base.

La prueba de ancho de 320 píxeles CSS y la ampliación de la fuente raíz al 200 % son comprobaciones técnicas diferentes del zoom nativo del navegador. Los scripts no ejecutan NVDA ni representan sesiones con participantes.

En la continuación se añadieron verificaciones independientes: `evidence/keyboard-tasks` contiene las cuatro tareas con eventos de teclado; `evidence/native-zoom/verified-native-api-final` acredita zoom nativo mediante `chrome.tabs.setZoom/getZoom` en Chromium aislado; `evidence/nvda` conserva anuncios reales de NVDA 2026.3 para T1, T2 y T4 y la navegación de T3. La lectura completa de los valores de existencias y cita con NVDA sigue pendiente. Son recorridos técnicos automatizados, sin participantes. El registro de NVDA no acredita por sí solo comprensión auditiva ni conformidad completa. La documentación en cada carpeta distingue los métodos y las limitaciones.

## Verificación del código

Desde `frontend`:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

El backend no fue modificado para esta entrega. Sus pruebas anteriores y la integración con servicios clínicos requieren su entorno propio; no se deducen de la comprobación del frontend.

La revisión de dependencias del 2 de noviembre de 2026 detectó 15 avisos existentes de npm (14 moderados y uno alto). El detalle está en `output/apf3/dependency-audit.json`. La solución propuesta para el aviso alto de Zod implica una actualización mayor y debe revisarse con sus resolutores y validaciones antes de un despliegue de producción. No forma parte de la declaración de accesibilidad.

## Cerrar la entrega académica

1. Confirmar número de grupo y revisar el informe, la matriz y la contribución de cada integrante.
2. Ejecutar el paquete de Figma en un archivo del grupo, comprobar sus capas y prototipo, medir con Stark y conservar capturas. Publicar el enlace de visualización y comprobarlo en incógnito.
3. Revisar los recorridos técnicos ya registrados con teclado, zoom nativo al 200 % y NVDA. Completar la revisión manual con la tecnología de apoyo de cada participante. El árbol de accesibilidad y los registros automatizados no sustituyen su experiencia de uso.
4. Obtener consentimiento y ejecutar las sesiones con al menos cinco participantes que cubran tres perfiles. Para la banda Excelente, al menos dos deben tener una condición real o usar habitualmente una tecnología de apoyo. Usar los formularios y registrar éxito, ayuda, tiempo, errores, SEQ y SUS sin rellenar datos ausentes con cero.
5. Comparar versiones solo cuando tarea, rol y criterio de cierre sean equivalentes. Los resultados de usabilidad del APF2 aportado son simulados y no constituyen una línea base empírica.
6. Actualizar la matriz, las barreras residuales y la declaración con los registros obtenidos. No declarar conformidad AA sin evaluar todos los criterios aplicables.
7. Publicar la web actualizada si el grupo lo decide y verificar el enlace en una sesión nueva. Ensayar doce minutos de exposición y tres de preguntas.

Los consentimientos originales deben conservarse en privado. El ZIP académico solo debe contener copias anonimizadas y evidencias sin información médica personal.
