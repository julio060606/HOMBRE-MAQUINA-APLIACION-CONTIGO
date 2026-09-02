# MOD-06: Ajustes, Notificaciones y Respaldo Cifrado

- **Plataforma:** Web (Configuración Avanzada) y Móvil (Ajustes Básicos de Voz).
- **Perfil de Usuario:** Cuidador / Paciente.
- **Tecnología:** Almacenamiento en la Nube Cifrado (Cloud Storage) + Web Push / FCM.

---

## 1. Objetivo del Módulo y Justificación IHM

Centralizar las opciones de accesibilidad del paciente y la gestión de copias de seguridad de forma automatizada y transparente.

- **Justificación IHM (Prevención de Errores - Heurística #5):** Las copias de seguridad no deben requerir que el adulto mayor recuerde contraseñas complejas. Se gestionan automáticamente vinculadas al ID del paciente y la cuenta verificada del cuidador.

---

## 2. Ajustes de Accesibilidad (Móvil)

- **Modo Fácil / Ultra Accesible:** Agranda fuentes un 25% adicional y oculta detalles secundarios.
- **Guía por Voz Continua:** El sistema lee en voz alta cada pantalla al abrirse.
- **Número de Repeticiones de Alarma:** Configurable (1 a 3 avisos cada 10 minutos).
- **Sensibilidad de Alerta al Cuidador:** Si tras 3 avisos el paciente no confirma, se dispara una notificación push y SMS al teléfono del cuidador.

---

## 3. Umbrales Clínicos (Configurados en Web por el Cuidador/Médico)

```typescript
export interface ClinicalThresholds {
  patientId: string;
  systolicMaxNormal: number;   // Ej: 130 mmHg
  systolicMinNormal: number;   // Ej: 100 mmHg
  diastolicMaxNormal: number;  // Ej: 85 mmHg
  diastolicMinNormal: number;  // Ej: 60 mmHg
  pulseMaxNormal: number;      // Ej: 100 bpm
  pulseMinNormal: number;      // Ej: 60 bpm
  notifyOnOutOfRange: boolean; // Alerta inmediata si el paciente registra valores fuera de rango
}
```
