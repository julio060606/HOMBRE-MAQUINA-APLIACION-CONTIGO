# Especificación de Componentes, Secciones y Guía de Estilo

Esta guía documenta la construcción de componentes y pantallas del frontend siguiendo el **Sistema de Diseño Triádico**.

---

## 1. Reglas Globales de Maquetación

### A. Geometría de Componentes (0 Curvatura)
* Todos los contenedores principales, tarjetas, inputs, tablas y botones de la **Web Institucional (Clínica)**, **Landing de Contigo** y **Aplicación Web del Cuidador** deben implementar esquinas rectas (`rounded-none` o bordes definidos de 0px / minimalistas).
* Esto maximiza el área útil de visualización de datos médicos y aporta una estética arquitectónica, sobria y profesional (estilo SaaS de alta gama).

### B. Jerarquía Tipográfica
* **Títulos, Encabezados y Métricas:** `Plus Jakarta Sans` (`font-heading`).
  * En Landing y Clínica: usar peso **`font-light` / `font-normal`** para elegancia editorial.
  * En Dashboard del Cuidador: usar peso **`font-semibold` / `font-bold`** en valores numéricos y KPIs para legibilidad rápida.
* **Cuerpo de Texto, Tablas y Formularios:** `Inter` (`font-sans`) para máxima claridad en lectura continua.

---

## 2. Mapa de Vistas del Frontend Web

### 🌐 Vistas Públicas e Institucionales (Capa 1)
1. **`/clinic` (`ClinicPortalPage.tsx`):**
   * Navbar con logotipo vectorial (`CENTRO MÉDICO`), enlace a "Mi Portal" y botón de agendar cita.
   * Hero con eslogan ligero, carrusel vertical con imágenes y degradado oscuro superpuesto, y difuminado inferior que se funde en blanco con la página.
   * Sección 2x2 de Atención Médica con fotos reales.
   * Cartera de Especialidades con panel de detalle expandible interactivo.
   * Sección "¿Por qué elegirnos?" con testimonio médico y certificaciones.
   * **Sección de la App CONTIGO:** Banner de ancho completo (`w-full`) con gradiente de Verde Salud (`#136F53`) que se desvanece hacia la derecha, con letras oscuras y mockup del teléfono.
   * Sedes, Aseguradoras EPS y Footer corporativo completo.

2. **`/landing` (`ContigoLandingPage.tsx`):**
   * Navbar minimalista con logotipo vectorial en verde y los 2 accesos esenciales (`← Portal Centro Médico` y `Acceso Cuidador`).
   * Hero con eslogan de telecuidado y placeholder de captura móvil.
   * Desglose de características con fotos reales (Pastillero, Presión, Alertas, Reporte PDF).
   * Sección comparativa de la Plataforma Dual (Móvil Paciente vs Web Cuidador).

---

### 💻 Vistas de la Aplicación Web del Cuidador (Capa 2)
1. **`/login` y `/register` (`LoginPage.tsx`, `RegisterPage.tsx`):**
   * Formularios limpios con geometría de 0 curvatura, logotipo vectorial en Verde Salud y credenciales precargadas para pruebas.
2. **`/dashboard` (`DashboardPage.tsx`):**
   * Barra de estado superior con resumen del paciente activo (Dacio Ramos).
   * 4 Tarjetas KPI: Adherencia de hoy (%), Última Presión (120/80 mmHg), Pulso en reposo (bpm) y Estado de sincronización móvil en vivo.
   * Timeline de dosis programadas vs tomadas con fotos de pastillas.
   * Feed de alertas recientes y avisos clínicos.
3. **`/medications` (`MedicationsPage.tsx`):**
   * Pastillero interactivo con selector de estado (Activo / Pausado).
   * Modal de alta rápida con dosis, horarios, frecuencia y foto del comprimido.
4. **`/vitals` (`VitalsPage.tsx`):**
   * Gráfico de líneas interactivo con **Recharts** (Presión Sistólica en rojo / Diastólica en azul y líneas de referencia en 120/80 mmHg).
   * Tabla cronológica de registros con canal de entrada (Voz vs Teclado) y estado clínico.
5. **`/reports` (`ReportsPage.tsx`):**
   * Selector de rango temporal (7, 30, 90 días) y casillas de verificación de secciones clínicas.
   * Vista previa y generador de informe médico en PDF listo para imprimir con casillas de firma y sello.
6. **`/settings` (`SettingsPage.tsx`):**
   * Configuración de umbrales clínicos de alarma, tiempos de tolerancia por omisión y descarga de copia de seguridad en JSON cifrado.

---

## 3. Guía de Interacción para Agentes de IA
* **No inventar paletas no documentadas:** Utilizar estrictamente `#136F53` (Verde Salud), `#1E3A8A` (Azul Clínico) y semáforos estándar.
* **Mantener la consistencia geométrica:** En el frontend web, preservar las clases `rounded-none` o bordes rectos nítidos en los nuevos módulos creados.
* **Probar siempre con Mocks:** Asegurar que `VITE_USE_MOCKS=true` funcione de manera autónoma sin requerir el backend encendido.
