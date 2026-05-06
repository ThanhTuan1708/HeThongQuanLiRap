FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY app.js seed.js syncMovies.js syncCinemaPromotion.js ./
COPY config ./config
COPY controllers ./controllers
COPY middleware ./middleware
COPY models ./models
COPY public ./public
COPY routes ./routes
COPY utils ./utils

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
