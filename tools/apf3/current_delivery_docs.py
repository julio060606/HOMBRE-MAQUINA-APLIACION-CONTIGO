"""Update entrypoints and declarations to the canonical current package."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'output/apf3'
def write_docs():
    entrega='''# Entrega canónica actual de CONTIGO APF3

Fecha de corte: 3 de noviembre de 2026. Repositorio: `C:\\Users\\vegac\\Documents\\Hombre Maquina`.

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
'''
    readme='''# CONTIGO APF3

El paquete canónico está en `output/apf3` y describe la interfaz actual de este repositorio. La app paciente reúne medicamentos y mediciones en una vista. El cuidador conserva tratamiento, existencias, citas y seguimiento. El formulario usa Número de arriba, Número de abajo, unidades, pulso opcional y revisión antes de guardar.

La aplicación central local trabaja con API y PostgreSQL y se prueba en <http://127.0.0.1:3001/login> mediante el lanzador del proyecto. No sustituir la integración central por demostración aislada para ocultar una configuración de despliegue. La publicación requiere backend alojado y comprobación completa de roles.

## Evidencia por versión

`output/apf3/evidence/current-2026-11-03` es el único corte que alimenta los resultados actuales. API/PostgreSQL acredita salud, acceso sintético y lecturas autorizadas sin cambios clínicos. La demostración privada de puerto 3013 sirve para teclado y cambios sintéticos aislados. Contraste/geometría registra el formulario vigente a 320/390/430 y escala de lectura 100/200 %, sin confundirla con zoom nativo.

Los entregables previos y sus fuentes se preservan en `output/apf3/history/2026-11-03-pre-current-refresh`. Las pruebas antiguas por pestañas, zoom nativo y NVDA no acreditan automáticamente el formulario rediseñado. El intento actual de lectura T3 fue detenido antes de gestos nativos por una limitación del proveedor de control de pantalla. Se conserva su estado y la lectura completa sigue pendiente.

## Regeneración de entregables

Los scripts `tools/apf3/build_deliverables_data.py`, `build_deliverables_pdf.py`, `build_deliverables_office.mjs` y `package_delivery.py` leen `output/apf3/current-config.json`. La rama actual utiliza `current_delivery_data.py`, `current_delivery_pdf.py` y `current_delivery_office.mjs`. Usar Node, Python y `@oai/artifact-tool` del runtime bundle obtenido por `load_workspace_dependencies`; no modificar esas dependencias.

Los archivos finales usan el prefijo `APF3_CONTIGO_`. Conservar una versión histórica antes de reemplazar y verificar las imágenes PDF/PPTX/XLSX. Las fichas y SUS/SEQ permanecen sin respuestas hasta disponer de sesiones consentidas. El número de grupo y correo no son necesarios para producir este corte.

## Pendientes académicos

Completar auditoría manual, prioridades altas, archivo Figma nativo compartido, Stark, tecnologías de apoyo sobre el código actual y cinco participantes de tres perfiles. Para Excelente C3 se añaden dos personas con condición real o tecnología habitual. El APF2 aporta ejemplos simulados, no una línea base observada.

No declarar Conforme AA ni inclusión validada completa mientras falten esas comprobaciones. El SOS registra una petición de prueba y no acredita contacto a emergencias. Las fotografías son de referencia. Ensayar doce minutos de exposición y tres de preguntas. Los consentimientos originales y cualquier dato identificable se guardan en privado. Consultar `output/apf3/ENTREGA.md`.
'''
    statement='''# Declaración de accesibilidad de CONTIGO

Fecha: 3 de noviembre de 2026. Estado: evaluación técnica parcial, no Conforme AA.

Alcance: interfaz local actual de paciente simplificada a medicamentos/mediciones, formulario rediseñado y vistas del cuidador registradas en `evidence/current-2026-11-03/api-audit/audit.json`. Métodos: axe en estados actuales, contraste sRGB sobre estilos calculados, geometría y teclado con datos sintéticos, e inspección de código. Las lecturas API/PostgreSQL central se distinguen del contexto privado de demostración para las tareas que cambian datos.

Por principio: Perceptible (20 criterios), Operable (17), Comprensible (10) y Robusto (3) permanecen parciales. La matriz distingue criterios, estados, resultado limitado y comprobaciones pendientes. Cero incidencias automáticas no constituye conformidad completa.

Faltan revisión manual integral, tecnologías de apoyo sobre la versión actual, Figma nativo publicado, Stark y validación con cinco participantes de tres perfiles. El intento NVDA T3 actual no llegó a gestos de lectura por detención del proveedor; no se infiere éxito de su árbol de accesibilidad. La escala de texto 200 % del producto no acredita zoom nativo. Las fotografías son de referencia y el SOS no contacta emergencias ni acredita entrega.

Plan: completar estas comprobaciones, resolver las prioridades altas, registrar barreras residuales y actualizar la matriz y declaración. El acceso público requiere backend alojado y frontend configurado y probado; la evidencia local no acredita Vercel.

Canal de reporte del proyecto: https://github.com/julio060606/HOMBRE-MAQUINA-APLIACION-CONTIGO/issues. Indicar pantalla, versión, acción, navegador y tecnología usada, evitando información médica, identidad y credenciales. No se atribuye aprobación institucional de Clínica San Pablo.
'''
    ai='''# Declaración de uso de inteligencia artificial en APF3

Codex y varios subagentes apoyaron implementación, inspección, ejecución de pruebas técnicas, documentación y generación de artefactos. La revisión actual usa el repositorio Hombre Maquina y un corte específico de evidencia; el paquete previo de Descargas no se mezcla con esta entrega.

Los registros de herramientas corresponden a operaciones efectivamente ejecutadas y delimitan origen central API/PostgreSQL frente a demostración aislada. No se generaron personas, consentimientos, testimonios ni métricas humanas de éxito, tiempo, SEQ o SUS. Las fichas permanecen sin resultados hasta realizar sesiones consentidas. No se declara lectura con NVDA cuando el proveedor detuvo el intento antes de los gestos.

El equipo debe revisar los artefactos, reproducir los resultados, documentar su contribución y cumplir la política de IA del curso. Esta declaración no calcula un porcentaje de autoría ni elimina los requisitos de revisión académica. No se atribuye representación institucional de la clínica.
'''
    for name,text in [('ENTREGA.md',entrega),('Declaracion_de_accesibilidad.md',statement),('APF3_Declaracion_IA.md',ai)]: (OUT/name).write_text(text,encoding='utf-8')
    (ROOT/'README_APF3.md').write_text(readme,encoding='utf-8')
if __name__=='__main__':write_docs()
