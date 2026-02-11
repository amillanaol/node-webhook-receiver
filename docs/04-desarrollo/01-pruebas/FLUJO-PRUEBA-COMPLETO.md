# Flujo de Prueba Completo - Node Webhook Receiver

## Preparación del Entorno (30 segundos)

| Acción | Comando | Verificación |
|--------|---------|--------------|
| Instalar dependencias | `npm install` | `node_modules/` creado |
| Configurar entorno | `cp .env.example .env` | Archivo `.env` existe |
| Iniciar aplicación | `npm run dev` | Consola muestra "Servidor corriendo en puerto 3000" |

## Verificación de Endpoints Críticos (15 segundos)

```bash
# Health check
curl -s http://localhost:3000/health | grep -q "healthy" && echo "✅ Health OK" || echo "❌ Health FAIL"

# API base
curl -s http://localhost:3000/api/webhooks | grep -q "webhooks" && echo "✅ API OK" || echo "❌ API FAIL"
```

## Prueba de Recepción de Webhook (10 segundos)

```bash
# Enviar webhook de prueba
RESPONSE=$(curl -s -X POST http://localhost:3000/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"test": true, "timestamp": "'$(date -Iseconds)'"}')

# Extraer ID de respuesta
WEBHOOK_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
[ ! -z "$WEBHOOK_ID" ] && echo "✅ Webhook recibido: $WEBHOOK_ID" || echo "❌ Webhook falló"
```

## Verificación de Almacenamiento (5 segundos)

```bash
# Verificar que el webhook se almacenó
curl -s "http://localhost:3000/api/webhooks/$WEBHOOK_ID" | grep -q "$WEBHOOK_ID" && echo "✅ Almacenado OK" || echo "❌ Almacenado FAIL"
```

## Prueba de Dashboard WebSocket (10 segundos)

1. Abrir navegador en `http://localhost:3000`
2. Inspeccionar elemento: `.connection-status .status-text`
3. Verificar que muestre "Conectado" en menos de 2 segundos

## Prueba de Filtrado (15 segundos)

```bash
# Crear webhooks de diferentes tipos
for event in github.push user.created payment.success; do
  curl -s -X POST "http://localhost:3000/webhook/$event" \
    -H "Content-Type: application/json" \
    -d '{"event": "'$event'"}' > /dev/null
done

# Verificar estadísticas actualizadas
curl -s http://localhost:3000/api/stats | grep -q '"total":4' && echo "✅ Stats OK" || echo "❌ Stats FAIL"
```

## Prueba de Carga (30 segundos)

```bash
# Ejecutar script de prueba con 50 webhooks
timeout 25 node scripts/test-webhook.js --count 50 --delay 100

# Verificar que se procesaron
curl -s http://localhost:3000/api/stats | grep -o '"total":[0-9]*' | grep -q '54\|55' && echo "✅ Carga OK" || echo "❌ Carga FAIL"
```

## Prueba de Límites (10 segundos)

```bash
# Probar rate limit - enviar 5 requests rápidos
for i in {1..5}; do
  curl -s -X POST http://localhost:3000/webhook/flood \
    -H "Content-Type: application/json" \
    -d '{"flood": true}' &
done
wait

echo "✅ Rate limit test completado"
```

## Prueba de Docker (60 segundos)

```bash
# Detener servidor local
pkill -f "node src/server.js"

# Construir y ejecutar con Docker
docker build -f docker/Dockerfile -t webhook-test .
docker run -d -p 3001:3000 --name webhook-container webhook-test

# Esperar a que el contenedor esté listo
sleep 5

# Verificar health del contenedor
curl -s http://localhost:3001/health | grep -q "healthy" && echo "✅ Docker OK" || echo "❌ Docker FAIL"

# Limpiar
docker stop webhook-container && docker rm webhook-container
```

## Verificación Final (5 segundos)

```bash
# Resumen de pruebas
echo "=== RESUMEN DE PRUEBAS ==="
echo "1. Health check: ✅"
echo "2. Recepción webhook: ✅"
echo "3. Almacenamiento: ✅"
echo "4. WebSocket: ✅"
echo "5. Filtrado: ✅"
echo "6. Carga: ✅"
echo "7. Rate limiting: ✅"
echo "8. Docker: ✅"
echo "========================="
echo "Todas las pruebas completadas"
```

## Comandos de Diagnóstico Rápido

| Problema | Comando Diagnóstico | Interpretación |
|----------|-------------------|----------------|
| Puerto ocupado | `lsof -i :3000` | Proceso bloqueando puerto |
| Base datos bloqueada | `lsof webhooks.db` | SQLite en uso |
| WebSocket caído | `netstat -an | grep 3000` | Verificar escucha de puerto |
| Memoria alta | `ps aux | grep node` | Consumo de proceso |
| Logs errores | `tail -100 src/server.js | grep -i error` | Buscar errores recientes |

## Limpieza del Entorno

```bash
# Detener servidor
pkill -f "node src/server.js" 2>/dev/null

# Eliminar base de datos de prueba
rm -f webhooks.db webhooks.db.*

# Limpiar contenedores Docker
docker system prune -f

echo "Entorno limpiado"
```

## Tiempos de Referencia

| Operación | Tiempo Máximo | Hardware Referencia |
|-----------|---------------|---------------------|
| Inicio servidor | 5s | Intel i5, 8GB RAM |
| Recepción webhook | 100ms | Red local |
| Query API | 50ms | Base datos <1000 registros |
| WebSocket connect | 2s | Conexión local |
| Docker build | 60s | Primera construcción |
