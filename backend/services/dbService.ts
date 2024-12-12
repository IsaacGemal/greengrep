import { PrismaClient } from "@prisma/client";
import type { Post, Content, Image } from "@prisma/client";
import type { ImageAnalysis } from "./types";
import { generateEmbeddings } from "./openaiService";

const prisma = new PrismaClient();

export async function storeAnalysis(analysis: ImageAnalysis) {
  const embeddings = await generateEmbeddings(analysis);

  const posts = await Promise.allSettled(
    analysis.posts.map(async (post, index) => {
      try {
        const content = await prisma.content.create({
          data: {
            greentext: post.content.greentext,
            text: post.content.text,
            embedding: embeddings[index].embedding,
          },
        });

        // Create Image if it exists
        let image = null;
        if (post.embedded_image) {
          image = await prisma.image.create({
            data: {
              filename: post.embedded_image.filename,
              size: post.embedded_image.size,
              format: post.embedded_image.format,
              dimensions: post.embedded_image.dimensions,
              description: post.embedded_image.description,
            },
          });
        }

        // Create the Post with optional post_id
        return await prisma.post.create({
          data: {
            post_id: post.post_id || null,
            board: post.board,
            timestamp: new Date(post.timestamp),
            poster: post.poster || "Anonymous",
            is_nsfw: post.is_nsfw || false,
            url: post.url,
            content: {
              connect: { id: content.id },
            },
            image: image
              ? {
                  connect: { id: image.id },
                }
              : undefined,
          },
          include: {
            content: true,
            image: true,
          },
        });
      } catch (error) {
        console.error(`Failed to store post: ${error}`);
        throw error;
      }
    })
  );

  // Filter out rejected promises and return successful posts
  return posts
    .filter(
      (
        result
      ): result is PromiseFulfilledResult<
        Post & {
          content: Content;
          image: Image | null;
        }
      > => result.status === "fulfilled"
    )
    .map((result) => result.value);
}

export default async function searchPosts(searchEmbedding: number[]) {
  try {
    return await prisma.$queryRaw`
      SELECT 
        p.url,
        p.is_nsfw,
        1 - (c.embedding::vector <#> ${searchEmbedding}::vector) as similarity
      FROM "Content" c
      JOIN "Post" p ON p."contentId" = c.id
      WHERE (c.embedding::vector <#> ${searchEmbedding}::vector) < 0.3
      ORDER BY similarity DESC
      LIMIT 20;
    `;
  } catch (error) {
    console.error(
      "Search error:",
      error instanceof Error ? error.message : error
    );
    throw new Error("Failed to perform vector search");
  }
}

export async function getRandomPosts(
  limit: number = 1000 // We can change or adjust this later, for now it's hardcoded to 1000
): Promise<{ url: string; is_nsfw: boolean }[]> {
  try {
    const results = await prisma.$queryRaw<{ url: string; is_nsfw: boolean }[]>`
      SELECT url, is_nsfw
      FROM "Post"
      WHERE url IS NOT NULL
      ORDER BY RANDOM()
      LIMIT ${limit}`;

    return results;
  } catch (error) {
    console.error("Random posts error:", error);
    throw new Error("Failed to fetch random posts");
  }
}
