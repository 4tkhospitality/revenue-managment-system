-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('booked', 'cancelled');

-- CreateEnum
CREATE TYPE "DecisionAction" AS ENUM ('accept', 'override');

-- CreateTable
CREATE TABLE "hotels" (
    "hotel_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "capacity" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotels_pkey" PRIMARY KEY ("hotel_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'manager',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "job_id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_hash" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'pending',
    "error_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("job_id")
);

-- CreateTable
CREATE TABLE "reservations_raw" (
    "id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "booking_date" DATE NOT NULL,
    "arrival_date" DATE NOT NULL,
    "departure_date" DATE NOT NULL,
    "rooms" INTEGER NOT NULL,
    "revenue" DECIMAL NOT NULL,
    "status" "ReservationStatus" NOT NULL,
    "cancel_date" DATE,
    "loaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservations_raw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_otb" (
    "hotel_id" UUID NOT NULL,
    "as_of_date" DATE NOT NULL,
    "stay_date" DATE NOT NULL,
    "rooms_otb" INTEGER NOT NULL,
    "revenue_otb" DECIMAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_otb_pkey" PRIMARY KEY ("hotel_id","as_of_date","stay_date")
);

-- CreateTable
CREATE TABLE "features_daily" (
    "hotel_id" UUID NOT NULL,
    "as_of_date" DATE NOT NULL,
    "stay_date" DATE NOT NULL,
    "dow" INTEGER,
    "is_weekend" BOOLEAN,
    "month" INTEGER,
    "pickup_t30" INTEGER,
    "pickup_t7" INTEGER,
    "pickup_t3" INTEGER,
    "pace_vs_ly" DOUBLE PRECISION,
    "remaining_supply" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "features_daily_pkey" PRIMARY KEY ("hotel_id","as_of_date","stay_date")
);

-- CreateTable
CREATE TABLE "demand_forecast" (
    "hotel_id" UUID NOT NULL,
    "as_of_date" DATE NOT NULL,
    "stay_date" DATE NOT NULL,
    "remaining_demand" INTEGER,
    "model_version" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demand_forecast_pkey" PRIMARY KEY ("hotel_id","as_of_date","stay_date")
);

-- CreateTable
CREATE TABLE "price_recommendations" (
    "hotel_id" UUID NOT NULL,
    "as_of_date" DATE NOT NULL,
    "stay_date" DATE NOT NULL,
    "current_price" DECIMAL,
    "recommended_price" DECIMAL,
    "expected_revenue" DECIMAL,
    "uplift_pct" DOUBLE PRECISION,
    "explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_recommendations_pkey" PRIMARY KEY ("hotel_id","as_of_date","stay_date")
);

-- CreateTable
CREATE TABLE "pricing_decisions" (
    "decision_id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "as_of_date" DATE NOT NULL,
    "stay_date" DATE NOT NULL,
    "action" "DecisionAction" NOT NULL,
    "system_price" DECIMAL,
    "final_price" DECIMAL,
    "reason" TEXT,
    "decided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_decisions_pkey" PRIMARY KEY ("decision_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_raw_hotel_id_reservation_id_job_id_key" ON "reservations_raw"("hotel_id", "reservation_id", "job_id");

-- CreateIndex
CREATE INDEX "idx_otb_as_of" ON "daily_otb"("hotel_id", "as_of_date");

-- CreateIndex
CREATE INDEX "idx_otb_stay" ON "daily_otb"("hotel_id", "stay_date");

-- CreateIndex
CREATE UNIQUE INDEX "price_recommendations_hotel_id_stay_date_as_of_date_key" ON "price_recommendations"("hotel_id", "stay_date", "as_of_date");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("hotel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("hotel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations_raw" ADD CONSTRAINT "reservations_raw_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("hotel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations_raw" ADD CONSTRAINT "reservations_raw_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "import_jobs"("job_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_otb" ADD CONSTRAINT "daily_otb_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("hotel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "features_daily" ADD CONSTRAINT "features_daily_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("hotel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_forecast" ADD CONSTRAINT "demand_forecast_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("hotel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_recommendations" ADD CONSTRAINT "price_recommendations_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("hotel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_decisions" ADD CONSTRAINT "pricing_decisions_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("hotel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_decisions" ADD CONSTRAINT "pricing_decisions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
