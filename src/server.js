const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const path = require('path')
const WebSocket = require('ws')
const http = require('http')
require('dotenv').config()

const logger = require('./middleware/logger')
const webhookRoutes = require('./routes/webhook')
const apiRoutes = require('./routes/api')
const { initializeDatabase } = require('./models/webhook')

const app = express()
const PORT = process.env.PORT || 3000

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // límite de requests por ventana
  message: 'Demasiadas requests desde esta IP'
})

// Middleware
app.use(helmet())
app.use(cors())
app.use(limiter)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(logger)

// Rutas
app.use('/webhook', webhookRoutes)
app.use('/api', apiRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')))

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'La ruta solicitada no existe'
  })
})

// Crear servidor HTTP y WebSocket
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

// WebSocket para actualizaciones en tiempo real
wss.on('connection', (ws) => {
  console.log('Cliente WebSocket conectado')
  
  ws.on('close', () => {
    console.log('Cliente WebSocket desconectado')
  })
})

// Función para enviar actualizaciones a todos los clientes conectados
function broadcastUpdate(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data))
    }
  })
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...')
  server.close(() => {
    console.log('Servidor cerrado')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...')
  server.close(() => {
    console.log('Servidor cerrado')
    process.exit(0)
  })
})

// Inicializar base de datos y arrancar servidor
async function startServer() {
  try {
    await initializeDatabase()
    server.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
      console.log(`📊 Dashboard disponible en http://localhost:${PORT}`)
      console.log(`🏥 Health check en http://localhost:${PORT}/health`)
    })
  } catch (error) {
    console.error('Error al iniciar el servidor:', error)
    process.exit(1)
  }
}

startServer()

module.exports = { app, broadcastUpdate }
