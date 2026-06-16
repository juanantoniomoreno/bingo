# Bingo — Docker Dev Makefile
# make up       → levanta todo (hot-reload activo)
# make down     → baja todo
# make rebuild  → rebuild completo de imágenes y levanta
# make shared   → recompila shared y reinicia servicios
# make logs     → tail de logs de backend + frontend
# make shell-be → abre un shell en el backend
# make shell-fe → abre un shell en el frontend

.PHONY: up down rebuild shared logs shell-be shell-fe

up:
	docker compose up -d

down:
	docker compose down

rebuild:
	docker compose down
	docker compose build --no-cache
	docker compose up -d

shared:
	docker compose exec backend npm run build --workspace=shared
	docker compose restart backend frontend

logs:
	docker compose logs -f backend frontend

shell-be:
	docker compose exec backend bash

shell-fe:
	docker compose exec frontend bash
