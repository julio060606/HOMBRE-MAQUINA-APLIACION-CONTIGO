# Verificación de Comunicarme: interfaz progresiva

Los resultados finales son `communication-board.json`, `communication-board-keyboard.json` y las 36 imágenes `board-*.png` enlazadas en el JSON. Incluyen editor, mensaje y respuesta en 320/390/430 px, escalas del producto 100/200 % y ambos contrastes. La escala del producto no equivale al zoom nativo del navegador.

Se verificaron selección, edición, respuesta progresiva, conservación al editar, borrado al cerrar, ausencia de almacenamiento de mensajes, modo sin sonido, ciclo Tab/Mayús+Tab y retorno de foco. No se hicieron solicitudes API ni modificaciones clínicas. Las huellas de las dos fuentes finales están en el JSON.

Los 36 estados no detectaron violations de axe ni desborde horizontal. Axe conserva 417 nodos incomplete de contraste por detección de solapamientos del modal. No se ocultan ni se presentan como aprobación completa WCAG; requieren revisión adicional. La revisión visual comprobó reflujo y acceso al cuerpo del panel, especialmente con texto ampliado, además de la geometría automática.

`diagnostics-pre-final` contiene vistas intermedias previas al cierre visual; no sustituye las capturas finales ni corresponde necesariamente a las huellas finales. Reproducción desde la raíz del proyecto: `node tools/apf3/verify-communication-board.mjs` con el frontend local en 3001.
