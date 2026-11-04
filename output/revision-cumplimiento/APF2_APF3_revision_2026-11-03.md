# Revisión de cumplimiento de APF2 y APF3 de CONTIGO

Fecha de revisión: 3 de noviembre de 2026.

El proyecto cumple parcialmente ambas consignas. La implementación local tiene un avance funcional importante, pero la entrega pública presenta un bloqueo de autenticación y la evidencia experimental y de accesibilidad todavía está incompleta. No corresponde dar APF2 ni APF3 por cerrados con los archivos revisados.

## Alcance y fuentes

Se contrastaron estos documentos aportados con el código y los entregables disponibles:

- [Avance 2 actualizado](C:/Users/vegac/Downloads/CONTIGO_AVANCE_2_ACTUALIZADO%281%29.docx).
- [Consigna APF2](C:/Users/vegac/Downloads/IHM_Consigna_APF2.pdf).
- [Consigna APF3](C:/Users/vegac/Downloads/Consigna%20APF3%20%E2%80%94%20Interacci%C3%B3n%20Hombre%20M%C3%A1quina.pdf).
- Código actual de este repositorio y entregables en `output/apf3`.
- Paquete adicional encontrado en `C:/Users/vegac/Downloads/CONTIGO_APF3`, fechado el 3 de noviembre. Es una versión distinta y se distingue del paquete del repositorio, fechado el 2 de noviembre.

La revisión incluye extracción completa de los documentos principales, inspección visual de páginas relevantes de las consignas y del informe APF3 del repositorio, lectura de la matriz XLSX y de registros técnicos, y comprobaciones puntuales del sitio local y público. No se realizaron sesiones con participantes, una auditoría WCAG integral nueva, una revisión jurídica independiente ni una sustentación. No se editaron los documentos fuente ni el código de la aplicación.

## Bloqueo comprobado en la URL pública

El portal `https://hombre-maquina-apliacion-contigo.vercel.app/clinic` responde HTTP 200. Al enviar las credenciales de cuidador precargadas desde `/login`, la solicitud a `/api/v1/auth/login` devuelve **HTTP 405**. La interfaz permanece en el acceso y muestra «No se pudo completar la solicitud (405).» Se reprodujo el intento en dos sesiones aisladas.

Por tanto, que el portal abra no acredita que el producto permita completar los flujos declarados. El defecto afecta directamente C2 del APF2, según las secciones 4, 6, 7 y 10 de su consigna. La aplicación local sí permite iniciar sesión como paciente y cuidador. Debe revisarse la configuración de API y alojamiento de la versión pública y repetirse la prueba completa después de corregirla; no se atribuye una causa técnica definitiva sin inspeccionar ese despliegue.

## APF2

