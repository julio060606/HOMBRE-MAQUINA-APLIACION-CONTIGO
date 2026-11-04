# Ayudas dentro del teléfono: criterios de implementación y QA

Revisión técnica del 3 de noviembre de 2026. Son recomendaciones de implementación derivadas de fuentes primarias; no sustituyen pruebas con personas mayores ni tecnologías de apoyo. La prueba nativa con NVDA sigue pendiente por el bloqueo documentado del proveedor de control.

## Diálogo nativo y contención visual

`showModal()` eleva el diálogo al plano superior del documento. El `overflow: hidden` del marco simulado no basta para recortarlo. Conservar el diálogo nativo y calcular su geometría respecto de la intersección entre la pantalla del teléfono y la zona visible permite mantener la semántica modal sin que la ventana escape visualmente del dispositivo. Esta adaptación de geometría es una decisión del proyecto, no un requisito literal de WAI. Fuentes: [HTML Standard: dialog](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element), [MDN: top layer](https://developer.mozilla.org/en-US/docs/Glossary/Top_layer).

La modalidad nativa bloquea la interacción con el resto del documento, aunque el sombreado se recorte al teléfono. El panel no debe anunciarse como una región modal que permita operar simultáneamente el dashboard de fondo. Evitar `aria-hidden` en un ancestro que también contenga el diálogo. [WAI APG: patrón de diálogo modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

El fondo `::backdrop` también necesita geometría o recorte explícito. Los navegadores modernos permiten heredar las variables CSS del diálogo en su backdrop: Chrome/Edge 122, Firefox 120 y Safari 17.4 incorporaron esa herencia. La verificación debe registrar el `clip-path` calculado y una captura; no basta con comprobar una variable declarada. [Chrome for Developers: herencia de backdrop](https://developer.chrome.com/blog/css-backdrop-inheritance). El modelo de colocación se describe en el [borrador CSS Positioned Layout 4](https://drafts.csswg.org/css-position-4/#backdrop), que sigue siendo trabajo en curso.

## Foco, cierre y lectura

Al abrir, el foco debe entrar al panel. En opciones extensas resulta adecuado enfocar un título estático con `tabindex="-1"`, conservando el comienzo del contenido a la vista. Tab y Mayús+Tab deben recorrer sus controles sin salir; Escape y un cierre visible deben permitir volver al disparador. No colocar `tabindex` en el propio elemento `dialog` ni eliminar manualmente su atributo `open`: cerrar con su método conserva el ciclo nativo. Mantener un nombre accesible y una descripción breve; no unir todo el contenido complejo en una única descripción. Fuentes: [patrón APG](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [ejemplo APG y justificación del foco](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/), [HTML Standard](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element).

## Ampliación y desplazamiento

Con texto ampliado, comprobar que todos los textos y acciones permanezcan disponibles. El criterio 1.4.4 contempla ampliar hasta el 200 % sin perder contenido o función; la verificación debe identificar qué mecanismo usó. La escala del producto no debe llamarse zoom nativo. El reflujo 1.4.10 utiliza 320 píxeles CSS como referencia para contenido vertical y evita exigir desplazamiento en dos dimensiones, salvo excepciones concretas. Fuentes: [WCAG 2.1: ampliar texto](https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html), [WCAG 2.1: reflujo](https://www.w3.org/WAI/WCAG21/Understanding/reflow.html).

Para este teléfono, usar un solo contenedor vertical activo dentro del panel evita una combinación difícil de manejar de scroll del diálogo y scroll de su cuerpo. Excluir los textarea de ese conteo: su desplazamiento propio puede ser necesario para editar. A 200 %, un encabezado y pie fijos que dejen una franja mínima para el contenido son un defecto práctico aunque no haya overflow horizontal. Es preferible el scroll completo del panel a reducir el tamaño de texto elegido. Esta elección es una inferencia de diseño que debe comprobarse visualmente.

Medir de nuevo la superficie al cambiar tamaño, orientación o contenido y al desplazarse la página. El teclado en pantalla y el zoom táctil pueden cambiar la zona visual sin modificar el viewport de disposición; considerar los eventos de `visualViewport` y probar ese caso en dispositivos reales. [MDN: VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport).

## Necesidades de personas mayores

Las ayudas deben conservar una ubicación y nombres previsibles, iconos acompañados de texto, foco visible y acciones inequívocas. Reducir enlaces secundarios, texto repetido y cambios inesperados facilita la orientación. Las dificultades de visión, destreza, audición y concentración pueden coexistir; una ayuda visual no debe eliminar la vía escrita o el manejo por teclado. Estas recomendaciones se apoyan en [WAI: necesidades de personas mayores](https://www.w3.org/WAI/older-users/) y [aplicación de WCAG a personas mayores](https://www.w3.org/WAI/older-users/developing/).

## Criterios ejecutables del proyecto

- Disparadores de lectura, comunicación y SOS dentro de `[data-app-surface]`, sin duplicados globales en la app paciente.
- Diálogo marcado `data-dialog-in-app` completamente dentro de la intersección visible; backdrop recortado; dashboard sin límites heredados del teléfono.
- Texto, controles y acciones accesibles en 320/390/430 y escritorio, escalas 100/200 % y ambos contrastes.
- Un único contenedor vertical de contenido; ningún desborde horizontal; revisión visual del área útil además de las medidas.
- Apertura por Enter, foco inicial interior, Tab/Mayús+Tab, Escape y retorno al disparador; mostrar mensaje y solicitar respuesta por Enter.
- Lecturas autenticadas sintéticas sin modificar registros clínicos. No confirmar SOS durante QA.
- Conservar violations e incomplete de axe por separado; no inferir conformidad completa ni validación con participantes a partir del recorrido automático.

El script preparado es `tools/apf3/verify-inclusive-dialog-frame.mjs`; se ejecutará cuando la interfaz y el hook estén estables. Guardará evidencias en `output/inclusive-app-2026-11-03/dialog-frame/`.
