# CONTIGO APF3

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
