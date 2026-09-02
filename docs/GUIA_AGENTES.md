# Guía Para Agentes De IA - Ecosistema CONTIGO

Este documento define el protocolo de trabajo obligatorio para cualquier agente de Inteligencia Artificial (y desarrollador humano) que participe en el diseño, documentación o implementación del ecosistema **CONTIGO**.

---

## 1. Lectura Obligatoria Previa

Antes de proponer, estructurar o escribir código en cualquier módulo, el agente **DEBE** leer y asimilar:

1. `docs/00-contexto-maestro.md` (Visión, filosofía IHM, arquitectura Spring Boot + React, Multi-Tenancy).
2. `docs/01-arquitectura/README.md` (Estructura de carpetas, capas y patrones).
3. `docs/02-base-de-datos/README.md` (Schemas PostgreSQL, Flyway y aislamiento de datos).
4. `docs/06-ux-ui/README.md` (Principios cognitivos, WCAG AAA, Material UI y data-testid).
5. La especificación técnica del módulo correspondiente en `docs/04-modulos/`.

---

## 2. Forma de Trabajo y Protocolo por Tarea

1. **Confirmar el Módulo y Alcance:** Validar a qué módulo pertenece la tarea (`MOD-00` al `MOD-07`) y qué perfil de usuario afecta (Cuidador, Médico, Clínica o Paciente).
2. **Revisar Reglas de Negocio y Permisos:** Verificar si el endpoint requiere roles específicos (`ROLE_CAREGIVER`, `ROLE_CLINIC_ADMIN`, etc.) y qué validaciones de entrada aplican.
3. **Actualizar Documentación si Falta Información:** Si una regla o contrato de datos está incompleto, actualizar el archivo `.md` respectivo antes de codificar.
4. **Proponer Diseño Técnico Breve:** Explicar componentes, DTOs, entidades o hooks involucrados antes de escribir código masivo.
5. **Implementar con Clean Architecture:**
   - **Backend (Spring Boot):** Controllers delegando a Services de aplicación, entidades JPA en schemas específicos, repositorios y DTOs inmutables (Java Records).
   - **Frontend (React + TS):** Componentes atómicos con Material UI / Tailwind, formularios con React Hook Form + Zod, queries con TanStack Query y pruebas con `data-testid`.
6. **Validar y Verificar:** Ejecutar pruebas proporcionales al riesgo (Unitarias, de integración o validación de contratos).
7. **Resumir Resultados:** Indicar archivos creados/modificados, pruebas ejecutadas, posibles riesgos mitigados y siguientes pasos.

---

## 3. Reglas Estrictas e Inviolables

- ❌ **Prohibido improvisar reglas de negocio:** Todo debe alinearse con la especificación del módulo.
- ❌ **Prohibido crear archivos gigantes:** Ningún componente o clase debe superar las 300 líneas.
- ❌ **Prohibido mezclar responsabilidades:** Separar estrictamente presentación (UI), estado, lógica de negocio y acceso a datos.
- ❌ **Prohibido exponer datos entre organizaciones / clínicas:** Toda consulta institucional debe filtrar por `organizacion_id`.
- ❌ **Prohibido confiar ciegamente en datos del frontend:** Toda validación de Zod en frontend debe tener su contraparte con Jakarta Validation en Spring Boot.
- ❌ **Prohibido cambios destructivos en base de datos:** Toda modificación de esquema debe gestionarse mediante scripts SQL versionados en Flyway (`V1__...sql`).
- ❌ **Prohibido almacenar secretos en el frontend:** Claves API, tokens maestros o credenciales de almacenamiento jamás deben exponerse en el cliente web.

---

## 4. Prompts Maestros para Agentes Especializados

### A. Prompt para Agente Frontend Web (Portal Cuidador / Landing)
```text
Lee primero docs/00-contexto-maestro.md, docs/01-arquitectura/README.md, docs/06-ux-ui/README.md y la especificación del módulo en docs/04-modulos/ que vamos a trabajar.

Actúa como Tech Lead Frontend y especialista en UX/UI con Material UI y React.
Construye el frontend por piezas reutilizables: layouts (Sidebar/Header), vistas principales, tablas de datos, formularios con Zod y diálogos modales.

Stack obligatorio:
- React 18+ con TypeScript y Vite.
- Material UI (MUI v5) / Tailwind CSS con paleta accesible.
- React Hook Form + Zod para validaciones estrictas.
- TanStack Query (React Query) para llamadas y caché de API.
- React Router v6 con rutas protegidas por roles.
- Atributos data-testid estables en todos los botones e inputs interactivos.

Vamos a implementar: [INSERTAR MÓDULO O PANTALLA].
```

### B. Prompt para Agente Backend (Spring Boot Core & Security)
```text
Lee primero docs/00-contexto-maestro.md, docs/01-arquitectura/README.md, docs/02-base-de-datos/README.md y la especificación del módulo en docs/04-modulos/.

Actúa como Arquitecto de Software Senior y Desarrollador Backend Enterprise en Java / Spring Boot.
Implementa siguiendo Clean Architecture y Domain-Driven Design:
- Java 17/21 y Spring Boot 3.x.
- Spring Security 6 con JWT sin estado y Refresh Tokens en Redis.
- Control de acceso RBAC por roles (@PreAuthorize).
- Spring Data JPA con schemas PostgreSQL dedicados (auth, clinical, telemetry, reports).
- Migraciones automáticas con Flyway.
- DTOs con Java Records y Jakarta Validation (@NotNull, @NotBlank, @Min, etc.).
- Documentación OpenAPI 3 / Swagger con anotaciones descriptivas.

Vamos a implementar: [INSERTAR ENDPOINT O CASO DE USO].
```

### C. Prompt para Agente de Base de Datos y Migraciones (PostgreSQL + Flyway)
```text
Lee primero docs/00-contexto-maestro.md y docs/02-base-de-datos/README.md.

Actúa como Administrador de Base de Datos (DBA) Senior y Especialista en PostgreSQL.
Genera los scripts de migración de Flyway (V{version}__{descripcion}.sql) asegurando:
- Uso correcto de schemas funcionales (auth, clinical, telemetry, reports).
- Llaves primarias UUIDv7 o BIGSERIAL optimizadas.
- Claves foráneas e integridad referencial estricta con eliminación en cascada controlada.
- Índices B-Tree compuestos para consultas frecuentes por paciente y fecha.
- Soporte Multi-Tenant mediante organizacion_id en tablas aplicables.
```