| Exigencia | Estado | Evidencia y trabajo necesario |
|---|---|---|
| Continuidad con el caso APF1 | Presente documentalmente | El informe conserva Clínica San Pablo y los roles de CONTIGO. No se aportó el APF1 original para cotejar íntegramente sus hallazgos. |
| Objetivo, variables y métricas de eficacia, eficiencia y SUS | Presente | Secciones 1 y 2, tablas 1 a 4. Define tiempos, errores, ayuda, controles y amenazas a la validez. |
| Protocolo de reclutamiento y sesiones con al menos tres usuarios reales o simulados | Parcial | Hay tres personajes y un protocolo propuesto. El propio texto aclara que no hay fichas que acrediten ejecución de las tareas vigentes, versiones, cronometraje u orden de prueba. |
| Tareas principales de principio a fin | Implementación local avanzada; entrega pública bloqueada | Existen T1 toma, T2 SOS de prueba y T3 consulta del cuidador. La URL entregada no deja superar el acceso en la comprobación realizada. |
| Al menos cinco pantallas relacionadas | Presente en la implementación local | Se cargaron resumen, medicamentos, mediciones, citas y ficha clínica del cuidador; también el acceso y la app del paciente. |
| Controles, validaciones, confirmaciones y estados | Presente en parte y con evidencia técnica | El formulario actual permite ingresar y revisar una medición antes de guardar. Los registros históricos cubren otros estados. No se reejecutaron todos los estados posibles en esta revisión. |
| Resolver visiblemente los tres hallazgos priorizados del APF1 | Parcial | H5 tiene respuestas explícitas; H6 sigue sin evidencia de fotografías validadas; ayuda y separación por roles mejoraron. El informe reconoce pendientes y no declara los tres cerrados. |
| Comparación visual antes y después | Incompleta en el Word | Las secciones 3.1 a 3.3 describen el antes mediante texto/esquemas y reconocen la falta de capturas base. Las capturas posteriores no sustituyen por sí solas el antes. |
| Resultados por usuario y tarea | Incompleto | Tablas 10 y 11: ejemplos heredados. T3 vigente figura sin medición; el SUS de P3 corresponde al ejemplo anterior y no valida esa nueva tarea. |
| Diez ítems SUS y fórmula | Presente y aritméticamente correcto | Las respuestas producen 97,5; 92,5; 97,5. Media: 95,83/100. Se verificó el cálculo. Sigue siendo una matriz simulada. |
| Interpretación y conclusiones sustentadas | Parcial | El informe explica sus límites correctamente. La diferencia de tiempos de T1 no demuestra mejora causal porque mezcla ayuda y abandono con tareas terminadas autónomamente. |
| PDF de máximo 14 páginas de cuerpo y PPTX de máximo 14 diapositivas | No acreditado con la entrega aportada | Se entregó para revisar un DOCX, no el PDF y PPTX finales APF2. Su propiedad interna registra 16 páginas totales; eso no demuestra exceso, porque portada y referencias se excluyen. Exportar y contar el cuerpo. No se identificó un PPTX APF2 de CONTIGO entre los archivos revisados. |
| Declaración de IA | Presente | El anexo declara Gemini/Codex. Falta verificar el cumplimiento de la política de porcentaje y la revisión/contribución del equipo; no puede deducirse un porcentaje por el estilo de redacción. |

### Distinción sobre la simulación

La consigna APF2 **sí admite usuarios reales o simulados**. No es correcto rechazar el avance simplemente porque los perfiles sean simulados. El pendiente es documentar una ejecución coherente de las tareas y su procedencia: el informe reconoce que conserva cifras ilustrativas del borrador, que no hay registros de las sesiones correspondientes y que T3 cambió. Un ejemplo numérico correctamente rotulado no equivale a una sesión simulada ejecutada y documentada.

### Lectura por criterio de rúbrica APF2

- **C1, metodología:** buena estructura propuesta, con ejecución pendiente de acreditar.
- **C2, prototipo:** avance local considerable; el error 405 de la URL pública es el bloqueo prioritario.
- **C3, resultados:** falta evidencia de testeo de la versión y tareas vigentes, especialmente T3.
- **C4, progresión:** hay explicación de los hallazgos, pero falta completar el antes/después y su comprobación.

No se asigna una nota numérica: la calificación también depende de los archivos efectivamente entregados y de la demostración del docente.

## APF3 del repositorio

