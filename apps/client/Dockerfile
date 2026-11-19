FROM node:20-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy lockfile and package manifests
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/client/package.json ./apps/client/

# Install dependencies with frozen lockfile
RUN npm ci

# Copy sources
COPY packages/shared ./packages/shared
COPY apps/client ./apps/client

# Build shared and client (standalone)
RUN npm run build --workspace=@patra/shared
RUN npm run build --workspace=client

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Copy Next.js standalone build output and static assets
COPY --chown=node:node --from=builder /app/apps/client/.next/standalone ./
COPY --chown=node:node --from=builder /app/apps/client/.next/static ./apps/client/.next/static
COPY --chown=node:node --from=builder /app/apps/client/public ./apps/client/public

USER node

EXPOSE 3000

CMD ["node", "apps/client/server.js"]
