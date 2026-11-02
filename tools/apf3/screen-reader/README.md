# Recorrido técnico con NVDA real

La preparación utiliza una copia portátil aislada de NVDA 2026.3 y registros emitidos por el lector real. No modifica el perfil habitual del usuario ni instala NVDA. Los recorridos son comprobaciones técnicas del agente; no son sesiones con participantes.

El paquete oficial está en `%TEMP%/contigo-apf3-nvda/nvda_2026.3.exe`. Se comprobó su firma Authenticode de NV Access Limited y el SHA256 `A8A87CB823DA0C62CFBAE4A444AE5AE238D54DC82AD6D46D3FDB3FEF082799B2`. El ejecutable portátil indica versión 2026.3 y archivo 2026.3.0.58174.

`prepare.ps1` verifica el paquete y crea `profile-apf3/nvda.ini`, dentro de esa carpeta temporal. No inicia el lector. `start-local.ps1` rechaza reemplazar una instancia ya existente y registra el PID que inicia. Configura español, Speech Viewer automático y nivel IO 12, sin bienvenida, sonidos de inicio, actualizaciones, estadísticas, complementos o acceso remoto. No guarda cambios al salir.

Las opciones oficiales `--config-path`, `--log-file` y `--no-sr-flag` mantienen el perfil y el log dentro de la carpeta de trabajo y evitan cambiar la bandera global del lector. No se usa `--minimal`, pues esta versión omite con él los diálogos de inicio que activan Speech Viewer. No se usa `--secure`, pues desactiva el registro.

El código oficial de NVDA escribe las secuencias reales con la marca `Speaking [...]`. `extract-speaking.ps1` copia esas líneas y sus cabeceras temporales, sin generar texto ni invocar `speak`. Si el log carece de anuncios, falla. El log de origen se mantiene para la revisión local; cualquier evidencia que se incorpore a la entrega debe excluir contenido del escritorio ajeno a la demostración.

`foreground-local.mjs` y `traverse-browser.mjs` se conectan al perfil de prueba de Chrome en CDP 9223. Solo actúan cuando la pestaña tiene origen `http://127.0.0.1:3001`, validado antes de cada acción. Utilizan el API de Playwright para foco, teclado y captura de la página local. No automatizan ventanas ni entradas nativas de Windows. Se registran T1, T2 y T4 del paciente y T3 del cuidador, conservando las limitaciones de cualquier paso fallido.

La presencia de anuncios demuestra únicamente los controles y estados efectivamente observados con esta combinación de navegador y lector. No acredita inteligibilidad acústica, experiencia de una persona con discapacidad o conformidad integral WCAG. El sintetizador de este perfil es el automático real, no un reemplazo de texto fabricado.

Fuentes oficiales verificadas el 2 de noviembre de 2026:

- [Guía de NVDA](https://download.nvaccess.org/documentation/en/userGuide.html), también incluida en `portable/documentation/en/userGuide.html` para la versión 2026.3.
- [Opciones de línea de comandos](https://github.com/nvaccess/nvda/blob/release-2026.3/source/argsParsing.py).
- [Esquema de configuración](https://github.com/nvaccess/nvda/blob/release-2026.3/source/config/configSpec.py).
- [Activación de Speech Viewer al iniciar](https://github.com/nvaccess/nvda/blob/release-2026.3/source/core.py).
- [Visualizador nativo de voz](https://github.com/nvaccess/nvda/blob/release-2026.3/source/speechViewer.py).
- [Registro de secuencias reales](https://github.com/nvaccess/nvda/blob/release-2026.3/source/speech/speech.py).
