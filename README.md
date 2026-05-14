# Bingo Multiplayer

Un juego de bingo multijugador en tiempo real con temática de sala de bingo clásica. Sin autenticación, sin complicaciones: creás una partida, compartís el ID y empezás a jugar.

---

## Características

- **Sin registro** — entrás con un nombre y listo
- **Partidas por ID** — código alfanumérico de 6 caracteres para unirse
- **Dos roles**: Dispensador (saca números del 1-90) y Jugador (marca cartones)
- **Hasta 50 jugadores** por partida
- **1 a 5 cartones** por jugador
- **Diseño visual** inspirado en una sala de bingo real: madera, metálico, bolas con sombra
- **Responsive** — funciona en desktop y mobile
- **Reconexión automática** — si perdés la conexión, el estado se recupera

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS 3.4, Socket.io-client |
| **Backend** | Node.js, Express 4, Socket.io 4, TypeScript |
| **Estado** | In-memory (`Map<string, GameRoom>`) + Redis para eventos futuros |
| **Shared** | Tipos TypeScript compartidos entre frontend y backend |
| **Tests** | Vitest (backend), 23 tests para CardGenerator |
| **Monorepo** | npm workspaces |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Next.js 14)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐  │
│  │  Lobby      │  │  Game Page  │  │  Components                 │  │
│  │  (crear/    │  │  (rol-based │  │  BingoBoard, Card, Number   │  │
│  │   unirse)   │  │   rendering)│  │  Display, DispensadorCtrl   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────────┘  │
│         │                │                                          │
│         └────────────────┴──────────────────────────────────────────┤
│                              Socket.io (WebSocket)                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVIDOR (Express + Socket.io)               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │  REST API       │  │  Socket Handlers│  │  GameManager        │  │
│  │  POST /api/game │  │  createGame     │  │  (Map<gameId, Room>)│  │
│  │  GET  /api/game/:id│  joinGame    │  │                     │  │
│  │                 │  │  drawNumber     │  │  GameRoom           │  │
│  │  Health /api/health│  toggleLine  │  │  - drawnNumbers[]   │  │
│  │                 │  │  markCard       │  │  - players[]        │  │
│  │                 │  │  callLine       │  │  - line/bingo state │  │
│  │                 │  │  callBingo      │  │  - CardGenerator    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Redis (conexión lista para futuras mejoras de persistencia) │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Decisiones Técnicas

### 1. Sin autenticación
El juego está diseñado para sesiones rápidas y casuales. No hay usuarios, ni sesiones persistentes, ni base de datos de jugadores. El estado vive solo mientras dura la partida.

### 2. Estado en memoria (GameManager)
Las partidas se guardan en un `Map<string, GameRoom>` en memoria. Esto permite:
- Búsquedas O(1) por `gameId`
- Baja latencia en operaciones de juego
- Simplicidad para MVP

**Trade-off**: si el servidor se reinicia, las partidas activas se pierden. Redis está conectado pero no se usa todavía como store primario (preparado para futuro).

### 3. WebSocket como canal principal, REST como fallback
- **Socket.io**: todos los eventos del juego (crear, unirse, sacar número, marcar cartón, línea, bingo)
- **REST**: health check y polling de estado (usado para detectar si una partida terminó mientras el cliente estaba desconectado)

### 4. Colores determinísticos para cartones
Los cartones usan un color aleatorio **determinístico** (`cardId % colors.length`) para evitar _hydration mismatch_ entre servidor y cliente. Esto es crítico porque Next.js renderiza server-side y luego hidrata client-side.

### 5. Marcado client-side
El tache de números en los cartones es **puramente local** (optimistic update). El servidor valida los índices pero no persiste el estado de marcado. Esto reduce tráfico de red y complejidad, a costa de que si el jugador recarga la página, pierde los taches.

