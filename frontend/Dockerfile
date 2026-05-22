# Frontend Dockerfile - Monorepo workspace build
FROM node:20-slim

WORKDIR /app

# Copy root and workspace package files for layer caching
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
COPY shared/package*.json ./shared/

# Install dependencies for all workspaces
RUN npm ci

# Copy source code
COPY . .

# Build shared package first (required by frontend types)
RUN npm run build --workspace=shared

WORKDIR /app/frontend

EXPOSE 3000

# These are baked at build time for Next.js production builds,
# but for dev mode they are read at runtime by the dev server.
ENV NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

CMD ["npm", "run", "dev"]
