FROM oven/bun:1-alpine AS deps
WORKDIR /app

# Install only production dependencies for a smaller runtime image.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock tsconfig.json cordo.config.ts ./
COPY src ./src

CMD ["bun", "run", "./src/index.ts"]