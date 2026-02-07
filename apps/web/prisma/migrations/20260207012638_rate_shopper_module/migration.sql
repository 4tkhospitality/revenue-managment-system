/*
  Warnings:

  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ImportType" AS ENUM ('RESERVATION', 'CANCELLATION');

-- CreateEnum
CREATE TYPE "CalcType" AS ENUM ('PROGRESSIVE', 'ADDITIVE');

-- CreateEnum
CREATE TYPE "PromotionGroup" AS ENUM ('SEASONAL', 'ESSENTIAL', 'TARGETED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'hotel_admin', 'manager', 'viewer');

-- CreateEnum
CREATE TYPE "RateShopCacheStatus" AS ENUM ('FRESH', 'STALE', 'EXPIRED', 'REFRESHING', 'FAILED');

-- CreateEnum
CREATE TYPE "RateShopAvailabilityStatus" AS ENUM ('AVAILABLE', 'SOLD_OUT', 'NO_RATE');

-- CreateEnum
CREATE TYPE "RateShopDataConfidence" AS ENUM ('HIGH', 'MED', 'LOW');

-- CreateEnum
CREATE TYPE "RateShopRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'COALESCED');

-- CreateEnum
CREATE TYPE "RateShopRecommendationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RateShopDemandStrength" AS ENUM ('WEAK', 'NORMAL', 'STRONG');

-- CreateEnum
CREATE TYPE "RateShopQueryType" AS ENUM ('PROPERTY_DETAILS', 'LISTING');

-- CreateEnum
CREATE TYPE "RateShopProvider" AS ENUM ('SERPAPI');

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_hotel_id_fkey";

-- AlterTable
ALTER TABLE "hotels" ADD COLUMN     "company_email" TEXT,
ADD COLUMN     "default_base_rate" DECIMAL(12,2),
ADD COLUMN     "fiscal_start_day" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "ladder_steps" TEXT,
ADD COLUMN     "max_rate" DECIMAL(12,2),
ADD COLUMN     "min_rate" DECIMAL(12,2),
ALTER COLUMN "timezone" SET DEFAULT 'Asia/Ho_Chi_Minh',
ALTER COLUMN "currency" SET DEFAULT 'VND';

-- AlterTable
ALTER TABLE "import_jobs" ADD COLUMN     "import_type" "ImportType" NOT NULL DEFAULT 'RESERVATION';

-- AlterTable
ALTER TABLE "reservations_raw" ADD COLUMN     "book_time" TIMESTAMPTZ(6),
ADD COLUMN     "cancel_reason" TEXT,
ADD COLUMN     "cancel_source" TEXT,
ADD COLUMN     "cancel_time" TIMESTAMPTZ(6),
ADD COLUMN     "company_name" TEXT,
ADD COLUMN     "last_modified_time" TIMESTAMPTZ(6),
ADD COLUMN     "reservation_id_norm" TEXT,
ADD COLUMN     "room_code" TEXT,
ADD COLUMN     "room_code_norm" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "email_verified" TIMESTAMP(3),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "phone" TEXT,
ALTER COLUMN "hotel_id" DROP NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'viewer';

-- CreateTable
CREATE TABLE "hotel_users" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'viewer',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "cancellations_raw" (
    "id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "folio_num" TEXT NOT NULL,
    "arrival_date" DATE NOT NULL,
    "cancel_time" TIMESTAMPTZ(6) NOT NULL,
    "as_of_date" DATE NOT NULL,
    "nights" INTEGER NOT NULL,
    "rate_amount" DECIMAL(12,2) NOT NULL,
    "total_revenue" DECIMAL(12,2) NOT NULL,
    "channel" TEXT,
    "sale_group" TEXT,
    "room_type" TEXT,
    "room_code" TEXT,
    "guest_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "folio_num_norm" TEXT,
    "match_notes" TEXT,
    "match_status" TEXT,
    "matched_at" TIMESTAMPTZ(6),
    "matched_reservation_id" UUID,
    "room_code_norm" TEXT,

    CONSTRAINT "cancellations_raw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_types" (
    "id" TEXT NOT NULL,
    "hotel_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "net_price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ota_channels" (
    "id" TEXT NOT NULL,
    "hotel_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "calc_type" "CalcType" NOT NULL DEFAULT 'PROGRESSIVE',
    "commission" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ota_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_catalog" (
    "id" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "group_type" "PromotionGroup" NOT NULL,
    "sub_category" TEXT,
    "default_pct" DOUBLE PRECISION,
    "allow_stack" BOOLEAN NOT NULL DEFAULT true,
    "max_one_in_group" BOOLEAN NOT NULL DEFAULT false,
    "max_one_per_subcategory" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "promotion_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_instances" (
    "id" TEXT NOT NULL,
    "hotel_id" UUID NOT NULL,
    "ota_channel_id" TEXT NOT NULL,
    "promo_id" TEXT NOT NULL,
    "discount_pct" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_settings" (
    "id" TEXT NOT NULL,
    "hotel_id" UUID NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "rounding_rule" TEXT NOT NULL DEFAULT 'CEIL_1000',
    "max_discount_cap" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitors" (
    "id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "google_place_id" TEXT,
    "serpapi_property_token" TEXT,
    "address" TEXT,
    "star_rating" INTEGER,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_shop_cache" (
    "id" UUID NOT NULL,
    "cache_key" TEXT NOT NULL,
    "query_type" "RateShopQueryType" NOT NULL DEFAULT 'PROPERTY_DETAILS',
    "provider" "RateShopProvider" NOT NULL DEFAULT 'SERPAPI',
    "canonical_params" JSONB NOT NULL,
    "property_token" TEXT,
    "check_in_date" VARCHAR(10),
    "check_out_date" VARCHAR(10),
    "adults" INTEGER,
    "length_of_stay" INTEGER,
    "currency" VARCHAR(5),
    "offset_days" INTEGER,
    "status" "RateShopCacheStatus" NOT NULL DEFAULT 'STALE',
    "raw_response" JSONB,
    "raw_response_ref" TEXT,
    "fetched_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stale_until" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_vendor_cache_hit" BOOLEAN,
    "refresh_lock_until" TIMESTAMP(3),
    "refreshing_request_id" UUID,
    "fail_streak" INTEGER NOT NULL DEFAULT 0,
    "backoff_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_shop_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_shop_requests" (
    "id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "cache_key" TEXT NOT NULL,
    "check_in_date" VARCHAR(10) NOT NULL,
    "check_out_date" VARCHAR(10),
    "adults" INTEGER NOT NULL DEFAULT 2,
    "status" "RateShopRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requested_date" DATE NOT NULL,
    "provider" "RateShopProvider" NOT NULL DEFAULT 'SERPAPI',
    "estimated_searches" INTEGER NOT NULL DEFAULT 1,
    "credit_consumed" BOOLEAN NOT NULL DEFAULT false,
    "is_vendor_cache_hit" BOOLEAN,
    "coalesced_to_request_id" UUID,
    "query_type" "RateShopQueryType",
    "http_status" INTEGER,
    "error_message" TEXT,

    CONSTRAINT "rate_shop_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitor_rates" (
    "id" UUID NOT NULL,
    "competitor_id" UUID NOT NULL,
    "cache_id" UUID NOT NULL,
    "check_in_date" VARCHAR(10) NOT NULL,
    "source" TEXT NOT NULL,
    "scraped_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "availability_status" "RateShopAvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "data_confidence" "RateShopDataConfidence" NOT NULL DEFAULT 'MED',
    "total_rate_lowest" DECIMAL(14,0),
    "total_rate_before_tax" DECIMAL(14,0),
    "rate_per_night_lowest" DECIMAL(14,0),
    "rate_per_night_before_tax" DECIMAL(14,0),
    "representative_price" DECIMAL(14,0),
    "price_source_level" INTEGER,
    "is_official" BOOLEAN NOT NULL DEFAULT false,
    "raw_price_json" JSONB,

    CONSTRAINT "competitor_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_snapshots" (
    "id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "check_in_date" VARCHAR(10) NOT NULL,
    "length_of_stay" INTEGER NOT NULL DEFAULT 1,
    "adults" INTEGER NOT NULL DEFAULT 2,
    "snapshot_date" VARCHAR(10) NOT NULL,
    "my_rate" DECIMAL(14,0),
    "comp_min" DECIMAL(14,0),
    "comp_max" DECIMAL(14,0),
    "comp_avg" DECIMAL(14,0),
    "comp_median" DECIMAL(14,0),
    "comp_available_count" INTEGER NOT NULL DEFAULT 0,
    "sold_out_count" INTEGER NOT NULL DEFAULT 0,
    "no_rate_count" INTEGER NOT NULL DEFAULT 0,
    "price_index" DECIMAL(6,4),
    "gap_pct" DECIMAL(6,4),
    "delta_pct" DECIMAL(6,4),
    "market_confidence" "RateShopDataConfidence" NOT NULL DEFAULT 'MED',
    "demand_strength" "RateShopDemandStrength" NOT NULL DEFAULT 'NORMAL',
    "recommended_rate" DECIMAL(14,0),
    "reason_codes" TEXT[],
    "is_latest" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_shop_recommendations" (
    "id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "check_in_date" VARCHAR(10) NOT NULL,
    "snapshot_date" VARCHAR(10) NOT NULL,
    "current_rate" DECIMAL(14,0),
    "recommended_rate" DECIMAL(14,0),
    "delta_pct" DECIMAL(6,4),
    "reason_codes" TEXT[],
    "confidence" "RateShopDataConfidence" NOT NULL DEFAULT 'MED',
    "status" "RateShopRecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_shop_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_shop_usage_daily" (
    "usage_date" VARCHAR(10) NOT NULL,
    "searches_used" INTEGER NOT NULL DEFAULT 0,
    "budget_limit" INTEGER NOT NULL DEFAULT 500,
    "safe_mode_on" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_shop_usage_daily_pkey" PRIMARY KEY ("usage_date")
);

-- CreateTable
CREATE TABLE "rate_shop_usage_tenant_monthly" (
    "hotel_id" UUID NOT NULL,
    "billing_month" VARCHAR(7) NOT NULL,
    "searches_used" INTEGER NOT NULL DEFAULT 0,
    "quota_cap" INTEGER NOT NULL DEFAULT 200,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_shop_usage_tenant_monthly_pkey" PRIMARY KEY ("hotel_id","billing_month")
);

-- CreateIndex
CREATE INDEX "hotel_users_hotel_id_idx" ON "hotel_users"("hotel_id");

-- CreateIndex
CREATE UNIQUE INDEX "hotel_users_user_id_hotel_id_key" ON "hotel_users"("user_id", "hotel_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "idx_cancel_as_of" ON "cancellations_raw"("hotel_id", "as_of_date");

-- CreateIndex
CREATE INDEX "idx_cancel_time" ON "cancellations_raw"("hotel_id", "cancel_time");

-- CreateIndex
CREATE INDEX "idx_cancel_arrival" ON "cancellations_raw"("hotel_id", "arrival_date");

-- CreateIndex
CREATE INDEX "idx_cancel_match_status" ON "cancellations_raw"("hotel_id", "match_status");

-- CreateIndex
CREATE UNIQUE INDEX "cancellations_raw_hotel_id_folio_num_norm_arrival_date_canc_key" ON "cancellations_raw"("hotel_id", "folio_num_norm", "arrival_date", "cancel_time");

-- CreateIndex
CREATE INDEX "room_types_hotel_id_idx" ON "room_types"("hotel_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_types_hotel_id_name_key" ON "room_types"("hotel_id", "name");

-- CreateIndex
CREATE INDEX "ota_channels_hotel_id_idx" ON "ota_channels"("hotel_id");

-- CreateIndex
CREATE UNIQUE INDEX "ota_channels_hotel_id_code_key" ON "ota_channels"("hotel_id", "code");

-- CreateIndex
CREATE INDEX "promotion_catalog_vendor_group_type_idx" ON "promotion_catalog"("vendor", "group_type");

-- CreateIndex
CREATE INDEX "campaign_instances_hotel_id_ota_channel_id_idx" ON "campaign_instances"("hotel_id", "ota_channel_id");

-- CreateIndex
CREATE INDEX "campaign_instances_promo_id_idx" ON "campaign_instances"("promo_id");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_settings_hotel_id_key" ON "pricing_settings"("hotel_id");

-- CreateIndex
CREATE INDEX "competitors_hotel_id_idx" ON "competitors"("hotel_id");

-- CreateIndex
CREATE INDEX "competitors_is_active_serpapi_property_token_idx" ON "competitors"("is_active", "serpapi_property_token");

-- CreateIndex
CREATE UNIQUE INDEX "competitors_hotel_id_serpapi_property_token_key" ON "competitors"("hotel_id", "serpapi_property_token");

-- CreateIndex
CREATE UNIQUE INDEX "rate_shop_cache_cache_key_key" ON "rate_shop_cache"("cache_key");

-- CreateIndex
CREATE INDEX "rate_shop_cache_expires_at_idx" ON "rate_shop_cache"("expires_at");

-- CreateIndex
CREATE INDEX "rate_shop_cache_status_idx" ON "rate_shop_cache"("status");

-- CreateIndex
CREATE INDEX "rate_shop_cache_query_type_check_in_date_idx" ON "rate_shop_cache"("query_type", "check_in_date");

-- CreateIndex
CREATE INDEX "rate_shop_cache_property_token_check_in_date_idx" ON "rate_shop_cache"("property_token", "check_in_date");

-- CreateIndex
CREATE INDEX "rate_shop_cache_offset_days_expires_at_idx" ON "rate_shop_cache"("offset_days", "expires_at");

-- CreateIndex
CREATE INDEX "rate_shop_cache_status_backoff_until_expires_at_idx" ON "rate_shop_cache"("status", "backoff_until", "expires_at");

-- CreateIndex
CREATE INDEX "rate_shop_cache_check_out_date_idx" ON "rate_shop_cache"("check_out_date");

-- CreateIndex
CREATE INDEX "rate_shop_requests_hotel_id_check_in_date_idx" ON "rate_shop_requests"("hotel_id", "check_in_date");

-- CreateIndex
CREATE INDEX "rate_shop_requests_cache_key_idx" ON "rate_shop_requests"("cache_key");

-- CreateIndex
CREATE INDEX "rate_shop_requests_hotel_id_requested_date_idx" ON "rate_shop_requests"("hotel_id", "requested_date");

-- CreateIndex
CREATE INDEX "competitor_rates_competitor_id_check_in_date_idx" ON "competitor_rates"("competitor_id", "check_in_date");

-- CreateIndex
CREATE INDEX "competitor_rates_cache_id_idx" ON "competitor_rates"("cache_id");

-- CreateIndex
CREATE INDEX "competitor_rates_check_in_date_idx" ON "competitor_rates"("check_in_date");

-- CreateIndex
CREATE INDEX "market_snapshots_hotel_id_check_in_date_is_latest_idx" ON "market_snapshots"("hotel_id", "check_in_date", "is_latest");

-- CreateIndex
CREATE INDEX "market_snapshots_is_latest_idx" ON "market_snapshots"("is_latest");

-- CreateIndex
CREATE UNIQUE INDEX "market_snapshots_hotel_id_check_in_date_length_of_stay_adul_key" ON "market_snapshots"("hotel_id", "check_in_date", "length_of_stay", "adults", "snapshot_date");

-- CreateIndex
CREATE INDEX "rate_shop_recommendations_hotel_id_check_in_date_idx" ON "rate_shop_recommendations"("hotel_id", "check_in_date");

-- CreateIndex
CREATE INDEX "rate_shop_recommendations_hotel_id_status_idx" ON "rate_shop_recommendations"("hotel_id", "status");

-- CreateIndex
CREATE INDEX "idx_res_raw_match1" ON "reservations_raw"("hotel_id", "reservation_id_norm", "arrival_date", "room_code_norm");

-- CreateIndex
CREATE INDEX "idx_res_raw_match2" ON "reservations_raw"("hotel_id", "reservation_id_norm", "arrival_date");

-- CreateIndex
CREATE INDEX "idx_res_raw_otb" ON "reservations_raw"("hotel_id", "book_time", "cancel_time", "arrival_date", "departure_date");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("hotel_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_users" ADD CONSTRAINT "hotel_users_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("hotel_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_users" ADD CONSTRAINT "hotel_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancellations_raw" ADD CONSTRAINT "cancellations_raw_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("hotel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancellations_raw" ADD CONSTRAINT "cancellations_raw_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "import_jobs"("job_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancellations_raw" ADD CONSTRAINT "cancellations_raw_matched_reservation_id_fkey" FOREIGN KEY ("matched_reservation_id") REFERENCES "reservations_raw"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("hotel_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ota_channels" ADD CONSTRAINT "ota_channels_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("hotel_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_instances" ADD CONSTRAINT "campaign_instances_ota_channel_id_fkey" FOREIGN KEY ("ota_channel_id") REFERENCES "ota_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_instances" ADD CONSTRAINT "campaign_instances_promo_id_fkey" FOREIGN KEY ("promo_id") REFERENCES "promotion_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_settings" ADD CONSTRAINT "pricing_settings_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("hotel_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("hotel_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_shop_requests" ADD CONSTRAINT "rate_shop_requests_cache_key_fkey" FOREIGN KEY ("cache_key") REFERENCES "rate_shop_cache"("cache_key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_shop_requests" ADD CONSTRAINT "rate_shop_requests_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("hotel_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitor_rates" ADD CONSTRAINT "competitor_rates_competitor_id_fkey" FOREIGN KEY ("competitor_id") REFERENCES "competitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitor_rates" ADD CONSTRAINT "competitor_rates_cache_id_fkey" FOREIGN KEY ("cache_id") REFERENCES "rate_shop_cache"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_snapshots" ADD CONSTRAINT "market_snapshots_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("hotel_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_shop_recommendations" ADD CONSTRAINT "rate_shop_recommendations_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("hotel_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_shop_usage_tenant_monthly" ADD CONSTRAINT "rate_shop_usage_tenant_monthly_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("hotel_id") ON DELETE CASCADE ON UPDATE CASCADE;
