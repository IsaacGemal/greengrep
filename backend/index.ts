import { Elysia, error, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { S3, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import { analyzeImage } from "./services/claudeService";
import { storeAnalysis } from "./services/dbService";
import { generateSearchEmbedding } from "./services/openaiService";
import searchPosts from "./services/dbService";
import { swagger } from "@elysiajs/swagger";
import {
  getCachedSearch,
  setCachedSearch,
  type SearchResult,
} from "./services/redisService";
import { getRandomPosts } from "./services/dbService";
import { findSimilarItems } from "./services/duplicateService";

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

const app = new Elysia()
  .use(swagger())
  .use(cors())
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
      const duplicates = await findSimilarItems(analysis);

      // Store the analysis in the database
      const storedPosts = await storeAnalysis(analysis);

      return {
        message: "File uploaded and analyzed successfully",
        fileUrl,
        analysis,
        storedPosts,
        duplicates,
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

// Vector similarity search
app.get(
  "/api/vector-search",
  async ({ query, error }) => {
    const searchQuery = query.q;
    if (!searchQuery) {
      return error(400, { error: "Search query is required" });
    }

    try {
      // Check cache first
      const cachedResults = await getCachedSearch(searchQuery);
      if (cachedResults) {
        console.log("Cache hit for query:", searchQuery);
        return {
          query: searchQuery,
          results: cachedResults as SearchResult[],
          cached: true,
        };
      }

      console.log("Cache miss for query:", searchQuery);
      // If not in cache, perform the search
      const embedding = await generateSearchEmbedding(searchQuery);
      const results = (await searchPosts(embedding)) as SearchResult[];

      // Cache the results
      await setCachedSearch(searchQuery, results);

      return {
        query: searchQuery,
        results,
        cached: false,
      };
    } catch (err) {
      console.error("Vector search error:", err);
      return error(500, { error: "Search failed" });
    }
  },
  {
    // Add query parameter definition for Swagger
    query: t.Object({
      q: t.String({
        description: "Search query term",
        required: true,
      }),
    }),
  }
);

// Add this new endpoint
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
    detail: {
      summary: "Get random posts",
      description: "Returns 1000 random posts with their URLs and NSFW status",
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
