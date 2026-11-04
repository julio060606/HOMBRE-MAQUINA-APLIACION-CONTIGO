# Publicación de la versión con API de Contigo

La aplicación actual usa Spring Boot y dos bases PostgreSQL. Vercel aloja el frontend; su regla SPA no crea la API Java. La URL pública debe conectarse a un backend HTTPS disponible. La ejecución local sigue en 3001/8081/55432.

## Requisitos de alojamiento

El backend necesita Java 21, una conexión a la base CONTIGO y una conexión de lectura a la clínica ficticia. En el alojamiento, SERVER_ADDRESS debe permitir la interfaz del contenedor; el puerto y las credenciales los proporciona el servicio elegido. Los secretos se configuran en el alojamiento y no se incorporan al frontend ni al repositorio.

Las variables utilizadas por tools/runtime/Start-Project.ps1 y backend/src/main/resources/application.yml son:

| Uso | Variables |
|---|---|
| Servidor | PORT, SERVER_ADDRESS |
| Base CONTIGO | SPRING_DATASOURCE_URL, SPRING_DATASOURCE_USERNAME, SPRING_DATASOURCE_PASSWORD, SPRING_DATASOURCE_DRIVER |
| Autenticación | JWT_SECRET |
| Proveedor clínico | CLINICAL_PROVIDER_MODE=database, CLINIC_ORGANIZATION_ID |
| Base clínica | CLINIC_DB_URL, CLINIC_DB_USERNAME, CLINIC_DB_PASSWORD, CLINIC_DB_DRIVER |
| Sincronización | CLINIC_SYNC_ENABLED, CLINIC_SYNC_ON_STARTUP, CLINIC_SYNC_INTERVAL_MS, CLINIC_SYNC_INITIAL_DELAY_MS |

No se eligió ni contrató un servicio de backend. Tampoco se copiaron las bases locales a un proveedor. Esas acciones requieren conocer el destino y sus condiciones. Mantener las bases separadas y los permisos de solo lectura del conector clínico.

## Configuración del frontend

En el proyecto de Vercel, usar frontend como directorio raíz y configurar VITE_USE_MOCKS=false y VITE_API_BASE_URL con la URL HTTPS real del backend terminada en /api/v1. Volver a compilar para que Vite incorpore esas variables. Una URL localhost no sirve en el navegador de otra persona.

No se debe activar el modo offline como sustitución silenciosa cuando la API falla. Una demostración offline, si se elige, debe publicarse y describirse expresamente como otra condición de prueba.

La compilación local para una API pública real puede prepararse con tools/runtime/Build-PublicFrontend.ps1 -ApiBaseUrl seguido de la URL proporcionada por el alojamiento. El script verifica la salud antes de compilar y restaura las variables del proceso; no publica ni cambia frontend/.env.

## Verificación después de publicar

Ejecutar tools/runtime/Test-PublicDeployment.ps1 con FrontendUrl y ApiBaseUrl. El resultado se guarda en output/apf3/evidence/current-2026-11-03/public-deployment.json. Una respuesta HTML a /api/v1/health no acredita una API disponible.

Después, comprobar en un navegador nuevo el inicio de sesión de paciente y cuidador, T1 a T4, permisos, mensajes de error y sincronización entre dispositivos. Guardar capturas y condiciones reales de ejecución. La salud HTTP por sí sola no completa esa comprobación.
