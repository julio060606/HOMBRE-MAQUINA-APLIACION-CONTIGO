# Entrega canónica actual de CONTIGO APF3

Fecha de corte: 3 de noviembre de 2026. Repositorio: `C:\Users\vegac\Documents\Hombre Maquina`.

Este paquete describe una sola revisión: paciente con medicamentos y mediciones en una vista, formulario rediseñado con revisión y API/PostgreSQL local. Los entregables anteriores están en `history/2026-11-03-pre-current-refresh`. El paquete anterior `Downloads/CONTIGO_APF3` corresponde a otra revisión y no alimenta estos resultados.

| Archivo canónico | Contenido |
|---|---|
| APF3_CONTIGO_Informe.pdf | Contexto, métodos, evidencia actual, ajustes, validación pendiente, normativa y declaración parcial. |
| APF3_CONTIGO_Presentacion.pptx | Doce diapositivas con capturas de esta revisión. |
| APF3_CONTIGO_Matriz.xlsx | Cincuenta criterios y veintiséis núcleo por estado observado; hallazgos, trazabilidad y fichas sin respuestas humanas. |
| APF3_CONTIGO_Instrumentos.pdf | Protocolo, consentimiento modelo sin firmar, observación, SUS y SEQ. |
| APF3_CONTIGO_Anexos.zip | Entregables, fuentes y evidencia exclusiva actual, con manifiesto SHA-256. |

La evidencia actual está en `evidence/current-2026-11-03`. `api-database.json` y `storage.json` documentan salud, accesos y lecturas de API/PostgreSQL central, sin cambios clínicos. `api-audit/audit.json` conserva axe y capturas de los estados API actuales. `flows/keyboard-current.json` recorre T1–T4 en demostración aislada de puerto 3013: las escrituras de T1 son privadas, T2 cancela y T4 revisa y vuelve sin guardar. No se presentan como escrituras sobre PostgreSQL.

`contrast/summary.json`, `before.json` y `after.json` registran contraste y geometría del formulario. Se comprueban 12 combinaciones de ancho 320/390/430, escala de lectura 100/200 % y estándar/alto contraste, con valores sintéticos extremos. La escala del producto no equivale al zoom nativo del navegador. El archivo inspect es diagnóstico y no representa el resultado final.

La lectura completa de T3 con NVDA actual no fue verificada: el proveedor de control de pantalla detuvo el intento antes de los gestos por no poder comprobar la URL activa. El estado está en `flows/nvda-api-t3/status.json`. Los anuncios históricos de NVDA y el zoom nativo previo mantienen su versión y no se reutilizan como aprobación de la interfaz actual.

El usuario ha diferido expresamente el trabajo en Figma para después. Figma nativo publicado y Stark permanecen pendientes hasta existir archivo actual ejecutado, inspeccionado y compartido. El paquete generador Figma actual es preparatorio y no sustituye el enlace. Los resultados técnicos no acreditan conformidad AA completa ni validación inclusiva.

Las sesiones de cinco participantes y tres perfiles, los consentimientos y SUS/SEQ permanecen pendientes. No se inventaron personas ni se sustituyeron datos ausentes por cero. Para Excelente C3 se requieren además dos personas con condición real o tecnología de apoyo habitual.

La aplicación central se prueba localmente en `http://127.0.0.1:3001/login` con el lanzador del repositorio. La publicación queda diferida: el equipo todavía no dispone de alojamiento para el backend. Publicar requiere backend alojado y frontend configurado y probado en sesión nueva. La ejecución local no acredita Vercel. Número de grupo y correo no son necesarios para preparar estos archivos.

`qa` contiene revisión interna y queda fuera del ZIP. Los consentimientos originales y datos identificables se conservan en privado. No se modifica `output/revision-cumplimiento`, que documenta la revisión previa.
