# Build context must be the repo root: docker build -f apps/api/Dockerfile .
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/db/package.json ./packages/db/package.json
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build:db
RUN npm run build -w apps/api

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app ./
EXPOSE 4000
CMD ["sh", "-c", "cd packages/db && npx prisma migrate deploy && cd /app && node apps/api/dist/main.js"]
