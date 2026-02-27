class WebhookDashboard {
    constructor() {
        this.ws = null
        this.webhooks = []
        this.currentFilter = ''
        this.autoRefresh = true
        this.currentWebhook = null
        
        console.log('🚀 Inicializando WebhookDashboard...')
        console.log('📱 User Agent:', navigator.userAgent)
        console.log('🌐 URL actual:', window.location.href)

        this.initializeElements()
        this.setupEventListeners()
        this.connectWebSocket()
        this.loadInitialData()
        this.startPolling()

        // Enviar webhook de prueba automático desde JSONPlaceholder
        this.sendAutoTestWebhook()
        
        console.log('✅ WebhookDashboard inicializado')
    }

    initializeElements() {
        this.elements = {
            connectionStatus: document.getElementById('connectionStatus'),
            totalWebhooks: document.getElementById('totalWebhooks'),
            last24h: document.getElementById('last24h'),
            recentWebhooks: document.getElementById('recentWebhooks'),
            eventTypes: document.getElementById('eventTypes'),
            eventTypeFilter: document.getElementById('eventTypeFilter'),
            refreshBtn: document.getElementById('refreshBtn'),
            clearBtn: document.getElementById('clearBtn'),
            webhookUrl: document.getElementById('webhookUrl'),
            copyUrlBtn: document.getElementById('copyUrlBtn'),
            webhooksList: document.getElementById('webhooksList'),
            webhookCount: document.getElementById('webhookCount'),
            autoRefresh: document.getElementById('autoRefresh'),
            modal: document.getElementById('webhookModal'),
            closeModal: document.getElementById('closeModal'),
            detailId: document.getElementById('detailId'),
            detailEventType: document.getElementById('detailEventType'),
            detailSourceIp: document.getElementById('detailSourceIp'),
            detailCreatedAt: document.getElementById('detailCreatedAt'),
            detailHeaders: document.getElementById('detailHeaders'),
            detailPayload: document.getElementById('detailPayload'),
            copyHeaders: document.getElementById('copyHeaders'),
            copyPayload: document.getElementById('copyPayload')
        }

        // Establecer URL del webhook
        const protocol = window.location.protocol
        const host = window.location.host
        this.elements.webhookUrl.value = `${protocol}//${host}/webhook`
    }

    setupEventListeners() {
        this.elements.refreshBtn.addEventListener('click', () => this.loadInitialData())
        this.elements.clearBtn.addEventListener('click', () => this.clearWebhooks())
        this.elements.copyUrlBtn.addEventListener('click', () => this.copyWebhookUrl())
        this.elements.eventTypeFilter.addEventListener('change', (e) => {
            this.currentFilter = e.target.value
            this.renderWebhooks()
        })
        this.elements.autoRefresh.addEventListener('click', () => this.toggleAutoRefresh())
        this.elements.closeModal.addEventListener('click', () => this.closeModal())
        this.elements.copyHeaders.addEventListener('click', () => this.copyToClipboard('headers'))
        this.elements.copyPayload.addEventListener('click', () => this.copyToClipboard('payload'))

        // Cerrar modal al hacer clic fuera
        this.elements.modal.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) {
                this.closeModal()
            }
        })

        // ESC para cerrar modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal()
            }
        })

        // Manejar cambios de conectividad (especialmente importante en móviles)
        window.addEventListener('online', () => {
            console.log('📶 Conexión restaurada')
            this.reconnectAttempts = 0
            this.connectWebSocket()
        })

        window.addEventListener('offline', () => {
            console.log('📵 Sin conexión')
            this.updateConnectionStatus(false)
        })

        // Reconectar cuando la pestaña vuelve a estar visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && (!this.ws || this.ws.readyState !== WebSocket.OPEN)) {
                console.log('👁️ Pestaña visible, reconectando WebSocket')
                this.reconnectAttempts = 0
                this.connectWebSocket()
            }
        })
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const wsUrl = `${protocol}//${window.location.host}`

        console.log('🔌 Intentando conectar WebSocket a:', wsUrl)

        try {
            this.ws = new WebSocket(wsUrl)

            this.ws.onopen = () => {
                console.log('✅ WebSocket conectado')
                this.updateConnectionStatus(true)
                this.reconnectAttempts = 0
            }

            this.ws.onclose = (event) => {
                console.log('❌ WebSocket desconectado. Código:', event.code, 'Razón:', event.reason)
                this.updateConnectionStatus(false)
                this.scheduleReconnect()
            }

            this.ws.onerror = (error) => {
                console.error('❌ Error WebSocket:', error)
                this.updateConnectionStatus(false)
            }

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    if (data.type === 'webhook_received') {
                        this.handleNewWebhook(data.data)
                    }
                } catch (error) {
                    console.error('Error al procesar mensaje WebSocket:', error)
                }
            }
        } catch (error) {
            console.error('❌ Error al crear WebSocket:', error)
            this.scheduleReconnect()
        }
    }

    scheduleReconnect() {
        this.reconnectAttempts = (this.reconnectAttempts || 0) + 1
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000)
        console.log(`🔄 Reintentando conexión en ${delay}ms (intento ${this.reconnectAttempts})`)
        setTimeout(() => this.connectWebSocket(), delay)
    }

    updateConnectionStatus(connected) {
        const status = this.elements.connectionStatus
        if (connected) {
            status.classList.add('connected')
            status.querySelector('.status-text').textContent = 'Conectado'
        } else {
            status.classList.remove('connected')
            status.querySelector('.status-text').textContent = 'Desconectado'
        }
    }

    handleNewWebhook(webhookData) {
        // Agregar al inicio del array
        this.webhooks.unshift({
            id: webhookData.id,
            eventType: webhookData.eventType,
            headers: webhookData.headers,
            payload: webhookData.payload,
            sourceIp: webhookData.sourceIp,
            createdAt: webhookData.createdAt
        })

        // Limitar a 100 webhooks en memoria
        if (this.webhooks.length > 100) {
            this.webhooks = this.webhooks.slice(0, 100)
        }

        this.renderWebhooks()
        this.updateStats()
        this.updateEventTypesFilter()

        // Marcar como nuevo
        setTimeout(() => {
            const firstItem = document.querySelector('.webhook-item')
            if (firstItem) {
                firstItem.classList.add('new')
                setTimeout(() => firstItem.classList.remove('new'), 2000)
            }
        }, 100)
    }

    async loadInitialData() {
        console.log('📥 loadInitialData() iniciando...')
        try {
            // Cargar webhooks con credentials incluidas para evitar problemas CORS
            console.log('🌐 Fetching /api/webhooks?limit=50...')
            const webhooksResponse = await fetch('/api/webhooks?limit=50', {
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json'
                }
            })
            
            console.log('📊 Response status:', webhooksResponse.status)
            
            if (!webhooksResponse.ok) {
                throw new Error(`HTTP error! status: ${webhooksResponse.status}`)
            }
            
            const webhooksData = await webhooksResponse.json()
            console.log('✅ Webhooks cargados:', webhooksData.webhooks?.length || 0)
            this.webhooks = webhooksData.webhooks || []

            // Cargar estadísticas
            console.log('📈 Cargando estadísticas...')
            await this.updateStats()

            // Cargar tipos de eventos
            console.log('🏷️ Cargando tipos de eventos...')
            await this.updateEventTypesFilter()

            // Renderizar
            console.log('🎨 Renderizando webhooks...')
            this.renderWebhooks()
            console.log('✅ loadInitialData() completado')

        } catch (error) {
            console.error('❌ Error al cargar datos iniciales:', error)
            console.error('Stack:', error.stack)
            // Mostrar error en la UI para móviles
            this.showError('Error al cargar datos: ' + error.message)
        }
    }

    showError(message) {
        const container = this.elements.webhooksList
        container.innerHTML = `
            <div class="empty-state error">
                <div class="empty-icon">⚠️</div>
                <h3>${message}</h3>
                <button onclick="location.reload()" class="btn">Recargar página</button>
            </div>
        `
    }

    async updateStats() {
        try {
            const response = await fetch('/api/stats', {
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json'
                }
            })
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const stats = await response.json()

            this.elements.totalWebhooks.textContent = stats.total
            this.elements.last24h.textContent = stats.last24h
            this.elements.recentWebhooks.textContent = stats.recent
            this.elements.eventTypes.textContent = Object.keys(stats.byEvent).length

        } catch (error) {
            console.error('Error al actualizar estadísticas:', error)
        }
    }

    async updateEventTypesFilter() {
        try {
            const response = await fetch('/api/event-types')
            const data = await response.json()

            const currentValue = this.elements.eventTypeFilter.value
            this.elements.eventTypeFilter.innerHTML = '<option value="">Todos los eventos</option>'

            data.eventTypes.forEach(eventType => {
                const option = document.createElement('option')
                option.value = eventType
                option.textContent = eventType
                if (eventType === currentValue) {
                    option.selected = true
                }
                this.elements.eventTypeFilter.appendChild(option)
            })

        } catch (error) {
            console.error('Error al actualizar tipos de eventos:', error)
        }
    }

    renderWebhooks() {
        const container = this.elements.webhooksList
        const filteredWebhooks = this.currentFilter
            ? this.webhooks.filter(w => w.eventType === this.currentFilter)
            : this.webhooks

        this.elements.webhookCount.textContent = `${filteredWebhooks.length} webhook${filteredWebhooks.length !== 1 ? 's' : ''}`

        if (filteredWebhooks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📡</div>
                    <h3>Esperando webhooks...</h3>
                    <p>Envía un webhook para verlo aquí</p>
                </div>
            `
            return
        }

        container.innerHTML = filteredWebhooks.map(webhook => `
            <div class="webhook-item" data-id="${webhook.id}">
                <div class="webhook-header">
                    <span class="webhook-event">${this.escapeHtml(webhook.eventType)}</span>
                    <span class="webhook-time">${this.formatDate(webhook.createdAt)}</span>
                </div>
                <div class="webhook-body">
                    <div class="webhook-info">
                        <span class="webhook-label">IP:</span>
                        <span class="webhook-value">${this.escapeHtml(webhook.sourceIp)}</span>
                    </div>
                    <div class="webhook-info">
                        <span class="webhook-label">ID:</span>
                        <span class="webhook-value">${this.escapeHtml(webhook.id)}</span>
                    </div>
                </div>
                <div class="webhook-preview">
                    <code>${this.getPayloadPreview(webhook.payload)}</code>
                </div>
            </div>
        `).join('')

        // Agregar event listeners a los items
        container.querySelectorAll('.webhook-item').forEach(item => {
            item.addEventListener('click', () => {
                const webhookId = item.getAttribute('data-id')
                const webhook = this.webhooks.find(w => w.id === webhookId)
                if (webhook) {
                    this.showWebhookDetails(webhook)
                }
            })
        })
    }

    getPayloadPreview(payload) {
        try {
            const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload
            const str = JSON.stringify(parsed)
            return this.escapeHtml(str.length > 100 ? str.substring(0, 100) + '...' : str)
        } catch {
            const str = String(payload)
            return this.escapeHtml(str.length > 100 ? str.substring(0, 100) + '...' : str)
        }
    }

    showWebhookDetails(webhook) {
        this.currentWebhook = webhook

        this.elements.detailId.textContent = webhook.id
        this.elements.detailEventType.textContent = webhook.eventType
        this.elements.detailSourceIp.textContent = webhook.sourceIp
        this.elements.detailCreatedAt.textContent = this.formatDate(webhook.createdAt)

        // Formatear headers
        try {
            const headers = typeof webhook.headers === 'string'
                ? JSON.parse(webhook.headers)
                : webhook.headers
            this.elements.detailHeaders.textContent = JSON.stringify(headers, null, 2)
        } catch {
            this.elements.detailHeaders.textContent = webhook.headers
        }

        // Formatear payload
        try {
            const payload = typeof webhook.payload === 'string'
                ? JSON.parse(webhook.payload)
                : webhook.payload
            this.elements.detailPayload.textContent = JSON.stringify(payload, null, 2)
        } catch {
            this.elements.detailPayload.textContent = webhook.payload
        }

        // Aplicar syntax highlighting
        if (window.Prism) {
            Prism.highlightElement(this.elements.detailHeaders)
            Prism.highlightElement(this.elements.detailPayload)
        }

        this.elements.modal.style.display = 'flex'
    }

    closeModal() {
        this.elements.modal.style.display = 'none'
        this.currentWebhook = null
    }

    async copyToClipboard(type) {
        if (!this.currentWebhook) return

        let text = ''
        if (type === 'headers') {
            text = this.elements.detailHeaders.textContent
        } else if (type === 'payload') {
            text = this.elements.detailPayload.textContent
        }

        try {
            await navigator.clipboard.writeText(text)

            // Feedback visual
            const button = type === 'headers' ? this.elements.copyHeaders : this.elements.copyPayload
            const originalText = button.textContent
            button.textContent = '✓ Copiado'
            button.style.backgroundColor = '#10b981'

            setTimeout(() => {
                button.textContent = originalText
                button.style.backgroundColor = ''
            }, 2000)
        } catch (error) {
            console.error('Error al copiar:', error)
            alert('Error al copiar al portapapeles')
        }
    }

    async clearWebhooks() {
        if (!confirm('¿Estás seguro de que quieres eliminar todos los webhooks?')) {
            return
        }

        try {
            const response = await fetch('/api/webhooks', {
                method: 'DELETE'
            })

            if (response.ok) {
                this.webhooks = []
                this.renderWebhooks()
                this.updateStats()
                this.updateEventTypesFilter()
            } else {
                alert('Error al eliminar webhooks')
            }
        } catch (error) {
            console.error('Error al eliminar webhooks:', error)
            alert('Error al eliminar webhooks')
        }
    }

    async copyWebhookUrl() {
        try {
            await navigator.clipboard.writeText(this.elements.webhookUrl.value)

            // Feedback visual
            const originalText = this.elements.copyUrlBtn.textContent
            this.elements.copyUrlBtn.textContent = '✓ Copiado'
            this.elements.copyUrlBtn.style.backgroundColor = '#10b981'

            setTimeout(() => {
                this.elements.copyUrlBtn.textContent = originalText
                this.elements.copyUrlBtn.style.backgroundColor = ''
            }, 2000)
        } catch (error) {
            console.error('Error al copiar URL:', error)
            alert('Error al copiar URL')
        }
    }

    toggleAutoRefresh() {
        this.autoRefresh = !this.autoRefresh

        if (this.autoRefresh) {
            this.elements.autoRefresh.classList.add('active')
            this.elements.autoRefresh.textContent = '▶️ Auto-actualizar'
        } else {
            this.elements.autoRefresh.classList.remove('active')
            this.elements.autoRefresh.textContent = '⏸️ Auto-actualizar'
        }
    }

    startPolling() {
        setInterval(() => {
            if (this.autoRefresh) {
                this.updateStats()
            }
        }, 30000) // Actualizar cada 30 segundos
    }

    formatDate(dateString) {
        const date = new Date(dateString)
        const now = new Date()
        const diff = now - date

        const seconds = Math.floor(diff / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        if (seconds < 60) return 'hace unos segundos'
        if (minutes < 60) return `hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`
        if (hours < 24) return `hace ${hours} hora${hours !== 1 ? 's' : ''}`
        if (days < 7) return `hace ${days} día${days !== 1 ? 's' : ''}`

        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    escapeHtml(text) {
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
    }

    // Función para enviar webhook de prueba automático desde JSONPlaceholder
    async sendAutoTestWebhook() {
        try {
            console.log('🚀 Enviando webhook de prueba automático desde JSONPlaceholder...')

            // Obtener datos de JSONPlaceholder
            const response = await fetch('https://jsonplaceholder.typicode.com/posts/1')
            const data = await response.json()

            console.log('📦 Datos obtenidos de JSONPlaceholder:', data)

            // Enviar webhook con los datos obtenidos
            const webhookResponse = await fetch('/webhook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Event-Type': 'test.jsonplaceholder',
                    'X-Source': 'auto-test'
                },
                body: JSON.stringify({
                    source: 'jsonplaceholder',
                    event: 'auto_test',
                    data: data,
                    timestamp: new Date().toISOString()
                })
            })

            if (webhookResponse.ok) {
                console.log('✅ Webhook de prueba enviado exitosamente')
            } else {
                console.warn('⚠️ Error al enviar webhook de prueba:', webhookResponse.status)
            }

        } catch (error) {
            console.error('❌ Error al enviar webhook de prueba automático:', error)
        }
    }
}

// Manejador global de errores para diagnóstico en móviles
window.onerror = function(msg, url, line, col, error) {
    console.error('🔴 Error global:', msg)
    console.error('URL:', url)
    console.error('Línea:', line, 'Columna:', col)
    console.error('Error:', error)
    return false
}

window.addEventListener('unhandledrejection', function(event) {
    console.error('🔴 Promesa rechazada no manejada:', event.reason)
})

// Inicializar dashboard al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM cargado, inicializando dashboard...')
    try {
        new WebhookDashboard()
    } catch (error) {
        console.error('🔴 Error al inicializar dashboard:', error)
        document.body.innerHTML = '<div style="padding: 20px; color: red;"><h2>Error al cargar el dashboard</h2><p>' + error.message + '</p><pre>' + error.stack + '</pre></div>'
    }
})
