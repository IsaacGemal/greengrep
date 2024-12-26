import { Elysia, error, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { rateLimit } from "elysia-rate-limit";
import {
  S3,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { analyzeImage } from "./services/claudeService";
import { storeAnalysis } from "./services/dbService";
import { generateSearchEmbedding } from "./services/openaiService";
import searchPosts, { searchPostsPaginated } from "./services/dbService";
import { swagger } from "@elysiajs/swagger";
import {
  getCachedSearch,
  getCachedStats,
  setCachedSearch,
  setCachedStats,
  type SearchResult,
} from "./services/redisService";
import { getRandomPosts } from "./services/dbService";
import { findSimilarItems } from "./services/duplicateService";
import { PrismaClient } from "@prisma/client";

const BUCKET_NAME = process.env.BUCKET_NAME || "greengrep";
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || "";
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || "";

const s3 = new S3({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const prisma = new PrismaClient();

const PROD_URL = "https://greengrep-production.up.railway.app";
const DEV_URL = "http://localhost:3001";

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "Greengrep API",
          version: "1.0.0",
        },
        servers: [
          {
            url: PROD_URL,
            description: "Production server (Railway)",
          },
          {
            url: DEV_URL,
            description: "Local development server",
          },
        ],
      },
    })
  )
  .use(cors())
  .use(
    rateLimit({
      duration: 60000, // 1 minute in milliseconds
      max: 500, // 500 requests per minute will not be a problem
      generator: (request) => {
        // Use IP address as identifier for rate limiting
        return request.headers.get("x-forwarded-for") || "unknown";
      },
    })
  )
  // Global error handler: log the error and respond with a generic message
  .onError(({ error }) => {
    console.error("Server error:", error);
    return { error: "Internal Server Error" };
  });

// List all files in S3 bucket
app.get("/api/files", async ({ query, error }) => {
  try {
    const limit = parseInt(query.limit ?? "20", 10);
    const cursor = query.cursor;

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: limit,
      ContinuationToken: cursor || undefined,
    });

    const response = await s3.send(command);
    const files = (response.Contents || []).map(
      ({ Key, LastModified, Size }) => ({
        key: Key,
        lastModified: LastModified,
        size: Size,
        url: `https://${BUCKET_NAME}.s3.amazonaws.com/${Key}`,
      })
    );

    return {
      files,
      nextCursor: response.NextContinuationToken,
      hasMore: response.IsTruncated,
    };
  } catch (err) {
    console.error("List files error:", err);
    return error(500, { error: "Failed to list files" });
  }
});