| Exigencia | Estado | Evidencia y trabajo necesario |
|---|---|---|
| Heredar las tareas del APF2 y añadir T4 | Presente en el diseño | T1 a T3 se conservan y T4 aborda error, corrección y revisión de mediciones. |
| Auditar cinco o más pantallas y sus estados | Evidencia histórica disponible | La auditoría base tiene 21 estados y la posterior 23. Debe revalidarse frente a la interfaz actual. |
| Matriz de los 50 criterios y 26 núcleo | Estructura presente; evaluación parcial | La hoja Matriz WCAG tiene 1.150 registros, 50 criterios y 23 pantallas/estados; incluye los 26 núcleo. Tener filas no significa haber cerrado cada criterio: 877 resultados se rotulan como parciales, 229 como no aplica y 44 como cumplimiento observado limitado a título o idioma. |
| Triangular métodos automáticos, manuales y tecnologías de apoyo | Parcial | Hay axe, inspección técnica, teclado, zoom nativo y registros reales de NVDA. Persisten revisión manual integral, Stark y lectura completa de T3 pendientes. |
| Stark con ratios y simulaciones sensoriales | Pendiente | No hay ejecución acreditada de Stark. Los cálculos CSS y axe complementan, pero no sustituyen, esta evidencia explícita de la consigna. |
| Al menos nueve ajustes, tres por categoría | Cantidad propuesta presente; cierre parcial | La hoja Trazabilidad contiene 11 ajustes: 3 sensoriales, 4 motores y 4 cognitivos. Cada ajuste debe mantener criterio y evidencia válida antes/después. Los pendientes impiden tratar los once como cierre definitivo. |
| Resolver todas las prioridades altas | Cierre no acreditado | H03 y H04, prioridad 9, conservan límites explícitos sobre reflow/escalado integral. Los recorridos técnicos resueltos no acreditan el criterio completo. |
| Demo Figma navegable con seis páginas y kit accesible | Pendiente | `figma/estado.json` dice que el paquete está generado, pero no ejecutado ni publicado en Figma. El ZIP y el plugin no son un enlace a un archivo nativo navegable. |
| Teclado, zoom 200 % y lector | Evidencia técnica parcial | Hay T1 a T4 con teclado y zoom nativo. NVDA cubre técnicamente T1, T2 y T4; T3 solo navegación/encabezados. El foco fue dirigido programáticamente y no prueba descubrimiento autónomo. |
| Cinco participantes y tres perfiles | Pendiente | Cero filas con resultados de sesión y cero cuestionarios SUS completos en la matriz. Los formularios son instrumentos preparados. |
| Dos participantes con condición real o tecnología de apoyo habitual para Excelente | Pendiente | Es requisito de esa banda, además del mínimo de cinco participantes y tres perfiles de la sección 8. No se ha acreditado reclutamiento/sesiones. |
| Consentimientos y resultados anonimizados | Pendiente | Hay modelos, no consentimientos ejecutados ni resultados nuevos por participante. |
| Éxito, tiempo, errores, SEQ, SUS y barreras por perfil comparados con APF2 | Pendiente | Faltan resultados APF3 y una línea base comparable ejecutada. No reutilizar 95,83 como evidencia de satisfacción de participantes de APF3. |
| Marco normativo y declaración honesta | Presente documentalmente | El informe contiene marco normativo, principios, límites, plan y enlace a Issues. Declara evaluación parcial. Esta revisión no certifica vigencia jurídica ni cumplimiento legal integral. |
| PDF ≤15 páginas de cuerpo y PPTX ≤12 | Cantidad verificada | PDF: 14 páginas totales, con portada y dos de referencias; cuerpo de 11. PPTX: 12 diapositivas. La sustentación 12+3 no se ha observado. |
| ZIP con matriz, protocolo, evidencias y declaración de IA | Paquete presente; contenido humano incompleto | El ZIP contiene 318 entradas y una copia de la matriz idéntica a la externa. Faltan las evidencias humanas exigidas. El grupo sigue como PorConfirmar. |

### Evidencia desactualizada

El informe del repositorio describe navegación del paciente por pestañas; `ENTREGA.md` y `README_APF3.md` advierten que fue simplificada después. La integración posterior de bases y el rediseño local del formulario también cambiaron el producto. En consecuencia, las capturas y comprobaciones anteriores siguen siendo evidencia de su versión, pero no prueban automáticamente conformidad de la versión actual.

Las afirmaciones históricas de cero incidencias axe se limitan a sus estados y herramientas. Tampoco equivalen a cero barreras ni a cumplimiento integral de WCAG.

