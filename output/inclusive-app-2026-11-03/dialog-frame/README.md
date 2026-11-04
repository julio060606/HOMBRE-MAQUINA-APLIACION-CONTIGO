# Diálogos dentro del teléfono y ayudas del cuidador

`audit.json` es el resultado final consolidado: **96 estados ejecutados**, 80 en la app paciente y 16 en el dashboard. Las dos fases comparten las mismas doce huellas de fuentes, verificadas de nuevo al consolidar. `patient-audit.json` y `caregiver-audit.json` conservan el alcance individual. No hubo escrituras clínicas ni intentos bloqueados de escritura de dominio.

Se comprobaron contención geométrica del diálogo y su backdrop, disparadores únicos dentro de la pantalla paciente, ausencia de límites de teléfono en el dashboard, un único contenedor vertical activo, foco inicial, Tab/Mayús+Tab, Escape, retorno al disparador y acciones de comunicación por Enter. Los datos y cuentas son sintéticos; iniciar/cerrar sesiones de QA es la única mutación de servidor permitida.

La fase paciente cubre 320/390/430/1280 px, escalas del producto 100/200 % y ambos contrastes. La fase cuidador cubre 390/1280 px y ambas escalas en contraste estándar; su auditoría de dashboard ampliada se conserva por separado en la evidencia del agente de cuidador. El zoom nativo, lector de pantalla y las sesiones humanas no forman parte de estos resultados.

Los resultados contienen cero nodos violations y **112 nodos incomplete** de axe, preservados sin ocultar. La revisión visual de capturas seleccionadas comprueba el área útil y el reflujo; no convierte los incomplete en aprobación manual de todos los criterios.

Las imágenes `*-context.png` muestran el panel en su contexto visual; el resto de los PNG finales están enlazados desde los estados del JSON. `audit-quick.json` y las imágenes `quick-*` corresponden a una fase preliminar previa al último ajuste de scroll. `audit-initial-caregiver-race.json` conserva el intento inicial incompleto: el script abrió la antigua barra de Login durante la resolución de una ruta lazy. La espera se corrigió para exigir la barra de cuidador y su selector antes de ejecutar las pruebas; los cuatro casos de cuidador se repitieron correctamente.

Reproducción con frontend/API locales activos: `node tools/apf3/verify-inclusive-dialog-frame.mjs`. Para diagnóstico corto: `--quick`; para repetir solo los cuatro casos de cuidador: `--caregiver-only`. La ejecución completa espera una versión estable y comprueba sus huellas al terminar.

Fundamento técnico y enlaces primarios: `../research/dialog-phone-guidance.md`.
