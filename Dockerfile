FROM ghcr.io/vivliostyle/cli:latest
WORKDIR /src

COPY package.json package-lock.json ./
RUN npm ci
