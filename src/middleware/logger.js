const morgan = require('morgan')

// Formato personalizado para logs
const customFormat = ':method :url :status :res[content-length] - :response-time ms - :remote-addr - :date[clf]'

// Middleware de logging
const logger = morgan(customFormat, {
  skip: (req, res) => {
    // No loguear health checks en producción
    return process.env.NODE_ENV === 'production' && req.path === '/health'
  },
  stream: {
    write: (message) => {
      // En producción, podrías enviar esto a un servicio de logging
      if (process.env.NODE_ENV === 'production') {
        // Por ahora, solo lo mandamos a la consola
        console.log(message.trim())
      } else {
        // En desarrollo, log con colores
        console.log(`[${new Date().toISOString()}] ${message.trim()}`)
      }
    }
  }
})

// Logger para errores
const errorLogger = (err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.url}`)
  console.error('Error:', err.message)
  console.error('Stack:', err.stack)
  next(err)
}

module.exports = logger
module.exports.errorLogger = errorLogger
