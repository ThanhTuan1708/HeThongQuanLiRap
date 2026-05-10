FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL=http://127.0.0.1:3000/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm ci

COPY index.html vite.config.js serve-dist.js ./
COPY public ./public
COPY src ./src

RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/serve-dist.js ./serve-dist.js

ENV FRONTEND_PORT=5173
EXPOSE 5173

CMD ["node", "serve-dist.js"]
