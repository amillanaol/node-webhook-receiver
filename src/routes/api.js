const express = require('express')
const { 
  getWebhooks, 
  getWebhookById, 
  deleteWebhook, 
  getStats 
} = require('../models/webhook')

const router = express.Router()

// GET /api/webhooks - Lista todos los webhooks
router.get('/webhooks', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100
    const offset = parseInt(req.query.offset) || 0
    const eventType = req.query.eventType

    let webhooks = await getWebhooks(limit, offset)

    // Filtrar por tipo de evento si se especifica
    if (eventType) {
      webhooks = webhooks.filter(w => w.eventType === eventType)
    }

    res.json({
      webhooks,
      total: webhooks.length,
      limit,
      offset
    })

  } catch (error) {
    console.error('Error al obtener webhooks:', error)
    res.status(500).json({
      error: 'Error al obtener webhooks',
      message: error.message
    })
  }
})

// GET /api/webhooks/:id - Detalle de un webhook
router.get('/webhooks/:id', async (req, res) => {
  try {
    const { id } = req.params
    const webhook = await getWebhookById(id)

    if (!webhook) {
      return res.status(404).json({
        error: 'Webhook no encontrado',
        id
      })
    }

    res.json(webhook)

  } catch (error) {
    console.error('Error al obtener webhook:', error)
    res.status(500).json({
      error: 'Error al obtener webhook',
      message: error.message
    })
  }
})

// DELETE /api/webhooks/:id - Eliminar webhook
router.delete('/webhooks/:id', async (req, res) => {
  try {
    const { id } = req.params
    const deleted = await deleteWebhook(id)

    if (!deleted) {
      return res.status(404).json({
        error: 'Webhook no encontrado',
        id
      })
    }

    res.json({
      message: 'Webhook eliminado exitosamente',
      id
    })

  } catch (error) {
    console.error('Error al eliminar webhook:', error)
    res.status(500).json({
      error: 'Error al eliminar webhook',
      message: error.message
    })
  }
})

// GET /api/stats - Estadísticas
router.get('/stats', async (req, res) => {
  try {
    const stats = await getStats()
    res.json(stats)

  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      message: error.message
    })
  }
})

// GET /api/event-types - Tipos de eventos únicos
router.get('/event-types', async (req, res) => {
  try {
    // Esta sería una función adicional en el modelo
    // Por ahora, devolvemos los datos de stats.byEvent
    const stats = await getStats()
    const eventTypes = Object.keys(stats.byEvent)

    res.json({
      eventTypes,
      total: eventTypes.length
    })

  } catch (error) {
    console.error('Error al obtener tipos de eventos:', error)
    res.status(500).json({
      error: 'Error al obtener tipos de eventos',
      message: error.message
    })
  }
})

module.exports = router
