-- AlterTable
ALTER TABLE "Catch" ALTER COLUMN "photoUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Enduro" ADD COLUMN     "requirePhoto" BOOLEAN NOT NULL DEFAULT true;
