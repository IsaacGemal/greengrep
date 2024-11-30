import OpenAI from "openai";
import type { ImageAnalysis } from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbeddings(analysis: ImageAnalysis) {
  for (const post of analysis.posts) {
    const fullText = [...post.content.greentext, ...post.content.text].join(
      " "
    );
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: fullText,
      encoding_format: "float",
    });
    console.log({
      post_id: post.post_id,
      full_text: fullText,
      embedding: embedding.data[0].embedding.slice(0, 5),
    });
  }
}
