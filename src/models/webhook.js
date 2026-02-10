const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../webhooks.db')

let db

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error al conectar con SQLite:', err)
        return reject(err)
      }
      console.log('Conectado a SQLite')
      createTables().then(resolve).catch(reject)
    })
  })
}

function createTables() {
  return new Promise((resolve, reject) => {
    const createWebhooksTable = `
      CREATE TABLE IF NOT EXISTS webhooks (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        headers TEXT NOT NULL,
        payload TEXT NOT NULL,
        source_ip TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `

    db.run(createWebhooksTable, (err) => {
      if (err) {
        console.error('Error al crear tabla webhooks:', err)
        return reject(err)
      }
      console.log('Tabla webhooks creada o ya existe')
      resolve()
    })
  })
}

function createWebhook({ eventType, headers, payload, sourceIp }) {
  return new Promise((resolve, reject) => {
    const id = uuidv4()
    const stmt = db.prepare(`
      INSERT INTO webhooks (id, event_type, headers, payload, source_ip)
      VALUES (?, ?, ?, ?, ?)
    `)

    stmt.run([
      id,
      eventType,
      JSON.stringify(headers),
      JSON.stringify(payload),
      sourceIp
    ], function(err) {
      if (err) {
        console.error('Error al crear webhook:', err)
        return reject(err)
      }
      resolve({ id, eventType, headers, payload, sourceIp })
    })

    stmt.finalize()
  })
}

function getWebhooks(limit = 100, offset = 0) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM webhooks
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `

    db.all(query, [limit, offset], (err, rows) => {
      if (err) {
        console.error('Error al obtener webhooks:', err)
        return reject(err)
      }

      const webhooks = rows.map(row => ({
        id: row.id,
        eventType: row.event_type,
        headers: JSON.parse(row.headers),
        payload: JSON.parse(row.payload),
        sourceIp: row.source_ip,
        createdAt: row.created_at
      }))

      resolve(webhooks)
    })
  })
}

function getWebhookById(id) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM webhooks WHERE id = ?'

    db.get(query, [id], (err, row) => {
      if (err) {
        console.error('Error al obtener webhook:', err)
        return reject(err)
      }

      if (!row) {
        return resolve(null)
      }

      const webhook = {
        id: row.id,
        eventType: row.event_type,
        headers: JSON.parse(row.headers),
        payload: JSON.parse(row.payload),
        sourceIp: row.source_ip,
        createdAt: row.created_at
      }

      resolve(webhook)
    })
  })
}

function deleteWebhook(id) {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM webhooks WHERE id = ?'

    db.run(query, [id], function(err) {
      if (err) {
        console.error('Error al eliminar webhook:', err)
        return reject(err)
      }

      resolve(this.changes > 0)
    })
  })
}

function getStats() {
  return new Promise((resolve, reject) => {
    const queries = {
      total: 'SELECT COUNT(*) as total FROM webhooks',
      last24h: `SELECT COUNT(*) as total FROM webhooks WHERE created_at >= datetime('now', '-1 day')`,
      byEvent: 'SELECT event_type, COUNT(*) as total FROM webhooks GROUP BY event_type',
      recent: 'SELECT COUNT(*) as total FROM webhooks WHERE created_at >= datetime("now", "-1 hour")'
    }

    const results = {}

    Promise.all([
      new Promise((res, rej) => {
        db.get(queries.total, (err, row) => {
          if (err) return rej(err)
          res(row.total)
        })
      }),
      new Promise((res, rej) => {
        db.get(queries.last24h, (err, row) => {
          if (err) return rej(err)
          res(row.total)
        })
      }),
      new Promise((res, rej) => {
        db.all(queries.byEvent, (err, rows) => {
          if (err) return rej(err)
          res(rows.reduce((acc, row) => {
            acc[row.event_type] = row.total
            return acc
          }, {}))
        })
      }),
      new Promise((res, rej) => {
        db.get(queries.recent, (err, row) => {
          if (err) return rej(err)
          res(row.total)
        })
      })
    ])
    .then(([total, last24h, byEvent, recent]) => {
      resolve({
        total,
        last24h,
        byEvent,
        recent,
        timestamp: new Date().toISOString()
      })
    })
    .catch(reject)
  })
}

function cleanup(olderThanDays = 30) {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM webhooks WHERE created_at < datetime('now', '-${olderThanDays} days')`
    
    db.run(query, function(err) {
      if (err) {
        console.error('Error al limpiar webhooks antiguos:', err)
        return reject(err)
      }
      console.log(`Eliminados ${this.changes} webhooks antiguos`)
      resolve(this.changes)
    })
  })
}

module.exports = {
  initializeDatabase,
  createWebhook,
  getWebhooks,
  getWebhookById,
  deleteWebhook,
  getStats,
  cleanup
}
