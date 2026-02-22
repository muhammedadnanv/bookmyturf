
-- 1. Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'owner', 'player');

-- 2. Sport type enum
CREATE TYPE public.sport_type AS ENUM ('cricket', 'football', 'badminton', 'tennis', 'basketball', 'hockey', 'volleyball', 'other');

-- 3. Turf status enum
CREATE TYPE public.turf_status AS ENUM ('pending', 'approved', 'rejected', 'deactivated');

-- 4. Booking status enum
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- 5. Payment status enum  
CREATE TYPE public.payment_status AS ENUM ('pending', 'success', 'failed', 'refunded');

-- 6. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- 8. Turfs table
CREATE TABLE public.turfs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  city TEXT NOT NULL,
  area TEXT NOT NULL,
  address TEXT,
  sport_type sport_type NOT NULL DEFAULT 'cricket',
  amenities TEXT[] DEFAULT '{}',
  hourly_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  status turf_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Turf images table
CREATE TABLE public.turf_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turf_id UUID REFERENCES public.turfs(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Turf slots table
CREATE TABLE public.turf_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turf_id UUID REFERENCES public.turfs(id) ON DELETE CASCADE NOT NULL,
  day_of_week INT NOT NULL, -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  price_override NUMERIC(10,2), -- null means use turf hourly_price
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turf_id UUID REFERENCES public.turfs(id) ON DELETE CASCADE NOT NULL,
  slot_id UUID REFERENCES public.turf_slots(id) ON DELETE CASCADE NOT NULL,
  player_id UUID NOT NULL,
  booking_date DATE NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  owner_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Prevent double booking: one slot per turf per date
  UNIQUE(turf_id, slot_id, booking_date)
);

-- 12. Payments table (mock for MVP)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL UNIQUE,
  amount NUMERIC(10,2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  payment_method TEXT DEFAULT 'razorpay_mock',
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Payout ledger
CREATE TABLE public.payout_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  commission_amount NUMERIC(10,2) NOT NULL,
  owner_payout NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Platform settings (for commission rate)
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.platform_settings (key, value) VALUES ('commission_rate', '10');

-- 15. Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 16. Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_turfs_updated_at BEFORE UPDATE ON public.turfs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 17. Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 18. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turf_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turf_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- 19. RLS Policies

-- Profiles: users see own, admins see all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User roles: users see own role, admins see all
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Turfs: approved turfs are public, owners manage own
CREATE POLICY "Anyone can view approved turfs" ON public.turfs FOR SELECT USING (status = 'approved');
CREATE POLICY "Owners can view own turfs" ON public.turfs FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners can create turfs" ON public.turfs FOR INSERT WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners can update own turfs" ON public.turfs FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Admins can view all turfs" ON public.turfs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update turfs" ON public.turfs FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Turf images: public for approved turfs, owners manage
CREATE POLICY "Anyone can view turf images" ON public.turf_images FOR SELECT USING (true);
CREATE POLICY "Owners can manage turf images" ON public.turf_images FOR ALL USING (
  EXISTS (SELECT 1 FROM public.turfs WHERE id = turf_id AND owner_id = auth.uid())
);

-- Turf slots: public for viewing, owners manage
CREATE POLICY "Anyone can view active slots" ON public.turf_slots FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can manage slots" ON public.turf_slots FOR ALL USING (
  EXISTS (SELECT 1 FROM public.turfs WHERE id = turf_id AND owner_id = auth.uid())
);

-- Bookings: players see own, owners see their turf bookings, admins see all
CREATE POLICY "Players can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "Players can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "Players can update own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = player_id);
CREATE POLICY "Owners can view turf bookings" ON public.bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.turfs WHERE id = turf_id AND owner_id = auth.uid())
);
CREATE POLICY "Admins can view all bookings" ON public.bookings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update bookings" ON public.bookings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Payments: linked to booking access
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND player_id = auth.uid())
);
CREATE POLICY "Users can create payments" ON public.payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND player_id = auth.uid())
);
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Payout ledger: owners see own, admins see all
CREATE POLICY "Owners can view own payouts" ON public.payout_ledger FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Admins can view all payouts" ON public.payout_ledger FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Platform settings: admins manage, all authenticated can read
CREATE POLICY "Authenticated can read settings" ON public.platform_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage settings" ON public.platform_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 20. Storage bucket for turf images
INSERT INTO storage.buckets (id, name, public) VALUES ('turf-images', 'turf-images', true);

CREATE POLICY "Anyone can view turf images" ON storage.objects FOR SELECT USING (bucket_id = 'turf-images');
CREATE POLICY "Owners can upload turf images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'turf-images' AND auth.role() = 'authenticated');
CREATE POLICY "Owners can update own turf images" ON storage.objects FOR UPDATE USING (bucket_id = 'turf-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owners can delete own turf images" ON storage.objects FOR DELETE USING (bucket_id = 'turf-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 21. Function to assign role on signup (called from edge function)
CREATE OR REPLACE FUNCTION public.assign_role(_user_id UUID, _role app_role)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;
