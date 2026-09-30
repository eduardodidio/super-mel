-- AlterTable
ALTER TABLE "scores" ADD COLUMN "mode" VARCHAR(20) NOT NULL DEFAULT 'infinite',
ADD COLUMN "seed" INTEGER;
