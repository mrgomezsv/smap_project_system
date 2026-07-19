# Informe de Auditoría y Puntos de Mejora: Proyecto KidsFun

Este documento detalla los hallazgos técnicos y las recomendaciones estratégicas para los proyectos `kidsfun_django` y `kidsfun_app` tras la implementación del flujo de Waiver V2.

## 1. Arquitectura del Backend (Django)

### Puntos Positivos
- Uso correcto de **Django REST Framework** para la comunicación con la app.
- Implementación de **Firebase Admin SDK** para validación de identidad.
- Separación de responsabilidades con la nueva app `waiver_v2`.

### Áreas de Mejora
- **Unificación de Modelos**: Aún existen remanentes del modelo `WaiverDataDB` (apuntando a `api_waiver_waiverdata`) en el código. Se recomienda migrar totalmente a `WaiverQRV2` y eliminar el código legado para evitar confusiones.
- **Seguridad de QR**: El código QR actual es un fragmento de UUID de 8 caracteres. Aunque es difícil de adivinar, para un entorno de alta concurrencia se recomienda:
  - Añadir una firma digital (HMAC) al código.
  - Almacenar un hash del código en la DB en lugar del código en plano.
- **Validación Automática**: El método `update_status` se llama manualmente en las vistas. Podría implementarse un `@property` o un manager personalizado para que los waivers expirados se marquen como `INACTIVE` automáticamente al consultarlos.

## 2. Aplicación Flutter

### Puntos Positivos
- Estructura limpia de APIs usando un `ApiManager` centralizado.
- Buena implementación de internacionalización (L10n).
- Interfaz intuitiva para el registro de familiares.

### Áreas de Mejora
- **Manejo de Estados**: La app depende mucho de `setState`. Para la escala del proyecto, se recomienda migrar a un gestor de estados más robusto como **Provider** o **Bloc**, especialmente en el flujo de registro.
- **Persistencia del QR**: Actualmente, si el usuario no tiene conexión, no puede ver su QR. Se recomienda guardar el QR encriptado en `SharedPreferences` o una DB local (`sqflite`) para acceso offline.
- **Sincronización de Campos**: Existía una discrepancia entre `qr_code` (backend) y `qr_value` (app). Ya fue mitigada en el backend, pero se recomienda estandarizar los nombres de campos en los modelos de Dart.

## 3. Seguridad y DevOps

### Hallazgos
- **Variables de Entorno**: El uso de `.env.local` y `.env.production` es excelente para la portabilidad.
- **Dockerización**: El proyecto cuenta con un `docker-stack.yml` sólido para despliegues en enjambre (Swarm) o K8s.

### Recomendaciones
- **Rate Limiting**: Aunque DRF tiene `AnonRateThrottle`, los endpoints de validación de QR deben tener una política de "Throttling" muy estricta para prevenir ataques de fuerza bruta sobre los códigos de 8 caracteres.
- **Logs**: Centralizar los logs de producción en una herramienta como Sentry o ELK para detectar errores de generación de PDF en tiempo real.

## 4. Experiencia de Usuario (UI/UX)

### Recomendaciones
- **Dashboard Premium**: La implementación del acordeón mejora la legibilidad. Se sugiere añadir un filtro por "Rango de Fechas" para que los administradores puedan auditar registros de días específicos rápidamente.
- **Notificaciones Push**: Aprovechar que Firebase está integrado para enviar una notificación al Titular cuando un colaborador escanea su QR con éxito.

---
*Documento generado por Antigravity AI - 2026*
