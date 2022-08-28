-- CreateTable
CREATE TABLE "Reminder" (
    "id" VARCHAR(21) NOT NULL,
    "userId" BIGINT NOT NULL,
    "content" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);
