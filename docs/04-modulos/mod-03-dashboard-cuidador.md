# MOD-03: Dashboard de Monitoreo del Cuidador (Web)

- **Plataforma:** Aplicación Web (Escritorio / Responsive).
- **Perfil de Usuario:** Cuidador Primario, Familiar o Personal de Asistencia.
- **Tecnología:** React + TypeScript + Vite + Tailwind CSS + TanStack Query + Recharts.

---

## 1. Objetivo del Módulo y Justificación IHM

Proveer un centro de comando visual y analítico para que el cuidador supervise el bienestar del adulto mayor en tiempo real desde cualquier navegador de escritorio.

- **Justificación IHM:** Reduce la carga de supervisión continua. En lugar de llamadas telefónicas invasivas o navegación compleja en móvil, el cuidador obtiene una visión general rápida (visibilidad del estado del sistema - Heurística #1) de las tomas y mediciones de presión arterial de su familiar.

---

## 2. Componentes y Secciones del Dashboard Web

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CONTIGO · Panel del Cuidador       [Paciente: Abuelo Dacio ▼]  [Perfil] [Salir] │
├──────────────┬──────────────────────────────────────────────────────────────┤
│ 📊 Resumen   │ 🟢 ESTADO GENERAL: Todo en orden hoy (Adherencia: 100%)       │
│ 💊 Recetas   ├───────────────────────────────┬──────────────────────────────┤
│ 📈 Historial │ ⏰ PRÓXIMAS TOMAS DE HOY       │ 🩺 ÚLTIMA MEDICIÓN PRESIÓN   │
│ 📄 Reportes  │ • 08:00 AM - Losartán 50mg    │ • 120 / 80 mmHg (Normal)     │
│ ⚙️ Ajustes   │   [Tomada a las 08:05 AM ✅]   │   Registrado hoy 09:30 AM    │
│              │ • 02:00 PM - Vitamina D 1 tab │                              │
│              │   [Pendiente ⏳]               │ [Ver histórico completo →]   │
│              ├───────────────────────────────┴──────────────────────────────┤
│              │ 🚨 ALERTAS RECIENTES                                         │
│              │ • Sin alertas críticas registradas en las últimas 48 horas.   │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

### Secciones Principales:
1. **Header Superior:** Selector del paciente activo (soporta cuidado de múltiples adultos mayores), estado de sincronización en vivo y perfil.
2. **Sidebar de Navegación:** Enlaces rápidos a: Resumen (Dashboard), Gestión de Medicamentos, Historial y Gráficos, Generador de Reportes PDF y Configuración/Vinculación.
3. **Tarjeta de Adherencia Diaria:** Barra de progreso visual con el porcentaje de medicamentos tomados en el día.
4. **Tarjeta de Signos Vitales (Presión Arterial):** Muestra el último valor sistólico/diastólico con código de color (Verde: Normal, Amarillo: Alerta, Rojo: Crítico según los umbrales configurados).
5. **Timeline de Tomas:** Lista cronológica de dosis programadas para la jornada con estado (Tomada, Pendiente, Omitida).

---

## 3. Reglas de Negocio

1. **Sincronización en Tiempo Real:** Si el paciente marca "Ya tomé" en su móvil, el Dashboard Web debe actualizar automáticamente el estado del medicamento mediante WebSockets sin requerir recarga manual de página.
2. **Alertas de Omisión:** Si una toma pasa de 30 minutos sin confirmación, el dashboard destacará la tarjeta en color ámbar y emitirá una notificación en el navegador.
3. **Soporte Multi-Paciente:** El cuidador puede administrar más de un adulto mayor desde la misma cuenta web.

---

## 4. Contratos de Datos (API)

### `GET /api/v1/caregiver/dashboard-summary`
**Respuesta:**
```json
{
  "patient": {
    "id": "pat_123",
    "fullName": "Dacio Pérez",
    "age": 78,
    "lastSyncAt": "2026-09-01T23:30:00Z"
  },
  "todayAdherence": {
    "totalDoses": 3,
    "takenDoses": 2,
    "percentage": 66.6
  },
  "lastVitals": {
    "systolic": 120,
    "diastolic": 80,
    "pulse": 72,
    "recordedAt": "2026-09-01T09:30:00Z",
    "status": "NORMAL"
  },
  "upcomingDoses": [
    {
      "id": "dose_001",
      "medicationName": "Losartán",
      "dosage": "50 mg",
      "scheduledTime": "08:00",
      "status": "TAKEN",
      "takenAt": "2026-09-01T08:05:00Z"
    },
    {
      "id": "dose_002",
      "medicationName": "Vitamina D",
      "dosage": "1 tableta",
      "scheduledTime": "14:00",
      "status": "PENDING"
    }
  ]
}
```

---

## 5. Criterios de Aceptación

- [ ] Carga inicial del dashboard en menos de 1.5 segundos.
- [ ] Indicadores de estado visuales claros con colores accesibles (evitar depender únicamente del color para daltónicos).
- [ ] Atributos `data-testid` presentes en todos los componentes interactivos.
