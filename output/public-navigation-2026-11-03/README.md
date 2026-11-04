# Acceso y navegación pública de CONTIGO

Revisión local del 3 de noviembre de 2026. Se simplificó el login a correo, contraseña y una sola acción principal. Se retiraron la columna promocional, las listas de beneficios, los avisos técnicos y el botón duplicado «Entrada rápida». Las cuentas académicas quedan disponibles en «Cambiar cuenta de prueba».

Landing y login comparten cabecera con Inicio, Cómo funciona, Clínica y acceso. El logo CONTIGO vuelve al landing. El portal clínico mantiene su identidad y añade enlaces claros al landing y al acceso. Los accesos de paciente/cuidador del landing preparan la cuenta correspondiente; siguen autenticando contra la API central. Una sesión abierta ofrece continuar en el espacio correcto o cambiar de cuenta explícitamente.

Los cambios de página colocan el foco en su título; los enlaces a secciones lo llevan a su encabezado. El menú móvil admite teclado y Escape, cierra al navegar y devuelve el foco al botón al cancelarlo. Atrás recupera la posición de lectura. Se guarda antes de navegar para que una página de destino más corta no borre esa posición. Una respuesta tardía de autenticación puede completar la sesión, pero no fuerza una redirección si ya saliste del login.

## Evidencia

`audit.json` terminó con `complete: true`, ocho controles funcionales aprobados, diez fuentes estables y cero errores JavaScript. No se intentaron escrituras clínicas. La prueba usa cuentas sintéticas sobre la API local, en un contexto Chrome independiente del navegador del usuario.

- 24 combinaciones: login, landing y clínica; anchos de 320 y 1280 px; texto al 100, 125, 150 y 200 %. Sin desbordamiento horizontal de la página. Axe no detectó violaciones en esas 24 combinaciones; los resultados incompletos se conservan para revisión manual.
- Dos combinaciones adicionales a 320 px/200 %, alto contraste y controles grandes: capturas y comprobación de desbordamiento del login y landing. Estas dos no incluyen un nuevo análisis axe.
- Recorridos entre páginas, enlaces repetidos a secciones, historial Atrás, menú por teclado y foco, selección de cuenta, contraseña visible/oculta, error de acceso con recuperación, prevención de envío duplicado, entrada real al paciente/dashboard, sesión abierta y salida durante una autenticación lenta.
- En el recorrido de historial se recuperó exactamente la posición de 1615 px. Es un ensayo local y no una garantía sobre todas las redes o tamaños de contenido.

Para reproducir con los servicios activos:

```powershell
node tools/apf3/verify-public-navigation.mjs
```

Las capturas se nombran por página, ancho y tamaño del texto. `previous-before-late-login-guard.json` corresponde al primer corte aprobado. `diagnostic-scroll-restoration.json` documenta el fallo intermitente de historial encontrado en una repetición y corregido antes del informe final. Las capturas `failure.png` conservadas son diagnósticas, no evidencia de aprobación de la versión final.

El registro es una comprobación técnica con Chrome headless. No sustituye las pruebas con personas, lectores de pantalla ni la evaluación completa de WCAG. Las entregas académicas generadas anteriormente conservan sus propios cortes de fuente.
