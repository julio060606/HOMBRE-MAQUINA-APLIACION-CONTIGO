# Rediseño de Comunicarme y Opciones de lectura

Revisión del 3 de noviembre de 2026 sobre el proyecto actual. Las pruebas de la implementación anterior se conservan en `output/accessibility-communication-2026-11-03` y el paquete académico previo mantiene su alcance original.

## Cambios de experiencia e interfaz

- Opciones de lectura pasa a un panel modal: lectura/contraste, sonido/avisos y movimiento/precisión. El tamaño se elige mediante botones con estado visible y vista previa. Los interruptores conservan controles nativos, etiquetas y descripción. Los cambios se aplican al instante; Listo cierra y Restablecer revierte las preferencias.
- La barra superior reúne accesos con iconos y muestra cuántas preferencias están activas. Abrir el panel mantiene el contenido de la página en su lugar.
- Comunicarme presenta tarjetas de frases, un compositor con contador y una acción principal clara. Después muestra el mensaje en grande; la respuesta escrita se solicita cuando se necesita. Editar conserva la conversación, y cerrar la borra.
- Voz y borrado tienen menor prioridad visual; si la voz está desactivada, la razón permanece visible. Los detalles de privacidad se pueden desplegar.
- Con texto ampliado en celular el panel completo se desplaza, para que los encabezados y acciones fijas no oculten los controles. Se mantiene el tamaño de lectura elegido.

## Comprobaciones

Frontend: 76 pruebas en 13 archivos, ESLint y compilación TypeScript/Vite aprobados. La advertencia existente de tamaño del fragmento de reportes permanece sin impedir la compilación.

`options/interaction.json` registra cinco recorridos funcionales y doce combinaciones de ancho, escala y contraste. Incluye consentimiento de vibración simulada, persistencia, restablecimiento, cambio dinámico al 200 %, teclado, retorno de foco, geometría y acceso al botón Listo. `communication/` conserva 36 estados de editor/mensaje/respuesta, recorridos funcionales y teclado. Las observaciones incomplete de axe se conservan y no acreditan conformidad WCAG completa.

Son pruebas técnicas con navegadores privados y sin cambios de dominio en la API. No equivalen a sesiones con personas usuarias ni a un recorrido con lector de pantalla o zoom nativo. La vibración física no se ha comprobado.

## Reproducción

Con la aplicación local en 3001:

```powershell
node tools/apf3/verify-access-options.mjs
node tools/apf3/verify-communication-board.mjs
```

Los scripts escriben resultados y capturas en esta carpeta; trabajan con almacenamiento de contextos privados y bloquean las solicitudes API durante las pruebas de estos paneles.
