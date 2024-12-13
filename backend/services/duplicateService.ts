import { generateSearchEmbedding } from "./openaiService";
import searchPosts from "./dbService";

export async function findSimilarItems(hardcodedText: string) {
  try {
    // Generate embedding for the hardcoded text
    const embedding = await generateSearchEmbedding(hardcodedText);

    // Perform similarity search in the database
    const results = await searchPosts(embedding);

    // Return the top 5 closest items and their similarity scores
    //@ts-ignore
    return results.slice(0, 5).map((result) => ({
      url: result.url,
      is_nsfw: result.is_nsfw,
      similarity: result.similarity,
    }));
  } catch (error) {
    console.error("Error finding similar items:", error);
    throw new Error("Failed to find similar items");
  }
}

// Call the function with a hardcoded string
(async () => {
  const hardcodedText =
    "RTS requires planning, thinking and concentration to play Zoomers don't have those skills because they spend all their free time watching dumb shit on tiktok RTS is now a dead genre thanks to zoomies being retarded";
  try {
    const similarItems = await findSimilarItems(hardcodedText);
    console.log("Similar items:", similarItems);
  } catch (error) {
    console.error("Error:", error);
  }
})();
