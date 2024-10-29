FROM node:22-alpine
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile && yarn cache clean
WORKDIR /workspaces/daigirin-template
