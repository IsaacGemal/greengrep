-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "board" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "poster" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "imageId" TEXT,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "greentext" TEXT[],
    "text" TEXT[],

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "filename" TEXT,
    "size" TEXT,
    "format" TEXT,
    "dimensions" TEXT,
    "description" TEXT,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Post_post_id_key" ON "Post"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "Post_contentId_key" ON "Post"("contentId");

-- CreateIndex
CREATE INDEX "Post_post_id_idx" ON "Post"("post_id");

-- CreateIndex
CREATE INDEX "Post_timestamp_idx" ON "Post"("timestamp");

-- CreateIndex
CREATE INDEX "Content_greentext_idx" ON "Content"("greentext");

-- CreateIndex
CREATE INDEX "Content_text_idx" ON "Content"("text");

-- CreateIndex
CREATE INDEX "Image_filename_idx" ON "Image"("filename");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;
