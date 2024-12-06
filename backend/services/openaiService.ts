import OpenAI from "openai";
import type { ImageAnalysis } from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbeddings(analysis: ImageAnalysis) {
  const results = await Promise.all(
    analysis.posts.map(async (post) => {
      const fullText = [...post.content.greentext, ...post.content.text].join(
        " "
      );
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: fullText,
        encoding_format: "float",
      });

      console.log(
        `First 5 dimensions for post ${post.post_id}:`,
        embedding.data[0].embedding.slice(0, 5)
      );

      return {
        post_id: post.post_id,
        embedding: embedding.data[0].embedding,
      };
    })
  );
  return results;
}

export async function generateSearchEmbedding(searchQuery: string) {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: searchQuery,
    encoding_format: "float",
  });

  return embedding.data[0].embedding;
}
