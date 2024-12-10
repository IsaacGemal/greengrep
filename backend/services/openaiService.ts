import OpenAI from "openai";
import type { ImageAnalysis } from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbeddings(analysis: ImageAnalysis) {
  try {
    const embeddings = await Promise.all(
      analysis.posts.map(async (post) => {
        const fullText = [...post.content.greentext, ...post.content.text].join(
          " "
        );
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
    const { data } = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: searchQuery,
      encoding_format: "float",
    });

    return data[0].embedding;
  } catch (error) {
    console.error("Search embedding generation failed:", error);
    throw new Error("Failed to generate search embedding");
  }
}
