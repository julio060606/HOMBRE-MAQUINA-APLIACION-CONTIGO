# SOS con voz y mensajes — clínica de demostración

La clínica es ficticia, pero la comunicación entre las dos cuentas es funcional: el paciente registra una solicitud en PostgreSQL, el dashboard recibe el aviso y una persona autorizada puede aceptar para hablar o responder por escrito. No hay conexión con una institución real ni con telefonía o emergencias.

## Prueba en dos sesiones

1. Abre [CONTIGO](http://127.0.0.1:3001/login) como `dacio@contigo.example` y pulsa **SOS · Pedir ayuda**. La solicitud se envía inmediatamente, aunque no actives el micrófono.
2. En otra sesión de navegador abre el acceso como `cuidador@contigo.example` o `admin@contigo.example`. La clave académica de estas cuentas es `Contigo2026!`.
3. En **Solicitudes SOS**, elige **Atender solicitud**. Aparecen las solicitudes de todos los pacientes autorizados, aunque el selector principal muestre otro paciente. Cambiar de sección del dashboard mantiene la conversación abierta.
4. Escribe mensajes o pulsa **Activar micrófono** en ambos extremos y acepta el permiso del navegador. Si se bloquea la reproducción, usa **Escuchar llamada**. El texto permite conversar sin usar la voz.
5. **Finalizar y volver** o **Finalizar atención y cerrar** apaga el micrófono y termina la sesión. Se conservan la solicitud y los mensajes. Aceptar una conversación confirma recepción y no equivale a resolver una situación médica.

Usa dos navegadores, perfiles o una ventana privada para distinguir fácilmente las cuentas. La sesión de autenticación se guarda por pestaña. Las pruebas automatizadas usan contextos de navegador independientes.

## Acceso y conexión

El micrófono requiere HTTPS o `localhost`, permiso explícito y soporte WebRTC. Entrar desde otro teléfono por una IP HTTP permite usar texto, pero normalmente no permite abrir su micrófono. El audio actual se prueba en la máquina local; la conexión directa en una red local depende de su configuración. Para audio entre redes distintas se debe publicar frontend y API con HTTPS y configurar un servidor TURN. No hay un TURN ni un proveedor telefónico contratado en este proyecto. Referencias: [Media Capture and Streams de W3C](https://w3c.github.io/mediacapture-main/getusermedia/) y [servidores TURN de WebRTC](https://webrtc.org/getting-started/turn-server).

El modo sin sonido bloquea el inicio del audio y detiene las pistas existentes. Al cerrar o perder el permiso de acceso se detiene el audio local. Denegar el micrófono conserva los mensajes. No se graba audio ni se transcribe la voz. El texto se guarda en el servidor para los participantes de la conversación.

## Persistencia y permisos

- Migración `V10__support_conversations.sql`: tablas `telemetry.support_sessions` y `telemetry.support_events`.
- El paciente crea su propia solicitud; el cuidador vinculado o administrador autorizado puede atender. La aceptación se bloquea para impedir dos personas atendiendo la misma solicitud.
- Solo paciente y persona que aceptó pueden consultar o enviar mensajes y señales. Cada operación vuelve a comprobar la autorización vigente.
- Las operaciones usan identificadores idempotentes. Reintentar tras un fallo de red no duplica la solicitud o el mensaje.
- Estado `WAITING`, `ACCEPTED` o `ENDED`. Una sesión dura como máximo 30 minutos. La caducidad se comprueba al leer y con una limpieza programada cada minuto.
- Las señales SDP/ICE se eliminan al terminar o caducar; los mensajes quedan como historial. Cada sesión admite hasta 1000 eventos; cada mensaje, hasta 1000 caracteres.
- SSE anuncia cambios de estado después de confirmar la transacción. El dashboard usa actualización cada tres segundos como respaldo; la conversación consulta sus eventos cada segundo. La latencia depende de red, servidor y navegador.

## Verificación

La comprobación integrada reproducible está en `tools/apf3/verify-live-sos.mjs` y los resultados en [la evidencia de esta versión](output/live-sos-2026-11-03/README.md). Usa Chrome headless, dos cuentas sintéticas y dispositivos de audio simulados; comprueba paquetes entrantes de audio en ambos extremos. No equivale a una prueba de micrófonos físicos, lectores de pantalla, participantes ni una clínica real.

Esta funcionalidad está en el proyecto local. Los PDF, diapositivas y archivos de entrega APF3 anteriores representan sus cortes de fuente y no se regeneran automáticamente con esta mejora.
