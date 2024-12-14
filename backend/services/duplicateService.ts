import { generateEmbeddingWithoutCache } from "./openaiService";
import searchPosts from "./dbService";
import type { ImageAnalysis } from "./types";

export async function findSimilarItems(analysis: ImageAnalysis) {
  try {
    // Combine all text content from the post for similarity checking
    const post = analysis.posts[0]; // We currently only handle single posts
    if (!post) {
      console.log("No post found in analysis");
      return [];
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
      return [];
    }

    console.log("Searching for similar items with text:", textContent);

    // Generate embedding for the combined text
    const embedding = await generateEmbeddingWithoutCache(textContent);

    // Perform similarity search in the database
    const results = await searchPosts(embedding);

    // Return the top 5 closest items and their similarity scores
    //@ts-ignore
    const topResults = results
      .slice(0, 5)
      .map((result: { url: string; is_nsfw: boolean; similarity: number }) => ({
        url: result.url,
        is_nsfw: result.is_nsfw,
        similarity: result.similarity,
      }));

    console.log("Top 5 similar items:", topResults);
    return topResults;
  } catch (error) {
    console.error("Error finding similar items:", error);
    throw new Error("Failed to find similar items");
  }
}
