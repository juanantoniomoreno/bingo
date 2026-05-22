# Backend Dockerfile - Monorepo workspace build
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

# Build shared package first (required by backend)
RUN npm run build --workspace=shared

WORKDIR /app/backend

EXPOSE 3001

ENV PORT=3001
ENV REDIS_URL=redis://redis:6379
ENV CORS_ORIGIN=http://localhost:3000

CMD ["npm", "run", "dev"]
