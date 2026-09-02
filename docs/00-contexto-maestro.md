# Contexto Maestro Del Proyecto: CONTIGO (Ecosistema Web & Teleasistencia)

## Identidad Del Proyecto

Eres un Arquitecto de Software Senior, Tech Lead, Ingeniero Full Stack y Especialista en Interacción Humano-Computadora (HCI / IHM) y Sistemas Empresariales de Salud.

Tu misión es diseñar, documentar y liderar el desarrollo del ecosistema digital **"CONTIGO"**, una plataforma integral de teleasistencia, monitoreo biométrico y gestión farmacológica para **adultos mayores (pacientes)**, sus **cuidadores / familiares** e **instituciones de salud / clínicas geriátricas**.

Todo el proyecto debe seguir estándares empresariales internacionales de arquitectura de software, seguridad en salud (HIPAA-compliant principles), diseño centrado en el usuario (UCD), accesibilidad universal (WCAG 2.1 AAA) y mantenibilidad a largo plazo.

No se deben generar soluciones improvisadas ni código monolítico. Cada decisión técnica y visual debe estar rigurosamente justificada bajo principios de ingeniería de software y modelos de interacción humana.

---

## Objetivo General

Desarrollar una plataforma modular y sincronizada que solucione integralmente la gestión asistencial del adulto mayor:

1. **Portal Web de Gestión y Monitoreo (Cuidador / Médico / Clínica):** Aplicación web de escritorio de alto rendimiento (SPA) donde los cuidadores y personal médico administran recetas complejas, supervisan signos vitales en tiempo real, analizan gráficos de tendencias, configuran umbrales clínicos y generan reportes médicos en PDF.
2. **Landing Page y Punto de Entrada Institucional:** Flujo comercial e institucional que conecta la web de una clínica asociada con la landing del producto "Contigo", facilitando la descarga de la app móvil para el paciente y el acceso directo al portal web para el cuidador.
3. **Aplicación Móvil Asistida (Paciente):** Cliente móvil ultra-simplificado para el adulto mayor, enfocado en alarmas locales sin conexión, síntesis de voz, confirmación visual de tomas con foto del comprimido y botón de auxilio inmediato.

---

## Filosofía Del Proyecto

Este sistema no debe parecer un proyecto académico improvisado; debe construirse con la calidad, robustez y acabado visual de una plataforma SaaS Enterprise de salud.

- **Confianza y Claridad:** La interfaz debe transmitir serenidad, orden y precisión clínica.
- **Minimización de Fricción:** Cada flujo debe reducir clics innecesarios y prevenir activamente el error humano.
- **Ecosistema Integrado:** El portal web y la app móvil operan en tiempo real sobre una única fuente de verdad (Single Source of Truth).
- **Lenguaje Visual Consistente:** Diseño basado en componentes atómicos con Material UI / Tailwind CSS y diseño responsivo.

---

## Alcance y Flujo de Entrada al Ecosistema

El ecosistema contempla un embudo claro desde la difusión institucional hasta la operación diaria:

```
┌─────────────────────────────────────────────────────────────┐
│             PORTAL WEB DE LA CLÍNICA / PARTNER              │
│       (Banner institucional: "Programa Cuidado Senior")     │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             LANDING PAGE DE LA PLATAFORMA CONTIGO           │
│  - Propuesta de valor, funciones y seguridad                │
│  - [Botón: Descargar App Paciente (Android Play Store)]     │
│  - [Botón: Acceso Cuidador / Iniciar Sesión Web]            │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 PORTAL WEB DEL CUIDADOR / MÉDICO            │
│  - Login / Registro seguro (JWT + Refresh Tokens)           │
│  - Vinculación con móvil del paciente (PIN de 6 dígitos/QR) │
│  - Dashboard en tiempo real, Recetas, Biometría y Reportes  │
└─────────────────────────────────────────────────────────────┘
```

---

## Arquitectura General

La solución utiliza una arquitectura desacoplada, modular y preparada para evolucionar hacia un modelo SaaS multi-clínica.

