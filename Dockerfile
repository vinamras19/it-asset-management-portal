FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app

# 1. Setup Backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# 2. Copy Backend Source
COPY backend/ ./backend/

# 3. Copy Frontend Build to the exact path server.js expects
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# 4. Environment Configuration
ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /app/backend

EXPOSE 5000

CMD ["node", "server.js"]