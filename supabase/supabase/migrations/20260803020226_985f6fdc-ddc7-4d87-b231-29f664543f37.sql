UPDATE public.doctors
SET is_online = true,
    is_available = true,
    is_verified = true,
    is_approved_by_admin = true,
    approval_status = 'approved',
    consultation_price = CASE WHEN COALESCE(consultation_price,0) <= 0 THEN 250 ELSE consultation_price END,
    price_video_chat = CASE WHEN COALESCE(price_video_chat,0) <= 0 THEN 250 ELSE price_video_chat END
WHERE id IN (
  'c4c629db-1c45-43ab-9ae3-5be4b38da46f',
  'a2a8bd20-31a5-4d02-9c52-b1a177d61a5f',
  '8b32a5f6-0fce-4c33-a245-2c655764c011'
);