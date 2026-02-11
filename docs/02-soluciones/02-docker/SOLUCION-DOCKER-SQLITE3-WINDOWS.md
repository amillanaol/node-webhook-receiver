# Solución al Error de SQLite3 en Docker en Windows

## Acceso Rápido

| Necesidad | Ubicación | Rol |
|-----------|-----------|-----|
| Resolver error "invalid ELF header" | [Diagnóstico](#diagnóstico) | Desarrollador |
| Entender causa raíz | [Análisis Técnico](#análisis-técnico) | Arquitecto/DevOps |
| Aplicar solución completa | [Solución Implementada](#solución-implementada) | Desarrollador |
| Verificar estado del contenedor | [Comandos de Verificación](#comandos-de-verificación) | DevOps |

## Diagnóstico

### Síntoma
Contenedor en estado `Restarting` tras ejecutar `make docker-compose-up`.

### Error Específico
```
Error: /app/node_modules/sqlite3/build/Release/node_sqlite3.node: invalid ELF header
```

### Verificación del Problema

| Comando | Resultado Esperado |
|---------|-------------------|
| `docker ps` | Contenedor en estado `Restarting (1)` |
| `docker logs --tail 30 <container>` | Error "invalid ELF header" en sqlite3 |
| `docker inspect --format='{{.State.Health.Status}}' docker-webhook-receiver-1` | `unhealthy` o no disponible |

## Análisis Técnico

### Causa Raíz
El módulo `sqlite3` contiene binarios nativos compilados específicamente para Windows en el `node_modules` local. El Dockerfile multi-etapa copia estos binarios Windows sobre los binarios Linux correctos, causando incompatibilidad de arquitectura (ELF = formato Linux, incompatible con binarios Windows).

### Secuencia del Error

| Orden Original (Problema) | Acción | Resultado |
|---------------------------|--------|-----------|
| 1 | Etapa builder instala dependencias Linux | Binarios correctos generados |
| 2 | `COPY --from=builder node_modules` | Binarios Linux copiados a imagen final |
| 3 | `COPY . .` | **Binarios Windows locales sobrescriben los Linux** |
| 4 | Ejecución | Error "invalid ELF header" |

### Flujo Correcto

| Orden Corregido | Acción | Resultado |
|-----------------|--------|-----------|
| 1 | `COPY . .` | Código copiado (con node_modules Windows) |
| 2 | `rm -rf node_modules` | Binarios Windows eliminados |
| 3 | `COPY --from=builder node_modules` | Binarios Linux correctos copiados |
| 4 | Ejecución | Contenedor funcional |

## Solución Implementada

### Modificación de Dockerfile

| Archivo | Ubicación | Líneas |
|---------|-----------|--------|
| `docker/Dockerfile` | [Referencia](docker/Dockerfile) | 21-27 |

Cambio aplicado:

```dockerfile
# Orden correcto:
COPY --chown=webhook:nodejs . .
RUN rm -rf node_modules
COPY --from=builder --chown=webhook:nodejs /app/node_modules ./node_modules
```

### Archivo .dockerignore

| Archivo | Recomendación |
|---------|---------------|
| `.dockerignore` | Incluir `node_modules`, `.env`, `webhooks.db`, `.git` |

```
node_modules
npm-debug.log
.env
webhooks.db
.git
coverage
.nyc_output
*.log
```

### Procedimiento de Limpieza Completa

| Paso | Comando | Propósito |
|------|---------|-----------|
| 1 | `make docker-compose-down` | Detener contenedores |
| 2 | `docker rmi -f docker-webhook-receiver` | Eliminar imagen corrupta |
| 3 | `docker volume rm docker_webhook-data` | Limpiar datos persistentes |
| 4 | `docker builder prune -f` | Eliminar cache de build |
| 5 | `docker-compose -f docker/docker-compose.yml up -d --build` | Reconstruir limpio |

## Comandos de Verificación

### Post-Instalación

| Comando | Estado Esperado |
|---------|-----------------|
| `docker ps` | `Up X minutes` (sin "Restarting") |
| `docker logs <container>` | Sin errores, "Webhook receiver iniciado" |
| `curl http://localhost:3000/health` | `{"status":"healthy"}` |
| `make test-webhook` | HTTP 201 Created |

### Verificación de Logs

| Comando | Descripción |
|---------|-------------|
| `docker logs <container>` | Logs completos |
| `docker logs --tail 50 <container>` | Últimas 50 líneas |
| `docker logs -f <container>` | Logs en tiempo real |

## Solución de Problemas

| Problema | Diagnóstico | Solución |
|----------|-------------|----------|
| Contenedor reiniciando constantemente | `docker ps` muestra `Restarting` | Aplicar [procedimiento de limpieza](#procedimiento-de-limpieza-completa) |
| Error "invalid ELF header" | Logs muestran error de sqlite3 | Modificar orden en `docker/Dockerfile:21-27` |
| Puerto 3000 ocupado | `netstat -ano \| findstr :3000` | Cambiar puerto en `.env` o matar proceso |
| Curl "Empty reply" | Contenedor reiniciando | Esperar 10s y verificar logs |
| Imagen usa cache incorrecto | Problema persiste tras rebuild | Ejecutar `docker builder prune -f` antes de rebuild |
| Permisos denegados en volumen | Error EACCES en logs | Eliminar volumen y recrear |

## Referencias Cruzadas

| Documento | Ubicación | Contenido |
|-----------|-----------|-----------|
| Guía de Docker Compose | `docs/GUIA-PRUEBAS-DOCKER-COMPOSE.md` | Testing con Docker Compose |
| Dockerfile | `docker/Dockerfile` | Configuración de imagen |
| Docker Compose | `docker/docker-compose.yml` | Configuración de servicios |
| README | `README.md` | Información general |

## Versionado

| Versión | Generado | Estado | Comentarios |
|---------|----------|--------|-------------|
| 1.0.0 | 2026-02-10 | Estable | Documentación de solución para error sqlite3 en Docker Windows |
