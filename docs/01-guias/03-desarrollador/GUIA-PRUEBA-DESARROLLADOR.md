# Guía de Prueba para Desarrolladores

## Acceso Rápido por Rol

| Rol | Documentación Principal | Archivos Clave |
|-----|------------------------|-----------------|
| Desarrollador Backend | [Backend Testing](#backend-testing) | `src/server.js`, `src/models/webhook.js` |
| Desarrollador Frontend | [Frontend Testing](#frontend-testing) | `src/public/app.js`, `src/public/index.html` |
| DevOps | [Docker Testing](#docker-testing) | `docker/Dockerfile`, `docker/docker-compose.yml` |
| QA/Testing | [Integration Testing](#integration-testing) | `scripts/test-webhook.js` |

## Configuración Inicial

| Paso                     | Comando                             | Ubicación         | Tiempo Estimado |
| ------------------------ | ----------------------------------- | ----------------- | --------------- |
| 1. Instalar dependencias | `npm install`                       | `./package.json`  | 30-60s          |
| 2. Configurar entorno    | `cp .env.example .env`              | `./.env.example`  | 5s              |
| 3. Iniciar servidor      | `npm run dev`                       | `./src/server.js` | 3-5s            |
| 4. Verificar health      | `curl http://localhost:3000/health` | Endpoint          | 1s              |

## Backend Testing

### Verificación de Endpoints

| Endpoint | Método | Payload de Prueba | Respuesta Esperada |
|----------|--------|-------------------|-------------------|
| `/webhook/test` | POST | `{"data":"test"}` | `{"id":"uuid","eventType":"test"}` |
| `/api/webhooks` | GET | N/A | `{"webhooks":[],"total":0}` |
| `/api/stats` | GET | N/A | `{"total":0,"last24h":0,"byEvent":{}}` |
| `/health` | GET | N/A | `{"status":"healthy","timestamp":"..."}` |

### Pruebas de Carga

| Herramienta | Comando | Parámetros |
|-------------|---------|------------|
| Script interno | `node scripts/test-webhook.js` | `--count 100 --delay 10` |
| curl manual | `curl -X POST` | `-d '{"test":true}' -H "Content-Type: application/json"` |

## Frontend Testing

### Verificación del Dashboard

1. Abrir navegador en `http://localhost:3000`
2. Inspeccionar WebSocket: DevTools > Network > WS
3. Verificar conexión: Buscar frame con `{"type":"connection"}`

### Pruebas de Interfaz

| Elemento | Selector | Comportamiento Esperado |
|----------|----------|------------------------|
| Conexión WS | `.connection-status` | Cambia a "Conectado" en <2s |
| Botón refresh | `#refreshBtn` | Recarga lista en <1s |
| Filtro eventos | `#eventTypeFilter` | Filtra resultados instantáneamente |
| Modal detalles | `.webhook-item` | Abre al hacer clic |

## Docker Testing

### Construcción de Imagen

```bash
docker build -f docker/Dockerfile -t webhook-receiver .
```

### Verificación de Contenedor

| Comando | Salida Esperada |
|---------|----------------|
| `docker run -p 3000:3000 webhook-receiver` | Servidor escuchando puerto 3000 |
| `docker exec container-id curl http://localhost:3000/health` | `{"status":"healthy"}` |
| `docker logs container-id` | Sin errores críticos |

### Docker Compose

```bash
cd docker && docker-compose up -d
```

## Integration Testing

### Flujo Completo de Prueba

| Paso | Acción | Resultado Esperado |
|------|--------|-------------------|
| 1 | Enviar webhook | Recibir ID único |
| 2 | Verificar dashboard | Webhook aparece en lista |
| 3 | Verificar API | GET `/api/webhooks` incluye nuevo webhook |
| 4 | Verificar stats | Contador incrementa |
| 5 | Filtrar por tipo | Solo muestra webhooks del tipo seleccionado |

### Casos de Prueba Específicos

| Caso | Endpoint | Headers | Payload | Resultado |
|------|----------|---------|---------|-----------|
| Evento GitHub | `/webhook/github.push` | `X-GitHub-Event: push` | `{"repository":{"name":"test"}}` | EventType = github.push |
| Evento genérico | `/webhook` | `Content-Type: application/json` | `{"message":"test"}` | EventType = unknown |
| Payload grande | `/webhook/test` | N/A | Objeto con >1000 propiedades | Guarda sin errores |

## Solución de Problemas

| Problema | Causa Probable | Solución |
|----------|---------------|----------|
| Puerto 3000 ocupado | `EADDRINUSE` | Cambiar PORT en `.env` o matar proceso |
| `broadcastUpdate is not a function` | Dependencia circular | Ya resuelto - Verificar uso de `src/utils/websocket.js` |
| **SQLITE_READONLY: attempt to write a readonly database** | Inconsistencia DB_PATH, procesos zombie, o permisos | Ver [SOLUCION-SQLITE-READONLY.md](./SOLUCION-SQLITE-READONLY.md) |
| SQLite bloqueado | Base datos en uso | Eliminar `webhooks.db` y reiniciar |
| WebSocket desconectado | Error de red | Verificar firewall, reiniciar navegador |
| Docker build falla | Node modules corruptos | Ejecutar `rm -rf node_modules && npm install` |
| Tests lentos | Delay configurado | Usar `--delay 0` en script de prueba |

## Métricas de Rendimiento

| Métrica | Valor Esperado | Ubicación |
|---------|---------------|-----------|
| Tiempo de respuesta API | <100ms | Logs del servidor |
| Tiempo de conexión WS | <2s | DevTools Network |
| Tamaño payload máximo | 10MB | Configurado en `src/server.js` |
| Límite rate | 1000 req/15min | Middleware en `src/server.js` |

## Referencias de Código

| Funcionalidad | Archivo | Línea | Método |
|---------------|--------|--------|--------|
| Recepción webhook | `src/routes/webhook.js` | 7-50 | `router.post('/:event')` |
| Almacenamiento | `src/models/webhook.js` | 45-65 | `createWebhook()` |
| WebSocket - Inicialización | `src/utils/websocket.js` | 6-18 | `initializeWebSocket()` |
| WebSocket - Broadcast | `src/utils/websocket.js` | 21-32 | `broadcastUpdate()` |
| Health check | `src/server.js` | 38-44 | `app.get('/health')` |
| Rate limiting | `src/server.js` | 18-23 | `rateLimit()` |

## Versionado

| Versión | Generado | Estado | Comentarios |
|---------|----------|--------|-------------|
| 1.0.0 | 2024-02-10 | Estable | Documentación inicial de pruebas |
| 1.1.0 | 2026-02-10 | Estable | Refactorización WebSocket a módulo independiente |
