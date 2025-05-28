FROM node:20-alpine

WORKDIR /app

# ⚠️ Solo copiamos los archivos de dependencias
COPY package.json pnpm-lock.yaml ./

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install

# 👇 Luego copiamos el resto
COPY . .

RUN pnpm run build

EXPOSE 5173
CMD ["pnpm", "preview", "--host", "--port", "5173"]

