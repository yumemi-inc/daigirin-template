FROM node:20-alpine
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile && yarn cache clean
WORKDIR /workspaces/daigirin-template
