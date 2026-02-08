SELECT 
    'Reservations' as source,
    MIN(arrival_date) as min_arrival,
    MAX(arrival_date) as max_arrival,
    MAX(booking_date) as max_booking,
    COUNT(*) as cnt
FROM reservations_raw
WHERE hotel_id = '82423729-fb42-45ad-be9e-4e163600998d'
UNION ALL
SELECT 
    'OTB' as source,
    MIN(stay_date) as min_stay,
    MAX(stay_date) as max_stay,
    MAX(as_of_date) as max_as_of,
    COUNT(*) as cnt
FROM daily_otb
WHERE hotel_id = '82423729-fb42-45ad-be9e-4e163600998d';
