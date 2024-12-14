import OpenAI from "openai";
import { getCachedEmbedding, setCachedEmbedding } from "./redisService";
import type { ImageAnalysis } from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbeddings(analysis: ImageAnalysis) {
  try {
    const embeddings = await Promise.all(
      analysis.posts.map(async (post) => {
        const imageDescription = post.embedded_image?.description || "";
        const fullText = [
          ...post.content.greentext,
          ...post.content.text,
          imageDescription,
        ].join(" ");

        // TODO
        // Right now we are embedding each post individually
        // We should probably embed every all together
        // For now it still works but it's not as good
        console.log("Embedding text:", fullText);

        const { data } = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: fullText,
          encoding_format: "float",
        });

        return {
          post_id: post.post_id,
          embedding: data[0].embedding,
        };
      })
    );

    return embeddings;
  } catch (error) {
    console.error("Failed to generate embeddings:", error);
    throw new Error("Embedding generation failed");
  }
}

export async function generateSearchEmbedding(searchQuery: string) {
  try {
    // Check embedding cache first
    const cachedEmbedding = await getCachedEmbedding(searchQuery);
    if (cachedEmbedding) {
      console.log("Embedding cache hit for:", searchQuery);
      return cachedEmbedding;
    }

    console.log("Embedding cache miss for:", searchQuery);
    // Generate new embedding if not cached
    const { data } = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: searchQuery,
      encoding_format: "float",
    });

    const embedding = data[0].embedding;

    // Cache the embedding
    await setCachedEmbedding(searchQuery, embedding);

    return embedding;
  } catch (error) {
    console.error("Search embedding generation failed:", error);
    throw new Error("Failed to generate search embedding");
  }
}

// This is used for the duplicate search
// Redis would be overkill here
export async function generateEmbeddingWithoutCache(text: string) {
  try {
    const { data } = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    return data[0].embedding;
  } catch (error) {
    console.error("Embedding generation failed:", error);
    throw new Error("Failed to generate embedding");
  }
}
