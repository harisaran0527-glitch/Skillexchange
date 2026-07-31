# ─── Production Dockerfile for SkillExchange (Back4App Containers) ─────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and package configuration files
COPY package.json package-lock.json* ./
COPY Backend/package.json Backend/package-lock.json* ./Backend/
COPY Backend/frontend/package.json Backend/frontend/package-lock.json* ./Backend/frontend/

# Install dependencies for root, backend, and frontend
RUN npm install --legacy-peer-deps
RUN cd Backend && npm install --legacy-peer-deps
RUN cd Backend/frontend && npm install --legacy-peer-deps

# Copy application source code
COPY . .

# Build Vite React Frontend into ./dist and Backend/frontend/dist
RUN npm run build

# ─── Production Runtime ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5005
ENV HOST=0.0.0.0

COPY --from=builder /app ./

EXPOSE 5005

CMD ["node", "Backend/server.js"]
