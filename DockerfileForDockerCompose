FROM node:20-alpine
WORKDIR /workspaces/daigirin-template

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile && yarn cache clean
