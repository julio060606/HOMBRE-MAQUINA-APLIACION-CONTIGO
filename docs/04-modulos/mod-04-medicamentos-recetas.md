# MOD-04: Gestión de Medicamentos y Recetas

- **Plataforma:** Web (Creación y Edición Masiva) / Móvil (Visualización Asistida).
- **Perfil de Usuario:** Cuidador / Médico / Paciente.
- **Tecnología:** React + React Hook Form + Zod + Cloud Storage (para fotos de fármacos).

---

## 1. Objetivo del Módulo y Justificación IHM

Permitir la prescripción, catalogación y programación de medicamentos de forma rápida, evitando conflictos de horarios y errores de dosificación.

- **Justificación IHM (Reconocer vs. Recordar):** Cada medicamento permite adjuntar una fotografía nítida del comprimido o caja. Esto asegura que el adulto mayor identifique visualmente qué debe ingerir sin depender de nombres farmacológicos complejos.
- **Prevención de Errores (Heurística #5):** Formularios con validación en tiempo real de dosis, franjas horarias y duración del tratamiento.

---

## 2. Flujo de Trabajo en Portal Web (Cuidador)

1. **Listado de Medicamentos Activos:** Vista en tabla/tarjetas de todos los medicamentos en curso con foto miniatura, dosis, horario y botón de acción (Editar / Suspender).
2. **Formulario de Alta de Medicamento:**
   - **Nombre comercial o genérico:** Campo con autocompletado de medicamentos comunes.
   - **Dosis y Unidad:** Selector claro (mg, ml, gotas, tabletas).
   - **Horario de Toma:** Selector de hora digital accesible.
   - **Frecuencia:** Diaria, Días específicos (Lunes, Miércoles, Viernes) o Intervalos (cada 8 horas).
   - **Duración:** Tratamiento continuo o con fecha de fin programada.
   - **Foto de la Pastilla:** Subida de imagen o captura de cámara.
   - **Indicaciones Adicionales:** "Tomar después de comer", "Con abundante agua".

---

## 3. Modelo de Datos (Esquema de Prescripción)

```typescript
export interface MedicationPrescription {
  id: string;
  patientId: string;
  name: string;
  dosage: string;                // Ej: "50 mg"
  formFactor: 'TABLET' | 'CAPSULE' | 'LIQUID' | 'DROPS' | 'INJECTION';
  imageUrl?: string;             // Foto del comprimido
  times: string[];               // ["08:00", "20:00"]
  frequencyType: 'DAILY' | 'SPECIFIC_DAYS' | 'INTERVAL';
  specificDays?: number[];       // [1, 3, 5] (Lunes, Miércoles, Viernes)
  startDate: string;             // ISO Date
  endDate?: string;              // ISO Date (opcional)
  instructions?: string;         // Ej: "Tomar con el desayuno"
  isActive: boolean;
}
```
