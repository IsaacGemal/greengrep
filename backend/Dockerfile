# Build stage
FROM oven/bun:1 AS build

WORKDIR /app

# Keep OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Copy package files
COPY package.json .
COPY bun.lockb .

# Copy both Prisma and Drizzle files
COPY prisma/ prisma/
COPY drizzle/ drizzle/
COPY drizzle.config.ts .

# Install dependencies
RUN bun install

# Generate Prisma client
RUN bunx prisma generate

# Copy source files
COPY . .

# Build the application
RUN bun build \
    --compile \
    --minify \
    --target bun \
    --outfile dist/server \
    ./index.ts

# Production stage
FROM oven/bun:1-slim

WORKDIR /app

# Keep OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Copy built executable and necessary files
COPY --from=build /app/dist/server ./server
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/drizzle ./drizzle

# Environment variables needed at runtime
ENV NODE_ENV=production
ENV PORT=3001

# Expose the port
EXPOSE 3001

# Run the server
CMD ["./server"] 