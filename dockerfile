FROM node:20.10-alpine

RUN mkdir -p /app
WORKDIR /app
COPY package.json .

CMD ["npm", "start"]