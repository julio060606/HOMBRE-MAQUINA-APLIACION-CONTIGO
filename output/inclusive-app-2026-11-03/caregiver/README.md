# Dashboard del cuidador: claridad y acceso

Revisión del 3 de noviembre de 2026 sobre la aplicación local con API y PostgreSQL. Las ayudas se integran en el encabezado del dashboard, junto al paciente seleccionado. La cuenta personal, vinculación y salida se agrupan bajo «Mi cuenta».

## Decisiones

La vista inicial prioriza tomas pendientes, próxima cita y avisos. Los avisos críticos permanecen visibles completos, sin el límite anterior de tres registros. Las gráficas, porcentajes de tomas y avisos adicionales se consultan bajo demanda. Un acceso «Revisar avisos» abre la sección correspondiente y lleva el foco a su encabezado. Las dosis canceladas y las respuestas ya registradas siguen disponibles; el filtro «Todas» recupera estas últimas.

El menú utiliza palabras breves, iconos acompañados de texto, foco visible y controles amplios. Al abrir el menú móvil, el foco entra en sus enlaces; Escape cierra y lo devuelve al botón. El menú cerrado no participa en Tab. Con texto ampliado se usa el mismo menú y se apilan las filas; se limita el padding y el tamaño decorativo del avatar para conservar el tamaño de lectura elegido.

Estas decisiones se apoyan en la [guía WAI para personas mayores](https://www.w3.org/WAI/older-users/), que relaciona visión, audición, movilidad y memoria con las barreras de uso, y en la [orientación cognitiva de WAI](https://www.w3.org/WAI/WCAG2/supplemental/objectives/o1-understandable/), sobre propósitos claros, controles familiares y consistencia. Son decisiones de este proyecto; no acreditan conformidad completa ni sustituyen pruebas con personas usuarias.

## Evidencia

`audit.json` registra doce combinaciones: anchos 320/390/1440, escala del producto 100/200 % y contraste estándar/alto. Conserva axe, capturas, geometría y hashes. Se comprueban la ubicación de las ayudas, menú por teclado, acceso a detalles, filtro Todas y salida. Los registros técnicos se limitan a autenticación y lecturas autorizadas; se bloquean las escrituras de dominio. Las observaciones incomplete de axe permanecen en el JSON.

Dos pruebas de renderizado verifican que una cuarta alerta crítica siga visible y que la lista inicial priorice tomas sin respuesta conservando el control Todas. Pasaron junto con cuatro regresiones previas, TypeScript y ESLint. Las capturas iniciales con problemas de padding no son evidencia final: consultar las `dashboard-*.png` enlazadas en `audit.json`. `overflow-diagnostic.png` es únicamente diagnóstico.

Reproducir desde la raíz, con la aplicación local en 3001: `node tools/apf3/verify-caregiver-inclusion.mjs`. No son sesiones con participantes ni pruebas con lector de pantalla o zoom nativo.
