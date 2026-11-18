FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/client/package.json apps/client/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --ignore-scripts
COPY apps/client apps/client
COPY packages/shared packages/shared
RUN npm run build --workspace=@patra/shared
ARG NEXT_PUBLIC_API_URL=http://localhost:5001/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build --workspace=client
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/client ./apps/client
COPY --from=build /app/packages/shared ./packages/shared
USER node
EXPOSE 3000
CMD ["npm", "start", "--workspace=client", "--", "--hostname", "0.0.0.0"]
