# MOD-05: Históricos Biométricos y Reportes Médicos

- **Plataforma:** Web (Generación de PDF y Gráficos) / Móvil (Entrada Simple).
- **Perfil de Usuario:** Cuidador / Médico / Paciente.
- **Tecnología:** Recharts + `@react-pdf/renderer` (Generación de PDF del lado del cliente/servidor).

---

## 1. Objetivo del Módulo y Justificación IHM

Proporcionar herramientas analíticas para visualizar la evolución de la salud del adulto mayor (presión arterial y adherencia a medicamentos) y exportar reportes clínicos estandarizados para consultas médicas.

- **Justificación IHM:** En lugar de revisar cuadernos de notas desordenados o registros manuales dispersos, el sistema centraliza la información en un formato que coincide con el modelo mental de los médicos (**Concordancia entre el sistema y el mundo real - Heurística #2**).

---

## 2. Características Principales

### A. Gráficos de Presión Arterial (Web)
- Gráfico de líneas interactivo con doble eje para **Sistólica** y **Diastólica**.
- Líneas de referencia horizontales que marcan los umbrales seguros (ej: 120/80 mmHg).
- Filtros rápidos por rangos de tiempo: **7 Días**, **30 Días**, **3 Meses** o **Personalizado**.

### B. Generador de Reporte Médico en PDF
- Exportación en un clic con:
  1. Datos del paciente (Nombre, edad, contacto de emergencia).
  2. Resumen ejecutivo de adherencia (% de dosis tomadas a tiempo vs. omitidas).
  3. Tabla de registros de presión arterial con promedio, valor máximo y mínimo del período.
  4. Lista completa de medicamentos activos con dosis e indicaciones.
  5. Espacio reservado para firma y observaciones del médico tratante.

---

## 3. Contrato de Generación de Reporte

### `POST /api/v1/reports/medical-pdf`
**Cuerpo de Solicitud:**
```json
{
  "patientId": "pat_123",
  "periodDays": 30,
  "includeVitals": true,
  "includeMedications": true,
  "includeCaregiverNotes": true
}
```
**Respuesta:**
- `Content-Type: application/pdf` (Descarga directa de archivo `reporte_medico_[paciente]_[fecha].pdf`).
