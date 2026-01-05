FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json nx.json tsconfig.base.json ./

RUN npm ci --silent --no-progress

COPY . .

ENV NX_DAEMON=false
ENV NPM_CONFIG_LOGLEVEL=error

EXPOSE 3000

CMD ["npx", "nx", "serve", "api"]
