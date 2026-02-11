# Node Webhook Receiver

[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-Jest-yellow.svg)](https://jestjs.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](docker/)

Aplicación para recibir, almacenar y mostrar webhooks en tiempo real con dashboard web y WebSocket.

## Acceso Rápido

| Necesidad | Ubicación | Rol |
|-----------|-----------|-----|
| Instalar y ejecutar | [Instalación](#instalación) | DevOps |
| Probar webhooks | [Pruebas](#pruebas) | QA/Desarrollador |
| Documentación técnica | [Mapeo de Código](#mapeo-de-código) | Desarrollador |
| Solución de problemas | [Solución de Problemas](#solución-de-problemas) | Todos |
| Referencia de API | [Endpoints](#endpoints) | Desarrollador Backend |
| Configurar entorno | [Variables de Entorno](#variables-de-entorno) | DevOps |

## Características

- **Recepción de Webhooks**: Endpoints HTTP para recibir webhooks de cualquier fuente
- **Almacenamiento Persistente**: Base de datos SQLite para guardar todos los webhooks
- **Dashboard en Tiempo Real**: Interfaz web con WebSocket para visualización instantánea
- **API REST**: Consulta, filtra y gestiona webhooks programáticamente
- **Detección Automática**: Reconoce automáticamente tipos de eventos (GitHub, GitLab, etc.)
- **Seguridad**: Rate limiting, headers de seguridad con Helmet, CORS configurado
- **Dockerizado**: Fácil despliegue con Docker y Docker Compose

## Guía por Rol

### Usuario Final
Accede al dashboard en `http://localhost:3000` para visualizar webhooks en tiempo real.

### Desarrollador
Utiliza los endpoints API para integrar con sistemas externos. Consulta [Mapeo de Código](#mapeo-de-código) para ubicar funcionalidades específicas.

### DevOps
Configura variables de entorno en `.env` y despliega con Docker. Revisa [Deployment](#deployment) para opciones de producción.

## Requisitos Previos

| Componente | Versión | Verificación |
|------------|---------|--------------|
| Node.js | >= 16.x | `node --version` |
| npm | >= 8.x | `npm --version` |
| Docker | Opcional | `docker --version` |

## Instalación

### Opción 1: Instalación Local

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd node-webhook-receiver

# 2. Instalar dependencias
make install
# o: npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# 4. Iniciar servidor
make dev
# o: npm run dev
```

### Opción 2: Docker Compose (Recomendado)

```bash
# Levantar todos los servicios
docker-compose -f docker/docker-compose.yml up -d

# Ver logs
docker-compose -f docker/docker-compose.yml logs -f

# Detener servicios
docker-compose -f docker/docker-compose.yml down
```

### Opción 3: Makefile

```bash
make help      # Ver todos los comandos disponibles
make setup     # Configurar proyecto completo
make dev       # Modo desarrollo con auto-reload
make start     # Modo producción
```

## Endpoints

### Recepción de Webhooks

| Método | Endpoint | Descripción | Código Fuente |
|--------|----------|-------------|---------------|
| POST | `/webhook/:event` | Recibe webhook con tipo de evento específico | `src/routes/webhook.js:6-50` |
| POST | `/webhook` | Recibe webhook genérico (detecta tipo automáticamente) | `src/routes/webhook.js:52-102` |

### API REST

| Método | Endpoint | Parámetros | Respuesta | Código Fuente |
|--------|----------|------------|-----------|---------------|
| GET | `/api/webhooks` | `?limit=50&offset=0&eventType=` | Lista paginada de webhooks | `src/routes/api.js:11-39` |
| GET | `/api/webhooks/:id` | `id` (UUID) | Detalle completo del webhook | `src/routes/api.js:41-63` |
| DELETE | `/api/webhooks/:id` | `id` (UUID) | Confirmación de eliminación | `src/routes/api.js:65-90` |
| GET | `/api/stats` | - | Estadísticas agregadas | `src/routes/api.js:92-105` |
| GET | `/api/event-types` | - | Lista de tipos de eventos únicos | `src/routes/api.js:107-127` |
| GET | `/health` | - | Estado del servicio y uptime | `src/server.js:59-65` |

### Ejemplos de Uso

```bash
# Enviar webhook con tipo de evento específico
curl -X POST http://localhost:3000/webhook/github.push \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{
    "repository": {"name": "mi-repo", "url": "https://github.com/user/repo"},
    "pusher": {"name": "developer"},
    "commits": [{"message": "Nuevo commit"}]
  }'

# Webhook genérico
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Event-Type: custom.event" \
  -d '{"message": "Hello World", "timestamp": "2024-01-01T00:00:00Z"}'

# Listar webhooks (con paginación)
curl "http://localhost:3000/api/webhooks?limit=10&offset=0"

# Filtrar por tipo de evento
curl "http://localhost:3000/api/webhooks?eventType=github.push"

# Obtener estadísticas
curl http://localhost:3000/api/stats

# Health check
curl http://localhost:3000/health
```

## Pruebas

### Scripts de Prueba Manual

| Comando | Descripción |
|---------|-------------|
| `make test-webhook` | Enviar un webhook de prueba simple |
| `make test-webhook-many` | Enviar 10 webhooks con delay de 500ms |
| `node scripts/test-webhook.js --event github.push --count 5 --delay 500` | Opciones personalizadas |

### Tests Automatizados

| Comando | Tipo | Descripción |
|---------|------|-------------|
| `make test` | Todos | Ejecuta suite completa con cobertura |
| `make test-unit` | Unitarios | Tests de funciones individuales |
| `make test-integration` | Integración | Tests de endpoints y base de datos |
| `make test-watch` | Watch | Tests en modo observación |

### Pipeline de CI Local

```bash
make run-ci    # Ejecuta lint + tests + security audit
```

## Arquitectura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Cliente HTTP  │────▶│  Express Server  │────▶│   SQLite DB     │
│   (Webhooks)    │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  WebSocket (WS)  │────▶ Dashboard Web
                        └──────────────────┘      (Tiempo Real)
```

### Flujo de Datos

1. **Recepción**: El servidor Express recibe webhooks vía HTTP POST
2. **Procesamiento**: Se almacena en SQLite con metadata (headers, IP, timestamp)
3. **Broadcast**: WebSocket emite el evento a todos los clientes conectados
4. **Visualización**: El dashboard web actualiza la lista en tiempo real

## Mapeo de Código

### Estructura de Directorios

```
node-webhook-receiver/
├── src/
│   ├── server.js           # Punto de entrada y configuración Express
│   ├── routes/
│   │   ├── webhook.js      # Endpoints de recepción de webhooks
│   │   └── api.js          # API REST para consultas
│   ├── models/
│   │   └── webhook.js      # Lógica de base de datos SQLite
│   ├── middleware/
│   │   └── logger.js       # Middleware de logging
│   ├── utils/
│   │   └── websocket.js    # Gestión de WebSocket
│   └── public/             # Dashboard web (HTML, CSS, JS)
├── scripts/
│   └── test-webhook.js     # Utilidad para enviar webhooks de prueba
├── docker/
│   ├── Dockerfile          # Imagen Docker
│   └── docker-compose.yml  # Orquestación
├── tests/                  # Tests unitarios e integración
├── docs/                   # Documentación adicional
└── Makefile                # Comandos automatizados
```

### Rutas y Controladores

| Endpoint | Archivo | Líneas | Descripción |
|----------|---------|--------|-------------|
| `POST /webhook/:event` | `src/routes/webhook.js` | 6-50 | Recepción con tipo de evento |
| `POST /webhook` | `src/routes/webhook.js` | 52-102 | Recepción con detección automática |
| `GET /api/webhooks` | `src/routes/api.js` | 11-39 | Listado paginado |
| `GET /api/webhooks/:id` | `src/routes/api.js` | 41-63 | Detalle por ID |
| `DELETE /api/webhooks/:id` | `src/routes/api.js` | 65-90 | Eliminar webhook |
| `GET /api/stats` | `src/routes/api.js` | 92-105 | Estadísticas |
| `GET /api/event-types` | `src/routes/api.js` | 107-127 | Tipos únicos |
| `GET /health` | `src/server.js` | 59-65 | Health check |

### Modelo de Datos

| Función | Archivo | Líneas | Propósito |
|---------|---------|--------|-----------|
| `createWebhook()` | `src/models/webhook.js` | 45-65 | Insertar nuevo webhook |
| `getWebhooks()` | `src/models/webhook.js` | 67-85 | Consultar con filtros |
| `getWebhookById()` | `src/models/webhook.js` | 87-105 | Buscar por UUID |
| `deleteWebhook()` | `src/models/webhook.js` | 107-125 | Eliminar registro |
| `getStats()` | `src/models/webhook.js` | 127-150 | Estadísticas agregadas |
| `initializeDatabase()` | `src/models/webhook.js` | 152-170 | Crear tablas |

### WebSocket

| Función | Archivo | Líneas | Propósito |
|---------|---------|--------|-----------|
| `initializeWebSocket()` | `src/utils/websocket.js` | 6-18 | Configurar servidor WS |
| `broadcastUpdate()` | `src/utils/websocket.js` | 21-32 | Emitir a todos los clientes |

## Variables de Entorno

| Variable | Descripción | Default | Requerido |
|----------|-------------|---------|-----------|
| `PORT` | Puerto del servidor HTTP | `3000` | No |
| `HOST` | Host del servidor | `0.0.0.0` | No |
| `DB_PATH` | Ruta de la base de datos SQLite | `./data/webhooks.db` | No |
| `NODE_ENV` | Entorno (development/production) | `development` | No |

### Ejemplo de `.env`

```env
# Puerto del servidor
PORT=3000

# Host del servidor (0.0.0.0 permite conexiones desde cualquier IP)
HOST=0.0.0.0

# Ruta de la base de datos SQLite
DB_PATH=./data/webhooks.db

# Entorno (development, production)
NODE_ENV=development
```

## Docker

### Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `make docker-build` | Construir imagen Docker |
| `make docker-run` | Ejecutar contenedor en background |
| `make docker-stop` | Detener y eliminar contenedor |
| `make docker-compose-up` | Levantar con Docker Compose |
| `make docker-compose-down` | Detener servicios de Compose |

### Dockerfile

La imagen incluye:
- Node.js 18 Alpine (ligero)
- SQLite3 precompilado
- Health check integrado
- Usuario no-root para seguridad

### Docker Compose

```yaml
# Incluye:
# - Servicio principal
# - Volumen persistente para SQLite
# - Health checks
# - Restart automático
```

## Deployment

### Local/Desarrollo

```bash
make setup     # Instala dependencias
make dev       # Inicia con nodemon
```

### Producción

1. **Configurar entorno**:
   ```bash
   cp .env.example .env
   # Editar: NODE_ENV=production, PORT=80
   ```

2. **Usar PM2** (recomendado):
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name webhook-receiver
   pm2 save
   pm2 startup
   ```

3. **Configurar Nginx** (reverse proxy):
   ```nginx
   server {
       listen 80;
       server_name tu-dominio.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **SSL/TLS** con Let's Encrypt:
   ```bash
   certbot --nginx -d tu-dominio.com
   ```

### Docker en Producción

```bash
# Build con optimizaciones
docker build -t webhook-receiver:latest -f docker/Dockerfile .

# Run con variables de entorno
docker run -d \
  --name webhook-receiver \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -v $(pwd)/data:/app/data \
  --restart unless-stopped \
  webhook-receiver:latest
```

## Seguridad

| Medida | Implementación | Ubicación |
|--------|----------------|-----------|
| Rate Limiting | 1000 requests/IP/15min | `src/server.js:19-24` |
| Headers de Seguridad | Helmet.js | `src/server.js:30-44` |
| CORS | Configurado para orígenes específicos | `src/server.js:45-48` |
| CSP | Content Security Policy | `src/server.js:31-38` |
| Validación de Payload | Límite 10MB | `src/server.js:50` |
| Auditoría de Dependencias | `npm audit` | `make security-audit` |

### Buenas Prácticas

- Ejecutar con usuario no-root en Docker
- Usar HTTPS en producción (TLS 1.2+)
- Configurar firewall (solo puertos necesarios)
- Mantener dependencias actualizadas
- Revisar logs regularmente

## Solución de Problemas

| Problema | Causa | Solución | Verificación |
|----------|-------|----------|--------------|
| `ECONNREFUSED` en localhost | Servidor no iniciado | Ejecutar `npm start` | `curl http://localhost:3000/health` |
| Puerto 3000 ocupado | Proceso previo activo | Cambiar `PORT` en `.env` | `lsof -i :3000` (Linux/Mac) / `netstat -ano \| findstr :3000` (Windows) |
| Respuesta 404 | Ruta incorrecta | Verificar URL y método HTTP | Revisar logs del servidor |
| Respuesta 500 | Error interno | Revisar logs en terminal | `console.error` en servidor |
| SQLite bloqueado (database locked) | Base de datos en uso | Eliminar `data/webhooks.db` y reiniciar | `rm data/webhooks.db` |
| Webhook no aparece en dashboard | WebSocket desconectado | Recargar página del dashboard | Verificar WS en DevTools (F12 > Network > WS) |
| Payload truncado | Límite de 10MB excedido | Reducir tamaño del payload | Verificar en `src/server.js:50` |
| Rate limiting (429) | Demasiadas requests | Esperar 15 minutos o cambiar IP | Revisar configuración en `src/server.js:19-24` |
| Error EADDRINUSE | Puerto en uso | Matar proceso o cambiar puerto | `npx kill-port 3000` |

### Logs Útiles

```bash
# Ver logs en tiempo real
npm start 2>&1 | tee server.log

# En Docker
docker logs -f webhook-receiver

# Con Docker Compose
docker-compose -f docker/docker-compose.yml logs -f
```

## Comandos Make Disponibles

```bash
$ make help

node-webhook-receiver - Comandos disponibles:
  help              Mostrar ayuda
  install           Instalar dependencias
  dev               Iniciar servidor en modo desarrollo
  start             Iniciar servidor
  test              Ejecutar todos los tests
  test-unit         Ejecutar tests unitarios
  test-integration  Ejecutar tests de integración
  test-watch        Ejecutar tests en modo watch
  lint              Ejecutar linter
  lint-fix          Ejecutar linter y corregir errores automáticamente
  docker-build      Construir imagen Docker
  docker-run        Ejecutar contenedor Docker
  docker-stop       Detener contenedor Docker
  docker-compose-up Levantar servicios con Docker Compose
  docker-compose-down Detener servicios de Docker Compose
  test-webhook      Enviar webhook de prueba
  test-webhook-many Enviar múltiples webhooks de prueba
  setup             Configurar proyecto (instalar dependencias)
  backup            Crear backup de la base de datos
  clean             Limpiar archivos temporales
  clean-all         Limpiar todo incluyendo base de datos
  install-dev       Instalar dependencias de desarrollo
  security-audit    Ejecutar auditoría de seguridad
  run-ci            Ejecutar pipeline completo de CI localmente
```

## Referencias Cruzadas

| Documento | Ubicación | Contenido |
|-----------|-----------|-----------|
| Guía de resolución de vulnerabilidades | `docs/02-soluciones/03-seguridad/RESOLVER-VULNERABILIDADES-NPM.md` | Seguridad de dependencias |
| Comandos de referencia | `docs/04-desarrollo/01-pruebas/COMANDOS-REFERENCIA.md` | Comandos útiles |
| Flujo de prueba completo | `docs/04-desarrollo/01-pruebas/FLUJO-PRUEBA-COMPLETO.md` | Testing automatizado |
| Guía de prueba para desarrolladores | `docs/01-guias/03-desarrollador/GUIA-PRUEBA-DESARROLLADOR.md` | Referencia técnica completa |
| Solución SQLite Readonly | `docs/02-soluciones/01-sqlite/SOLUCION-SQLITE-READONLY.md` | Fix para permisos SQLite |
| Guía Docker Compose | `docs/02-soluciones/02-docker/GUIA-PRUEBAS-DOCKER-COMPOSE.md` | Testing con Docker |

## Changelog

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.2.0 | 2026-02-10 | Documentación mejorada, badges, arquitectura |
| 1.1.0 | 2026-02-10 | Refactorización README con documentación técnica |
| 1.0.0 | 2024-02-10 | Versión inicial estable |

## Contribuir

1. Fork el repositorio
2. Crea una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### Requisitos de PR

- Tests pasando (`make test`)
- Linter sin errores (`make lint`)
- Cobertura de código >= 80%
- Documentación actualizada

## Licencia

[MIT](LICENSE) © 2024-2026

---

**Nota**: Este README está optimizado para desarrolladores. Para documentación de usuario final, consulta el dashboard web en `http://localhost:3000`.
