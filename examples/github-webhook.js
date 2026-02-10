/**
 * Ejemplo: Receptor de Webhooks de GitHub
 *
 * Este archivo muestra cómo implementar un receptor seguro
 * de webhooks de GitHub usando Express.
 *
 * Para usar este código:
 * 1. npm install express body-parser
 * 2. Configura tu secreto: export GITHUB_WEBHOOK_SECRET="tu-secreto"
 * 3. node examples/github-webhook.js
 *
 * Luego, configura el webhook en GitHub apuntando a:
 * http://tu-servidor:3000/webhooks/github
 */

import express from 'express';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

// Middleware para capturar el body raw (necesario para validar firma)
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

/**
 * Valida la firma de GitHub
 * GitHub envía un header X-Hub-Signature-256 con el HMAC del payload
 */
function validateGitHubSignature(payload, signature) {
  if (!WEBHOOK_SECRET) {
    throw new Error('GITHUB_WEBHOOK_SECRET no está configurado');
  }

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  // Comparación segura contra timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

/**
 * Endpoint principal de webhooks de GitHub
 */
app.post('/webhooks/github', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const event = req.headers['x-github-event'];
  const deliveryId = req.headers['x-github-delivery'];

  console.log(`📨 Webhook recibido: ${event} (ID: ${deliveryId})`);

  try {
    // 1. Validar firma
    if (!validateGitHubSignature(req.rawBody, signature)) {
      console.error('❌ Firma inválida');
      return res.status(401).json({ error: 'Firma inválida' });
    }

    console.log('✅ Firma validada correctamente');

    // 2. Procesar según el tipo de evento
    switch (event) {
      case 'push':
        await handlePushEvent(req.body);
        break;

      case 'pull_request':
        await handlePullRequestEvent(req.body);
        break;

      case 'issues':
        await handleIssuesEvent(req.body);
        break;

      default:
        console.log(`⚠️  Evento no manejado: ${event}`);
    }

    // 3. Responder rápidamente (GitHub espera 200 en < 10 segundos)
    res.status(200).json({
      success: true,
      message: 'Webhook procesado',
      deliveryId
    });

  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

/**
 * Maneja eventos de push
 */
async function handlePushEvent(payload) {
  const { repository, pusher, commits } = payload;

  console.log(`🚀 Push a ${repository.full_name}`);
  console.log(`👤 Por: ${pusher.name}`);
  console.log(`📝 Commits: ${commits.length}`);

  // Aquí va tu lógica:
  // - Desplegar aplicación
  // - Ejecutar CI/CD
  // - Notificar equipo
  // etc.
}

/**
 * Maneja eventos de pull request
 */
async function handlePullRequestEvent(payload) {
  const { action, pull_request } = payload;

  console.log(`🔀 PR ${action}: #${pull_request.number}`);
  console.log(`📄 Título: ${pull_request.title}`);

  // Aquí va tu lógica:
  // - Ejecutar tests automáticos
  // - Code review automático
  // - Actualizar estado
  // etc.
}

/**
 * Maneja eventos de issues
 */
async function handleIssuesEvent(payload) {
  const { action, issue } = payload;

  console.log(`📋 Issue ${action}: #${issue.number}`);
  console.log(`📄 Título: ${issue.title}`);

  // Aquí va tu lógica:
  // - Auto-etiquetar
  // - Asignar a personas
  // - Responder automáticamente
  // etc.
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Iniciar servidor
 */
app.listen(PORT, () => {
  console.log(`🎯 Servidor escuchando en puerto ${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhooks/github`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);

  if (!WEBHOOK_SECRET) {
    console.warn('⚠️  ADVERTENCIA: GITHUB_WEBHOOK_SECRET no está configurado');
    console.warn('   Configúralo con: export GITHUB_WEBHOOK_SECRET="tu-secreto"');
  }
});

export default app;