### 6. Generación de cartones "correct by construction"
El algoritmo de `CardGenerator` no genera cartones al azar y luego valida. En su lugar:
1. Genera un patrón booleano 9×3 válido (garantiza 15 números, 5 por fila)
2. Rellena cada columna con números de su década correspondiente
3. Ordena ascendentemente dentro de cada columna

Esto evita el patrón "generate-and-test" que puede fallar o ser lento.

### 7. Diseño visual 100% CSS
Todo el tema de "sala de bingo" (madera, metálico, bolas, sombras) se implementa con CSS puro y Tailwind. No hay imágenes, fuentes externas, ni assets. Esto garantiza:
- Carga instantánea
- Cero dependencias de CDN
- Fácil de mantener y modificar

### 8. Monorepo con `shared/`
Los tipos TypeScript (`GameState`, `Card`, `Player`, eventos Socket.io) viven en un paquete compartido importado por frontend y backend. Esto garantiza que el contrato de API nunca se desincronice.

---

## Instalación

### Requisitos previos

- Node.js 18+ y npm
- Redis 7+ (o Docker)

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd bingo
npm install
```

### 2. Levantar Redis

**Con Docker (recomendado):**
```bash
docker run -d -p 6379:6379 --name bingo-redis redis:7-alpine
```

**O si tenés Redis instalado:**
```bash
redis-server
```

### 3. Configurar variables de entorno

El backend usa variables por defecto que funcionan en local, pero podés crear un `.env` en `backend/`:

```env
PORT=3001
CORS_ORIGIN=http://localhost:3000
REDIS_URL=redis://localhost:6379
```

### 4. Levantar todo

```bash
# Desde la raíz — levanta frontend (puerto 3000) y backend (puerto 3001)
npm run dev
```

O por separado:
```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

### 5. Abrir en el navegador

- **App**: http://localhost:3000
- **API**: http://localhost:3001
- **Health**: http://localhost:3001/api/health

---

## Cómo jugar

1. **Crear partida**: En la landing, escribí tu nombre y hacé click en "Crear partida". Te convertís en el Dispensador.
2. **Compartir ID**: Copiá el ID de 6 caracteres y pasaselo a los jugadores.
3. **Unirse**: Los jugadores entran el ID, su nombre, y eligen cuántos cartones quieren (1-5).
4. **Jugar**:
   - **Dispensador**: hacé click en los números del 1 al 90 para "sacarlos". También podés cantar "Línea" o "Bingo".
   - **Jugador**: hacé click en los números de tus cartones para tacharlos. Cuando completés una línea o bingo, aparecerá una alerta para que la cantes.
5. **Fin de partida**: Cuando alguien canta bingo, la partida termina y aparece el ganador.

---

## Estructura del Proyecto

```
bingo/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Entry point: Express + Socket.io + Redis
│   │   ├── routes/
│   │   │   └── game.ts           # REST: POST /api/game, GET /api/game/:id
│   │   └── game/
│   │       ├── GameManager.ts    # Registro en memoria de partidas
│   │       ├── GameRoom.ts       # Estado de una partida individual
│   │       ├── handlers.ts       # Todos los handlers de Socket.io
│   │       ├── CardGenerator.ts  # Algoritmo de generación de cartones
│   │       └── CardGenerator.test.ts # Tests Vitest (23 tests)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Landing: crear/unirse a partida
│   │   ├── layout.tsx            # Layout global (fondo madera)
│   │   └── game/[gameId]/
│   │       └── page.tsx          # Pantalla de juego (rol-based)
│   ├── components/
│   │   ├── lobby-form.tsx        # Formulario de creación/unión
│   │   ├── bingo-board.tsx       # Tablero 1-90 del dispensador
│   │   ├── number-display.tsx    # Bolas de números salidos
│   │   ├── card.tsx              # Cartón de bingo (9×3)
│   │   ├── dispensador-controls.tsx # Botones Línea/Bingo
│   │   ├── alerts.tsx            # Alertas de Línea/Bingo
│   │   ├── game-end-modal.tsx    # Modal de fin de partida
│   │   └── game-id-display.tsx   # Placa del ID de partida
│   ├── hooks/
│   │   └── useSocket.ts          # Hook de conexión Socket.io
│   ├── lib/
│   │   └── card-color.ts         # Colores determinísticos de cartones
│   ├── types/
│   │   └── index.ts              # Re-export de shared/types
│   ├── tailwind.config.ts        # Tokens de color madera/metálico
│   ├── app/globals.css           # Utilidades CSS (texturas, bolas, hendiduras)
│   └── package.json
├── shared/
│   ├── types.ts                  # Tipos compartidos: GameState, Card, eventos Socket.io
│   └── index.ts                  # Re-exports
├── package.json                  # Workspaces: frontend, backend, shared
└── README.md                     # Este archivo
```

