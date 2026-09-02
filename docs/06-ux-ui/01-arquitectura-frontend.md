# Arquitectura Frontend & Sistema de Diseño Triádico

Este documento define la arquitectura técnica del frontend, el stack tecnológico y el **Sistema de Diseño Triádico** del ecosistema **CONTIGO / Centro Médico San Juan**.

---

## 1. Arquitectura Triádica de Diseño (3 Capas Especializadas)

La solución responde a un principio central de **Interacción Humano-Computadora (IHM)** y **Diseño Centrado en el Usuario (UCD)**: *paciente, cuidador y público institucional poseen contextos de uso, capacidades motrices y cargas cognitivas radicalmente distintas*. Por tanto, el ecosistema se divide en 3 capas formales:

```mermaid
flowchart TD
    subgraph Capa1["Capa 1: Sitio Institucional & Landing"]
        A1["Estilo: Arquitectónico / Editorial"]
        A2["Objetivo: Captación, Prestigio y Confianza Médica"]
        A3["Líneas rectas (0 curvatura), tipografía light, banners full-width"]
    end

    subgraph Capa2["Capa 2: Aplicación Web del Cuidador (Dashboard SaaS)"]
        B1["Estilo: SaaS Clínico de Alta Productividad"]
        B2["Objetivo: Supervisión 24/7, Registro Rápido con Teclado, Exportación"]
        B3["Paneles densos, gráficos biométricos, KPIs panorámicos"]
    end

    subgraph Capa3["Capa 3: App Móvil del Paciente (Adulto Mayor)"]
        C1["Estilo: Accesibilidad Extrema (WCAG 2.1 AAA)"]
        C2["Objetivo: Cero Fricción, Cero Error Farmacológico, Auxilio Directo"]
        C3["Botones gigantes (64px+), fotos reales de pastillas, voz (TTS)"]
    end

    Capa1 -->|Acceso Web Cuidador| Capa2
    Capa2 <-->|Sincronización en Tiempo Real (WebSockets / Cloud)| Capa3
```

---

## 2. Matriz Comparativa del Sistema de Diseño

| Dimensión de Diseño | 🌐 Capa 1: Landing & Clínica (Público) | 💻 Capa 2: Web Cuidador (Dashboard SaaS) | 📱 Capa 3: App Móvil Paciente (Senior) |
| :--- | :--- | :--- | :--- |
| **Usuario Objetivo** | Familiares, adultos mayores autónomos, público general. | Hijo, cuidador formal o médico (30-55 años). | Adulto mayor (70+ años), presbicia, temblor fino. |
| **Dispositivo de Uso** | Navegador Web / Móvil responsive. | Computadora / Laptop / Tablet (teclado + mouse). | Smartphone táctil (Android). |
| **Tipografía y Peso** | `Plus Jakarta Sans` (light / normal) + `Inter`. | `Plus Jakarta Sans` (medium/bold) para métricas + `Inter` para datos. | `font-extrabold` (24px - 32px), ultra legible a distancia. |
| **Geometría de Contenedores** | **0 Curvatura (`rounded-none`)**, estética arquitectónica. | **0 Curvatura / Líneas Rectas Nítidas**, máxima densidad de datos. | **Píldoras y Botones Redondeados Gigantes** (`rounded-3xl` de 64px+). |
| **Mecanismo de Entrada** | Exploración por scroll y clics. | **Teclado físico** (dosis, miligramos, notas clínicas). | **Voz interactiva (TTS/STT)** y toques gigantes. |
| **Carga Cognitiva** | Informativo / Narrativa visual con fotografías reales. | **Dashboard Panorámico Multitarea** (adherencia, presión, alertas). | **Una sola decisión por pantalla** (ej: "¿Tomó su Losartán?"). |
| **Cumplimiento Accesibilidad** | WCAG 2.1 AA | WCAG 2.1 AA / Contraste Alto | **WCAG 2.1 AAA Obligatorio** |

---

## 3. Tokens Visuales y Paleta Oficial

### 🎨 Paleta Cromática
* **Verde Salud Principal (`#136F53` / `forest-700`):** Marca de Contigo, botones de acción primaria, acentos clínicos frescos y enérgicos.
* **Verde Salud Oscuro (`#0E543F` / `forest-800`):** Fondos de banners y cabeceras de alto contraste.
* **Azul Institucional (`#0F2942` / `#1E3A8A`):** Identidad del Centro Médico / Clínica San Juan y acentos de telemedicina.
* **Cian Tecnológico (`#0284C7`):** Indicadores de sincronización móvil y estados de telemetría.
* **Semáforo Clínico Universal:**
  * **Éxito / Normal (`#16A34A` / Emerald-600):** Dosis tomada, presión dentro de rango.
  * **Advertencia / Pendiente (`#D97706` / Amber-600):** Dosis próxima, alerta preventiva.
  * **Crítico / Emergencia (`#DC2626` / Red-600):** Presión fuera de rango, omisión de fármaco, botón de auxilio SOS.
* **Fondos:** `#FDFBF7` (Superficie cálida asistiva) y `#F8FAFC` (Slate neutro para datos).

---

## 4. Stack Tecnológico del Frontend

* **Framework:** React 18 + TypeScript.
* **Build Tool:** Vite.
* **Estilos:** Tailwind CSS con extensión de tokens de `forest-700`, `font-heading`, `font-sans` y clases `rounded-none`.
* **Componentes Base:** Material UI (MUI v5) con overrides en `frontend/src/app/theme.ts`.
* **Visualización de Datos:** Recharts (Gráficos de series de tiempo para presión arterial y pulso).
* **Enrutamiento:** React Router v6.
* **Gestión de Estado y Mocks:** Context API (`AuthContext`, `PatientContext`) + conmutador transparente `VITE_USE_MOCKS=true`.
