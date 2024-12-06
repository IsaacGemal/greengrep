import { PrismaClient } from "@prisma/client";
import type { ImageAnalysis } from "./types";
import { generateEmbeddings } from "./openaiService";

const prisma = new PrismaClient();

export async function storeAnalysis(analysis: ImageAnalysis) {
  // Get embeddings first
  const embeddings = await generateEmbeddings(analysis);

  const posts = await Promise.all(
    analysis.posts.map(async (post, index) => {
      // Create or connect the Content with embedding
      const content = await prisma.content.create({
        data: {
          greentext: post.content.greentext,
          text: post.content.text,
          embedding: embeddings[index].embedding, // Store the embedding
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
    })
  );

  return posts;
}

export default async function searchPosts(searchEmbedding: number[]) {
  try {
    // Perform vector similarity search using cosine similarity
    const results = await prisma.$queryRaw`
      SELECT 
        p.*,
        c.*,
        i.*,
        1 - (c.embedding::vector <#> ${searchEmbedding}::vector) as similarity
      FROM "Content" c
      JOIN "Post" p ON p."contentId" = c.id
      LEFT JOIN "Image" i ON p."imageId" = i.id
      WHERE 1 - (c.embedding::vector <#> ${searchEmbedding}::vector) > 0.7
      ORDER BY similarity DESC
      LIMIT 20;
    `;

    return results;
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
}
