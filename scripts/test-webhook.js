#!/usr/bin/env node

const http = require('http')
const { argv } = require('process')

// Configuración
const DEFAULT_HOST = 'localhost'
const DEFAULT_PORT = 3000
const DEFAULT_EVENT = 'test'

function showHelp() {
    console.log(`
🎯 Webhook Test Script

Uso:
  node test-webhook.js [opciones]

Opciones:
  --host <host>     Host del servidor (default: ${DEFAULT_HOST})
  --port <port>     Puerto del servidor (default: ${DEFAULT_PORT})
  --event <event>   Tipo de evento (default: ${DEFAULT_EVENT})
  --count <n>       Número de webhooks a enviar (default: 1)
  --delay <ms>      Delay entre webhooks en ms (default: 1000)
  --help          Mostrar ayuda

Ejemplos:
  node test-webhook.js
  node test-webhook.js --event github.push --count 5
  node test-webhook.js --host webhook.example.com --port 443 --event user.created
`)
}

function parseArgs() {
    const args = {
        host: DEFAULT_HOST,
        port: DEFAULT_PORT,
        event: DEFAULT_EVENT,
        count: 1,
        delay: 1000
    }

    for (let i = 2; i < argv.length; i++) {
        switch (argv[i]) {
            case '--help':
                showHelp()
                process.exit(0)
                break
            case '--host':
                args.host = argv[++i]
                break
            case '--port':
                args.port = parseInt(argv[++i])
                break
            case '--event':
                args.event = argv[++i]
                break
            case '--count':
                args.count = parseInt(argv[++i])
                break
            case '--delay':
                args.delay = parseInt(argv[++i])
                break
            default:
                console.error(`Opción desconocida: ${argv[i]}`)
                process.exit(1)
        }
    }

    return args
}

function generateWebhookData(eventType, index) {
    const baseData = {
        timestamp: new Date().toISOString(),
        eventId: `evt_${Date.now()}_${index}`,
        source: 'test-script'
    }

    // Datos específicos según el tipo de evento
    const eventData = {
        'test': {
            message: 'Este es un webhook de prueba',
            data: {
                test: true,
                index: index,
                random: Math.random()
            }
        },
        'github.push': {
            ref: 'refs/heads/main',
            before: 'abc123',
            after: 'def456',
            repository: {
                name: 'test-repo',
                full_name: 'user/test-repo',
                private: false
            },
            pusher: {
                name: 'test-user',
                email: 'test@example.com'
            },
            commits: [
                {
                    id: 'abc123',
                    message: 'Test commit',
                    author: {
                        name: 'Test User',
                        email: 'test@example.com'
                    }
                }
            ]
        },
        'user.created': {
            user: {
                id: `user_${index}`,
                email: `user${index}@example.com`,
                name: `User ${index}`,
                created_at: new Date().toISOString()
            }
        },
        'payment.success': {
            payment: {
                id: `pay_${Date.now()}`,
                amount: Math.floor(Math.random() * 1000) + 100,
                currency: 'USD',
                status: 'completed'
            },
            customer: {
                id: `cust_${index}`,
                email: `customer${index}@example.com`
            }
        },
        'order.updated': {
            order: {
                id: `order_${index}`,
                status: ['pending', 'processing', 'completed', 'cancelled'][Math.floor(Math.random() * 4)],
                total: Math.floor(Math.random() * 500) + 50,
                items: [
                    {
                        id: `item_${index}_1`,
                        name: 'Test Product',
                        quantity: Math.floor(Math.random() * 5) + 1,
                        price: Math.floor(Math.random() * 100) + 10
                    }
                ]
            }
        }
    }

    return {
        ...baseData,
        ...(eventData[eventType] || eventData['test'])
    }
}

function sendWebhook(args, index) {
    return new Promise((resolve, reject) => {
        const webhookData = generateWebhookData(args.event, index)
        const postData = JSON.stringify(webhookData)

        const options = {
            hostname: args.host,
            port: args.port,
            path: `/webhook/${args.event}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'webhook-test-script/1.0',
                'X-Event-ID': `test_${Date.now()}_${index}`,
                'X-Test': 'true'
            }
        }

        console.log(`📤 Enviando webhook ${index + 1}/${args.count} a ${args.host}:${args.port}/webhook/${args.event}`)

        const req = http.request(options, (res) => {
            let responseData = ''

            res.on('data', (chunk) => {
                responseData += chunk
            })

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`✅ Webhook ${index + 1} enviado exitosamente (Status: ${res.statusCode})`)
                    resolve({
                        success: true,
                        statusCode: res.statusCode,
                        response: responseData
                    })
                } else {
                    console.error(`❌ Webhook ${index + 1} falló (Status: ${res.statusCode})`)
                    reject(new Error(`HTTP ${res.statusCode}: ${responseData}`))
                }
            })
        })

        req.on('error', (error) => {
            console.error(`❌ Error al enviar webhook ${index + 1}:`, error.message)
            reject(error)
        })

        req.write(postData)
        req.end()
    })
}

async function run() {
    const args = parseArgs()
    
    console.log(`
🎯 Webhook Test Script
🌐 Target: ${args.host}:${args.port}/webhook/${args.event}
📊 Cantidad: ${args.count}
⏱️  Delay: ${args.delay}ms
`)

    const results = {
        success: 0,
        failed: 0,
        errors: []
    }

    for (let i = 0; i < args.count; i++) {
        try {
            await sendWebhook(args, i)
            results.success++
        } catch (error) {
            results.failed++
            results.errors.push({
                index: i,
                error: error.message
            })
        }

        // Esperar entre webhooks (excepto el último)
        if (i < args.count - 1 && args.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, args.delay))
        }
    }

    console.log(`\n📊 Resultados:`)
    console.log(`✅ Exitosos: ${results.success}`)
    console.log(`❌ Fallidos: ${results.failed}`)
    
    if (results.errors.length > 0) {
        console.log(`\n📝 Errores:`)
        results.errors.forEach(error => {
            console.log(`  Webhook ${error.index + 1}: ${error.error}`)
        })
    }

    console.log('\n🏁 Prueba completada')
}

// Ejecutar
run().catch(error => {
    console.error('Error fatal:', error)
    process.exit(1)
})
