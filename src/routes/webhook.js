const express = require('express')
const { createWebhook } = require('../models/webhook')
const { broadcastUpdate } = require('../server')
const router = express.Router()

// POST /webhook/:event - Recibir webhook
router.post('/:event', async (req, res) => {
  try {
    const eventType = req.params.event
    const headers = req.headers
    const payload = req.body
    const sourceIp = req.ip || req.connection.remoteAddress

    // Crear webhook en la base de datos
    const webhook = await createWebhook({
      eventType,
      headers,
      payload,
      sourceIp
    })

    console.log(`Webhook recibido: ${eventType} desde ${sourceIp}`)

    // Enviar actualización a los clientes WebSocket
    broadcastUpdate({
      type: 'webhook_received',
      data: {
        id: webhook.id,
        eventType,
        headers,
        payload,
        sourceIp,
        createdAt: new Date().toISOString()
      }
    })

    res.status(201).json({
      message: 'Webhook recibido exitosamente',
      id: webhook.id,
      eventType
    })

  } catch (error) {
    console.error('Error al procesar webhook:', error)
    res.status(500).json({
      error: 'Error al procesar el webhook',
      message: error.message
    })
  }
})

// POST /webhook - Recibir webhook sin tipo de evento
router.post('/', async (req, res) => {
  try {
    const headers = req.headers
    const payload = req.body
    const sourceIp = req.ip || req.connection.remoteAddress
    
    // Intentar detectar el tipo de evento desde los headers
    const eventType = headers['x-event-type'] || 
                     headers['x-github-event'] || 
                     headers['x-gitlab-event'] || 
                     headers['x-hook-event'] || 
                     'unknown'

    // Crear webhook en la base de datos
    const webhook = await createWebhook({
      eventType,
      headers,
      payload,
      sourceIp
    })

    console.log(`Webhook recibido: ${eventType} desde ${sourceIp}`)

    // Enviar actualización a los clientes WebSocket
    broadcastUpdate({
      type: 'webhook_received',
      data: {
        id: webhook.id,
        eventType,
        headers,
        payload,
        sourceIp,
        createdAt: new Date().toISOString()
      }
    })

    res.status(201).json({
      message: 'Webhook recibido exitosamente',
      id: webhook.id,
      eventType
    })

  } catch (error) {
    console.error('Error al procesar webhook:', error)
    res.status(500).json({
      error: 'Error al procesar el webhook',
      message: error.message
    })
  }
})

module.exports = router
