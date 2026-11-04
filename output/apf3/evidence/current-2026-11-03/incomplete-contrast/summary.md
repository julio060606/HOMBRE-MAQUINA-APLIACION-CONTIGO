# Revisión complementaria de contraste actual

Se revisaron exclusivamente los nodos color-contrast incompletos del archivo axe actual. Se conservaron capturas originales y sondas de fondo con restauración de estilos. No se modifican resultados de axe ni datos de dominio.

| Nodo | Texto | Mínimo conservador | Umbral | Resultado |
| --- | --- | ---: | ---: | --- |
| 11-vitals-01 | 2 nov. 2026 | 1.0 | 4.5 | Revisión pendiente |
| 11-vitals-02 | 2 nov. 2026 | 1.3005 | 4.5 | Revisión pendiente |
| 11-vitals-03 | 2 nov. 2026 | 1.7985 | 4.5 | Revisión pendiente |
| 11-vitals-04 | 2 nov. 2026 | 2.708 | 4.5 | Revisión pendiente |
| 11-vitals-05 | 75 | 4.5906 | 4.5 | Contraste acotado técnicamente suficiente |
| 11-vitals-06 | 90 | 5.7418 | 4.5 | Contraste acotado técnicamente suficiente |
| 11-vitals-07 | 105 | 5.7418 | 4.5 | Contraste acotado técnicamente suficiente |
| 11-vitals-08 | 120 | 5.7418 | 4.5 | Contraste acotado técnicamente suficiente |
| 11-vitals-09 | 135 | 5.7418 | 4.5 | Contraste acotado técnicamente suficiente |
| 11-vitals-10 | Sistólica | 8.0159 | 4.5 | Contraste acotado técnicamente suficiente |
| 11-vitals-11 | Diastólica | 8.7224 | 4.5 | Contraste acotado técnicamente suficiente |
| 11-vitals-12 | 2 nov. 2026 | 2.708 | 4.5 | Revisión pendiente |
| 11-vitals-13 | 78 | 5.7418 | 4.5 | Contraste acotado técnicamente suficiente |
| 11-vitals-14 | 79 | 5.7418 | 4.5 | Contraste acotado técnicamente suficiente |
| 11-vitals-15 | 80 | 5.7418 | 4.5 | Contraste acotado técnicamente suficiente |
| 11-vitals-16 | 81 | 5.7418 | 4.5 | Contraste acotado técnicamente suficiente |
| 11-vitals-17 | 82 | 5.7418 | 4.5 | Contraste acotado técnicamente suficiente |
| 11-vitals-18 | Peso (kg) | 8.7224 | 4.5 | Contraste acotado técnicamente suficiente |
| 14-login-01 | CONTIGO | 10.9779 | 3 | Revisión pendiente |
| 14-login-02 | Clínica ficticia · Proyecto CONTIGO | 5.3551 | 4.5 | Revisión pendiente |
| 14-login-03 | Acompañamiento y cuidado domiciliario | 8.912 | 3 | Contraste acotado técnicamente suficiente |
| 14-login-04 | Supervisión del tratamiento médico indicado por la clínica, tomas oportunas y mediciones en casa. | 6.6295 | 4.5 | Contraste acotado técnicamente suficiente |
| 14-login-05 | Dosis y horarios determinados por la clínica | 6.1269 | 4.5 | Contraste acotado técnicamente suficiente |
| 14-login-06 | Tomas declaradas y mediciones ingresadas por el paciente | 6.0609 | 4.5 | Contraste acotado técnicamente suficiente |
| 14-login-07 | Acompañamiento familiar y reportes de adherencia | 5.7699 | 4.5 | Contraste acotado técnicamente suficiente |

La medición complementa el diagnóstico; no elimina los incomplete del archivo axe ni implica conformidad general. Un mínimo insuficiente de rectángulo es inconcluso porque puede contener píxeles ajenos a glifos.

Grupos semánticos: Filtrar dosis y Periodo de mediciones tienen role=group y mantienen sus botones con aria-pressed.

Método técnico: mínimo de contraste WCAG sRGB sobre todos los colores de píxel de fondo de cada rectángulo de texto, ampliado un píxel. El color de tinta procede del estilo calculado. Se compone alfa sobre cada píxel y se considera la diferencia RGB observada al restaurar la captura hasta dos niveles. No es Stark, lector de pantalla ni validación con participantes.
