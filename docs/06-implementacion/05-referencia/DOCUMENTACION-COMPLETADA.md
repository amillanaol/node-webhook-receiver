# Documentación de Pruebas - Node Webhook Receiver

## Acceso Rápido

| Necesidad | Ubicación | Rol |
|-----------|-----------|-----|
| Probar con Postman | [Pruebas con Postman](#pruebas-con-postman) | QA/Desarrollador |
| Probar con curl | [Comandos de Referencia](COMANDOS-REFERENCIA.md) | Desarrollador Backend |
| Documentación técnica | [Mapeo de Código](#mapeo-de-código) | Desarrollador |
| Solución de problemas | [Solución de Problemas](#solución-de-problemas) | Todos |
| Configuración inicial | [Configuración](#configuración-inicial) | DevOps |

## Configuración Inicial

### Requisitos Previos

| Componente | Versión | Verificación |
|------------|---------|--------------|
| Node.js | >= 18.x | `node --version` |
| npm | >= 9.x | `npm --version` |
| SQLite | >= 3.x | `sqlite3 --version` |

### Instalación

| Paso | Comando | Archivo Generado | Tiempo |
|------|---------|------------------|--------|
| 1. Clonar repositorio | `git clone <repo>` | Directorio `node-webhook-receiver/` | Variable |
| 2. Instalar dependencias | `npm install` | `node_modules/` | 30-60s |
| 3. Configurar entorno | `copy .env.example .env` | `.env` | 2s |
| 4. Iniciar servidor | `npm start` | Servidor en puerto 3000 | 3-5s |

## Endpoints Disponibles

### Endpoints de Recepción

| Endpoint | Método | Descripción | Código Fuente |
|----------|--------|-------------|---------------|
| `/webhook/:event` | POST | Recibe webhook con tipo de evento | `src/routes/webhook.js:6-50` |
| `/webhook` | POST | Recibe webhook genérico | `src/routes/webhook.js:52-102` |

### Endpoints de API

| Endpoint | Método | Parámetros | Respuesta | Código Fuente |
|----------|--------|------------|-----------|---------------|
| `/api/webhooks` | GET | `?limit=50&offset=0&eventType=` | Lista de webhooks | `src/routes/api.js:11-39` |
| `/api/webhooks/:id` | GET | `id` (UUID) | Detalle del webhook | `src/routes/api.js:41-63` |
| `/api/webhooks/:id` | DELETE | `id` (UUID) | Confirmación eliminación | `src/routes/api.js:65-90` |
| `/api/stats` | GET | - | Estadísticas agregadas | `src/routes/api.js:92-105` |
| `/api/event-types` | GET | - | Lista de tipos únicos | `src/routes/api.js:107-127` |
| `/health` | GET | - | Estado del servicio | `src/server.js:38-44` |

## Pruebas con Postman

### Configuración de Colección

#### Colección Base

| Configuración | Valor |
|---------------|-------|
| Nombre | Node Webhook Receiver Tests |
| Descripción | Colección de pruebas para el receptor de webhooks |
| Variable base_url | `http://localhost:3000` |

### Request 1: Health Check

| Campo | Valor |
|-------|-------|
| Método | GET |
| URL | `{{base_url}}/health` |
| Headers | Ninguno |
| Body | N/A |

**Respuesta Esperada:**

| Campo | Tipo | Valor Esperado |
|-------|------|----------------|
| status | string | `healthy` |
| timestamp | string | ISO 8601 timestamp |
| uptime | number | Segundos desde inicio |

### Request 2: Enviar Webhook Simple

| Campo | Valor |
|-------|-------|
| Método | POST |
| URL | `{{base_url}}/webhook/test.simple` |
| Content-Type | `application/json` |

**Body (raw JSON):**

```json
{
  "message": "Prueba simple desde Postman",
  "timestamp": "2024-02-10T10:30:00Z",
  "test_id": "{{$randomUUID}}"
}
```

**Respuesta Esperada (201 Created):**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| message | string | `Webhook recibido exitosamente` |
| id | string | UUID del webhook generado |
| eventType | string | `test.simple` |

### Request 3: Enviar Webhook con Headers Personalizados

| Campo | Valor |
|-------|-------|
| Método | POST |
| URL | `{{base_url}}/webhook/usuario.creado` |

**Headers:**

| Header | Valor | Descripción |
|--------|-------|-------------|
| Content-Type | `application/json` | Tipo de contenido |
| X-Event-Type | `usuario.creado` | Tipo de evento |
| X-Request-ID | `{{$randomUUID}}` | ID único de request |
| User-Agent | `PostmanRuntime/7.x` | Cliente HTTP |

**Body (raw JSON):**

```json
{
  "usuario": {
    "id": 123,
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "rol": "admin"
  },
  "timestamp": "{{$isoTimestamp}}",
  "origen": "postman"
}
```

### Request 4: Simular Webhook de GitHub

| Campo | Valor |
|-------|-------|
| Método | POST |
| URL | `{{base_url}}/webhook/github.push` |

**Headers:**

| Header | Valor |
|--------|-------|
| Content-Type | `application/json` |
| X-GitHub-Event | `push` |
| X-GitHub-Delivery | `{{$randomUUID}}` |
| User-Agent | `GitHub-Hookshot/abc123` |

**Body (raw JSON):**

```json
{
  "ref": "refs/heads/main",
  "repository": {
    "id": 123,
    "name": "mi-proyecto",
    "full_name": "usuario/mi-proyecto",
    "url": "https://github.com/usuario/mi-proyecto"
  },
  "pusher": {
    "name": "Juan Desarrollador",
    "email": "juan@dev.com"
  },
  "commits": [
    {
      "id": "abc123def456",
      "message": "Fix: Corrección de bug importante",
      "timestamp": "{{$isoTimestamp}}",
      "author": {
        "name": "Juan Desarrollador",
        "email": "juan@dev.com"
      }
    }
  ],
  "head_commit": {
    "id": "abc123def456",
    "message": "Fix: Corrección de bug importante"
  }
}
```

### Request 5: Enviar Payload Grande

| Campo | Valor |
|-------|-------|
| Método | POST |
| URL | `{{base_url}}/webhook/datos.masivos` |
| Content-Type | `application/json` |

**Body (raw JSON):**

```json
{
  "tipo": "procesamiento_batch",
  "metadata": {
    "total_registros": 1000,
    "lote": 1,
    "procesado": false,
    "timestamp_inicio": "{{$isoTimestamp}}"
  },
  "datos": {
    "items": [
      {"id": 1, "valor": "dato_1"},
      {"id": 2, "valor": "dato_2"},
      {"id": 3, "valor": "dato_3"}
    ],
    "configuracion": {
      "version": "1.0.0",
      "entorno": "testing",
      "debug": true
    }
  }
}
```

### Request 6: Obtener Lista de Webhooks

| Campo | Valor |
|-------|-------|
| Método | GET |
| URL | `{{base_url}}/api/webhooks?limit=10&offset=0` |
| Headers | Ninguno |

**Respuesta Esperada:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| webhooks | array | Lista de objetos webhook |
| total | number | Total de webhooks en la lista |
| limit | number | Límite aplicado |
| offset | number | Offset aplicado |

**Estructura de Webhook:**

| Campo | Tipo | Ejemplo |
|-------|------|---------|
| id | string | `550e8400-e29b-41d4-a716-446655440000` |
| eventType | string | `test.simple` |
| payload | object | `{...}` |
| headers | object | `{...}` |
| sourceIp | string | `127.0.0.1` |
| createdAt | string | `2024-02-10T10:30:00.000Z` |

### Request 7: Filtrar por Tipo de Evento

| Campo | Valor |
|-------|-------|
| Método | GET |
| URL | `{{base_url}}/api/webhooks?eventType=usuario.creado` |

**Respuesta:** Lista filtrada solo con webhooks de tipo `usuario.creado`.

### Request 8: Obtener Estadísticas

| Campo | Valor |
|-------|-------|
| Método | GET |
| URL | `{{base_url}}/api/stats` |

**Respuesta Esperada:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| total | number | Total de webhooks almacenados |
| last24h | number | Webhooks últimas 24 horas |
| lastHour | number | Webhooks última hora |
| byEvent | object | Conteo por tipo de evento |

### Request 9: Obtener Detalle de Webhook Específico

| Campo | Valor |
|-------|-------|
| Método | GET |
| URL | `{{base_url}}/api/webhooks/{{webhook_id}}` |

**Nota:** Reemplazar `{{webhook_id}}` con el ID devuelto en el POST.

**Respuesta Esperada (200 OK):** Objeto webhook completo.

**Respuesta Error (404 Not Found):**

```json
{
  "error": "Webhook no encontrado",
  "id": "uuid-invalido"
}
```

### Request 10: Eliminar Webhook

| Campo | Valor |
|-------|-------|
| Método | DELETE |
| URL | `{{base_url}}/api/webhooks/{{webhook_id}}` |

**Respuesta Esperada (200 OK):**

```json
{
  "message": "Webhook eliminado exitosamente",
  "id": "uuid-del-webhook"
}
```

## Scripts de Prueba Automatizados

### Script de Postman: Prueba de Conectividad

```javascript
// Tests tab - Request: Health Check
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has healthy status", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.status).to.eql("healthy");
});

pm.test("Response has timestamp", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("timestamp");
});
```

### Script de Postman: Validar Webhook Creado

```javascript
// Tests tab - Request: Enviar Webhook Simple
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has webhook ID", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("id");
    pm.environment.set("webhook_id", jsonData.id);
});

pm.test("Event type matches", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.eventType).to.eql("test.simple");
});
```

### Script de Postman: Validar Lista de Webhooks

```javascript
// Tests tab - Request: Obtener Lista
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has webhooks array", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("webhooks");
    pm.expect(jsonData.webhooks).to.be.an("array");
});

pm.test("Response has pagination info", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("total");
    pm.expect(jsonData).to.have.property("limit");
    pm.expect(jsonData).to.have.property("offset");
});
```

## Variables de Entorno Postman

### Entorno de Desarrollo Local

| Variable | Valor Inicial | Valor Actual | Descripción |
|----------|---------------|--------------|-------------|
| base_url | `http://localhost:3000` | `http://localhost:3000` | URL base del servidor |
| webhook_id | - | - | ID del último webhook creado |
| test_event | `test.postman` | - | Tipo de evento de prueba |

### Entorno de Staging

| Variable | Valor | Descripción |
|----------|-------|-------------|
| base_url | `https://webhook-staging.example.com` | URL staging |
| api_key | `<staging-key>` | API Key staging |

## Pruebas de Carga con Postman

### Configuración Newman (CLI)

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| Iteraciones | 100 | Número de requests |
| Delay | 100 | Delay entre requests (ms) |
| Colección | `webhook-tests.json` | Archivo de colección |

**Comando:**

```bash
newman run webhook-tests.json -n 100 --delay-request 100
```

## Mapeo de Código

### Rutas y Controladores

| Endpoint | Archivo | Función | Líneas |
|----------|---------|---------|--------|
| `POST /webhook/:event` | `src/routes/webhook.js` | Manejador de webhook con tipo | 6-50 |
| `POST /webhook` | `src/routes/webhook.js` | Manejador de webhook genérico | 52-102 |
| `GET /api/webhooks` | `src/routes/api.js` | Listar webhooks | 11-39 |
| `GET /api/webhooks/:id` | `src/routes/api.js` | Obtener webhook por ID | 41-63 |
| `DELETE /api/webhooks/:id` | `src/routes/api.js` | Eliminar webhook | 65-90 |
| `GET /api/stats` | `src/routes/api.js` | Obtener estadísticas | 92-105 |
| `GET /api/event-types` | `src/routes/api.js` | Listar tipos de eventos | 107-127 |
| `GET /health` | `src/server.js` | Health check | 38-44 |

### Modelo de Datos

| Función | Archivo | Descripción | Líneas |
|---------|---------|-------------|--------|
| `createWebhook()` | `src/models/webhook.js` | Crear nuevo webhook | 45-65 |
| `getWebhooks()` | `src/models/webhook.js` | Obtener lista de webhooks | 67-85 |
| `getWebhookById()` | `src/models/webhook.js` | Buscar webhook por ID | 87-105 |
| `deleteWebhook()` | `src/models/webhook.js` | Eliminar webhook | 107-125 |
| `getStats()` | `src/models/webhook.js` | Calcular estadísticas | 127-150 |
| `initializeDatabase()` | `src/models/webhook.js` | Inicializar SQLite | 152-170 |

### WebSocket

| Función | Archivo | Descripción | Líneas |
|---------|---------|-------------|--------|
| `initializeWebSocket()` | `src/utils/websocket.js` | Inicializar servidor WebSocket | 6-18 |
| `broadcastUpdate()` | `src/utils/websocket.js` | Enviar actualización a clientes WS | 21-32 |
| Integración WS | `src/server.js` | Inicialización del servidor WS | 72-73 |

## Solución de Problemas

| Problema | Causa Probable | Solución | Verificación |
|----------|----------------|----------|--------------|
| `ECONNREFUSED` al conectar a localhost | Servidor no iniciado | Ejecutar `npm start` | `curl http://localhost:3000/health` |
| Puerto 3000 ocupado | Proceso previo activo | Cambiar PORT en `.env` o matar proceso | `lsof -i :3000` (Linux/Mac) o `netstat -ano | findstr :3000` (Windows) |
| Respuesta 404 en endpoint | Ruta incorrecta | Verificar URL y método HTTP | Revisar logs del servidor |
| Respuesta 500 | Error interno | Revisar logs en terminal | `console.error` en servidor |
| `broadcastUpdate is not a function` | Dependencia circular en módulos | Ya resuelto en v1.1.0 - Reiniciar servidor | Verificar que usa `src/utils/websocket.js` |
| SQLite bloqueado | Base de datos en uso | Eliminar `webhooks.db` y reiniciar | `rm webhooks.db` |
| Postman no recibe respuesta | URL mal configurada | Verificar variable `base_url` | Probar con `curl` directamente |
| Webhook no aparece en dashboard | WebSocket desconectado | Recargar página del dashboard | Verificar conexión WS en DevTools |
| Payload truncado | Límite de tamaño excedido | Verificar límite de 10MB en `src/server.js:29` | Reducir tamaño del payload |
| Headers no visibles | Content-Type incorrecto | Asegurar `Content-Type: application/json` | Verificar headers en Postman |
| Rate limiting (429) | Demasiadas requests | Esperar 15 minutos o cambiar IP | Revisar configuración en `src/server.js:18-23` |
| ID de webhook no encontrado | UUID incorrecto | Verificar formato de UUID | Usar ID devuelto por POST |

## Referencias Cruzadas

| Documento | Ubicación | Contenido |
|-----------|-----------|-----------|
| Guía de Pruebas Prácticas | `docs/GUIA-PRUEBAS-PRACTICAS.md` | Guía paso a paso con ejemplos |
| Guía para Desarrolladores | `docs/GUIA-PRUEBA-DESARROLLADOR.md` | Referencia técnica completa |
| Flujo de Prueba Completo | `docs/FLUJO-PRUEBA-COMPLETO.md` | Testing automatizado |
| Comandos de Referencia | `docs/COMANDOS-REFERENCIA.md` | Comandos útiles |
| Resolución de Vulnerabilidades | `docs/RESOLVER-VULNERABILIDADES-NPM.md` | Seguridad de dependencias |

## Versionado

| Versión | Generado | Estado | Comentarios |
|---------|----------|--------|-------------|
| 1.0.0 | 2024-02-10 | Estable | Documentación inicial de pruebas |
| 1.1.0 | 2024-02-10 | Estable | Sección de Postman agregada |
| 1.2.0 | 2026-02-10 | Estable | Refactorización WebSocket - módulo independiente |
