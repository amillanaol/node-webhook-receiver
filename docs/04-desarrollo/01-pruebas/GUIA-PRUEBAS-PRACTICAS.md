# 🧪 Guía de Pruebas Prácticas - Webhook Receiver

## 📋 Índice
- [Inicio Rápido (2 minutos)](#inicio-rápido-2-minutos)
- [Prueba Automática con JSONPlaceholder](#prueba-automática-con-jsonplaceholder)
- [Enviar Webhooks Manualmente](#enviar-webhooks-manualmente)
- [Usar el Script de Pruebas](#usar-el-script-de-pruebas)
- [Probar con Herramientas Externas](#probar-con-herramientas-externas)
- [Verificar Funcionalidades](#verificar-funcionalidades)
- [Solución de Problemas](#solución-de-problemas)

---

## 🚀 Inicio Rápido (2 minutos)

### 1. Iniciar el Servidor

```bash
# Desde la raíz del proyecto
npm start
```

**Deberías ver:**
```
🚀 Servidor corriendo en http://localhost:3000
📊 Dashboard disponible en http://localhost:3000
🏥 Health check en http://localhost:3000/health
```

### 2. Abrir el Dashboard

Abre tu navegador en: **http://localhost:3000**

**¿Qué deberías ver?**
- ✅ Estado: **"Conectado"** (luz verde)
- ✅ URL del webhook: `http://localhost:3000/webhook`
- ✅ Automáticamente aparece un webhook de prueba de JSONPlaceholder

---

## 🤖 Prueba Automática con JSONPlaceholder

**¡Esta prueba se ejecuta sola cuando abres la página!**

### ¿Qué hace?

1. Al cargar la página, automáticamente:
   - Consulta `https://jsonplaceholder.typicode.com/posts/1`
   - Obtiene datos de prueba
   - Envía esos datos como webhook al servidor
   - Muestra el webhook en la lista

### Verificar en la Consola del Navegador

Abre las DevTools (F12) y ve a la pestaña **Console**. Deberías ver:

```
🚀 Enviando webhook de prueba automático desde JSONPlaceholder...
📦 Datos obtenidos de JSONPlaceholder: {userId: 1, id: 1, title: "...", body: "..."}
✅ Webhook de prueba enviado exitosamente
✅ WebSocket conectado
```

### Ver los Detalles del Webhook

1. Haz clic en el webhook que apareció en la lista
2. Se abrirá un modal mostrando:
   - **Tipo de Evento**: `test.jsonplaceholder`
   - **Headers**: Información de la petición
   - **Payload**: Datos completos de JSONPlaceholder
   - **IP Origen**: Tu IP local
   - **Fecha y Hora**: Timestamp del webhook

---

## 📤 Enviar Webhooks Manualmente

### Opción 1: Usando curl (Terminal)

#### Webhook Simple

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"mensaje": "Hola mundo", "timestamp": "2024-02-10T10:30:00Z"}'
```

#### Webhook con Tipo de Evento Personalizado

```bash
curl -X POST http://localhost:3000/webhook/usuario.creado \
  -H "Content-Type: application/json" \
  -H "X-Event-Type: usuario.creado" \
  -d '{
    "usuario": {
      "id": 123,
      "nombre": "Juan Pérez",
      "email": "juan@example.com"
    },
    "timestamp": "'$(date -Iseconds)'"
  }'
```

#### Simular Webhook de GitHub

```bash
curl -X POST http://localhost:3000/webhook/github.push \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "User-Agent: GitHub-Hookshot/abc123" \
  -d '{
    "ref": "refs/heads/main",
    "repository": {
      "name": "mi-proyecto",
      "full_name": "usuario/mi-proyecto"
    },
    "pusher": {
      "name": "Juan Desarrollador",
      "email": "juan@dev.com"
    },
    "commits": [
      {
        "id": "abc123def456",
        "message": "Fix: Corrección de bug importante",
        "timestamp": "'$(date -Iseconds)'"
      }
    ]
  }'
```

#### Webhook con Datos Grandes

```bash
curl -X POST http://localhost:3000/webhook/datos.grandes \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "procesamiento",
    "datos": {
      "array": ['$(seq -s, 1 100)'],
      "metadata": {
        "procesado": true,
        "timestamp": "'$(date -Iseconds)'",
        "version": "1.0.0"
      }
    }
  }'
```

### Opción 2: Usando PowerShell (Windows)

```powershell
# Webhook simple
Invoke-RestMethod -Uri "http://localhost:3000/webhook" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"mensaje": "Prueba desde PowerShell"}'

# Webhook con tipo personalizado
$body = @{
    usuario = @{
        id = 456
        nombre = "María García"
        email = "maria@example.com"
    }
    timestamp = (Get-Date -Format "o")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/webhook/usuario.actualizado" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Opción 3: Usando JavaScript (Navegador)

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Webhook simple
fetch('http://localhost:3000/webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    mensaje: 'Prueba desde navegador',
    timestamp: new Date().toISOString()
  })
})
.then(res => res.json())
.then(data => console.log('Webhook enviado:', data))

