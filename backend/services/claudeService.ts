import { Anthropic } from "@anthropic-ai/sdk";
import type { ImageAnalysis } from "./types";

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
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

    console.log("Image URL:", imageUrl);
    console.log("Format:", format);
    console.log("Base64 length:", base64Image.length);

    // Media type mapping
    const mediaTypeMap: { [key: string]: string } = {
      jpeg: "image/jpeg",
      "image/jpeg": "image/jpeg",
      png: "image/png",
      "image/png": "image/png",
      gif: "image/gif",
      "image/gif": "image/gif",
      webp: "image/webp",
      "image/webp": "image/webp",
    };

    const mediaType = mediaTypeMap[format.toLowerCase()] || "image/jpeg";

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as
                  | "image/jpeg"
                  | "image/png"
                  | "image/gif"
                  | "image/webp",
                data: base64Image,
              },
            },
            {
              type: "text",
              text: `You are looking at a screenshot of one or more 4chan posts. 4chan is an anonymous imageboard where users can post text and images. Posts typically have an ID number, timestamp, and optional poster name. Some text lines start with ">" which makes them appear green ("greentext"). Extract all information from this 4chan-style post(s) into JSON format. There may be multiple posts in the image. For each post, capture the post ID, board name, timestamp, and poster name. For posts with images, include the image details. Separate the content into arrays of greentext (lines starting with ">") and regular text. Lastly make a determination of whether the post contains NSFW content (ie, 18+). DO NOT OUTPUT ANYTHING OTHER THAN THE JSON. Use this structure:
              {
                "posts": [
                  {
                    "post_id": "4chan post id",
                    "board": "board name or null if not specified",
                    "timestamp": "post timestamp",
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
    console.log("Claude Analysis:", response);

    const analysis = JSON.parse(response) as ImageAnalysis;

    // Add URL to the single post
    if (analysis.posts[0]) {
      analysis.posts[0].url = imageUrl;
    }

    return analysis;
  } catch (error) {
    console.error("Error analyzing image with Claude:", error);
    throw error;
  }
}
