# MOD-01: Onboarding y Vinculación de Roles

- **Plataforma:** Móvil (Paciente) y Web (Cuidador).
- **Perfil de Usuario:** Paciente y Cuidador.
- **Tecnología:** Autenticación por Código PIN / Tokens criptográficos.

---

## 1. Objetivo del Módulo y Justificación IHM

Establecer una vinculación segura entre el dispositivo móvil del paciente y la cuenta web del cuidador **sin imponer contraseñas alfanuméricas complejas al adulto mayor**.

- **Justificación IHM (Tolerancia a Errores y Carga Cognitiva):** Los adultos mayores suelen olvidar contraseñas complejas con símbolos y mayúsculas. El sistema traslada la gestión de seguridad al cuidador y ofrece un mecanismo de enlace mediante un **código PIN numérico de 6 dígitos** de un solo uso.

---

## 2. Flujo de Vinculación Paso a Paso

```
[ Cuidador en Portal Web ]                    [ Paciente en App Móvil ]
           │                                              │
1. Hace clic en "Vincular Nuevo Paciente"                  │
2. El sistema genera Código PIN: [ 8 4 2 1 9 5 ]           │
           │                                              │
3. El cuidador dicta o ingresa el PIN en el móvil del abuelo
                                                          │
                                         4. La App Móvil ingresa el PIN
                                                          │
                                         5. Muestra confirmación por Voz:
                                            "¡Vinculado con éxito a tu cuidador!"
```

---

## 3. Modelo de Datos de Enlace

```typescript
export interface PatientCaregiverLink {
  linkId: string;
  caregiverId: string;
  patientId: string;
  pairingCode: string;          // PIN de 6 dígitos numéricos
  expiresAt: string;            // Válido por 15 minutos
  status: 'PENDING' | 'LINKED' | 'EXPIRED';
  relationship: 'HIJO' | 'HIJA' | 'CONYUGE' | 'ENFERMERO' | 'OTRO';
}
```
