# LeveIA Agents

Plataforma comercial independiente para crear, configurar, entregar y administrar asistentes personales, profesionales y empresariales y equipos multiagente bajo la marca **LeveIA**.

## Límites del proyecto

- Repositorio público de código; **nunca** publicar claves, credenciales, datos de clientes, documentos privados ni conversaciones.
- Proyecto separado de LeveIA Chat, Natalie (Direcciones507), AS Developer, Mi Contacto y Empleos.pa.
- El dominio/subdominio queda por decidir. No inventar endpoints, ni reutilizar bases de datos ajenas.
- Sin despliegue de producción ni servicios con costo adicional sin aprobación.

## Primera entrega funcional

1. Arquitectura modular y panel ADMIN para crear y configurar asistentes por cliente.
2. Autenticación, permisos y aislamiento estricto por cliente/organización.
3. Chat de cada asistente con instrucciones y personalidad configurables, DeepSeek preferido y OpenAI opcional, con claves solo del lado servidor.
4. Memoria persistente por asistente y cliente, con controles de privacidad y eliminación.
5. Herramientas autorizadas para documentos Word, Excel y PDF, carga y consulta de archivos.
6. Entrega mediante enlace privado autenticado y experiencia PWA instalable.
7. Equipo multiagente configurable, registro de acciones, control de costos y confirmación humana para acciones críticas.
8. Pruebas automatizadas, instrucciones de despliegue y checklist de aceptación.

## Método de trabajo para AS Developer

Desarrollar en rama de tarea, en incrementos recuperables; ejecutar pruebas reales; registrar resultados, limitaciones y bloqueos. No reiniciar el trabajo al alcanzar un límite de pasos o presupuesto. Entregar PR para revisión; **no** fusionar ni desplegar sin autorización. Priorizar un recorrido vertical real: ADMIN crea asistente → asigna cliente → cliente inicia sesión → asistente reconoce su configuración → conversación privada → memoria recuperable. Después ampliar herramientas y multiagentes.

No incluir generación de imágenes, presentaciones ni WhatsApp en esta primera fase.
