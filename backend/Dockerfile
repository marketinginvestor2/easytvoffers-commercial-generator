# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files (package-lock.json will be included if it exists)
COPY package*.json ./

# Use npm ci if lockfile exists, otherwise npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Run stage ----
FROM node:20-alpine
WORKDIR /app

COPY --from=build /app/package*.json ./

# Install prod deps (ci if lockfile exists)
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY --from=build /app/dist ./dist

ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/server.js"]
