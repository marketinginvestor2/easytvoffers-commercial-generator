# ---- Build stage ----
FROM node:20-slim AS build
WORKDIR /app

# Install deps (no lockfile required)
COPY package.json ./
RUN npm install

# Copy source
COPY . .

# Build TS -> dist
RUN npm run build

# ---- Run stage ----
FROM node:20-slim
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy only what's needed
COPY --from=build /app/package.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 8080
CMD ["node", "dist/server.js"]
