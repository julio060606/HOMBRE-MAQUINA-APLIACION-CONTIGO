# MOD-00: Landing Page Institucional y Acceso al Portal

- **Plataforma:** Web Pública (Responsive / Desktop & Mobile).
- **Perfil de Usuario:** Visitantes, Familiares de Adultos Mayores, Directores de Clínicas.
- **Tecnología:** React + Material UI / Tailwind CSS + Vite.

---

## 1. Objetivo del Módulo y Flujo de Entrada

Proveer el punto de entrada digital al ecosistema **CONTIGO**, articulando la relación entre clínicas aliadas, familiares cuidadores y la descarga de la app móvil para pacientes.

```
[ Web Externa de Clínica Aliada ]
              │ (Banner: "Conoce nuestro programa de teleasistencia para adultos mayores")
              ▼
[ Landing Page Oficial de CONTIGO ]
  ├── Sección 1: Propuesta de valor y beneficios de teleasistencia.
  ├── Sección 2: Botón [ Descargar App Paciente (Google Play) ].
  ├── Sección 3: Botón [ Acceso Cuidador / Iniciar Sesión Web ].
  └── Sección 4: Formulario de contacto para Clínicas y Residencias Geriátricas.
              │
              ▼ (Al presionar "Acceso Cuidador")
[ Pantalla de Login / Registro Web del Cuidador ]
```

---

## 2. Componentes de la Landing Page

1. **Hero Section:**
   - Título impactante: *"Cuidado, medicación y salud de tus seres queridos en un solo lugar"*.
   - Imagen de alta calidad que muestre la dualidad: el abuelo con su teléfono accesible y el cuidador en su laptop viendo gráficos claros.
   - Dos llamados a la acción (CTAs):
     - Botón Primario: `[ Acceso al Portal Cuidador ]` (Navega a `/login`).
     - Botón Secundario: `[ Descargar App para Pacientes ]` (Enlace directo a Play Store / APK).
2. **Sección de Características:**
   - *Pastillero Inteligente con Foto:* Recordatorios infalibles con foto real del medicamento.
   - *Monitoreo Biométrico:* Gráficos de presión arterial y pulso en tiempo real.
   - *Alertas de Emergencia:* Notificaciones automáticas ante omisión de dosis o botones de auxilio.
   - *Reportes para el Médico:* Exportación en PDF en un solo clic.
3. **Sección de Alianzas y Clínicas (B2B):**
   - Espacio que explica cómo las residencias y clínicas geriátricas pueden monitorear múltiples pacientes desde un panel institucional centralizado.

---

## 3. Pantalla de Autenticación (`/login` y `/register`)

- **Login Cuidador:** Correo electrónico + Contraseña con opción de *"Recordar sesión"* y *"¿Olvidaste tu contraseña?"*.
- **Registro de Cuidador:** Formulario rápido de 3 campos (Nombre completo, Correo electrónico, Contraseña de 8+ caracteres).
- **Validación con Zod:**
```typescript
export const loginSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});
```

---

## 4. Criterios de Aceptación

- [ ] Carga ultra-rápida (Lighthouse Score > 90 en Performance y Accesibilidad).
- [ ] Responsive design perfecto en escritorio, tablet y smartphone.
- [ ] Enlace claro hacia la descarga de la app móvil del paciente.
- [ ] Identificadores `data-testid="btn-landing-caregiver-access"` y `data-testid="btn-landing-download-app"` implementados.
