import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  doublePrecision,
} from "drizzle-orm/pg-core";

// ------------------ Content ------------------
export const content = pgTable(
  "Content",
  {
    id: text("id").primaryKey(),
    // Arrays
    greentext: text("greentext").array(),
    text: text("text").array(),
    // For actual float arrays in PostgreSQL:
    embedding: doublePrecision("embedding").array().$type<number[]>(),
  },
  (table) => [
    index("Content_greentext_idx").on(table.greentext),
    index("Content_text_idx").on(table.text),
  ]
);

// ------------------ Images ------------------
export const images = pgTable(
  "Image",
  {
    id: text("id").primaryKey(),
    filename: text("filename"),
    size: text("size"),
    format: text("format"),
    dimensions: text("dimensions"),
    description: text("description"),
  },
  (table) => [index("images_filename_idx").on(table.filename)]
);

// ------------------ Posts ------------------
export const posts = pgTable(
  "Post",
  {
    id: text("id").primaryKey(),
    postId: text("post_id"), // 4chan post ID - important to note this is the 4chan post ID, NOT the database ID that we'd use as the primary key
    board: text("board"),
    timestamp: timestamp("timestamp", { precision: 3 }),
    poster: text("poster").default("Anonymous"),
    isNsfw: boolean("is_nsfw").default(false),
    url: text("url"),
    uploadedAt: timestamp("uploaded_at", { precision: 3 }).defaultNow(),

    // Match Prisma’s fields for foreign keys.
    // Prisma model: contentId String  @unique
    //               imageId   String?
    // “.references(() => content.id)” creates the FK to content.id
    contentId: text("contentId")
      .unique()
      .references(() => content.id, { onDelete: "cascade" }),
    imageId: text("imageId").references(() => images.id, {
      onDelete: "cascade",
    }),
  },
  (table) => [
    index("posts_post_id_idx").on(table.postId),
    index("posts_timestamp_idx").on(table.timestamp),
  ]
);
