import type { ImageAnalysis } from "./types";
import { generateEmbeddings } from "./openaiService";
import { sql } from "drizzle-orm";
import { db } from "../drizzle/db";
import { content, images, posts } from "../drizzle/schema";
import { v4 as uuidv4 } from "uuid";
import type { SearchResult } from "./redisService";

// Updated function with explicit return type
export default async function searchPosts(
  searchEmbedding: number[]
): Promise<SearchResult[]> {
  try {
    const query = sql.raw(`
      SELECT 
        p.url,
        p.is_nsfw,
        1 - (c.embedding::vector <#> ARRAY[${searchEmbedding.join(", ")}]::vector) as similarity
      FROM "Content" c
      JOIN "Post" p ON p."contentId" = c.id
      WHERE (c.embedding::vector <#> ARRAY[${searchEmbedding.join(", ")}]::vector) < 0.3
      ORDER BY similarity DESC
      LIMIT 20
    `);

    const results = await db.execute(query);
    return results.rows.map((row) => ({
      url: row.url as string,
      is_nsfw: row.is_nsfw as boolean,
      similarity: row.similarity as number,
    }));
  } catch (error) {
    console.error("Search error:", error);
    throw new Error("Failed to perform vector search");
  }
}

// New - using drizzle instead of prisma
export async function getRandomPosts(
  limit: number = 100
): Promise<{ url: string; is_nsfw: boolean }[]> {
  try {
    const results = await db
      .select({
        url: sql<string>`"Post".url`,
        is_nsfw: sql<boolean>`"Post"."is_nsfw"`,
      })
      .from(sql`"Post"`)
      .where(sql`"Post".url IS NOT NULL`)
      .orderBy(sql`RANDOM()`)
      .limit(limit);

    // Type conversion to match the expected return type
    return results.map((post) => ({
      url: post.url ?? "",
      is_nsfw: post.is_nsfw ?? false,
    }));
  } catch (error) {
    console.error("Random posts error:", error);
    throw new Error("Failed to fetch random posts");
  }
}

export async function searchPostsPaginated(
  searchEmbedding: number[],
  limit: number = 20,
  offset: number = 0
) {
  try {
    const query = sql.raw(`
      SELECT 
        p.url,
        p.is_nsfw,
        1 - (c.embedding::vector <#> ARRAY[${searchEmbedding.join(", ")}]::vector) as similarity
      FROM "Content" c
      JOIN "Post" p ON p."contentId" = c.id
      WHERE (c.embedding::vector <#> ARRAY[${searchEmbedding.join(", ")}]::vector) < 0.3
      AND p.url IS NOT NULL
      ORDER BY similarity DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    const results = await db.execute(query);
    return results.rows;
  } catch (error) {
    console.error("Paginated search error:", error);
    throw new Error("Failed to perform paginated vector search");
  }
}

// New - using drizzle instead of prisma
export async function storeAnalysis(analysis: ImageAnalysis) {
  const embeddings = await generateEmbeddings(analysis);

  const results = await Promise.allSettled(
    analysis.posts.map(async (post, index) => {
      try {
        // Generate UUIDs for our records
        const contentId = uuidv4();
        const imageId = post.embedded_image ? uuidv4() : null;
        const postId = uuidv4();

        // Insert content first
        const [insertedContent] = await db
          .insert(content)
          .values({
            id: contentId,
            greentext: post.content.greentext,
            text: post.content.text,
            embedding: embeddings[index].embedding,
          })
          .returning();

        // Insert image if it exists
        let insertedImage = null;
        if (post.embedded_image && imageId) {
          [insertedImage] = await db
            .insert(images)
            .values({
              id: imageId,
              filename: post.embedded_image.filename,
              size: post.embedded_image.size,
              format: post.embedded_image.format,
              dimensions: post.embedded_image.dimensions,
              description: post.embedded_image.description,
            })
            .returning();
        }

        // Insert post
        const [insertedPost] = await db
          .insert(posts)
          .values({
            id: postId,
            postId: post.post_id || null,
            board: post.board,
            timestamp: new Date(post.timestamp),
            poster: post.poster || "Anonymous",
            isNsfw: post.is_nsfw || false,
            url: post.url,
            contentId: contentId,
            imageId: imageId,
          })
          .returning();

        // Manually combine the results
        return {
          ...insertedPost,
          content: insertedContent,
          image: insertedImage,
        };
      } catch (error) {
        console.error(`Failed to store post: ${error}`);
        throw error;
      }
    })
  );

  return results
    .filter(
      (result): result is PromiseFulfilledResult<any> =>
        result.status === "fulfilled"
    )
    .map((result) => result.value);
}
