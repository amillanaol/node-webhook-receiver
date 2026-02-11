# Comandos de Referencia Rápida

## Inicio Inmediato

| Objetivo | Comando | Resultado |
|----------|---------|-----------|
| Instalar todo | `npm install` | Dependencias listas |
| Levantar servidor | `npm run dev` | Servidor en puerto 3000 |
| Verificar salud | `curl localhost:3000/health` | JSON con status |
| Enviar webhook | `node scripts/test-webhook.js` | Webhook de prueba |

## Endpoints Críticos

| Endpoint | Método | Uso |
|----------|--------|-----|
| `http://localhost:3000/health` | GET | Verificar servidor activo |
| `http://localhost:3000/api/webhooks` | GET | Listar webhooks |
| `http://localhost:3000/api/stats` | GET | Ver estadísticas |
| `http://localhost:3000/webhook/{evento}` | POST | Enviar webhook |
| `http://localhost:3000` | GET | Dashboard web |

## Flujo de Prueba Mínimo

```bash
# 1. Instalar (primera vez)
npm install

# 2. Iniciar servidor
npm run dev

# 3. Enviar webhook (en otra terminal)
curl -X POST http://localhost:3000/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"mensaje":"prueba"}'

# 4. Verificar recepción
curl http://localhost:3000/api/webhooks
```

## Diagnóstico Rápido

| Síntoma | Comando | Solución |
|---------|---------|----------|
| Puerto 3000 ocupado | `lsof -ti:3000` | `kill -9 <PID>` |
| Servidor no responde | `curl -m 3 localhost:3000/health` | Reiniciar con `npm run dev` |
| WebSocket desconectado | `netstat -an | grep 3000` | Verificar firewall/proxy |
| Base datos bloqueada | `lsof webhooks.db` | Eliminar DB: `rm webhooks.db` |
| **SQLITE_READONLY error** | `ls -la data/` y `tasklist \| findstr node` | Ver [SOLUCION-SQLITE-READONLY.md](SOLUCION-SQLITE-READONLY.md) |

## Solución SQLITE_READONLY (Resumen Rápido)

**Síntoma:** `make test-webhook` devuelve HTTP 500 con `SQLITE_READONLY`

**Diagnóstico rápido:**
```bash
# 1. Verificar procesos Node
tasklist /FI "IMAGENAME eq node.exe"

# 2. Verificar inconsistencia
ls -la webhooks.db        # Archivo en raíz (incorrecto)
ls -la data/              # Directorio vacío (debe contener DB)
cat .env | grep DB_PATH   # Debe ser ./data/webhooks.db
```

**Solución inmediata:**
```bash
# Windows
taskkill /F /IM node.exe
del webhooks.db
rmdir /S /Q data && mkdir data
icacls data /grant %username%:F
make dev

# Linux/Mac
killall node
rm -f webhooks.db
rm -rf data && mkdir data
chmod 755 data/
make dev
```

**Verificación:**
```bash
dir data\               # Debe mostrar webhooks.db
make test-webhook       # Debe retornar HTTP 201
```

📖 **Documentación completa:** [SOLUCION-SQLITE-READONLY.md](SOLUCION-SQLITE-READONLY.md)

## Pruebas de Carga Rápidas

```bash
# 10 webhooks rápidos
node scripts/test-webhook.js --count 10 --delay 0

# 100 webhooks espaciados
node scripts/test-webhook.js --count 100 --delay 100

# Webhook tipo GitHub
node scripts/test-webhook.js --event github.push --count 5
```

## Docker Inmediato

```bash
# Construir
docker build -f docker/Dockerfile -t webhook-receiver .

# Ejecutar
docker run -p 3000:3000 webhook-receiver

# Compose
cd docker && docker-compose up
```

## Variables de Entorno Esenciales

| Variable | Valor por Defecto | Propósito |
|----------|-------------------|-----------|
| PORT | 3000 | Puerto del servidor |
| NODE_ENV | development | Modo de operación |
| DB_PATH | ./webhooks.db | Ubicación base de datos |

## Logs y Monitoreo

| Información | Comando | Ubicación |
|---------------|---------|-----------|
| Logs en tiempo real | `tail -f webhooks.db.log` | Archivo SQLite |
| Errores recientes | `grep -i error src/server.js` | Código fuente |
| Métricas API | `curl localhost:3000/api/stats` | Endpoint |

## Limpieza Total

```bash
# Detener proceso
pkill -f "node src/server.js"
# Windows: taskkill /F /IM node.exe

# Eliminar datos (incluyendo directorio data/)
rm webhooks.db          # Base de datos antigua en raíz
rm -rf data/            # Directorio de datos actual
rm -rf node_modules

# Reinstalar
npm install

# Recrear directorio de datos
mkdir data
chmod 755 data/         # Linux/Mac
# Windows: icacls data /grant %username%:F
```

## Referencias de Archivos

| Funcionalidad | Archivo | Líneas Clave |
|---------------|---------|--------------|
| Servidor principal | `src/server.js` | 15-30 (config), 65-70 (health) |
| Recepción webhooks | `src/routes/webhook.js` | 8-25 (POST handler) |
| Modelo de datos | `src/models/webhook.js` | 45-65 (createWebhook) |
| Dashboard | `src/public/app.js` | 40-60 (WebSocket) |
| Script prueba | `scripts/test-webhook.js` | 80-120 (main loop) |
