# Solución de Problemas Docker Build - sqlite3

## Acceso Rápido

| Necesidad | Ubicación |
|-----------|-----------|
| Error EADDRINUSE (puerto ocupado) | [src/server.js:91-103](#manejo-errores-servidor) |
| Fallo en `npm ci` en Docker | [docker/Dockerfile](#configuracion-dockerfile) |
| Incompatibilidad sqlite3/Node | [package.json:37](#versiones-compatibles) |
| Rebuild forzado sin caché | [Comandos de Emergencia](#comandos-emergencia) |

## Guía por Rol

### Desarrollador - Docker

| Tarea | Archivo | Comando |
|-------|---------|---------|
| Construir imagen | docker/Dockerfile | `docker-compose -f docker/docker-compose.yml build --no-cache` |
| Levantar servicios | docker/docker-compose.yml | `make docker-compose-up` |
| Ver logs en tiempo real | docker/docker-compose.yml | `docker-compose -f docker/docker-compose.yml logs -f` |

### DevOps - Troubleshooting

| Problema | Causa Raíz | Solución |
|----------|------------|----------|
| `npm ci` falla con sqlite3 | Versión 5.0.2 incompatible con Node 18 | Actualizar a sqlite3@5.1.7 |
| Error EADDRINUSE | Puerto 3000 ocupado | Matar proceso o cambiar puerto |
| Build usa caché obsoleto | package-lock.json no actualizado | Rebuild con `--no-cache` |

## Mapeo de Código

### Configuración Dockerfile

| Componente | Ubicación | Propósito |
|------------|-----------|-----------|
| Etapa builder | docker/Dockerfile:1-10 | Compila dependencias nativas |
| Etapa final | docker/Dockerfile:12-24 | Imagen optimizada runtime |
| Health check | docker/Dockerfile:26-27 | Verifica estado del servicio |

### Versiones Compatibles

| Dependencia | Versión Problemática | Versión Solución | Notas |
|-------------|---------------------|------------------|-------|
| sqlite3 | 5.0.2 | 5.1.7 | Incompatible con Node 18+ |
| Node.js | - | 18.x | Requiere binarios pre-compilados |
| npm | - | >=9.x | Soporte para overrides |

## Problema → Solución

### Build Falla: `npm ci` Exit Code 1

| Síntoma | Diagnóstico | Acción |
|---------|-------------|--------|
| Error en línea 10 del Dockerfile | sqlite3@5.0.2 intenta compilar módulos nativos fallidos | 1. Actualizar package.json: `"sqlite3": "^5.1.7"` <br>2. Ejecutar `rm -rf node_modules package-lock.json && npm install` <br>3. Rebuild con `--no-cache` |
| Caché de Docker usa versión antigua | package-lock.json regenerado pero imagen no reconstruida | `docker-compose -f docker/docker-compose.yml build --no-cache` |

### Servidor No Inicia: EADDRINUSE

| Síntoma | Diagnóstico | Acción |
|---------|-------------|--------|
| `Error: listen EADDRINUSE :::3000` | Proceso previo ocupa el puerto | [Manejo implementado en src/server.js:91-103](src/server.js#L91-L103) o `npx kill-port 3000` |

## Comandos de Emergencia

```bash
# Limpiar todo y reconstruir desde cero
rm -rf node_modules package-lock.json
npm install
docker-compose -f docker/docker-compose.yml down
docker system prune -a  # ⚠️ Elimina todas las imágenes
docker-compose -f docker/docker-compose.yml up -d --build --force-recreate

# Solo rebuild sin caché
docker-compose -f docker/docker-compose.yml build --no-cache
docker-compose -f docker/docker-compose.yml up -d
```

## Referencias Cruzadas

| Concepto | Documentación Relacionada |
|----------|---------------------------|
| Arquitectura del sistema | [docs/05-referencia/REFACTORIZACION-WEBSOCKET.md](05-referencia/REFACTORIZACION-WEBSOCKET.md) |
| Comandos disponibles | [docs/COMANDOS-REFERENCIA.md](COMANDOS-REFERENCIA.md) |
| Configuración WebSocket | [src/utils/websocket.js](../src/utils/websocket.js) |
| Variables de entorno | [src/server.js:16](../src/server.js#L16) |

## Cambios en Archivos Clave

### docker/Dockerfile

Versión optimizada para sqlite3@5.1.7 con binarios pre-compilados:

```dockerfile
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-slim
WORKDIR /app
RUN groupadd -r nodejs && useradd -r -g nodejs webhook
COPY --from=builder --chown=webhook:nodejs /app/node_modules ./node_modules
COPY --chown=webhook:nodejs . .
USER webhook
EXPOSE 3000
CMD ["npm", "start"]
```

### src/server.js

Manejo de errores EADDRINUSE agregado en líneas 91-103:

```javascript
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Error: El puerto ${PORT} ya está en uso`)
    console.error('Soluciones:')
    console.error(`1. Mata el proceso: npx kill-port ${PORT}`)
    console.error(`2. Usa otro puerto: PORT=${parseInt(PORT) + 1} npm start`)
  } else {
    console.error('Error del servidor:', error.message)
  }
  process.exit(1)
})
```

## Historial de Incidentes

| Fecha | Problema | Causa | Solución Aplicada |
|-------|----------|-------|-------------------|
| 2026-02-10 | Build Docker falla | sqlite3@5.0.2 incompatible con Node 18 | Actualización a sqlite3@5.1.7, regeneración de package-lock.json, rebuild sin caché |
| 2026-02-10 | EADDRINUSE en desarrollo | Proceso nodemon zombie | Implementación de manejo de errores en server.js + documentación de comando kill-port |

## Versionado

| Versión | Fecha | Estado | Comentarios |
|---------|-------|--------|-------------|
| 1.0 | 2026-02-10 | Activa | Documentación inicial de problemas Docker/sqlite3 |
