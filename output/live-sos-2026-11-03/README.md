# Comunicación SOS — verificación técnica

La aplicación conserva solicitudes y mensajes en la API local y PostgreSQL. La voz se establece entre navegadores por WebRTC; una persona autorizada debe aceptar la solicitud desde el dashboard. Este flujo no constituye una central telefónica ni acredita atención de una clínica real.

Para reproducir la comprobación con los servicios locales activos:

```powershell
node tools/apf3/verify-live-sos.mjs http://127.0.0.1:3001
```

El script inicia dos contextos de Chrome separados con las cuentas sintéticas de Dacio y del cuidador. Chrome genera el audio de prueba; no se activa un micrófono físico ni se solicita acceso en el navegador del usuario. Se comprueban los paquetes de audio entrantes mediante `RTCPeerConnection.getStats()`, además de los estados de conexión y los mensajes.

Las únicas escrituras permitidas son la autenticación de estos contextos, las nuevas solicitudes de apoyo creadas durante la comprobación y el reconocimiento de sus avisos propios durante la limpieza. El script finaliza exclusivamente las sesiones que crea, y conserva sus identificadores en `audit.json`. Su lista permitida para reconocer avisos se deriva de los `alertId` devueltos al crear estas sesiones. Los avisos quedan en el historial académico; no se borran datos ajenos.

El resultado ejecutado y la validez de las fuentes se determinan mediante `audit.json`: `complete` debe ser `true`, los controles deben aprobar y `changedSourcesDuringRun` debe estar vacío. Las capturas fallidas se distinguen con el prefijo `failure-`; no son evidencia de aprobación.

## Resultado de esta revisión

`audit.json` terminó con `complete: true`: nueve controles aprobados, doce archivos de fuente con hashes iguales al inicio y al final, y cero errores JavaScript. La solicitud del paciente Dacio apareció en la sesión independiente del cuidador aunque el dashboard tenía seleccionada a Rosa. La latencia observada desde el primer clic hasta su aparición fue de 73 ms en este ensayo local; esta medición no garantiza los tiempos de una red pública ni que una persona esté disponible.

Se acreditaron mensajes guardados durante la espera, intercambio de texto en ambos sentidos, conservación del borrador ante un fallo de red y un único mensaje después del reintento. Denegar el micrófono mantuvo disponible la alternativa escrita. Ambos extremos WebRTC recibieron paquetes de audio: el primer registro conservado muestra 25 paquetes entrantes en el paciente, además de las estadísticas del otro extremo. También aprobaron silenciar y reactivar las pistas, apagar el audio, la protección del micrófono remoto al desconectarse, la reconexión y la finalización de ambos micrófonos.

El diálogo móvil a 320 px y texto al 200 % quedó dentro del teléfono, sin desbordamiento horizontal y con el foco contenido. Axe no detectó violaciones en los dos diálogos revisados: el del dashboard conservó un resultado incompleto que requiere evaluación manual; el móvil no tuvo resultados incompletos. Esto es un control automático acotado, no una declaración general de conformidad WCAG.

La solicitud final de prueba fue `fabe07ff-2234-4a20-a723-f9dcdcfe65a8`, con aviso `1d8dfd28-ae3b-4cb1-a6e4-ddf51bc6ccdc`; el cierre de limpieza respondió HTTP 200. Las otras dos ejecuciones se preservan como diagnósticos: `diagnostic-script-send-race.json` corresponde a una lectura demasiado temprana del script, y `diagnostic-mobile-overflow.json` al desbordamiento de cuatro píxeles corregido antes de la revisión final.

Después de la verificación se reconocieron los tres avisos propios acreditados por estos informes. `owned-alert-cleanup.json` registra los identificadores, los hashes de los informes de procedencia y los tres recibos HTTP 200 con `isResolved: true` y `notificationStatus: ACKNOWLEDGED`. Esto permite conservar el historial sin dejar los ensayos como pendientes en el dashboard. No se reconocieron otros avisos ni se borraron registros. La limpieza utiliza una sesión propia del cuidador, cerrada al terminar. Para repetir exclusivamente esta limpieza acreditada, sin ejecutar otra conversación:

```powershell
node tools/apf3/verify-live-sos.mjs http://127.0.0.1:3001 --cleanup-owned
```

Capturas principales:

- `00-boton-sos-contexto.png`: botón dentro del teléfono simulado en escritorio.
- `02-alerta-dashboard.png`: solicitud de Dacio mientras Rosa está seleccionada.
- `03-conversacion-texto.png`: conversación escrita.
- `04-permiso-denegado.png`: alternativa accesible cuando no se permite el micrófono.
- `04-audio-paciente.png` y `05-audio-dashboard.png`: conexión de audio en ambos extremos.
- `06-movil-320-texto-200.png`: diálogo estrecho con texto ampliado.

Esta prueba no reemplaza sesiones con usuarios, lectores de pantalla, micrófonos reales, personal clínico ni redes distintas. El despliegue por Internet requiere HTTPS y una configuración de conectividad WebRTC adecuada para sus redes, habitualmente con TURN. Consulte la [documentación oficial de WebRTC sobre TURN](https://webrtc.org/getting-started/turn-server).
