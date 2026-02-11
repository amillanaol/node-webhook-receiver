# Makefile para node-webhook-receiver

.PHONY: help install dev test test-unit test-integration lint lint-fix docker-build docker-run clean

# Variables
NODE_ENV ?= development
PORT ?= 3000

# Colores para output
GREEN  := $(shell tput -Af 40)
WHITE  := $(shell tput -Af 7)
YELLOW := $(shell tput -Af 3)
RESET  := $(shell tput -Af 9)

help: ## Mostrar ayuda
	@echo "$(GREEN)node-webhook-receiver - Comandos disponibles:$(RESET)"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(YELLOW)%-15s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Instalar dependencias
	@echo "$(GREEN)Instalando dependencias...$(RESET)"
	npm install

dev: ## Iniciar servidor en modo desarrollo
	@echo "$(GREEN)Iniciando servidor en modo desarrollo...$(RESET)"
	npm run dev

start: ## Iniciar servidor
	@echo "$(GREEN)Iniciando servidor...$(RESET)"
	npm start

test: ## Ejecutar todos los tests
	@echo "$(GREEN)Ejecutando tests...$(RESET)"
	npm test

test-unit: ## Ejecutar tests unitarios
	@echo "$(GREEN)Ejecutando tests unitarios...$(RESET)"
	npm run test:unit

test-integration: ## Ejecutar tests de integración
	@echo "$(GREEN)Ejecutando tests de integración...$(RESET)"
	npm run test:integration

test-watch: ## Ejecutar tests en modo watch
	@echo "$(GREEN)Ejecutando tests en modo watch...$(RESET)"
	npm run test:watch

lint: ## Ejecutar linter
	@echo "$(GREEN)Ejecutando linter...$(RESET)"
	npm run lint

lint-fix: ## Ejecutar linter y corregir errores automáticamente
	@echo "$(GREEN)Ejecutando linter y corrigiendo errores...$(RESET)"
	npm run lint:fix

docker-build: ## Construir imagen Docker
	@echo "$(GREEN)Construyendo imagen Docker...$(RESET)"
	docker build -t webhook-receiver -f docker/Dockerfile .

docker-run: ## Ejecutar contenedor Docker
	@echo "$(GREEN)Ejecutando contenedor Docker...$(RESET)"
	docker run -p $(PORT):3000 --name webhook-receiver -d webhook-receiver

docker-stop: ## Detener contenedor Docker
	@echo "$(GREEN)Deteniendo contenedor Docker...$(RESET)"
	docker stop webhook-receiver
	docker rm webhook-receiver

docker-compose-up: ## Levantar servicios con Docker Compose
	@echo "$(GREEN)Levantando servicios con Docker Compose...$(RESET)"
	docker-compose -f docker/docker-compose.yml up -d

docker-compose-down: ## Detener servicios de Docker Compose
	@echo "$(GREEN)Deteniendo servicios de Docker Compose...$(RESET)"
	docker-compose -f docker/docker-compose.yml down

test-webhook: ## Enviar webhook de prueba
	@echo "$(GREEN)Enviando webhook de prueba...$(RESET)"
	node scripts/test-webhook.js

test-webhook-many: ## Enviar múltiples webhooks de prueba
	@echo "$(GREEN)Enviando múltiples webhooks de prueba...$(RESET)"
	node scripts/test-webhook.js --count 10 --delay 500

setup: ## Configurar proyecto (instalar dependencias)
	@echo "$(GREEN)Configurando proyecto...$(RESET)"
	npm install
	@echo "$(GREEN)¡Proyecto configurado!$(RESET)"

backup: ## Crear backup de la base de datos
	@echo "$(GREEN)Creando backup de la base de datos...$(RESET)"
	cp webhooks.db webhooks.db.backup.$(shell date +%Y%m%d_%H%M%S)

clean: ## Limpiar archivos temporales
	@echo "$(GREEN)Limpiando archivos temporales...$(RESET)"
	rm -rf node_modules
	rm -rf coverage
	rm -rf .nyc_output
	find . -name "*.log" -delete
	find . -name ".DS_Store" -delete

clean-all: clean ## Limpiar todo incluyendo base de datos
	@echo "$(GREEN)Limpiando todo incluyendo base de datos...$(RESET)"
	rm -f webhooks.db
	rm -f webhooks.db.*

install-dev: ## Instalar dependencias de desarrollo
	@echo "$(GREEN)Instalando dependencias de desarrollo...$(RESET)"
	npm install --save-dev

security-audit: ## Ejecutar auditoría de seguridad
	@echo "$(GREEN)Ejecutando auditoría de seguridad...$(RESET)"
	npm audit
	@echo "$(YELLOW)Para corregir vulnerabilidades: npm audit fix$(RESET)"

run-ci: ## Ejecutar pipeline completo de CI localmente
	@echo "$(GREEN)Ejecutando pipeline de CI...$(RESET)"
	$(MAKE) lint
	$(MAKE) test
	$(MAKE) security-audit
	@echo "$(GREEN)✅ Pipeline de CI completado$(RESET)"

.DEFAULT_GOAL := help
