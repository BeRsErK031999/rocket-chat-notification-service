FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM dependencies AS build

COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
COPY test ./test
COPY eslint.config.js prettier.config.cjs ./
RUN yarn build && cp -r dist/src/* dist/ && rm -rf dist/src dist/test dist/scripts

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean

COPY --from=build /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/server.js"]
