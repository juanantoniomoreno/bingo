# Bingo — Docker Development Workflow

## Quick Start

```bash
make up        # levanta todo (redis + backend + frontend)
make down      # baja todo
make rebuild   # rebuild completo + levanta
make logs      # ver logs de backend y frontend
```

## Scenarios

### 1. Cambios en `backend/` o `frontend/` (archivos .ts, .tsx)

**No tenés que hacer nada.**

Tanto `ts-node-dev` (backend) como `next dev` (frontend) detectan los cambios automáticamente porque el código fuente se monta como volumen en los contenedores.

```
Editás → Guardás → Se recarga solo
```

### 2. Cambios en `shared/` (types, lógica compartida)

**Sí requiere un paso manual.** El workspace `shared` se compila a `dist/` y ambos contenedores consumen ese `dist/`. Como montamos el directorio compilado, tenés dos opciones:

**Opción A — desde tu máquina (más rápido):**

```bash
npm run build --workspace=shared
make up   # o docker compose restart backend frontend
```

**Opción B — usando Make:**

```bash
make shared
```

Esto recompila `shared` dentro del contenedor `backend` y reinicia ambos servicios.

### 3. Agregar o actualizar dependencias (`package.json`)

Las imágenes Docker tienen sus propios `node_modules` (protegidos por volúmenes anónimos). Si agregás un paquete en el host, el contenedor no lo ve.

**Flujo correcto:**

```bash
# 1. Instalás en tu máquina (actualiza package.json + package-lock.json)
npm install -w backend some-package
# o si es global al workspace raíz:
npm install some-package

# 2. Rebuild del servicio afectado (o de ambos)
docker compose build backend

# 3. Levantás
docker compose up -d
```

**Shortcut:**

```bash
make rebuild   # baja, rebuild sin cache, y levanta todo
```

## Pro Tips

### Entrar a un contenedor

```bash
make shell-be   # shell en backend
make shell-fe   # shell en frontend
```

O manualmente:

```bash
docker compose exec backend bash
docker compose exec frontend bash
```

### Ver logs de un solo servicio

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Redis no expone puerto al host

Redis solo se accede dentro de la red de Docker (`redis://redis:6379`). Esto evita conflictos si tenés Redis corriendo localmente.

### Si algo se rompe raro

```bash
make down
make rebuild
```

Esto borra los contenedores y recompila las imágenes desde cero. No pierde datos porque Redis es volátil en desarrollo (sin volumen persistente).

## URLs cuando está levantado

| Servicio       | URL                              |
| -------------- | -------------------------------- |
| App (frontend) | http://localhost:3000            |
| API (backend)  | http://localhost:3001            |
| Health check   | http://localhost:3001/api/health |
| Socket.io      | ws://localhost:3001              |
