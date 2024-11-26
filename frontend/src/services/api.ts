const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not defined");
}

export interface S3File {
  key: string;
  lastModified: string;
  size: number;
  url: string;
}

export const api = {
  async getFiles(): Promise<S3File[]> {
    const response = await fetch(`${API_BASE_URL}/files`);
    if (!response.ok) {
      throw new Error("Failed to fetch files");
    }
    const data = await response.json();
    return data.files;
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
};
