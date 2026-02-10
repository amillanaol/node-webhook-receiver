# Etapa de construcción
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# Etapa final
FROM node:18-alpine

WORKDIR /app

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S webhook -u 1001

# Copiar dependencias desde la etapa de construcción
COPY --from=builder --chown=webhook:nodejs /app/node_modules ./node_modules

# Copiar código de la aplicación
COPY --chown=webhook:nodejs . .

# Cambiar al usuario no-root
USER webhook

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Comando para ejecutar la aplicación
CMD ["npm", "start"]
