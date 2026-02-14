UPDATE subscriptions s
SET room_band = CASE
    WHEN h.capacity <= 30 THEN 'R30'::"RoomBand"
    WHEN h.capacity <= 80 THEN 'R80'::"RoomBand"
    WHEN h.capacity <= 150 THEN 'R150'::"RoomBand"
    ELSE 'R300P'::"RoomBand"
END,
capacity_snapshot = h.capacity
FROM hotels h
WHERE s.hotel_id = h.hotel_id
  AND (s.room_band = 'R30' OR s.capacity_snapshot IS NULL);