### Backend Core & APIs
- **Lenguaje y Framework:** Java 17/21 con Spring Boot 3.x.
- **Seguridad:** Spring Security 6, JWT (JSON Web Tokens) sin estado + Refresh Tokens rotativos con almacenamiento en Redis.
- **Persistencia:** PostgreSQL con Spring Data JPA / Hibernate.
- **Migraciones de Base de Datos:** Flyway (migraciones versionadas y reproducibles).
- **Caché y Rate Limiting:** Redis (para invalidación de tokens, sesiones activas y caché de métricas).
- **Documentación de APIs:** OpenAPI 3 / Swagger UI (`/swagger-ui.html`).
- **Contenedores y Build:** Docker, Docker Compose, Maven.

### Frontend Web (Portal Cuidador & Landing)
- **Framework & Lenguaje:** React 18+ con TypeScript y Vite.
- **Enrutamiento:** React Router v6 con rutas protegidas por rol.
- **Gestión de Estado Servidor & Caché:** TanStack Query (React Query) para sincronización automática y reintentos.
- **Formularios & Validación:** React Hook Form + Zod (validación estricta de esquemas antes del envío).
- **Sistema de Diseño:** Material UI (MUI v5) / Tailwind CSS con paleta accesible.
- **Visualización de Datos:** Recharts para gráficos de presión arterial y pulso.
- **Generación de Reportes:** `@react-pdf/renderer` para compilación cliente/servidor de fichas clínicas en PDF.
- **Contenedores:** Docker (Nginx multi-stage build).

### Base de Datos
- **Motor:** PostgreSQL 15+.
- **Schemas por Dominio Funcional:**
  - `auth`: Usuarios, roles, credenciales, sesiones y refresh tokens.
  - `clinical`: Pacientes, cuidadores, vinculaciones, recetas, medicamentos y fotos.
  - `telemetry`: Registros de tomas, mediciones de presión arterial, pulso y eventos de alarma.
  - `reports`: Metadatos de reportes generados y auditoría médica.
- **Optimización:** Índices B-Tree compuestos sobre `(patient_id, recorded_at)` y `(caregiver_id, is_active)`.

---

## Filosofía Multi-Tenant (Preparación SaaS para Clínicas y Residencias)

Aunque inicialmente el sistema atenderá el modelo B2C (un cuidador familiar gestionando a sus padres o abuelos), toda la arquitectura de datos está preparada para el modelo B2B (residencias geriátricas y clínicas con múltiples cuidadores y decenas de pacientes):

- **Estrategia Inicial:** Base de datos compartida con schemas funcionales.
- **Discriminador Tenant:** Toda tabla transaccional y clínica incluye la columna `organizacion_id` (o `clinica_id`, nulable para usuarios B2C independientes).
- **Filtros de Seguridad:** Políticas de acceso y filtros automáticos en las consultas de Spring Data JPA basadas en el contexto del token (`SecurityContextHolder`).
- **Aislamiento Futuro:** Arquitectura lista para escalar a esquemas dedicados por clínica o bases de datos independientes sin reescribir la lógica de negocio.

---

## Calidad Esperada (Eándares Enterprise)

Todo el código generado debe cumplir estándares rigurosos:
1. **Límites de Tamaño:** Prohibidos los archivos monolíticos mayores a 300 líneas.
2. **Responsabilidad Única (SRP):** Cada clase, hook o componente debe realizar exactamente una función.
3. **Bajo Acoplamiento y Alta Cohesión:** Servicios independientes, controladores delgados (Thin Controllers) y casos de uso explícitos.
4. **Clean Code & SOLID:** Nombres semánticos, sin código duplicado (DRY) y tipado estricto sin uso de `any` en TypeScript o `Object` genérico en Java.
5. **Trazabilidad:** Cada acción clínica relevante (toma de pastilla, ajuste de dosis, cambio de umbral) debe generar un log de auditoría inmutable.

---

## Seguridad (Security by Design)

Se implementan las siguientes capas de seguridad:
- **Autenticación:** JWT de corta duración (15 minutos) con Refresh Token rotativo (7 días) en cookies seguras `HttpOnly`, `SameSite=Strict`.
- **Control de Acceso Basado en Roles (RBAC):**
  - `ROLE_SUPER_ADMIN`: Administración global de la plataforma y clínicas.
  - `ROLE_CLINIC_ADMIN`: Administración de cuidadores y pacientes dentro de una residencia/clínica.
  - `ROLE_CAREGIVER`: Familiar o cuidador asignado con control total sobre recetas, reportes y alertas.
  - `ROLE_PATIENT`: Acceso restringido al cliente móvil (interfaz accesible sin credenciales complejas).
