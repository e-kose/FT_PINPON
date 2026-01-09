FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3005

CMD ["sh", "-c", "npm run migration && npm run start"]
