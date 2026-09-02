# Documentación del Ecosistema CONTIGO (Portal Web & Teleasistencia)

Bienvenido a la documentación técnica, arquitectónica y funcional del ecosistema **CONTIGO**.

Este repositorio de documentación sirve como la **fuente única de verdad (Single Source of Truth)** para desarrolladores, diseñadores de interacción (IHM / UX) y agentes de Inteligencia Artificial que colaboran en el desarrollo del sistema.

---

## 🧭 Orden de Lectura Obligatorio

Antes de escribir código o proponer cambios, todo desarrollador y agente de IA debe seguir este orden estricto de lectura:

1. **[Contexto Maestro del Proyecto](./00-contexto-maestro.md)**: Identidad, arquitectura general, stack tecnológico (Spring Boot + React), roles, seguridad y visión Enterprise.
2. **[Guía para Agentes de IA](./GUIA_AGENTES.md)**: Reglas de oro, directrices de interacción y prompts preconfigurados por rol.
3. **[Arquitectura del Sistema](./01-arquitectura/README.md)**: Desacoplamiento de capas, sincronización de datos y configuración de contenedores.
4. **[Arquitectura de Base de Datos](./02-base-de-datos/README.md)**: Schemas funcionales en PostgreSQL, migraciones Flyway y estrategia Multi-Tenant.
5. **[Guía de UX/UI y Accesibilidad](./06-ux-ui/README.md)**: Directrices de IHM, accesibilidad WCAG 2.1 AAA, tokens de diseño y matriz de 10 heurísticas de Nielsen.
6. **[Especificación de Módulos Web](./04-modulos/README.md)**:
   - `MOD-00`: Landing Page Institucional y Acceso al Portal.
   - `MOD-01`: Onboarding, Autenticación y Vinculación por PIN/QR.
   - `MOD-02`: Experiencia del Paciente (App Móvil).
   - `MOD-03`: Dashboard Central de Monitoreo en Tiempo Real (Web).
   - `MOD-04`: Gestión de Medicamentos, Fotos y Recetas (Pastillero Digital Web).
   - `MOD-05`: Históricos Biométricos, Gráficos y Generador de Reporte PDF.
   - `MOD-06`: Ajustes Clínicos, Alertas Críticas y Respaldo Cifrado.
   - `MOD-07`: Administración Clínica y Multi-Tenancy (B2B).
7. **[Contratos de APIs y Endpoints](./05-apis/README.md)**: Documentación OpenAPI / Swagger y eventos en tiempo real.
8. **[Decisiones de Arquitectura (ADRs)](./08-decisiones-arquitectura/ADR-001-dual-app-web.md)**: Justificación técnica de las decisiones de diseño.

---

## 📁 Estructura de la Documentación

```text
docs/
├── 00-contexto-maestro.md              # Documento fundacional y rector
├── GUIA_AGENTES.md                     # Manual y protocolo de trabajo para Agentes de IA
├── README.md                           # Índice maestro y orden de lectura
├── 01-arquitectura/                    # Arquitectura de software y backend/frontend
│   ├── README.md
│   └── 01-vision-arquitectonica.md
├── 02-base-de-datos/                   # PostgreSQL, Schemas, Flyway y Multi-Tenant
│   └── README.md
├── 04-modulos/                         # Especificaciones funcionales detalladas
│   ├── README.md
│   ├── mod-00-landing-acceso.md
│   ├── mod-01-onboarding-vinculacion.md
│   ├── mod-02-experiencia-paciente.md
│   ├── mod-03-dashboard-cuidador.md
│   ├── mod-04-medicamentos-recetas.md
│   ├── mod-05-historicos-reporte.md
│   ├── mod-06-ajustes-respaldo.md
│   └── mod-07-administracion-clinica.md
├── 05-apis/                            # Especificaciones OpenAPI / Swagger
│   └── README.md
├── 06-ux-ui/                           # Guía visual, Material UI, accesibilidad y data-testid
│   └── README.md
└── 08-decisiones-arquitectura/         # Architectural Decision Records (ADRs)
    └── ADR-001-dual-app-web.md
```

---

## ⚠️ Regla Principal e Inviolable de Desarrollo

> **"Nunca se debe escribir código de negocio sin comprender completamente el dominio funcional que se va a desarrollar, automatizar o proponer."**

Antes de implementar cualquier pantalla, endpoint o migración de base de datos:
1. Debe existir su documento de especificación en `docs/04-modulos/` con sus reglas de negocio, validaciones y contratos de datos.
2. Todo componente interactivo en frontend debe incluir atributos `data-testid` estables para testing automatizado.
3. Todo servicio en backend debe contar con validaciones dobles (Bean Validation / Zod) y registro de auditoría.
