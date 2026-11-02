# Evidencias técnicas del APF3 de Contigo

Estas herramientas ejecutan Chrome y axe sobre datos sintéticos del modo demostración. Producen capturas de la aplicación real, resultados JSON, dimensiones de controles y recorridos de teclado. No generan participantes, testimonios, tiempos humanos, resultados SUS ni conformidad WCAG integral.

## Preparación

Requiere Node.js compatible con el frontend y Google Chrome instalado. En PowerShell se utiliza `npm.cmd` para evitar la política local que bloquea `npm.ps1`.

```powershell
cd tools/apf3
npm.cmd ci
```

Iniciar la versión actual desde `frontend` en otra terminal:

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 3001 --strictPort
```

La línea base se preservó en el commit `4656d72365080d18b267f69d565e4d77a7ae3d56`, mediante un worktree separado en la carpeta temporal `contigo-apf2-baseline-4656d72`, con Vite en el puerto 3002. Nunca se cambia la rama del espacio de trabajo compartido para ejecutar la línea base.

## Ejecución reproducible

Desde `tools/apf3`:

```powershell
node audit.mjs http://127.0.0.1:3002 baseline
node supplemental.mjs http://127.0.0.1:3002 baseline
node additional.mjs http://127.0.0.1:3002 baseline
node audit.mjs http://127.0.0.1:3001 after
node supplemental.mjs http://127.0.0.1:3001 after
node additional.mjs http://127.0.0.1:3001 after
node closeups.mjs http://127.0.0.1:3002 baseline
node closeups.mjs http://127.0.0.1:3001 after
node contrast.mjs
node build-findings.mjs
node snapshot.mjs
```

Los archivos finales están en `output/apf3/evidence/baseline` y `output/apf3/evidence/after`. `audit.json` conserva los resultados completos de axe por pantalla y estado. `supplemental.json` registra medidas de navegación, foco, propósito de campos, títulos, estados y confirmaciones. `additional.json` registra orientación, espaciado, opciones de lectura y superficies de foco.

`findings.json` contiene observaciones y mejoras vinculadas a criterios, con severidad y alcance estimados técnicamente. Algunas observaciones son mejoras de diseño o buenas prácticas y no se presentan como incumplimientos demostrados. En particular, H05 conserva el foco visible que ya existía y 2.5.5 es AAA en WCAG 2.1. `comparison.json` cuenta ocurrencias automáticas por captura; esas cantidades no son criterios WCAG ni métricas de usuarios.

## Alcance y límites

- El viewport de 320 píxeles CSS comprueba distribución e identifica recortes dentro de contenedores. No acredita por sí solo el criterio completo de reflow.
- El estrés de fuente raíz al 200 % y la opción de texto al 200 % de Contigo son pruebas de texto ampliado. No se etiquetan como zoom nativo del navegador.
- El espaciado aplica interlineado de 1.5, margen entre párrafos de 2 em, espaciado de letras de 0.12 em y de palabras de 0.16 em. Las capturas requieren inspección visual.
- Los estados de error de almacenamiento y carga utilizan inyección de fallos explícita; el estado vacío usa un conjunto sintético sin recetas ni dosis. Las pantallas pertenecen a la aplicación, sin reemplazar su contenido con imágenes o HTML inventado.
- Cero infracciones automáticas no acredita conformidad AA. Los resultados incompletos de axe requieren revisión manual.
- No se ejecutaron NVDA ni Stark y no se presentan simulaciones como experiencias de personas con discapacidad. Las pruebas con participantes y consentimientos deben documentarse por separado.
- Las credenciales y datos de demostración no corresponden a pacientes reales. No se prueba entrega de SOS ni integración clínica real.

`source-manifest.json` y `git-diff.patch` identifican el código v3 inspeccionado mediante SHA-256, porque el HEAD original permanece igual mientras los cambios están sin confirmar.

## Verificación adicional del zoom nativo

La continuación del trabajo añadió `native-zoom.mjs` y una extensión local limitada a URLs HTTP locales. Esta prueba utiliza las APIs oficiales `chrome.tabs.setZoom` y `getZoom` en el navegador Chromium completo con perfil temporal aislado. No sustituye el zoom con CSS, DPR o emulación de viewport.

```powershell
npx.cmd playwright install chromium
node native-zoom.mjs http://127.0.0.1:3001 nueva-ejecucion
```

La ejecución final y sus límites están documentados en `output/apf3/evidence/native-zoom/README.md`. Los registros anteriores conservan su estado histórico; la nueva evidencia nativa se registra por separado.
