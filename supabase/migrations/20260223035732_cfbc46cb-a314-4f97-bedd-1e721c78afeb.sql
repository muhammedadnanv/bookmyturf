
-- Create a trigger to auto-create payout ledger entries when a booking is confirmed
CREATE OR REPLACE FUNCTION public.create_payout_on_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _owner_id uuid;
  _commission_rate numeric;
  _commission numeric;
  _owner_payout numeric;
BEGIN
  -- Only create payout for confirmed bookings
  IF NEW.status = 'confirmed' THEN
    -- Get owner from turf
    SELECT owner_id INTO _owner_id FROM turfs WHERE id = NEW.turf_id;
    
    -- Get commission rate from settings (default 10%)
    SELECT COALESCE(
      (SELECT value::numeric FROM platform_settings WHERE key = 'commission_rate'),
      10
    ) INTO _commission_rate;
    
    _commission := ROUND(NEW.total_amount * _commission_rate / 100, 2);
    _owner_payout := NEW.total_amount - _commission;
    
    INSERT INTO payout_ledger (owner_id, booking_id, total_amount, commission_rate, commission_amount, owner_payout)
    VALUES (_owner_id, NEW.id, NEW.total_amount, _commission_rate, _commission, _owner_payout)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_booking_confirmed
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.create_payout_on_booking();

-- Also add INSERT policy for payments (players need to create mock payments)
-- Already exists, but let's verify payout_ledger doesn't need direct access since trigger handles it
