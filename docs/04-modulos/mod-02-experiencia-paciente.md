# MOD-02: Experiencia y Teleasistencia del Paciente (App Móvil)

- **Plataforma:** Aplicación Móvil (Android / Flutter).
- **Perfil de Usuario:** Adulto Mayor (Paciente).
- **Tecnología:** Flutter / Kotlin Nativo + Síntesis de Voz (TTS) + Reconocimiento de Voz (STT).

---

## 1. Objetivo del Módulo y Justificación IHM

Ofrecer la experiencia más sencilla, accesible y reconfortante posible para el adulto mayor, eliminando cualquier sensación de ansiedad tecnológica.

- **Minimización de Carga Cognitiva:** La pantalla principal contiene únicamente la información de la jornada actual y 2 botones de acción masivos.
- **Asistencia por Voz Activa:** Cada elemento en pantalla puede ser leído en voz alta presionando el botón "Escuchar" o activando la guía por voz.

---

## 2. Pantallas y Componentes Principales

```
┌──────────────────────────────────────────────┐
│  CONTIGO                   🔊 [ Escuchar ]   │
│                                              │
│  Hola, Dacio                                 │
│  ──────────                                  │
│  🟢 Todo bien hoy                            │
│                                              │
│  💊 PRÓXIMA PASTILLA                         │
│  ┌────────────────────────────────────────┐  │
│  │ ⏰ 08:00 AM · Losartán 50 mg           │  │
│  │ [Foto Pastilla] Tomar con el desayuno  │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │          🩺 MEDIR PRESIÓN               │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │          🚨 PEDIR AYUDA                 │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  🎤 [ Hablar con Contigo ]                   │
└──────────────────────────────────────────────┘
```

### Acciones Principales del Paciente:
1. **Confirmar Toma de Medicamento:** Al sonar la alarma, la pantalla muestra la foto grande de la pastilla con un botón gigante de **"Ya tomé"** y otro de **"Posponer 10 min"**.
2. **Medir Presión Arterial:** Pantalla asistida con botones `[+]` y `[-]` grandes para ajustar sistólica y diastólica o dictado por voz ("Ciento veinte sobre ochenta").
3. **Botón "Pedir Ayuda" (Pánico):** Tocar este botón abre un diálogo claro de confirmación ("¿Deseas llamar a tu hijo Gerson?") antes de iniciar una llamada o enviar un SMS de emergencia con geolocalización.
