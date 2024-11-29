import express from "express";
import cors from "cors";
import { S3 } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import { analyzeImage } from "./services/claudeService";

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
  logger: console,
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
    const objects = await s3.listObjects({ Bucket: BUCKET_NAME });

    const files =
      objects.Contents?.map((object) => ({
        key: object.Key,
        lastModified: object.LastModified,
        size: object.Size,
        url: `https://${BUCKET_NAME}.s3.amazonaws.com/${object.Key}`,
      })) || [];

    res.json({ files });
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
    const fileUrl = s3File.location; // S3 URL of the uploaded file

    // Analyze the image using Claude
    const analysis = await analyzeImage(
      fileUrl,
      s3File.originalname,
      s3File.size.toString(),
      s3File.mimetype
    );

    res.json({
      message: "File uploaded and analyzed successfully",
      fileUrl,
      analysis,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to upload file",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

console.log("Hello from Bun!");
