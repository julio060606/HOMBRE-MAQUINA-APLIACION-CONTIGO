# CONTIGO

Proyecto de seguimiento para paciente y cuidador. La clínica es la fuente de recetas, dosis, horarios, citas y ficha clínica. El paciente declara sus tomas y registra mediciones en casa. El cuidador consulta el seguimiento y gestiona reposiciones o conteos físicos de medicamentos; no prescribe ni responde por el paciente.

El sistema cuenta con dos modalidades operativas claramente diferenciadas:
1. **Modo Demostración (`VITE_USE_MOCKS=true`)**: datos sintéticos persistentes en IndexedDB, ideal para recorridos locales y evaluación en el laboratorio compartido (`/demo/patient-lab`).
2. **Modo API Backend (`VITE_USE_MOCKS=false`)**: backend productivo en Spring Boot 3.3.4 (Java 21) conectado a PostgreSQL, con autenticación JWT, rotación/revocación de tokens, control de concurrencia y eventos transaccionales SSE (`/api/v1/events/stream`).

> [!NOTE]
> La conexión con sistemas hospitalarios externos requiere credenciales institucionales y acuerdos de autorización. El transporte técnico REST está implementado en `AuthorizedExternalClinicalProvider`, pero no se simula conexión en vivo ni se certifican integraciones sin acceso real verificado.

## Ejecución del proyecto

### 1. Backend (Spring Boot + PostgreSQL)

Requiere Java 21 y Docker (o PostgreSQL local).

```bash
# Iniciar contenedor PostgreSQL
docker compose up -d

# Ejecutar migraciones y servidor Spring Boot
cd backend
./mvnw spring-boot:run
```

El backend escucha en `http://localhost:8080`.

Para ejecutar las pruebas del backend (21 pruebas automatizadas, incluyendo concurrencia, permisos, auditoría e importación):

```bash
cd backend
./mvnw test
```

### 2. Frontend (React 18 + Vite + TypeScript)

Requiere Node.js 22.12+ o 24 y npm.

```bash
cd frontend
npm ci
npm run dev -- --host 127.0.0.1 --port 3001
```

Acceder a `http://127.0.0.1:3001`.

Para ejecutar las comprobaciones de calidad del frontend (47 pruebas unitarias/integración, análisis estático y compilación de producción):

```bash
cd frontend
npm run test
npm run lint
npm run build
```

## Flujos principales y roles

1. **Cuidador**: inicia sesión (ej. `cuidador@contigo.example` / `Contigo2026!`), consulta panel de pacientes vinculados (Dacio Ramos, Rosa Martínez), revisa adherencia, alertas, citas y gestiona existencias (reposiciones y conteos con auditoría). No puede prescribir medicamentos ni responder tomas en nombre del paciente.
2. **Paciente**: accede a `/patient-app` (ej. `dacio@contigo.example` / `Contigo2026!`), visualiza su próxima dosis, confirma toma («Ya la tomé» / «No la tomé»), registra presiones arteriales reales (sin cifras prefijadas), consulta citas y genera PIN temporal de vinculación.
3. **Laboratorio de prueba (`/demo/patient-lab`)**: disponible en modo demo para simular el teléfono móvil compartido con anchos de 360, 390 y 430 px.
4. **Cierre de sesión y revocación**: al hacer logout, el token de acceso queda invalidado en el servicio de revocación del servidor, cerrando de inmediato las conexiones SSE asociadas.
5. **Reportes PDF**: generación oficial calculada dinámicamente con Apache PDFBox en backend y react-pdf en frontend, con tratamiento riguroso de valores opcionales (un pulso no registrado se muestra como «No registrado», nunca como cero).

## Arquitectura

- `backend/src/main/java/com/sanpablo/contigo`:
  - `config`: seguridad Spring Security, filtro JWT con revocación por token.
  - `controller`: endpoints REST de auth, clínica, telemetría, emparejamiento, reportes y SSE.
  - `domain`: entidades JPA organizadas en esquemas `auth`, `clinical`, `telemetry`, `reports_audit`.
  - `service`: lógica de negocio con transacciones atómicas, control de bloqueo pesimista contra doble consumo, sincronización clínica versionada y emisión de eventos post-commit.
- `backend/src/main/resources/db/migration`: migraciones Flyway V1 a V8 (soporte para UUIDs de 36 caracteres y claves compuestas amplias).
- `frontend/src`:
  - `components/ui/MedicationImage.tsx`: fotografías de medicamentos reales con marcador honesto de ausencia («Imagen no disponible») sin sustitución indebida de fotos entre medicamentos.
  - `features/patient-app`: interfaz táctil balanceada con botones de al menos 52 px de altura para toma positiva y negativa.
  - `services/http/httpService.ts`: cliente HTTP tipado que rechaza fallback silencioso y propaga errores de la API.
  - `services/apiClient.ts`: suscripción SSE con encabezado `Authorization: Bearer` vía streaming fetch (sin credenciales en URL).

## Documentación de referencia

- [ADR-002: Fuente clínica y fundamentos de demostración](docs/08-decisiones-arquitectura/ADR-002-fuente-clinica-y-demo.md)
- [Plan Maestro](docs/09-plan-integracion-clinica/PLAN_MAESTRO.md)
- [Revisión y resolución de hallazgos R01–R15](docs/09-plan-integracion-clinica/REVISION_CAMBIOS_2026_10_07.md)
- [Lista de aceptación y entrega](docs/09-plan-integracion-clinica/CHECKLIST_ENTREGA.md)