## Comprobación técnica de la versión actual

Tras encontrar el servidor local detenido, se volvió a iniciar con el lanzador del proyecto. El acceso local de paciente y cuidador funcionó. En esta revisión se ejecutó axe sobre cinco vistas del cuidador y sobre la app del paciente a 320 píxeles: no se detectaron violations en esas condiciones. Quedaron resultados incompletos de contraste en mediciones y de ARIA en el resumen. No se guardaron mediciones ni respuestas de toma.

Se comprobó además el paso de ingreso a revisión con valores sintéticos 120/80. Esto acredita ese paso técnico, no comprensión ni autonomía de participantes.

### Posible regresión de contraste en los campos

El formulario local modificado usa borde `#8b9e95` sobre fondo `#f8fbf9`. Los estilos calculados del navegador confirman ambos colores. Su contraste sRGB es aproximadamente **2,72:1**, inferior al objetivo de 3:1 para límites de controles cuando son necesarios para identificarlos. El paquete anterior documentaba 4,76:1 para otros colores.

Revisar este límite frente a 1.4.11 y comprobar también el modo de alto contraste. No reutilizar el ratio anterior para dar por aprobado el diseño actual. Que axe no lo marque no cierra este control manual. No se declara el criterio completo incumplido o aprobado solo a partir de una pareja de colores.

## Segundo paquete APF3 encontrado en Descargas

`C:/Users/vegac/Downloads/CONTIGO_APF3` contiene un informe de 10 páginas totales, una presentación de 12 diapositivas, una matriz, anexos y una implementación ZIP. Su informe y LEEME reconocen que no hay participantes ni Figma publicado, que Stark, lector y zoom nativo siguen pendientes, y que la copia inicial no fue acreditada como idéntica a APF2.

Este paquete no es equivalente al del repositorio: documenta ocho vistas y 58 pruebas, mientras el paquete del repositorio documenta otra auditoría y aporta registros de NVDA/zoom anteriores. Su declaración además reconoce que no dispone de un canal de recepción operativo para barreras. La guía indica `/apf3` y puerto 5173; el proyecto actual usa 3001 y no declara una ruta `/apf3` en sus rutas. No utilizar esa guía como instrucción de arranque del repositorio actual sin adaptarla.

No mezclar conteos, capturas y resultados de ambos paquetes como si fueran una sola evaluación. Elegir la versión que se entregará, vincularla a una revisión de código y actualizar el resto de documentos y evidencias.

## Orden recomendado para completar

1. Corregir el inicio de sesión de Vercel y comprobar en sesión nueva T1, T2 y T3 con las cuentas de prueba.
2. Elegir una versión única del producto y de los entregables; fijar código, fecha, datos y tareas de v2/v3.
3. Completar la evidencia APF2 de las tres tareas y del antes/después; registrar con claridad las simulaciones permitidas o las sesiones reales y recalcular resultados desde sus fichas.
4. Crear y publicar el Figma nativo, ejecutar Stark, revisar el kit y conservar las seis páginas y las nueve comparaciones mínimas.
5. Reauditar la interfaz definitiva por criterio y estado, incluidos contraste, teclado, zoom nativo y lector con lectura completa de T3. Resolver altas y documentar las medias según la consigna.
6. Ejecutar la validación APF3 con al menos cinco participantes y tres perfiles, con consentimiento, éxito, tiempo, errores, SEQ, SUS y barreras residuales. Para Excelente, cubrir el requisito de dos participantes con condición real o uso habitual de tecnología de apoyo.
7. Actualizar informe, PPT, matriz, declaración, anexos, grupo y contribuciones para que todos describan la misma versión; comprobar límites y ensayar 12 minutos más 3 de preguntas.

La base técnica permite continuar, pero las prioridades académicas son el acceso público, la evidencia de ejecución y la validación inclusiva. Añadir funcionalidades al producto no sustituye esos requisitos.
