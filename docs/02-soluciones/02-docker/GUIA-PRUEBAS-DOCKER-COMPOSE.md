# Guía de Pruebas con Docker Compose

## Acceso Rápido

| Necesidad | Ubicación | Rol |
|-----------|-----------|-----|
| Primera ejecución | [Inicio Rápido](#inicio-rápido) | DevOps |
| Verificar estado del contenedor | [Comandos de Verificación](#comandos-de-verificación) | Desarrollador |
| Diagnosticar problemas | [Solución de Problemas](#solución-de-problemas) | DevOps |
| Ejecutar pruebas funcionales | [Testing Funcional](#testing-funcional) | QA |
| Configurar entornos | [Variables de Entorno](#variables-de-entorno) | DevOps |

## Inicio Rápido

### Primer Ejecución

| Paso                   | Comando                             | Estado Esperado              |
| ---------------------- | ----------------------------------- | ---------------------------- |
| 1. Construir e iniciar | `make docker-compose-up`            | Contenedor iniciado en 5-10s |
| 2. Verificar health    | `curl http://localhost:3000/health` | `{"status":"healthy"}`       |
| 3. Ver logs            | `docker logs webhook-receiver`      | Sin errores críticos         |
| 4. Detener             | `make docker-compose-down`          | Contenedores eliminados      |

### Ciclo de Prueba Básico

```bash
# Iniciar
make docker-compose-up

# Verificar estado
curl http://localhost:3000/health

# Enviar webhook de prueba
make test-webhook

# Ver logs en tiempo real
docker logs -f docker-webhook-receiver-1

# Detener y limpiar
make docker-compose-down
```

## Configuración del Servicio

### Estructura Docker Compose

| Componente | Configuración | Ubicación |
|------------|---------------|-----------|
| Imagen base | `node:18-slim` | `docker/Dockerfile:13` |
| Puerto expuesto | `3000:3000` | `docker/docker-compose.yml:9` |
| Volumen persistente | `webhook-data:/app/data` | `docker/docker-compose.yml:14` |
| Health check | HTTP GET /health cada 30s | `docker/docker-compose.yml:17-21` |
| Restart policy | `unless-stopped` | `docker/docker-compose.yml:15` |

### Variables de Entorno

| Variable | Valor Default | Descripción | Modificable |
|----------|---------------|-------------|-------------|
| `NODE_ENV` | `production` | Modo de ejecución | Sí (no recomendado) |
| `PORT` | `3000` | Puerto interno del contenedor | Sí (requiere mapeo) |

### Modificar Variables

Editar `docker/docker-compose.yml`:

```yaml
services:
  webhook-receiver:
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DB_PATH=/app/data/webhooks.db
```

## Comandos de Verificación

### Estado del Contenedor

| Comando | Propósito | Salida Esperada |
|---------|-----------|-----------------|
| `docker ps` | Listar contenedores activos | `webhook-receiver` en estado `Up` |
| `docker-compose -f docker/docker-compose.yml ps` | Estado de servicios compose | `webhook-receiver_1 ... Up` |
| `docker inspect docker-webhook-receiver-1` | Detalles completos del contenedor | JSON con configuración |

### Health Check

| Comando | Método | Respuesta |
|---------|--------|-----------|
| `curl http://localhost:3000/health` | HTTP | `{"status":"healthy","timestamp":"..."}` |
| `docker inspect --format='{{.State.Health.Status}}' docker-webhook-receiver-1` | Docker API | `healthy` |

### Logs y Monitoreo

| Comando | Descripción |
|---------|-------------|
| `docker logs docker-webhook-receiver-1` | Logs completos |
| `docker logs -f docker-webhook-receiver-1` | Logs en tiempo real |
| `docker logs --tail 50 docker-webhook-receiver-1` | Últimas 50 líneas |
| `docker logs --since 5m docker-webhook-receiver-1` | Logs últimos 5 minutos |

## Testing Funcional

### Prueba de Conectividad

```bash
# Verificar health endpoint
curl -v http://localhost:3000/health

# Respuesta esperada:
# < HTTP/1.1 200 OK
# {"status":"healthy","timestamp":"2024-01-01T00:00:00.000Z","uptime":123}
```

### Prueba de Recepción de Webhooks

| Escenario | Comando | Verificación |
|-----------|---------|--------------|
| Webhook simple | `curl -X POST http://localhost:3000/webhook/test -H "Content-Type: application/json" -d '{"msg":"test"}'` | HTTP 201 Created |
| Webhook con tipo | `curl -X POST http://localhost:3000/webhook/github.push -d '{"repo":"test"}'` | `eventType: github.push` |
| Payload grande | `curl -X POST http://localhost:3000/webhook -d @large-payload.json` | Sin truncamiento |

### Prueba de API

```bash
# Listar webhooks recibidos
curl http://localhost:3000/api/webhooks

# Obtener estadísticas
curl http://localhost:3000/api/stats

# Obtener tipos de eventos
curl http://localhost:3000/api/event-types
```

### Scripts de Prueba Automatizados

| Script | Descripción | Comando |
|--------|-------------|---------|
| `test-webhook` | Webhook único de prueba | `make test-webhook` |
| `test-webhook-many` | Múltiples webhooks | `make test-webhook-many` |
| Personalizado | Opciones avanzadas | `node scripts/test-webhook.js --event custom --count 5` |

## Escenarios de Prueba

### Escenario 1: Primera Instalación

| Paso | Comando | Check |
|------|---------|-------|
| 1 | `make docker-compose-up` | Construcción exitosa |
| 2 | `sleep 5` | Esperar inicialización |
| 3 | `curl http://localhost:3000/health` | Status: healthy |
| 4 | `make test-webhook` | Webhook recibido |
| 5 | `curl http://localhost:3000/api/webhooks` | 1 webhook listado |

### Escenario 2: Persistencia de Datos

```bash
# 1. Iniciar y enviar datos
make docker-compose-up
make test-webhook-many

# 2. Verificar datos persistidos
curl http://localhost:3000/api/stats

# 3. Detener sin eliminar volumen
make docker-compose-down

# 4. Reiniciar
make docker-compose-up

# 5. Verificar datos persisten
curl http://localhost:3000/api/stats
```

### Escenario 3: Reinicio del Servicio

| Acción | Comando | Verificación |
|--------|---------|--------------|
| Detener contenedor | `docker stop docker-webhook-receiver-1` | Estado: Exited |
| Reiniciar contenedor | `docker start docker-webhook-receiver-1` | Estado: Up |
| Verificar recuperación | `curl http://localhost:3000/health` | Healthy en < 10s |

### Escenario 4: Health Check Fallido

```bash
# Simular carga alta que afecta health check
for i in {1..100}; do
  curl -X POST http://localhost:3000/webhook/load.test -d "{\"index\":$i}" &
done

# Verificar health status durante carga
docker inspect --format='{{.State.Health.Status}}' docker-webhook-receiver-1
```

## Solución de Problemas

| Problema | Diagnóstico | Solución | Verificación |
|----------|-------------|----------|--------------|
| Puerto 3000 ocupado | `docker ps` muestra otro servicio | Cambiar puerto en `.env` o matar proceso | `lsof -i :3000` |
| Construcción fallida | `docker build` error en paso npm | Limpiar cache: `docker builder prune` | Reconstrucción exitosa |
| Volumen no persistente | Datos perdidos tras reinicio | Verificar volumen `webhook-data` | `docker volume ls` |
| Health check falla | Logs muestran timeout | Aumentar `start_period` a 60s | `docker inspect` estado healthy |
| Permisos denegados | Error EACCES en logs | Verificar usuario `webhook` en Dockerfile | `docker exec -it <id> whoami` |
| Contenedor se reinicia en loop | `docker ps` muestra status Restarting | Revisar logs: `docker logs --tail 20` | Contenedor estable Up > 30s |
| Base de datos bloqueada | Error SQLite en logs | Eliminar volumen: `docker volume rm webhook-data` | Reinicio exitoso |
| Variables no aplicadas | `env` dentro del contenedor incorrecto | Reconstruir con `docker-compose up --build` | `docker exec <id> env` |

### Diagnóstico de Logs

| Patrón de Error | Significado | Acción |
|-----------------|-------------|--------|
| `Error: EACCES: permission denied` | Problema de permisos en volumen | Recrear volumen con permisos correctos |
| `SQLite database is locked` | Base de datos bloqueada | Reiniciar contenedor o eliminar volumen |
| `ECONNREFUSED` en health check | Aplicación no responde | Verificar que el servidor inició correctamente |
| `Cannot find module` | Dependencias faltantes | Reconstruir imagen: `docker-compose build --no-cache` |

### Limpieza y Recreación

```bash
# Limpieza completa (elimina datos)
make docker-compose-down
docker volume rm webhook-data
docker rmi webhook-receiver_webhook-receiver
make docker-compose-up

# Reconstrucción forzada
docker-compose -f docker/docker-compose.yml up -d --build --force-recreate
```

## Comandos Avanzados

### Inspección del Contenedor

| Comando | Propósito |
|---------|-----------|
| `docker exec -it docker-webhook-receiver-1 sh` | Shell interactivo |
| `docker exec docker-webhook-receiver-1 ls -la /app/data` | Listar archivos de datos |
| `docker exec docker-webhook-receiver-1 cat /app/data/webhooks.db` | Ver base de datos |

### Escalar Servicios

```bash
# Múltiples instancias (requiere balanceador)
docker-compose -f docker/docker-compose.yml up -d --scale webhook-receiver=3
```

### Redes Docker

| Comando | Descripción |
|---------|-------------|
| `docker network ls` | Listar redes |
| `docker network inspect docker_default` | Detalles de red del compose |

## Referencias Cruzadas

| Documento | Ubicación | Contenido |
|-----------|-----------|-----------|
| README principal | `README.md` | Información general del proyecto |
| Dockerfile | `docker/Dockerfile` | Configuración de imagen |
| Docker Compose | `docker/docker-compose.yml` | Configuración de servicios |
| Comandos de referencia | `docs/COMANDOS-REFERENCIA.md` | Comandos adicionales |

## Versionado

| Versión | Generado | Estado | Comentarios |
|---------|----------|--------|-------------|
| 1.0.0 | 2026-02-10 | Estable | Guía inicial de pruebas con Docker Compose |
