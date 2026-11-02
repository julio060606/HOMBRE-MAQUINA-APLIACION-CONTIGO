# Verificación técnica del zoom nativo del navegador

La ejecución final está en [verified-native-api-final/native-zoom.json](verified-native-api-final/native-zoom.json). Contiene doce mediciones y doce capturas PNG originales del viewport del navegador.

Se utilizó Chrome for Testing 145.0.7632.6, distribuido con Playwright 1.58.2, con un perfil temporal aislado y una extensión local que solo admite pestañas HTTP de `localhost` o `127.0.0.1`. La extensión llamó a `chrome.tabs.setZoomSettings` con `mode: "automatic"` y `scope: "per-tab"`, y después a `chrome.tabs.setZoom` con factores 1 y 2. Cada captura registra la lectura independiente de `chrome.tabs.getZoom` y `getZoomSettings`.

| Medida | Zoom nativo 100 % | Zoom nativo 200 % |
|---|---:|---:|
| `chrome.tabs.getZoom` | 1 | 2 |
| `window.innerWidth` | 1262 | 631 |
| `window.devicePixelRatio` | 1 | 2 |
| Fuente CSS del elemento raíz | 16 px | 16 px |
| Dimensiones de cada captura visible | 1262 × 864 px | 1262 × 864 px |

La fuente CSS permanece en 16 px: el cambio lo aplica el navegador mediante su API de zoom. El script no introduce `zoom` CSS, no fuerza `deviceScaleFactor` y no cambia el viewport mediante emulación. El JSON conserva también dimensiones exteriores, `screen`, `visualViewport`, métricas CDP, versión del navegador y eventos de cambio de zoom.

La ejecución se realizó en modo headless del navegador Chromium completo, que admite extensiones. Los valores de `screen` registrados pertenecen a ese entorno de prueba y no se presentan como las dimensiones de un monitor físico de Windows. Las imágenes son capturas del viewport web, no del escritorio ni de la barra de herramientas de Chrome.

Se ejecutaron técnicamente con `getZoom() = 2` estos recorridos de datos sintéticos:

- T1: registrar la respuesta de Losartán de las 08:00 y comprobar la confirmación escrita.
- T2: abrir el SOS persistente desde Medición, revisar el alcance y confirmar una petición de demostración.
- T3: entrar como cuidador, consultar tratamiento, existencias de 29 tabletas después de T1 y próxima cita de demostración.
- T4: provocar el error de presión 80/120, corregir a 120/80, revisar y guardar la lectura.

Estos son recorridos automatizados de funcionamiento. No son tasas de éxito de participantes, tiempos humanos, resultados SUS/SEQ ni una prueba de lector de pantalla. Tampoco acreditan por sí solos conformidad completa con WCAG 1.4.4 o 1.4.10. El factor se restableció a 1 y el navegador aislado se cerró al terminar.

Las capturas finales se obtuvieron con `Page.captureScreenshot`, sin `clip`, sin editar imágenes y con `captureBeyondViewport: false`. El primer intento, conservado en esta carpeta raíz, utilizó capturas `fullPage` de Playwright y produjo recortes de ancho al combinarse con zoom nativo; no se debe utilizar ese intento preliminar como evidencia visual final. La carpeta `verified-native-api` conserva una segunda ejecución completa con el método CDP correcto. Ningún registro previo del APF2/APF3 se reemplazó.

## Reproducción

Con Vite ejecutándose en el puerto 3001, desde `tools/apf3`:

```powershell
npm.cmd ci
npx.cmd playwright install chromium
node native-zoom.mjs http://127.0.0.1:3001 nueva-ejecucion
```

Cada etiqueta debe ser nueva: el script rechaza sobrescribir un JSON de evidencia existente. El código de la extensión está en `tools/apf3/native-zoom-extension/` y no se instala en el perfil personal del usuario.

Fuentes oficiales consultadas: [API Tabs de Chrome](https://developer.chrome.com/docs/extensions/reference/api/tabs), [pruebas de extensiones de Playwright](https://playwright.dev/docs/chrome-extensions) y [Page.captureScreenshot de CDP](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-captureScreenshot).