// Webhook con tipo personalizado
fetch('http://localhost:3000/webhook/pago.exitoso', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Event-Type': 'pago.exitoso'
  },
  body: JSON.stringify({
    pago: {
      id: 'PAY-12345',
      monto: 99.99,
      moneda: 'USD',
      cliente: 'cliente@example.com'
    },
    timestamp: new Date().toISOString()
  })
})
.then(res => res.json())
.then(data => console.log('Pago registrado:', data))
```

---

## 🔧 Usar el Script de Pruebas

El proyecto incluye un script para enviar múltiples webhooks de prueba.

### Uso Básico

```bash
node scripts/test-webhook.js
```

### Enviar 10 Webhooks

```bash
node scripts/test-webhook.js --count 10
```

### Enviar con Delay entre Cada Uno

```bash
node scripts/test-webhook.js --count 20 --delay 500
```

### Prueba de Carga (100 webhooks rápidos)

```bash
node scripts/test-webhook.js --count 100 --delay 50
```

**¿Qué deberías ver?**
- En la terminal: Progreso del envío de webhooks
- En el dashboard: Los webhooks aparecen en tiempo real
- Las estadísticas se actualizan automáticamente

---

## 🌐 Probar con Herramientas Externas

### 1. Postman

1. **Crear una Request:**
   - Método: `POST`
   - URL: `http://localhost:3000/webhook/mi.evento`

2. **Headers:**
   ```
   Content-Type: application/json
   X-Event-Type: mi.evento
   ```

3. **Body (raw JSON):**
   ```json
   {
     "datos": "Mi webhook de prueba",
     "timestamp": "2024-02-10T10:30:00Z",
     "metadata": {
       "origen": "Postman",
       "version": "1.0"
     }
   }
   ```

4. **Enviar** y verificar la respuesta

### 2. Insomnia

Similar a Postman:
- Crea un `New Request` → `POST`
- URL: `http://localhost:3000/webhook`
- Body: JSON con tus datos
- Send!

### 3. HTTPie (Terminal amigable)

```bash
# Instalar httpie si no lo tienes
# pip install httpie

# Enviar webhook
http POST localhost:3000/webhook \
  mensaje="Prueba con HTTPie" \
  timestamp=$(date -Iseconds)

# Con headers personalizados
http POST localhost:3000/webhook/orden.creada \
  X-Event-Type:orden.creada \
  orden:='{"id": 789, "total": 150.00}' \
  timestamp=$(date -Iseconds)
```

### 4. Webhook.site (Pruebas Reales)

Para probar webhooks salientes desde servicios externos:

1. Ve a https://webhook.site
2. Copia tu URL única
3. Configúrala en el servicio que quieres probar (GitHub, Stripe, etc.)
4. Los webhooks aparecerán en webhook.site
5. Reenvíalos manualmente a tu servidor local:
   ```bash
   curl -X POST http://localhost:3000/webhook/servicio.externo \
     -H "Content-Type: application/json" \
     -d @webhook-capturado.json
   ```

---

## ✅ Verificar Funcionalidades

### 1. Conexión WebSocket

**Verificar:**
- ✅ El estado muestra "Conectado" (luz verde)
- ✅ Los webhooks aparecen en tiempo real sin recargar
- ✅ No hay errores en la consola del navegador

**Si aparece "Desconectado":**
- Revisa la consola del navegador (F12)
- Verifica que el servidor esté corriendo
- Intenta recargar la página

### 2. Visualización de Webhooks

**Verificar:**
- ✅ Los webhooks nuevos aparecen arriba de la lista
- ✅ Muestra: tipo de evento, hora, IP, ID
- ✅ Tiene animación de "nuevo" cuando llega un webhook

