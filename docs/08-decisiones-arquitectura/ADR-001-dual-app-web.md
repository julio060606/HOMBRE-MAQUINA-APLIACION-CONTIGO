# ADR-001: División Arquitectónica Dual (App Móvil para Paciente y Portal Web para Cuidador)

- **Estado:** Aprobado
- **Fecha:** 2026-09-01
- **Disciplina:** Interacción Humano-Computadora (IHM) & Arquitectura de Software

---

## 1. Contexto y Problema

Inicialmente, el prototipo móvil de "CONTIGO" concentraba tanto el flujo del paciente (adulto mayor) como el del cuidador dentro de la misma aplicación telefónica.

Durante la auditoría de usabilidad y carga cognitiva de la Unidad 1 del curso de IHM, se identificaron los siguientes puntos críticos:
1. **Sobrecarga en la Entrada de Datos:** El cuidador debe registrar tratamientos complejos (múltiples fármacos, miligramos, franjas horarias y observaciones médicas). Hacer esto en un teclado virtual móvil genera alta fatiga motriz y errores tipográficos (Slips).
2. **Contexto de Uso Divergente:** El cuidador suele ser un familiar o profesional en horario laboral con acceso continuo a una computadora de escritorio. Obligarlo a interactuar exclusivamente desde un celular interrumpe sus flujos de trabajo.
3. **Pobre Visualización de Datos en Pantallas Pequeñas:** La lectura de reportes de adherencia, análisis de tendencias de presión arterial y exportación de PDFs médicos es ineficiente en pantallas de formato vertical reducido.

---

## 2. Decisión Arquitectónica

Se decide formalmente **desacoplar el ecosistema en dos plataformas especializadas**:

1. **Cliente Móvil (Android/Flutter) dedicado al Paciente (Adulto Mayor):**
   - Mantiene exclusividad en funciones de asistencia inmediata, alarmas locales, síntesis de voz y botón de auxilio.
   - Diseñado con los más altos estándares de accesibilidad (botones >64dp, contraste WCAG AAA).

2. **Portal Web (React/TypeScript/Tailwind) dedicado al Cuidador/Familiar:**
   - Asume la totalidad de la gestión administrativa, creación de recetas, configuración de umbrales clínicos y descarga de reportes médicos en PDF.

---

## 3. Justificación Basada en Teoría de IHM

| Criterio Teórico | Impacto en la App Móvil (Paciente) | Impacto en el Portal Web (Cuidador) |
| :--- | :--- | :--- |
| **Ley de Fitts & Motricidad** | Botones táctiles sobredimensionados para compensar temblores y falta de precisión en dedos. | Uso de teclado y ratón de precisión para ingreso ágil de datos. |
| **Carga Cognitiva (Sweller)** | Una sola acción por pantalla; sin menús hamburguesa ni formularios largos. | Dashboard centralizado que permite visión panorámica de múltiples pacientes sin navegar entre pestañas móviles. |
| **Teoría de Errores (Norman)** | Confirmación guiada por voz para evitar falsas alarmas de emergencia. | Validación de esquemas en tiempo real (Zod) en formularios de prescripción médica antes de guardar. |
| **Reconocer vs. Recordar (Nielsen H6)** | Muestra la foto real del medicamento en la alarma para fácil identificación visual. | Muestra el inventario completo y el historial sin requerir memorización. |

---

## 4. Consecuencias y Beneficios

- **Positivas:**
  - Reducción drástica de la tasa de error al registrar medicamentos.
  - Mayor accesibilidad y adopción por parte de adultos mayores al no tener pantallas saturadas de configuración.
  - Flexibilidad para que el cuidador supervise a su familiar desde cualquier navegador de escritorio.
- **Compromisos (Trade-offs):**
  - Requiere mantener dos clientes frontend (Web y Móvil) consumiendo la misma API REST centralizada.
