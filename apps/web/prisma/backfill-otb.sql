-- Backfill book_time: local midnight (VN = UTC+7) → UTC
UPDATE reservations_raw
SET book_time = booking_date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh'
WHERE book_time IS NULL;

-- Backfill cancel_time: same timezone rule
UPDATE reservations_raw
SET cancel_time = cancel_date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh'
WHERE cancel_time IS NULL AND cancel_date IS NOT NULL;

-- Backfill snapshot_ts for existing ImportJobs
UPDATE import_jobs
SET snapshot_ts = created_at
WHERE snapshot_ts IS NULL;
