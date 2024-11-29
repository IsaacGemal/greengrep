import { PrismaClient } from "@prisma/client";
import type { ImageAnalysis } from "./types";

const prisma = new PrismaClient();

export async function storeAnalysis(analysis: ImageAnalysis) {
  const posts = await Promise.all(
    analysis.posts.map(async (post) => {
      // Create or connect the Content
      const content = await prisma.content.create({
        data: {
          greentext: post.content.greentext,
          text: post.content.text,
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

      // Create the Post
      return await prisma.post.create({
        data: {
          post_id: post.post_id,
          board: post.board,
          timestamp: new Date(post.timestamp),
          poster: post.poster,
          is_nsfw: post.is_nsfw || false,
          contentId: content.id,
          imageId: image?.id,
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
