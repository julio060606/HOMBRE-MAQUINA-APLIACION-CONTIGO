# Archivos de CONTIGO APF3

La vista móvil se simplificó después de esta entrega según el feedback del grupo. Los PDF, PPTX, XLSX y anexos de esta carpeta conservan la revisión anterior con pestañas; deben actualizarse antes de utilizarlos como evidencia de la interfaz actual. La nueva comprobación de medicamentos y mediciones está en `evidence/mobile-simplified/verification.json`.

Se preparó la aplicación local y un paquete técnico para revisión del grupo. Se documentaron las cuatro tareas con teclado y zoom nativo al 200 %. Con NVDA 2026.3 se registraron T1, T2 y T4, además de la navegación de T3; su lectura completa de valores sigue pendiente. La entrega académica todavía necesita las pruebas con personas y la ejecución real de Figma y Stark. No está lista para presentarse como validación inclusiva completa ni como conformidad AA.

| Archivo | Contenido |
|---|---|
| APF3_GrupoPorConfirmar_CONTIGO.pdf | Informe técnico con alcance, línea base, resultados reales de herramientas, ajustes, normativa, declaración parcial y plan de cierre. |
| APF3_GrupoPorConfirmar_CONTIGO.pptx | Presentación de doce diapositivas con evidencia antes y después y notas para la exposición. |
| APF3_Matriz_y_validacion_CONTIGO.xlsx | Cincuenta criterios A/AA y veintiséis núcleo por pantalla, hallazgos, prioridad, trazabilidad y hojas vacías para sesiones, SEQ y SUS. |
| APF3_Protocolo_y_fichas_CONTIGO.pdf | Protocolo, consentimiento sin completar, observación, SUS, SEQ, tecnología de apoyo y guion de sustentación. |
| APF3_GrupoPorConfirmar_Anexos.zip | Matriz, instrumentos, declaraciones y evidencia técnica sin imágenes internas de QA. |
| figma/CONTIGO_APF3_Figma.zip | Plugin local que genera páginas, componentes, anotaciones y conexiones editables. Falta ejecutarlo e inspeccionarlo en Figma. |
| APF3_Declaracion_IA.md | Uso de los agentes y herramientas, procedencia y responsabilidad de revisión. |
| Declaracion_de_accesibilidad.md | Alcance, métodos, limitaciones, plan y canal para reportar barreras. |

La auditoría principal registra veintiún estados de la base y veintitrés de la copia modificada. En la copia modificada no se detectaron incidencias axe en esos veintitrés estados. Hay comprobaciones complementarias de orientación, espaciado, preferencias, contraste, tablas y foco; el detalle y los resultados incompletos que requieren revisión están en los JSON. Estos resultados no son métricas de participantes.

La continuación conserva tres resultados incompletos de axe. La revisión específica de contraste midió 43 nodos: 31 límites conservadores superaron sus umbrales y 12 quedaron inconclusos por las limitaciones de la sonda o de la restauración de imagen. Un resultado inconcluso no se presenta como un incumplimiento ni como una comprobación aprobada. Las imágenes de sonda están identificadas y separadas de las capturas originales.

El frontend pasó sus cuarenta y ocho pruebas, ESLint y compilación de producción. El módulo de reportes conserva un aviso de tamaño y la revisión de dependencias mantiene avisos de seguridad detallados en `dependency-audit.json`. El backend no se modificó ni se volvió a validar en esta tarea.

Sustituir `PorConfirmar` por el número real de grupo antes de entregar. La aplicación local se puede probar en http://127.0.0.1:3001/login mientras Vite esté en ejecución. No se han subido cambios a GitHub ni actualizado Vercel.

Consultar `../../README_APF3.md` para ejecutar el proyecto y completar los pendientes. La carpeta `qa` y los archivos inspect son intermediarios de verificación y no deben entregarse como evidencias de usuarios.
