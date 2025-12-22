# ---- Build stage ----
FROM node:20-slim AS build
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build TS -> dist
RUN npm run build

# ---- Run stage ----
FROM node:20-slim
WORKDIR /app

ENV NODE_ENV=production

# Copy only what's needed
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

# Cloud Run listens on PORT
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server.js"]
