# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Install deps first (better Docker layer caching)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source + config and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Run stage ----
FROM node:20-alpine
WORKDIR /app

# Install only production deps
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy compiled output
COPY --from=build /app/dist ./dist

# Cloud Run uses PORT env var (it will inject it)
ENV PORT=8080
EXPOSE 8080

# Start server
CMD ["node", "dist/server.js"]
