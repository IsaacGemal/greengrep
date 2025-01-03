# Build stage
FROM oven/bun:1 AS build

WORKDIR /app

# Copy package files
COPY package.json .
COPY bun.lockb .

# Copy Drizzle files
COPY drizzle/ drizzle/
COPY drizzle.config.ts .

# Install dependencies
RUN bun install

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

# Copy built executable and necessary files
COPY --from=build /app/dist/server ./server
COPY --from=build /app/drizzle ./drizzle

# Environment variables needed at runtime
ENV NODE_ENV=production
ENV PORT=3001

# Expose the port
EXPOSE 3001

# Run the server
CMD ["./server"] 