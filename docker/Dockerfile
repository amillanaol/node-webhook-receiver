# Etapa de construcción
FROM node:18 AS builder

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# Etapa final
FROM node:18-slim

WORKDIR /app

# Crear usuario no-root
RUN groupadd -r nodejs && useradd -r -g nodejs webhook

# Copiar código de la aplicación (sin node_modules locales)
COPY --chown=webhook:nodejs . .

# Eliminar node_modules locales de Windows si existen
RUN rm -rf node_modules

# Copiar dependencias desde la etapa de construcción
COPY --from=builder --chown=webhook:nodejs /app/node_modules ./node_modules

# Cambiar al usuario no-root
USER webhook

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Comando para ejecutar la aplicación
CMD ["npm", "start"]
