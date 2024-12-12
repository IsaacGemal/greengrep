const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not defined");
}

console.log("Using API URL:", API_BASE_URL);

export interface S3File {
  key: string;
  lastModified: string;
  size: number;
  url: string;
}

export interface PaginatedResponse {
  files: S3File[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface SearchResult {
  url: string;
  similarity: number;
  is_nsfw: boolean;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
}

export const api = {
  async getFiles(
    cursor?: string,
    limit: number = 20
  ): Promise<PaginatedResponse> {
    const params = new URLSearchParams();
    if (cursor) params.append("cursor", cursor);
    params.append("limit", limit.toString());

    const response = await fetch(`${API_BASE_URL}/files?${params}`);
    if (!response.ok) {
      throw new Error("Failed to fetch files");
    }
    return await response.json();
  },

  async uploadFile(file: File): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }
  },

  async search(query: string): Promise<SearchResponse> {
    const params = new URLSearchParams({ q: query });
    const response = await fetch(`${API_BASE_URL}/vector-search?${params}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to perform search");
    }

    return await response.json();
  },
};
