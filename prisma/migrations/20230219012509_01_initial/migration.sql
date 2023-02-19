-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "content" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder_metadata" (
    "reminder_id" TEXT NOT NULL,
    "channel_id" BIGINT NOT NULL,
    "message_id" BIGINT NOT NULL,

    CONSTRAINT "reminder_metadata_pkey" PRIMARY KEY ("reminder_id")
);

-- CreateTable
CREATE TABLE "reminder_subscriptions" (
    "id" BIGSERIAL NOT NULL,
    "reminder_id" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,

    CONSTRAINT "reminder_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "guild_id" BIGINT NOT NULL,
    "embed" BOOLEAN NOT NULL,
    "embed_color" INTEGER NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_aliases" (
    "id" BIGSERIAL NOT NULL,
    "tag_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tag_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reminder_subscriptions_user_id_reminder_id_key" ON "reminder_subscriptions"("user_id", "reminder_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_guild_id_key" ON "tags"("name", "guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "tag_aliases_tag_id_name_key" ON "tag_aliases"("tag_id", "name");

-- AddForeignKey
ALTER TABLE "reminder_metadata" ADD CONSTRAINT "reminder_metadata_reminder_id_fkey" FOREIGN KEY ("reminder_id") REFERENCES "reminders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_subscriptions" ADD CONSTRAINT "reminder_subscriptions_reminder_id_fkey" FOREIGN KEY ("reminder_id") REFERENCES "reminders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_aliases" ADD CONSTRAINT "tag_aliases_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