### 3. Modal de Detalles

**Cómo probar:**
1. Haz clic en cualquier webhook de la lista
2. Debería abrir un modal mostrando:
   - ✅ Información general (ID, tipo, IP, fecha)
   - ✅ Headers formateados con colores
   - ✅ Payload formateado con colores
   - ✅ Botones "Copiar Headers" y "Copiar Payload"

**Probar copiado:**
- Clic en "Copiar Payload" → debería decir "✓ Copiado"
- Pega en un editor → debería tener el JSON formateado

### 4. Filtrado por Tipo

**Cómo probar:**
1. Envía varios webhooks de diferentes tipos
2. Usa el selector "Filtrar por tipo:"
3. La lista debería mostrar solo los del tipo seleccionado

**Ejemplo:**
```bash
# Enviar 3 tipos diferentes
curl -X POST http://localhost:3000/webhook/tipo.a -H "Content-Type: application/json" -d '{"test":1}'
curl -X POST http://localhost:3000/webhook/tipo.b -H "Content-Type: application/json" -d '{"test":2}'
curl -X POST http://localhost:3000/webhook/tipo.a -H "Content-Type: application/json" -d '{"test":3}'
```

Ahora filtra por "tipo.a" → deberías ver solo 2 webhooks

### 5. Estadísticas

**Verificar:**
- ✅ **Total Webhooks**: Cuenta total desde el inicio
- ✅ **Últimas 24h**: Webhooks del último día
- ✅ **Última hora**: Webhooks de los últimos 60 minutos
- ✅ **Tipos de Eventos**: Cantidad de tipos diferentes

**Las estadísticas se actualizan:**
- Inmediatamente cuando llega un webhook nuevo
- Cada 30 segundos automáticamente (si auto-refresh está activo)
- Al hacer clic en "🔄 Actualizar"

### 6. Botón Copiar URL

**Probar:**
1. Clic en "📋 Copiar" junto a la URL
2. Debería cambiar a "✓ Copiado" (fondo verde)
3. Pega la URL → debería ser `http://localhost:3000/webhook`

### 7. Limpiar Webhooks

**Probar:**
1. Clic en "🗑️ Limpiar"
2. Aparece confirmación: "¿Estás seguro...?"
3. Clic en "Aceptar"
4. Todos los webhooks desaparecen
5. Estadísticas vuelven a 0

### 8. Auto-actualizar

**Probar:**
1. El botón "▶️ Auto-actualizar" está activo por defecto
2. Clic para pausar → cambia a "⏸️ Auto-actualizar"
3. Las estadísticas dejan de actualizarse automáticamente
4. Clic nuevamente para reactivar

---

## 🎯 Casos de Prueba Completos

### Caso 1: Flujo Básico

```bash
# 1. Enviar webhook
curl -X POST http://localhost:3000/webhook/prueba.basica \
  -H "Content-Type: application/json" \
  -d '{"mensaje": "Prueba 1"}'

# 2. Verificar en API
curl http://localhost:3000/api/webhooks?limit=1

# 3. Verificar estadísticas
curl http://localhost:3000/api/stats
```

### Caso 2: Múltiples Eventos

```bash
# Crear 5 eventos diferentes
for i in {1..5}; do
  curl -X POST http://localhost:3000/webhook/evento.$i \
    -H "Content-Type: application/json" \
    -d "{\"numero\": $i, \"timestamp\": \"$(date -Iseconds)\"}"
  sleep 1
done

# Verificar en dashboard → deberías ver 5 webhooks
# Filtro debería mostrar 5 tipos diferentes
```

### Caso 3: Prueba de Rendimiento

```bash
# Enviar 50 webhooks en paralelo
for i in {1..50}; do
  curl -X POST http://localhost:3000/webhook/carga \
    -H "Content-Type: application/json" \
    -d "{\"id\": $i}" &
done
wait

# Verificar que todos se procesaron
curl http://localhost:3000/api/stats
```

---

## 🐛 Solución de Problemas

### Problema: Aparece "Desconectado"

**Causas posibles:**
1. El servidor no está corriendo
2. Error en el código JavaScript
3. WebSocket bloqueado por firewall/proxy