// Upload file endpoint
// Client should POST with multipart/form-data, field "file"
app.post(
  "/api/upload",
  async ({ body, error }) => {
    const { file } = body as { file: File };

    if (!file) {
      return error(400, { error: "No file uploaded" });
    }

    const uniqueFileName = `${Date.now()}-${file.name}`;

    try {
      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload file to S3
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: uniqueFileName,
          Body: buffer,
          ContentType: file.type || "application/octet-stream",
        })
      );

      const fileUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${uniqueFileName}`;

      // Analyze the image using Claude
      const analysis = await analyzeImage(
        fileUrl,
        file.name,
        file.size.toString(),
        file.type
      );

      // Check for duplicates using the analysis object directly
      const { isDuplicate, similarItems } = await findSimilarItems(analysis);

      if (isDuplicate) {
        // Delete the file from S3
        await s3.send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: uniqueFileName,
          })
        );

        return error(409, {
          error: "Duplicate content detected",
          similarItems,
        });
      }

      // If not a duplicate, proceed with storing the analysis
      const storedPosts = await storeAnalysis(analysis);

      return {
        message: "File uploaded and analyzed successfully",
        fileUrl,
        analysis,
        storedPosts,
        similarItems,
      };
    } catch (err) {
      console.error("Upload error:", err);
      return error(500, { error: "Failed to upload file" });
    }
  },
  {
    // Validation schema
    body: t.Object({
      file: t.File({
        type: ["image/jpeg", "image/png", "image/webp"], // Added WebP support
        maxSize: "5m",
      }),
    }),
  }
);

// Vector similarity search (without pagination)
app.get(
  "/api/vector-search",
  async ({ query, set }) => {
    // Check cache first
    const cachedResults = await getCachedSearch(query.q);
    if (cachedResults) {
      console.log("Cache hit for query:", query.q);
      return {
        query: query.q,
        results: cachedResults as SearchResult[],
        cached: true,
      };
    }

    console.log("Cache miss for query:", query.q);
    const embedding = await generateSearchEmbedding(query.q);
    const results = (await searchPosts(embedding)) as SearchResult[];

    // Cache the results
    await setCachedSearch(query.q, results);

    // Add rate limit headers
    set.headers["X-RateLimit-Remaining"] = set.headers["x-ratelimit-remaining"];
    set.headers["X-RateLimit-Reset"] = set.headers["x-ratelimit-reset"];

    return {
      query: query.q,
      results,
      cached: false,
    };
  },
  {
    query: t.Object({
      q: t.String({
        description: "Search query term",
        required: true,
      }),
    }),
  }
);

// Experimental paginated vector search
app.get(
  "/api/vector-search-paginated",
  async ({ query, set }) => {
    const page = query.page ?? "1";
    const limit = query.limit ?? "20";
    const offset = (Number(page) - 1) * Number(limit);
    const cacheKey = `${query.q}:${page}:${limit}`;

    // Check cache first with pagination params
    const cachedResults = await getCachedSearch(cacheKey);
    if (cachedResults) {
      console.log("Cache hit for paginated query:", cacheKey);
      return {
        query: query.q,
        results: cachedResults as SearchResult[],
        page,
        limit,
        cached: true,
      };
    }

    console.log("Cache miss for paginated query:", cacheKey);
    const embedding = await generateSearchEmbedding(query.q);
    const results = (await searchPostsPaginated(
      embedding,
      Number(limit),
      offset
    )) as SearchResult[];

    await setCachedSearch(cacheKey, results);

    set.headers["X-RateLimit-Remaining"] = set.headers["x-ratelimit-remaining"];
    set.headers["X-RateLimit-Reset"] = set.headers["x-ratelimit-reset"];

    return {
      query: query.q,
      results,
      page,
      limit,
      cached: false,
    };
  },
  {
    query: t.Object({
      q: t.String({
        description: "Search query term",
        required: true,
      }),
      page: t.Optional(
        t.Number({
          description: "Page number (starts from 1)",
          default: 1,
          minimum: 1,
        })
      ),
      limit: t.Optional(
        t.Number({
          description: "Number of results per page",
          default: 20,
          minimum: 1,
          maximum: 100,
        })
      ),
    }),
  }
);

// Random posts
app.get(
  "/api/random",
  async () => {
    try {
      const results = await getRandomPosts();
      return {
        results,
        count: results.length,
      };
    } catch (err) {
      console.error("Random posts error:", err);
      return error(500, { error: "Failed to fetch random posts" });
    }
  },
  {
    // Add response schema for Swagger
    // This isn't really needed, but I'm enjoying learning about TypeBox
    // And having really clean documentation is a nice touch
    response: {
      200: t.Object({
        results: t.Array(
          t.Object({
            url: t.String(),
            is_nsfw: t.Boolean(),
          })
        ),
        count: t.Number(),
      }),
      500: t.Object({
        error: t.String(),
      }),
    },
  }
);

// Simple post count with Redis caching
app.get(
  "/api/stats",
  async () => {
    try {
      // Try to get cached count first
      const cachedCount = await getCachedStats();
      if (cachedCount !== null) {
        return {
          totalImages: cachedCount,
          cached: true,
        };
      }

      // If no cache, get count from DB
      const count = await prisma.post.count();

      // Cache the result
      await setCachedStats(count);

      return {
        totalImages: count,
        cached: false,
      };
    } catch (err) {
      console.error("Stats error:", err);
      return error(500, { error: "Failed to fetch stats" });
    }
  },
  {
    // Add response schema for Swagger
    response: {
      200: t.Object({
        totalImages: t.Number(),
        cached: t.Boolean(),
      }),
      500: t.Object({
        error: t.String(),
      }),
    },
  }
);

app.listen(
  {
    port: process.env.PORT || 3000,
  },
  () => {
    console.log(`🦊 Server is running on port ${process.env.PORT || 3000}`);
    console.log("DB:", process.env.DATABASE_URL);
    console.log("REDIS:", process.env.REDIS_URL);
  }
);
