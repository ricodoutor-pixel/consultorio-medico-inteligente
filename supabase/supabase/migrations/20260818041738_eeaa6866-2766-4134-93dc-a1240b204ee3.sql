UPDATE public.doctors
SET price_chat_only = 100,
    price_video_chat = 150,
    price_return = 90,
    consultation_price = 150,
    updated_at = now()
WHERE price_chat_only <> 100
   OR price_video_chat <> 150
   OR price_return <> 90;