# Build from the repository root. Turbo prune retains the server and its workspace dependencies.
FROM node:22-alpine AS pruner

WORKDIR /app
COPY . .
RUN npm ci --ignore-scripts && npx turbo prune server --docker

FROM node:22-alpine AS builder

WORKDIR /app
COPY --from=pruner /app/out/json/ ./
RUN npm ci
COPY --from=pruner /app/out/full/ ./
RUN npm run build --workspace @patra/shared && npm run build --workspace server
RUN npm prune --omit=dev && mkdir -p apps/server/node_modules

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

USER node
EXPOSE 5001

CMD ["node", "apps/server/dist/index.js"]
