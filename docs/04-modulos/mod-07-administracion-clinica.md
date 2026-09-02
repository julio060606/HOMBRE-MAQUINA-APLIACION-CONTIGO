# MOD-07: Administración Clínica y Multi-Tenancy (B2B)

- **Plataforma:** Portal Web (Escritorio).
- **Perfil de Usuario:** Administrador de Clínica, Médico Jefe, Personal de Enfermería.
- **Tecnología:** React + Material UI + Spring Security RBAC.

---

## 1. Objetivo del Módulo

Permitir que instituciones de salud, clínicas privadas y residencias geriátricas gestionen múltiples adultos mayores, organicen turnos de cuidadores/enfermeros y auditen la administración farmacológica en toda la sede.

---

## 2. Vistas Principales del Módulo Institucional

1. **Directorio General de Pacientes:**
   - Tabla paginada con buscador en vivo por nombre, DNI/Documento o habitación/sede.
   - Estado de salud global (Semáforo de riesgo: Verde/Normal, Amarillo/Alerta, Rojo/Crítico).
   - Cuidador/Enfermero principal asignado.
2. **Asignación de Personal de Cuidado:**
   - Creación de cuentas de cuidadores y enfermeros vinculados a la organización (`organization_id`).
   - Asignación 1-a-Muchos (un enfermero a cargo de 5 pacientes en un turno).
3. **Panel de Alertas Centralizado (Central de Enfermería):**
   - Vista en tiempo real de todas las alarmas de omisión de pastillas o botones de auxilio activados en cualquier habitación.
   - Botón de "Revisado / Atendido por [Nombre de Enfermero]".

---

## 3. Contratos de Datos (API)

### `GET /api/v1/clinic/patients`
**Respuesta:**
```json
{
  "totalPatients": 24,
  "data": [
    {
      "patientId": "pat_101",
      "fullName": "Dacio Pérez",
      "roomOrTag": "Habitación 102",
      "caregiverAssigned": "Lic. Gerson Ramos",
      "todayAdherence": 100,
      "lastVitalsStatus": "NORMAL",
      "hasActiveAlert": false
    }
  ]
}
```

---

## 4. Criterios de Aceptación

- [ ] Aislamiento multi-tenant estricto: Una clínica jamás puede ver datos de otra clínica.
- [ ] Soporte para asignación masiva de recetas por médicos colegiados.
- [ ] Registro de auditoría con nombre y rol de quien administró cada dosis.
