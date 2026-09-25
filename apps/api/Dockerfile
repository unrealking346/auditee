FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN npm install && npm run build --workspace packages/shared && npm run build --workspace apps/api
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/api ./apps/api
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node","dist/server.js"]