**Soluciones:**
```bash
# 1. Verificar que el servidor esté corriendo
curl http://localhost:3000/health

# 2. Ver logs del servidor
# (en la terminal donde ejecutaste npm start)

# 3. Abrir DevTools del navegador (F12)
# Buscar errores en Console y Network > WS
```

### Problema: No aparecen webhooks automáticos

**Verificar:**
1. Abre DevTools (F12) → Console
2. Busca mensajes de error
3. Verifica que la función `sendAutoTestWebhook()` se ejecute

**Si falla la consulta a JSONPlaceholder:**
```javascript
// Probar manualmente en la consola
fetch('https://jsonplaceholder.typicode.com/posts/1')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error('Error:', e))
```

### Problema: Error "EADDRINUSE"

**Significa:** El puerto 3000 ya está en uso

**Solución en Windows:**
```powershell
# Ver qué proceso usa el puerto 3000
netstat -ano | findstr :3000

# Matar el proceso (reemplaza PID con el número que aparece)
taskkill /PID <PID> /F
```

**Solución en Linux/Mac:**
```bash
# Ver qué proceso usa el puerto 3000
lsof -i :3000

# Matar el proceso
kill -9 <PID>
```

**O cambiar el puerto:**
```bash
# Editar .env
PORT=3001

# Reiniciar servidor
npm start
```

### Problema: El modal no se abre

**Verificar:**
1. DevTools (F12) → Console → buscar errores
2. ¿Los webhooks tienen clase `webhook-item`?
3. Inspeccionar HTML del webhook

**Probar manualmente:**
```javascript
// En la consola del navegador
document.querySelector('.webhook-item').click()
```

### Problema: "Cannot read property 'textContent'"

**Causa:** Algún elemento HTML no existe

**Solución:**
1. Verifica que `index.html` esté completo
2. Recarga la página con Ctrl+F5 (hard reload)
3. Verifica la consola del navegador

---

## 📊 API Endpoints Disponibles

### Health Check
```bash
curl http://localhost:3000/health
```

### Listar Webhooks
```bash
# Últimos 50
curl http://localhost:3000/api/webhooks?limit=50

# Con offset
curl http://localhost:3000/api/webhooks?limit=20&offset=10
```

### Obtener Webhook Específico
```bash
curl http://localhost:3000/api/webhooks/<ID>
```

### Estadísticas
```bash
curl http://localhost:3000/api/stats
```

### Tipos de Eventos
```bash
curl http://localhost:3000/api/event-types
```

### Eliminar Todos los Webhooks
```bash
curl -X DELETE http://localhost:3000/api/webhooks
```

---

## 🎓 Tips y Mejores Prácticas

### 1. Usa Headers Descriptivos

```bash
curl -X POST http://localhost:3000/webhook/mi.evento \
  -H "Content-Type: application/json" \
  -H "X-Event-Type: mi.evento" \
  -H "X-Request-ID: $(uuidgen)" \
  -H "User-Agent: Mi-Aplicacion/1.0" \
  -d '{"datos": "importante"}'
```

### 2. Incluye Timestamps

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "evento": "test",
    "timestamp": "'$(date -Iseconds)'",
    "timestamp_unix": '$(date +%s)'
  }'
```

### 3. Usa JSON Válido

```bash
# ✅ Correcto
-d '{"nombre": "Juan", "edad": 30}'

# ❌ Incorrecto
-d '{nombre: "Juan", edad: 30}'
```

### 4. Prueba con Datos Reales

Usa datos similares a los que recibirás en producción para detectar problemas temprano.

### 5. Monitorea el Rendimiento

```bash
# Ver tiempo de respuesta
time curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## 📚 Recursos Adicionales

- **JSONPlaceholder**: https://jsonplaceholder.typicode.com/
- **Webhook.site**: https://webhook.site/
- **RequestBin**: https://requestbin.com/
- **Postman**: https://www.postman.com/
- **Insomnia**: https://insomnia.rest/

---

## 🎉 ¡Listo para Producción!

Cuando hayas completado todas las pruebas:

✅ WebSocket conecta correctamente
✅ Webhooks aparecen en tiempo real
✅ Modal muestra detalles completos
✅ Filtrado funciona correctamente
✅ Estadísticas se actualizan
✅ Copiar al portapapeles funciona
✅ API responde correctamente

**¡Tu Webhook Receiver está listo! 🚀**

---

**Versión:** 1.0.0
**Fecha:** 2024-02-10
**Autor:** Webhook Receiver Team
