FROM oven/bun:1 AS base
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Copy source
COPY src/ src/
COPY tsconfig.json ./

ENV PORT=3000
EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
