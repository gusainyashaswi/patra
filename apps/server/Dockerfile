FROM node:20-alpine AS builder

WORKDIR /app

# Copy lockfile and package manifests
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/

# Install all dependencies with frozen lockfile
RUN npm ci

# Copy sources
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

# Compile shared and server
RUN npm run build --workspace=@patra/shared
RUN npm run build --workspace=server

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy lockfile and package manifests for production install
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/

# Install production dependencies only using workspace-aware npm ci
RUN npm ci --omit=dev

# Copy compiled outputs
COPY --chown=node:node --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --chown=node:node --from=builder /app/apps/server/dist ./apps/server/dist

USER node

EXPOSE 4000

CMD ["node", "apps/server/dist/index.js"]
