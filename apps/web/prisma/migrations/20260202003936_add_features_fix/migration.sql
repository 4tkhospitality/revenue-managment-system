-- AlterTable
ALTER TABLE "features_daily" ADD COLUMN     "pickup_t15" INTEGER,
ADD COLUMN     "pickup_t5" INTEGER;

-- AlterTable
ALTER TABLE "import_jobs" ADD COLUMN     "error_log" JSONB,
ADD COLUMN     "total_rows" INTEGER;