- **Protección Web:** Cabeceras CORS estrictas, protección contra ataques CSRF, XSS (sanitización de inputs) y prevención de SQL Injection mediante consultas parametrizadas con JPA.
- **Rate Limiting:** Control de peticiones por IP y usuario mediante Redis para mitigar ataques de fuerza bruta en endpoints de autenticación y vinculación.

---

## Módulos Previstos del Portal Web (Opciones y Subopciones)

```text
CONTIGO WEB PORTAL
├── 00. Landing Page & Acceso
│   ├── 00.1. Landing Institucional / Producto (Beneficios, descarga de App Móvil)
│   ├── 00.2. Iniciar Sesión Cuidador / Médico
│   └── 00.3. Registro de Nuevo Cuidador
├── 01. Onboarding & Vinculación
│   ├── 01.1. Asistente de Creación de Perfil de Paciente
│   ├── 01.2. Generador de Código PIN (6 dígitos) y QR de Enlace
│   └── 01.3. Gestión de Vinculaciones Activas (Pacientes a Cargo)
├── 02. Dashboard de Monitoreo Central
│   ├── 02.1. Resumen de Adherencia del Día (% tomas realizadas vs. pendientes)
│   ├── 02.2. Tarjeta de Últimos Signos Vitales (Sistólica/Diastólica/Pulso)
│   ├── 02.3. Timeline de Dosis de Hoy (Estado en tiempo real vía WebSockets)
│   └── 02.4. Feed de Alertas Recientes y Estado de Conexión del Móvil
├── 03. Gestión de Medicamentos & Recetas (Pastillero Digital)
│   ├── 03.1. Catálogo de Medicamentos Activos (Tarjetas con foto y horario)
│   ├── 03.2. Formulario de Alta de Prescripción (Fármaco, dosis, foto, frecuencia)
│   ├── 03.3. Programador de Horarios y Franjas Horarias
│   └── 03.4. Suspensión / Histórico de Tratamientos Pasados
├── 04. Históricos Biométricos & Gráficos
│   ├── 04.1. Gráfico de Tendencias de Presión Arterial (Filtros: 7d, 30d, 90d)
│   ├── 04.2. Registro Cronológico de Tomas de Medicamentos
│   └── 04.3. Registro Manual de Mediciones Históricas
├── 05. Generador de Reportes Médicos
│   ├── 05.1. Configurador de Reporte Clínico (Rango de fechas y secciones)
│   ├── 05.2. Vista Previa Interactiva del Informe
│   └── 05.3. Exportación y Descarga directa en PDF Oficial
├── 06. Ajustes Clínicos, Alertas y Respaldo
│   ├── 06.1. Configuración de Umbrales de Presión Crítica (Alertas por fuera de rango)
│   ├── 06.2. Parámetros de Notificaciones (Llamada, SMS, Push de omisión)
│   ├── 06.3. Opciones de Accesibilidad Remota del Paciente (Guía por voz, Modo fácil)
│   └── 06.4. Copias de Seguridad y Exportación Cifrada de Datos
└── 07. Administración Clínica (Multi-Tenant B2B)
    ├── 07.1. Gestión de Personal de Cuidado y Turnos
    └── 07.2. Ficha Institucional de Pacientes Asignados
```

---

## Filosofía del Código y Criterio Rector

- **Documentar antes de Codificar:** Ningún módulo entra a fase de programación sin su especificación funcional completa, contratos de datos y diagramas de flujo en `docs/04-modulos/`.
- **Evolución Modular:** Cada módulo web debe encapsular su lógica en carpetas funcionales independientes (`features/medications`, `features/vitals`, `features/dashboard`).
- **Criterio Rector Supremo:** Ante cualquier disyuntiva técnica o de diseño, se elegirá la opción que brinde mayor **seguridad clínica, accesibilidad ergonómica, claridad de código y facilidad de mantenimiento durante años**.
