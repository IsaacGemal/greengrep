import sharp from "sharp";

// This is a hash function that is used to compare images
// It's based on the average hash algorithm, and modified to use 16x16 instead of 8x8
// https://kb.feval.ca/engineering/algorithm/ahash.html
// Very fast and simple and fuzzy, which is what we need
// We can always refine it later

export async function calculateAverageHash(
  imageBuffer: Buffer
): Promise<string> {
  try {
    // Resize to 16x16 and convert to grayscale
    const resizedBuffer = await sharp(imageBuffer)
      .resize(16, 16, { fit: "fill" })
      .grayscale()
      .raw()
      .toBuffer();

    // Calculate average pixel value
    const pixels = Array.from(resizedBuffer);
    const average =
      pixels.reduce((sum, pixel) => sum + pixel, 0) / pixels.length;

    // Create binary string based on whether pixels are above or below average
    let binaryString = "";
    pixels.forEach((pixel) => {
      binaryString += pixel >= average ? "1" : "0";
    });

    // Convert binary string to hexadecimal
    const hash = BigInt(`0b${binaryString}`).toString(16).padStart(16, "0");

    console.log("Image hash:", hash);
    return hash;
  } catch (error) {
    console.error("Error calculating image hash:", error);
    throw error;
  }
}
