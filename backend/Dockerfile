# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files (package-lock.json will be included if it exists)
COPY package*.json ./

# If lockfile exists use npm ci, otherwise fallback to npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Run stage ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy package files again for prod install
COPY package*.json ./

# Install prod deps (ci if lockfile exists)
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copy compiled output from build stage
COPY --from=build /app/dist ./dist

# Cloud Run will inject PORT, but we can keep default
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server.js"]
