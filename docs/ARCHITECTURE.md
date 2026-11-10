# Decisiones técnicas: fase 1

## Stack aprobado para arrancar
- **Node.js 22+ ESM**, librerías estándar HTTP y test de Node, cero dependencias en la base inicial.
- **PostgreSQL** como destino de persistencia de producción, todavía no implementado ni provisionado.
- **Sesiones seguras del lado servidor** con autenticación real pendiente; los tokens opacos actuales son una abstracción de desarrollo sin API pública de inicio de sesión.
- **Aislamiento por tenant**: cada entidad de asistente pertenece a una organización; toda consulta usa el tenant del principal autenticado, nunca un tenant declarado por el cliente.
- **Frontend**: PWA progresiva y panel ADMIN en la siguiente fase, sin escoger todavía un framework pesado.
- **Proveedores**: DeepSeek por defecto y OpenAI opcional; claves solamente en servidor. No se realizan llamadas a proveedores en esta fase.

## Estado honesto
Solo están implementados módulos de dominio, una abstracción de sesión en memoria, un servidor mínimo limitado a localhost y tests unitarios. **NO está listo para producción.** Falta autenticación real, almacenamiento durable, migraciones, panel ADMIN, conversación, memoria y PWA.

## Continuación para AS Developer
1. Comprobar `npm test` y `npm run check` mediante ejecutor aislado real. Si no hay ejecutor, detenerse y reportar el bloqueo, sin decir que pasó pruebas.
2. Crear persistencia PostgreSQL con migraciones reversibles y aislamiento estricto.
3. Implementar registro/inicio de sesión seguros, hashing, sesiones durables, protección CSRF/limitación de intentos.
4. Implementar UI administrativa mínima y un recorrido ADMIN crea asistente → cliente autorizado consulta configuración.
5. Extender conversación y memoria separada por tenant con DeepSeek configurable.
6. Entregar commits y PR; nunca fusionar ni desplegar sin autorización.
