# Flujos integrados del aplicativo paciente

Comprobación técnica del 3 de noviembre de 2026, posterior a estabilizar el contenedor móvil. Fuente y huellas SHA-256 en `patient-flow.json`; script reproducible: `tools/apf3/verify-inclusive-patient-flow.mjs`.

Dos contextos privados independientes: 390 px con texto al 100 % y 320 px con texto al 200 %, ambos con viewport de 1000 px de alto. Se usó Vite temporal en 3014 con `VITE_USE_MOCKS=true` solo en su proceso. No se editó `.env`. Se bloquearon todas las solicitudes API y se registraron cero solicitudes. Las escrituras sintéticas quedaron únicamente en IndexedDB privado de cada contexto.

T1: mediante Tab y Enter se declaró una toma, se revisó su respuesta y se abrió una corrección. El motivo fue obligatorio; cancelar devolvió el foco y conservó el registro. Una corrección posterior a «No la tomé» guardó el motivo y avanzó exactamente una versión. La confirmación recibió foco y su centro era visible dentro de `[data-app-surface]`, sin superposiciones.

T4: se ingresó 80/120, se comprobó el error asociado al campo y la conservación de ambos valores. Se corrigió a 120/80; revisar no guardó nada y no inventó pulso. Volver a «Corregir números» conservó 120/80 y el foco. Una confirmación explícita guardó exactamente una lectura sin pulso. El resultado recibió foco y quedó visible dentro del aplicativo.

Todas las activaciones y escrituras se hicieron mediante teclado. Antes de activar se comprobó que el centro del control estuviera dentro de la superficie móvil y que `elementFromPoint` no detectara un elemento superpuesto. Las capturas corresponden al viewport completo, no a un locator largo recortado por su ancestro.

Resultado: `complete=true`, cuatro comprobaciones de tarea (dos por contexto), cero errores y cero solicitudes API. Las once huellas de fuente permanecieron estables durante la ejecución. Se detuvo el servidor 3014 propio y se confirmó el puerto libre; no se tocaron 3001, 8081 ni PostgreSQL.

Estas pruebas no son sesiones con participantes ni lectura nativa con tecnología de apoyo. La escala del producto no equivale a zoom nativo. La validación de escrituras en API/PostgreSQL queda fuera de este ensayo: aquí se verificó el laboratorio sintético.
