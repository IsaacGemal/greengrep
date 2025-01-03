import { config } from "dotenv";
import { join } from "path";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

// Update the dotenv import to look in the parent directory
config({ path: join(__dirname, "../.env") });

async function testDrizzle() {
  // Log the connection string (remove sensitive info)
  const connectionString = process.env.DATABASE_URL;
  console.log(
    "📝 Connection string:",
    connectionString?.replace(/:[^@]*@/, ":***@")
  );

  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in environment variables!");
  }

  const client = new Client({
    connectionString,
  });

  try {
    console.log("🔌 Connecting to database...");
    await client.connect();
    console.log("✅ Connected successfully!");

    const db = drizzle(client, { schema });

    // Test basic query
    console.log("\n🔍 Testing basic query...");
    const firstPost = await db.query.posts.findFirst();
    console.log("Found post:", {
      id: firstPost?.id,
      postId: firstPost?.postId,
      board: firstPost?.board,
      timestamp: firstPost?.timestamp,
    });

    // Test count
    console.log("\n📊 Testing counts...");
    const postCount = await db.select().from(schema.posts).execute();
    const contentCount = await db.select().from(schema.content).execute();
    const imageCount = await db.select().from(schema.images).execute();

    console.log("Total counts:", {
      posts: postCount.length,
      content: contentCount.length,
      images: imageCount.length,
    });

    // Test relationships and arrays
    console.log("\n🔗 Testing relationships and array fields...");
    const postsWithContent = await db
      .select({
        postId: schema.posts.postId,
        contentId: schema.posts.contentId,
        greentext: schema.content.greentext,
        text: schema.content.text,
      })
      .from(schema.posts)
      .leftJoin(schema.content, eq(schema.posts.contentId, schema.content.id))
      .limit(5);

    console.log("Sample of 5 posts with their content:");
    postsWithContent.forEach((post) => {
      console.log({
        postId: post.postId,
        hasContent: !!post.contentId,
        greentextCount: post.greentext?.length ?? 0,
        textCount: post.text?.length ?? 0,
      });
    });
  } catch (error: unknown) {
    console.error("❌ Test failed:", error);
    // Type guard for PostgreSQL connection errors
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ECONNREFUSED"
    ) {
      console.log("\n🔍 Troubleshooting tips:");
      console.log("1. Check if your database container is running");
      console.log("2. Verify DATABASE_URL in your .env file");
      console.log("3. Make sure the port matches your Docker setup");
      console.log("\nTry running: docker compose up -d");
    }
  } finally {
    try {
      await client.end();
    } catch (e) {
      // Ignore close errors
    }
  }
}

// Run the test
console.log("🚀 Starting Drizzle test...");
testDrizzle()
  .then(() => {
    console.log("\n✅ Test complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
