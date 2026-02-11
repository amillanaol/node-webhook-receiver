const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const path = require('path')
const http = require('http')
require('dotenv').config()

const logger = require('./middleware/logger')
const webhookRoutes = require('./routes/webhook')
const apiRoutes = require('./routes/api')
const { initializeDatabase } = require('./models/webhook')
const { initializeWebSocket } = require('./utils/websocket')

const app = express()
const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '0.0.0.0'

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // límite de requests por ventana
  message: 'Demasiadas requests desde esta IP'
})

// Middleware
// Desactivar CSP y HSTS en desarrollo para evitar problemas de carga de recursos
const isDevelopment = process.env.NODE_ENV !== 'production'

app.use(helmet({
  contentSecurityPolicy: isDevelopment ? false : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
      connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  strictTransportSecurity: isDevelopment ? false : {
    maxAge: 15552000,
    includeSubDomains: true
  }
}))
app.use(cors({
  origin: true,
  credentials: true
}))
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
const wss = initializeWebSocket(server)

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
    server.listen(PORT, HOST, () => {
      console.log(`🚀 Servidor corriendo en http://${HOST}:${PORT}`)
      console.log(`📊 Dashboard disponible en http://localhost:${PORT}`)
      console.log(`🏥 Health check en http://localhost:${PORT}/health`)
      console.log(`📱 Acceso desde red local: http://<tu-ip-local>:${PORT}`)
    })
    
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Error: El puerto ${PORT} ya está en uso`)
        console.error('💡 Soluciones:')
        console.error(`   1. Mata el proceso: npx kill-port ${PORT}`)
        console.error(`   2. Usa otro puerto: PORT=${parseInt(PORT) + 1} npm start`)
      } else {
        console.error('❌ Error del servidor:', error.message)
      }
      process.exit(1)
    })
  } catch (error) {
    console.error('Error al iniciar el servidor:', error)
    process.exit(1)
  }
}

startServer()

module.exports = { app }
