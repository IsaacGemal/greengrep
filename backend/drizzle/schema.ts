import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: text("id").primaryKey(),
  postId: text("post_id"),
  board: text("board"),
  timestamp: timestamp("timestamp").notNull(),
  poster: text("poster").default("Anonymous"),
  url: text("url"),
  isNsfw: boolean("is_nsfw").default(false),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const content = pgTable("content", {
  id: text("id").primaryKey(),
  greentext: text("greentext").array(),
  text: text("text").array(),
  embedding: text("embedding").array(),
});

export const images = pgTable("images", {
  id: text("id").primaryKey(),
  filename: text("filename"),
  size: text("size"),
  format: text("format"),
  dimensions: text("dimensions"),
  description: text("description"),
});
