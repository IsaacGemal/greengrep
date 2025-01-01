import Redis from "ioredis";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is required");
}

const redis = new Redis(process.env.REDIS_URL);

// Short TTL for search results (5 minutes)
// As this platform grows, we'll want to cache longer, but for testing purposes it's fine if it's short
const SEARCH_RESULTS_TTL = 5 * 60;

// Long TTL for embeddings (1 week)
const EMBEDDING_TTL = 7 * 24 * 60 * 60;

// TTL for stats (1 hour)
const STATS_TTL = 60 * 60;

// Add a prefix based on the database URL to prevent cache collisions
const DB_PREFIX = process.env.DATABASE_URL
  ? Buffer.from(process.env.DATABASE_URL).toString("base64").slice(0, 10)
  : "local";

// Single, clean interface for search results
// We can always add more fields as needed
export interface SearchResult {
  url: string;
  is_nsfw: boolean;
  similarity: number;
}

// Cache functions for search results
export async function getCachedSearch(
  query: string
): Promise<SearchResult[] | null> {
  try {
    const cached = await redis.get(`${DB_PREFIX}:search:${query}`);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
}

export async function setCachedSearch(
  query: string,
  results: SearchResult[]
): Promise<void> {
  try {
    await redis.setex(
      `${DB_PREFIX}:search:${query}`,
      SEARCH_RESULTS_TTL,
      JSON.stringify(results)
    );
  } catch (error) {
    console.error("Redis set error:", error);
  }
}

// Cache functions for embeddings
export async function getCachedEmbedding(text: string) {
  try {
    const cached = await redis.get(`${DB_PREFIX}:embedding:${text}`);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
}

export async function setCachedEmbedding(text: string, embedding: number[]) {
  try {
    await redis.setex(
      `${DB_PREFIX}:embedding:${text}`,
      EMBEDDING_TTL,
      JSON.stringify(embedding)
    );
  } catch (error) {
    console.error("Redis set error:", error);
  }
}

// Cache functions for stats
export async function getCachedStats(): Promise<number | null> {
  try {
    const cached = await redis.get(`${DB_PREFIX}:stats:total_posts`);
    return cached ? parseInt(cached) : null;
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
}

export async function setCachedStats(count: number): Promise<void> {
  try {
    await redis.setex(
      `${DB_PREFIX}:stats:total_posts`,
      STATS_TTL,
      count.toString()
    );
  } catch (error) {
    console.error("Redis set error:", error);
  }
}
