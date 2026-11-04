# Auditoría técnica WCAG 2.1 AA de CONTIGO

Evaluación local del 4 de noviembre de 2026 sobre paciente, cuidador y páginas públicas. Se revisaron los 50 criterios A y AA, con trazabilidad individual de los 26 núcleo de la consigna APF3.

## Resultado

| Estado del criterio | Cantidad |
|---|---:|
| Sin fallo en muestra | 28 |
| Fallo | 5 |
| Parcial | 7 |
| No aplica, con justificación | 10 |

Se documentaron cinco hallazgos normativos abiertos y dos ajustes adicionales. H01 tiene prioridad alta. Las correcciones y nuevas pruebas permanecen propuestas.

## Evidencia técnica

- 33 pantallas y estados con axe-core 4.11.0 sobre Chrome 156.0.8078.80.
- Cero incidencias automáticas detectadas y 14 resultados `incomplete`, con 72 nodos para revisión. Un resultado indeterminado requiere interpretación manual.
- 35 variantes de geometría, texto, espaciado y orientación.
- 15 capturas de zoom nativo, incluidas 13 al 200 %, confirmado con `chrome.tabs.getZoom` en Chromium aislado.
- 125 fuentes de la aplicación verificadas mediante SHA-256, sin cambios durante la auditoría.
- Los siete módulos del cuidador y el paciente pasaron el reajuste a 320 CSS px con escala normal. Los desbordamientos adicionales de U01 corresponden a combinar 320 px y escala interna 200 %.

`audit.json` contiene 29 estados principales. `probes.json` añade cuatro estados con axe y las reproducciones complementarias. Los estados adicionales no tienen un JSON individual porque sus resultados se conservan completos dentro de `probes.json`.

`native-zoom.json` registra factores reales y medidas. `timed-refresh.json` conserva la reproducción de actualización automática. `auditoria-datos.json` reúne valoraciones, prioridades, fuentes, catálogo y límites.

Las 253 filas de trazabilidad relacionan criterios y capturas por grupos de vistas. La valoración del criterio es global y se distingue dónde se reprodujo cada fallo. Estas filas no equivalen a 253 pruebas manuales independientes.

## Condiciones de ejecución

Las cuentas y datos son sintéticos. Los guardados de medición, el error de toma y los estados SOS se interceptaron con respuestas controladas. Carga, error, vacío y actualización ordinaria también usan transporte controlado cuando corresponde. Los casos se identifican como `FIXTURE` o GET retenido. La caducidad SOS se contrastó con el límite real del servidor de treinta minutos, sin esperar ese tiempo en vivo.

La autenticación usa el servicio local. Otras escrituras clínicas quedaron bloqueadas. Los casos controlados describen el comportamiento del cliente y la lógica inspeccionada, sin acreditar persistencia clínica ni una atención real.

Los intentos iniciales incompletos se conservan en `attempts` dentro del paquete. Se corrigieron localizadores de la herramienta de auditoría y la estabilización del GET controlado. La repetición final se completó. El chequeo de retorno de foco inmediato del primer recorrido resultó insuficiente por la animación de cierre. La reproducción adicional esperó 600 ms y verificó también el siguiente Tab. H03 recoge ese resultado final.

## Verificaciones pendientes

Falta lectura real con NVDA, TalkBack o VoiceOver, contraste integral y validación completa de los flujos de voz y sus permisos. El Figma sigue parcial y Stark queda pendiente. La auditoría no incorpora participantes, consentimientos ni métricas humanas.

Los PDF descargables de la aplicación y los documentos del proyecto requieren una evaluación documental propia. El PDF de este informe tiene texto seleccionable, pero no se ha validado como PDF etiquetado accesible.

La aplicación conserva cinco barreras normativas abiertas. La conformidad AA integral sigue pendiente.

## Archivos finales

- Informe PDF de ocho páginas.
- Matriz Excel con seis hojas, 50 criterios, 253 relaciones de trazabilidad, siete hallazgos y prioridades calculadas.
- Paquete ZIP con el informe, la matriz, esta guía, capturas, JSON y los registros de intentos incompletos.

Las fuentes y los scripts de la auditoría permanecen en `tools/apf3/wcag-audit-2026-11-04`. Esta ronda añade auditoría y evidencia al proyecto. La implementación de sus correcciones requiere una ronda posterior.
