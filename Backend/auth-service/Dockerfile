FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build


EXPOSE 3001

CMD ["sh", "-c", "npm run migration && npm run start"]