# Guía de UX/UI, Accesibilidad y Sistema de Diseño

Este directorio contiene los estándares visuales, principios ergonómicos y directrices de Interacción Humano-Computadora (IHM) para el ecosistema **CONTIGO**.

---

## 📑 Documentos de Diseño

1. **[01. Arquitectura Frontend & Sistema de Diseño](./01-arquitectura-frontend.md)**:
   - Font Pairing: **Plus Jakarta Sans** (Títulos) + **Inter** (Cuerpo).
   - Paleta cromática: Verde Bosque (`#0F4C3A`) + Cian Clínico (`#0284C7`).
   - Sombras multicapa difusas y radios de bordes estándar (12px / 16px / 24px).
   - Librerías clave: `@mui/material`, `react-hook-form`, `zod`, `recharts`.
2. **[03. Jerarquía de Componentes y Secciones](./03-componentes-y-secciones.md)**:
   - Estructura de Layouts (Public Landing vs. Caregiver Main Layout).
   - Tarjetas de métricas (KPIs), formularios reactivos y modales accesibles.
   - Convención de `data-testid` para pruebas automatizadas.

---

## 🎨 Tokens de Diseño en Código (Fuente de la Verdad)

- **`frontend/src/app/theme.ts`**: Definición oficial de `createTheme` de Material UI con palette, typography y component overrides.
- **`frontend/index.html`**: Importación y `preconnect` de Google Fonts (`Plus Jakarta Sans` e `Inter`).

---

## ♿ Matriz de Accesibilidad y Heurísticas de Nielsen

| Heurística | Aplicación Web (Cuidador) |
| :--- | :--- |
| **H1: Visibilidad del Estado** | Indicadores de conexión en vivo con el móvil del paciente y estado de sincronización. |
| **H2: Concordancia con Mundo Real** | Ficha clínica estructurada similar a una receta médica tradicional. |
| **H5: Prevención de Errores** | Validación inmediata de campos obligatorios con Zod antes de enviar. |
| **H6: Reconocer vs. Recordar** | Fotografía real de los medicamentos en el pastillero digital. |
| **H8: Diseño Minimalista** | Dashboards limpios con sombras difusas, sin amontonamiento de datos. |
