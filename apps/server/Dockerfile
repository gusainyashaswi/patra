FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/client/package.json apps/client/package.json
RUN npm ci --ignore-scripts
COPY apps/server apps/server
RUN npm run build --workspace=server && npm prune --omit=dev --workspace=server
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/server/package.json ./apps/server/package.json
COPY --from=build /app/apps/server/dist ./apps/server/dist
USER node
EXPOSE 5001
CMD ["node", "apps/server/dist/index.js"]
