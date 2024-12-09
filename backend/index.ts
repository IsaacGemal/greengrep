import express from "express";
import cors from "cors";
import { S3, ListObjectsV2Command } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import { analyzeImage } from "./services/claudeService";
import { storeAnalysis } from "./services/dbService";
import { generateSearchEmbedding } from "./services/openaiService";
import searchPosts from "./services/dbService";

interface SearchResult {
  id: string;
  analysis: string;
  similarity: number;
  created_at: Date;
}

const app = express();
const PORT = process.env.PORT || 3001;

// Apply CORS middleware
app.use(cors());

// Body parser middleware (JSON)
app.use(express.json());

// Initialize S3 client
const s3 = new S3({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  // logger: console,
});

const BUCKET_NAME = "greengrep";

// Health check endpoint
// Example usage
// curl -X GET http://localhost:3001/api/health
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// List all files in bucket
// Example usage
// curl -X GET http://localhost:3001/api/files
app.get("/api/files", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string;

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: limit,
      ContinuationToken: cursor || undefined,
    });

    const response = await s3.send(command);

    const files =
      response.Contents?.map((object) => ({
        key: object.Key,
        lastModified: object.LastModified,
        size: object.Size,
        url: `https://${BUCKET_NAME}.s3.amazonaws.com/${object.Key}`,
      })) || [];

    res.json({
      files,
      nextCursor: response.NextContinuationToken,
      hasMore: response.IsTruncated,
    });
  } catch (error) {
    console.error("List files error:", error);
    res.status(500).json({ error: "Failed to list files" });
  }
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      // Use the original file name or generate a unique one
      const fileName = `${Date.now().toString()}-${file.originalname}`;
      cb(null, fileName);
    },
  }),
  fileFilter: (req, file, cb) => {
    // Accept only jpg, jpeg, and png files
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Only JPG and PNG files are allowed"));
    }
  },
});

// Upload file endpoint
// Example usage:
// curl -X POST -F "file=@/path/to/your/file.jpg" http://localhost:3001/api/upload
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error("No file uploaded");
    }

    const s3File = req.file as Express.MulterS3.File;
    const fileUrl = s3File.location;

    // Analyze the image using Claude
    const analysis = await analyzeImage(
      fileUrl,
      s3File.originalname,
      s3File.size.toString(),
      s3File.mimetype
    );

    // Store the analysis in the database
    const storedPosts = await storeAnalysis(analysis);

    res.json({
      message: "File uploaded and analyzed successfully",
      fileUrl,
      analysis,
      storedPosts,
    });
  } catch (error: Error | unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to upload file";
    console.error("Upload error:", error);
    res.status(500).json({
      error: errorMessage,
    });
  }
});

// Search endpoint
// We will keep the original one for later
app.get("/api/search", (async (req: express.Request, res: express.Response) => {
  try {
    const searchQuery = req.query.q as string;
    if (!searchQuery) {
      return res.status(400).json({ error: "Search query is required" });
    }
    const searchEmbedding = await generateSearchEmbedding(searchQuery);

    // Log first 5 numbers of the embedding
    console.log("First 5 embedding values:", searchEmbedding.slice(0, 5));

    res.json({
      query: searchQuery,
      embedding: searchEmbedding,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to generate search embedding" });
  }
}) as express.RequestHandler<
  Record<string, never>,
  { query: string; embedding: number[] } | { error: string },
  never,
  { q: string }
>);

// Add new endpoint for vector similarity search
// Don't want to mess up the original one for now
app.get("/api/vector-search", (async (
  req: express.Request,
  res: express.Response
) => {
  const { q: searchQuery } = req.query;

  if (!searchQuery || typeof searchQuery !== "string") {
    return res.status(400).json({
      error: "Search query is required",
    });
  }

  try {
    const embedding = await generateSearchEmbedding(searchQuery);
    const results = await searchPosts(embedding);

    res.json({
      query: searchQuery,
      results,
    });
  } catch (error: Error | unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Search failed";
    console.error("Vector search error:", error);
    res.status(500).json({
      error: errorMessage,
    });
  }
}) as express.RequestHandler<
  Record<string, never>,
  | { query: string; results: SearchResult[]; embedding: number[] }
  | { error: string },
  never,
  { q: string }
>);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

console.log("Hello from Bun!");
