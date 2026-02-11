const WebSocket = require('ws')

let wss = null

// Inicializar el servidor WebSocket
function initializeWebSocket(server) {
  wss = new WebSocket.Server({ server })

  wss.on('connection', (ws) => {
    console.log('Cliente WebSocket conectado')

    ws.on('close', () => {
      console.log('Cliente WebSocket desconectado')
    })
  })

  return wss
}

// Función para enviar actualizaciones a todos los clientes conectados
function broadcastUpdate(data) {
  if (!wss) {
    console.warn('WebSocket no inicializado, no se puede enviar actualización')
    return
  }

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data))
    }
  })
}

module.exports = {
  initializeWebSocket,
  broadcastUpdate
}