---

## API & Eventos

### REST Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/game` | Crear partida (`{ playerName }`) |
| `GET` | `/api/game/:id` | Estado de partida (polling fallback) |

### Socket.io Events (Client → Server)

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `createGame` | `{ playerName }` | Crear partida (te convierte en dispensador) |
| `joinGame` | `{ gameId, playerName, cardCount }` | Unirse a partida existente |
| `drawNumber` | `{ gameId, number }` | Sacar número (solo dispensador) |
| `toggleLine` | `{ gameId }` | Cantar/des-cantar línea |
| `toggleBingo` | `{ gameId }` | Cantar/des-cantar bingo |
| `markCard` | `{ gameId, cardIndex, cellIndex }` | Tachar casilla (client-side) |
| `callLine` | `{ gameId }` | Jugador canta línea |
| `callBingo` | `{ gameId }` | Jugador canta bingo |

### Socket.io Events (Server → Client)

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `gameCreated` | `{ gameId }` | Partida creada exitosamente |
| `gameJoined` | `{ game, playerId, cards }` | Unido a partida, recibís estado y cartones |
| `playerJoined` | `{ playerCount }` | Nuevo jugador se unió |
| `numberDrawn` | `{ number, drawnNumbers }` | Número sacado por el dispensador |
| `lineToggled` | `{ lineCalled }` | Estado de "línea" cambió |
| `bingoToggled` | `{ bingoCalled }` | Estado de "bingo" cambió |
| `cardMarked` | `{ cardIndex, cellIndex }` | Confirmación de tache (eco) |
| `gameEnded` | `{ winner, reason }` | Partida terminó |
| `error` | `{ code, message }` | Error |

---

## Scripts

```bash
# Raíz
npm run dev      # Levanta frontend + backend en paralelo
npm run build    # Build de todos los workspaces

# Backend
cd backend
npm run dev         # ts-node-dev con hot reload
npm run build       # Compila TypeScript a dist/
npm run start       # Ejecuta dist/index.js
npm run test        # Vitest una vez
npm run test:watch  # Vitest en modo watch

# Frontend
cd frontend
npm run dev     # Next.js dev server (puerto 3000)
npm run build   # Build de producción
npm run start   # Servidor de producción
```

---

## Tests

El backend tiene tests unitarios para `CardGenerator` con Vitest:

```bash
cd backend && npm run test
```

Cobertura:
- Validación de cartones generados (15 números, 5 por fila, 1-3 por columna)
- Rango de números por década
- Sin duplicados
- Orden ascendente dentro de columnas
- Patrones válidos (6 columnas con 2 números, 3 con 1)

---

## Roadmap / Ideas de mejora

1. **Docker Compose** — `docker-compose up` que levante Redis + backend + frontend
2. **Sonido** — efectos al sacar número, cantar línea/bingo, animación de bola cayendo
3. **Modo espectador** — entrar sin cartón para ver la partida
4. **Persistencia** — guardar historial de partidas en Redis/DB
5. **Tests e2e** — flujo completo: crear → unirse → jugar → ganar
6. **Animaciones** — transiciones de entrada para bolas, "stamp" al tachar
7. **Mobile refinado** — tablero 1-90 más compacto en pantallas chicas

---

## Licencia

MIT
