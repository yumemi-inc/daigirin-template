FROM node:24-alpine
COPY package.json yarn.lock ./
RUN yarn install --immutable && yarn cache clean
WORKDIR /workspaces/daigirin-template
