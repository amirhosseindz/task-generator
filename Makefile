.PHONY: help start stop restart status logs clean build

# Default environment
ENV ?= dev

# Validate environment parameter
ifeq ($(filter $(ENV),dev prod),)
  $(error Invalid ENV parameter. Use 'dev' or 'prod'. Example: make start ENV=dev)
endif

# Set docker-compose file based on environment
ifeq ($(ENV),dev)
  COMPOSE_FILE := docker-compose.dev.yml
else
  COMPOSE_FILE := docker-compose.prod.yml
endif

# Unified startup script
START_SCRIPT := ./scripts/start.sh

help: ## Show this help message
	@echo "Task Generator - Makefile Commands"
	@echo ""
	@echo "Usage: make [target] [ENV=dev|prod]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Examples:"
	@echo "  make start           # Start development environment (default)"
	@echo "  make start ENV=dev   # Start development environment"
	@echo "  make start ENV=prod  # Start production environment"
	@echo "  make stop            # Stop development environment (default)"
	@echo "  make stop ENV=prod   # Stop production environment"

start: ## Start the application (default: dev)
	@if [ ! -f "$(START_SCRIPT)" ]; then \
		echo "❌ Error: $(START_SCRIPT) not found"; \
		exit 1; \
	fi
	@if [ ! -x "$(START_SCRIPT)" ]; then \
		echo "📝 Making $(START_SCRIPT) executable..."; \
		chmod +x "$(START_SCRIPT)"; \
	fi
	@bash "$(START_SCRIPT)" $(ENV)

stop: ## Stop the application (default: dev)
	@echo "🛑 Stopping Task Generator ($(ENV) environment)..."
	@if ! command -v docker-compose &> /dev/null; then \
		echo "❌ Error: docker-compose is not installed"; \
		exit 1; \
	fi
	@if ! docker info &> /dev/null; then \
		echo "❌ Error: Docker is not running"; \
		exit 1; \
	fi
	@if [ -f docker-compose.override.yml ]; then \
		docker-compose -f $(COMPOSE_FILE) -f docker-compose.override.yml down; \
	else \
		docker-compose -f $(COMPOSE_FILE) down; \
	fi
	@echo "✅ Services stopped"

restart: stop start ## Restart the application (default: dev)

status: ## Show status of running containers (default: dev)
	@echo "📊 Task Generator Status ($(ENV) environment):"
	@if ! command -v docker-compose &> /dev/null; then \
		echo "❌ Error: docker-compose is not installed"; \
		exit 1; \
	fi
	@if [ -f docker-compose.override.yml ]; then \
		docker-compose -f $(COMPOSE_FILE) -f docker-compose.override.yml ps; \
	else \
		docker-compose -f $(COMPOSE_FILE) ps; \
	fi

logs: ## Show logs from running containers (default: dev)
	@echo "📋 Task Generator Logs ($(ENV) environment):"
	@if ! command -v docker-compose &> /dev/null; then \
		echo "❌ Error: docker-compose is not installed"; \
		exit 1; \
	fi
	@if [ -f docker-compose.override.yml ]; then \
		docker-compose -f $(COMPOSE_FILE) -f docker-compose.override.yml logs -f; \
	else \
		docker-compose -f $(COMPOSE_FILE) logs -f; \
	fi

logs-backend: ## Show logs from backend container only (default: dev)
	@echo "📋 Backend Logs ($(ENV) environment):"
	@if [ -f docker-compose.override.yml ]; then \
		docker-compose -f $(COMPOSE_FILE) -f docker-compose.override.yml logs -f backend; \
	else \
		docker-compose -f $(COMPOSE_FILE) logs -f backend; \
	fi

logs-frontend: ## Show logs from frontend container only (default: dev)
	@echo "📋 Frontend Logs ($(ENV) environment):"
	@if [ -f docker-compose.override.yml ]; then \
		docker-compose -f $(COMPOSE_FILE) -f docker-compose.override.yml logs -f frontend; \
	else \
		docker-compose -f $(COMPOSE_FILE) logs -f frontend; \
	fi

build: ## Build Docker images without starting (default: dev)
	@echo "📦 Building Docker images ($(ENV) environment)..."
	@if ! command -v docker-compose &> /dev/null; then \
		echo "❌ Error: docker-compose is not installed"; \
		exit 1; \
	fi
	@if [ -f docker-compose.override.yml ]; then \
		docker-compose -f $(COMPOSE_FILE) -f docker-compose.override.yml build; \
	else \
		docker-compose -f $(COMPOSE_FILE) build; \
	fi
	@echo "✅ Images built"

clean: ## Stop and remove containers, networks, and volumes (default: dev)
	@echo "🧹 Cleaning up Task Generator ($(ENV) environment)..."
	@if ! command -v docker-compose &> /dev/null; then \
		echo "❌ Error: docker-compose is not installed"; \
		exit 1; \
	fi
	@if [ -f docker-compose.override.yml ]; then \
		docker-compose -f $(COMPOSE_FILE) -f docker-compose.override.yml down -v; \
	else \
		docker-compose -f $(COMPOSE_FILE) down -v; \
	fi
	@echo "✅ Cleanup complete"

clean-all: ## Remove all containers, networks, volumes, and images
	@echo "🧹 Cleaning up all Task Generator resources..."
	@if ! command -v docker-compose &> /dev/null; then \
		echo "❌ Error: docker-compose is not installed"; \
		exit 1; \
	fi
	@echo "Stopping dev environment..."
	@docker-compose -f docker-compose.dev.yml down -v 2>/dev/null || true
	@echo "Stopping prod environment..."
	@docker-compose -f docker-compose.prod.yml down -v 2>/dev/null || true
	@echo "✅ All resources cleaned"

shell-backend: ## Open a shell in the backend container (default: dev)
	@echo "🐚 Opening shell in backend container ($(ENV) environment)..."
	@if [ -f docker-compose.override.yml ]; then \
		docker-compose -f $(COMPOSE_FILE) -f docker-compose.override.yml exec backend /bin/sh; \
	else \
		docker-compose -f $(COMPOSE_FILE) exec backend /bin/sh; \
	fi

shell-frontend: ## Open a shell in the frontend container (default: dev)
	@echo "🐚 Opening shell in frontend container ($(ENV) environment)..."
	@if [ -f docker-compose.override.yml ]; then \
		docker-compose -f $(COMPOSE_FILE) -f docker-compose.override.yml exec frontend /bin/sh; \
	else \
		docker-compose -f $(COMPOSE_FILE) exec frontend /bin/sh; \
	fi
