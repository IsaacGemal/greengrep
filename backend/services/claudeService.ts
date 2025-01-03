import { Anthropic } from "@anthropic-ai/sdk";
import { fileTypeFromBuffer } from "file-type";
import type { ImageAnalysis } from "./types";

// Initialize Grok client using Anthropic SDK
// I can't believe this actually works
const anthropic = new Anthropic({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/",
});

export async function analyzeImage(
  imageUrl: string,
  filename: string,
  size: string,
  format: string
): Promise<ImageAnalysis> {
  try {
    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    // Detect actual file type
    const fileType = await fileTypeFromBuffer(new Uint8Array(imageBuffer));
    const detectedMimeType = fileType?.mime || "image/jpeg";

    console.log("Image URL:", imageUrl);
    console.log("Provided format:", format);
    console.log("Detected format:", detectedMimeType);
    console.log("Base64 length:", base64Image.length);

    const message = await anthropic.messages.create({
      model: "grok-vision-beta",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: detectedMimeType as
                  | "image/jpeg"
                  | "image/png"
                  | "image/webp",
                data: base64Image,
              },
            },
            {
              type: "text",
              text: `You are looking at a screenshot of one or more 4chan posts. 4chan is an anonymous imageboard where users can post text and images. Posts typically have an ID number, timestamp, and optional poster name. Some text lines start with ">" which makes them appear green ("greentext"). Extract all information from this 4chan-style post(s) into JSON format. There may be multiple posts in the image. For each post, capture the post ID, board name, timestamp, and poster name. For posts with images, include the image details. Separate the content into arrays of greentext (lines starting with ">") and regular text. Lastly make a determination of whether the post contains NSFW content (ie, 18+). IMPORTANT: Output raw JSON only - do not wrap in markdown code blocks or add any other formatting. Use this structure:
              {
                "posts": [
                  {
                    "post_id": "4chan post id",
                    "board": "board name or null if not specified",
                    "timestamp": "the timestamp of the post (MUST BE IN ISO 8601 FORMAT)",
                    "poster": "poster name",
                    "has_image": true,
                    "is_nsfw": true,
                    "url": "${imageUrl}",
                    "embedded_image": {
                      "filename": "${filename}",
                      "size": "${size}",
                      "format": "${format}",
                      "description": "simple one-line description"
                    },
                    "content": {
                      "greentext": ["array_of_greentext_elements_if_any"],
                      "text": ["array_of_regular_text_elements"]
                    }
                  }
                ]
              }`,
            },
          ],
        },
      ],
    });

    const response =
      message.content[0].type === "text" ? message.content[0].text : "";
    console.log("Grok Analysis:", response);

    const analysis = JSON.parse(response) as ImageAnalysis;

    // Assign the URL to every post in the analysis
    analysis.posts = analysis.posts.map((post) => ({
      ...post,
      url: imageUrl,
    }));

    return analysis;
  } catch (error) {
    console.error("Error analyzing image with Grok:", error);
    throw error;
  }
}
