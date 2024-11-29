import { Anthropic } from "@anthropic-ai/sdk";

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Define types based on the example JSON structure
interface ImagePost {
  post_id: string;
  board: string | null;
  timestamp: string;
  poster: string;
  has_image: boolean;
  is_nsfw: boolean;
  embedded_image?: {
    filename?: string;
    size?: string;
    format?: string;
    dimensions?: string;
    description?: string;
  };
  content: {
    greentext: string[];
    text: string[];
  };
}

interface ImageAnalysis {
  posts: ImagePost[];
}

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

    // Convert format string to proper media type
    const mediaType =
      format.toLowerCase() === "jpeg" || format.toLowerCase() === "image/jpeg"
        ? "image/jpeg"
        : format.toLowerCase() === "png" || format.toLowerCase() === "image/png"
        ? "image/png"
        : format.toLowerCase() === "gif" || format.toLowerCase() === "image/gif"
        ? "image/gif"
        : format.toLowerCase() === "webp" ||
          format.toLowerCase() === "image/webp"
        ? "image/webp"
        : "image/jpeg";

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
              text: `You are looking at a screenshot of one or more 4chan posts. 4chan is an anonymous imageboard where users can post text and images. Posts typically have an ID number, timestamp, and optional poster name. Some text lines start with ">" which makes them appear green ("greentext"). Extract all information from this 4chan-style post(s) into JSON format. There may be multiple posts in the image. For each post, capture the post ID, board name, timestamp, and poster name. For posts with images, include the image details. Separate the content into arrays of greentext (lines starting with ">") and regular text. Lastly make a determination of whether the post contains NSFW content. Use this structure:
              {
                "posts": [
                  {
                    "post_id": "4chan post id",
                    "board": "board name or null if not specified",
                    "timestamp": "post timestamp",
                    "poster": "poster name",
                    "has_image": true,
                    "is_nsfw": true,
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

    return JSON.parse(response) as ImageAnalysis;
  } catch (error) {
    console.error("Error analyzing image with Claude:", error);
    throw error;
  }
}
