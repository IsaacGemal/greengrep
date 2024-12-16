export interface ImagePost {
  post_id?: string;
  board: string | null;
  timestamp: string;
  poster: string;
  has_image: boolean;
  is_nsfw: boolean;
  url: string;
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

export interface ImageAnalysis {
  posts: ImagePost[];
}
