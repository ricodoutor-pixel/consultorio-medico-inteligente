
CREATE OR REPLACE FUNCTION public.increment_planta_coins(_user_id uuid, _coins integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET planta_coins = COALESCE(planta_coins, 0) + _coins
  WHERE id = _user_id;
END;
$$;
