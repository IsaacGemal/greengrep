import { generateEmbeddingWithoutCache } from "./openaiService";
import searchPosts from "./dbService";
import type { ImageAnalysis } from "./types";

const SIMILARITY_THRESHOLD = 1.95;

export async function findSimilarItems(analysis: ImageAnalysis) {
  try {
    const post = analysis.posts[0];
    if (!post) {
      console.log("No post found in analysis");
      return {
        isDuplicate: false,
        similarItems: [],
      };
    }

    const textContent = [
      ...(post.content.greentext || []),
      ...(post.content.text || []),
      post.embedded_image?.description || "",
    ]
      .join(" ")
      .trim();

    if (!textContent) {
      console.log("No text content found to analyze");
      return {
        isDuplicate: false,
        similarItems: [],
      };
    }

    console.log("Searching for similar items with text:", textContent);

    const embedding = await generateEmbeddingWithoutCache(textContent);
    const results = (await searchPosts(embedding)) as Array<{
      similarity: number;
      url: string;
    }>;

    const isDuplicate = results.some(
      (item) => item.similarity >= SIMILARITY_THRESHOLD
    );

    if (isDuplicate) {
      console.log(
        `Duplicate detected with similarity >= ${SIMILARITY_THRESHOLD}`,
        {
          textContent,
          results: results
            .filter((item) => item.similarity >= SIMILARITY_THRESHOLD)
            .map((item) => ({
              similarity: item.similarity.toFixed(3),
              url: item.url,
            })),
        }
      );
    }

    return {
      isDuplicate,
      similarItems: results,
    };
  } catch (error) {
    console.error("Error finding similar items:", error);
    throw new Error("Failed to find similar items");
  }
}
