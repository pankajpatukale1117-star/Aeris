-- ROVEO Database Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  preferred_currency TEXT DEFAULT 'USD',
  travel_style TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DESTINATIONS TABLE (seeded data)
-- ============================================
CREATE TABLE IF NOT EXISTS public.destinations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  country TEXT NOT NULL,
  continent TEXT,
  description TEXT,
  long_description TEXT,
  category TEXT[], -- beach, mountain, city, adventure, culture, nature, food, historical
  image_url TEXT,
  gallery_urls TEXT[],
  highlights TEXT[],
  recommended_activities TEXT[],
  suggested_duration_min INTEGER, -- days
  suggested_duration_max INTEGER, -- days
  budget_min INTEGER, -- USD per day
  budget_max INTEGER, -- USD per day
  best_time_to_visit TEXT,
  language TEXT,
  timezone TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  rating DECIMAL(3, 2) DEFAULT 4.5,
  review_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRIPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
  cover_image_url TEXT,
  start_date DATE,
  end_date DATE,
  traveler_count INTEGER DEFAULT 1,
  budget_amount DECIMAL(12, 2),
  budget_currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'planning', -- planning, upcoming, active, completed, cancelled
  planning_type TEXT DEFAULT 'manual', -- manual, ai-generated
  notes TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRIP DAYS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.trip_days (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL,
  date DATE,
  title TEXT,
  description TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, day_number)
);

-- ============================================
-- ACTIVITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_day_id UUID REFERENCES public.trip_days(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  activity_type TEXT, -- transport, accommodation, sightseeing, food, adventure, relaxation, shopping
  start_time TEXT, -- HH:MM format
  end_time TEXT,
  duration_minutes INTEGER,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  estimated_cost DECIMAL(10, 2),
  cost_currency TEXT DEFAULT 'USD',
  booking_reference TEXT,
  notes TEXT,
  is_booked BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SAVED DESTINATIONS (Wishlist)
-- ============================================
CREATE TABLE IF NOT EXISTS public.saved_destinations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  destination_id UUID REFERENCES public.destinations(id) ON DELETE CASCADE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, destination_id)
);

-- ============================================
-- TRIP NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.trip_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  note_type TEXT DEFAULT 'general', -- general, packing, budget, reminder
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRIP COLLABORATORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.trip_collaborators (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'viewer', -- owner, editor, viewer
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- DESTINATIONS policies (public read, admin write)
CREATE POLICY "Anyone can view active destinations" ON public.destinations
  FOR SELECT USING (is_active = TRUE);

-- TRIPS policies
CREATE POLICY "Users can view their own trips" ON public.trips
  FOR SELECT USING (
    auth.uid() = user_id OR
    is_public = TRUE OR
    EXISTS (
      SELECT 1 FROM public.trip_collaborators tc
      WHERE tc.trip_id = trips.id AND tc.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert their own trips" ON public.trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own trips" ON public.trips
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own trips" ON public.trips
  FOR DELETE USING (auth.uid() = user_id);

-- TRIP DAYS policies
CREATE POLICY "Users can manage trip days for their trips" ON public.trip_days
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_days.trip_id AND t.user_id = auth.uid())
  );

-- ACTIVITIES policies
CREATE POLICY "Users can manage activities for their trips" ON public.activities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.trips t WHERE t.id = activities.trip_id AND t.user_id = auth.uid())
  );

-- SAVED DESTINATIONS policies
CREATE POLICY "Users can manage their saved destinations" ON public.saved_destinations
  FOR ALL USING (auth.uid() = user_id);

-- TRIP NOTES policies
CREATE POLICY "Users can manage their trip notes" ON public.trip_notes
  FOR ALL USING (auth.uid() = user_id);

-- TRIP COLLABORATORS policies
CREATE POLICY "Users can view collaborators for accessible trips" ON public.trip_collaborators
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_collaborators.trip_id AND t.user_id = auth.uid())
    OR user_id = auth.uid()
  );
CREATE POLICY "Trip owners can manage collaborators" ON public.trip_collaborators
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_collaborators.trip_id AND t.user_id = auth.uid())
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.trip_days
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.destinations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trip_days_trip_id ON public.trip_days(trip_id);
CREATE INDEX IF NOT EXISTS idx_activities_trip_day_id ON public.activities(trip_day_id);
CREATE INDEX IF NOT EXISTS idx_activities_trip_id ON public.activities(trip_id);
CREATE INDEX IF NOT EXISTS idx_saved_destinations_user_id ON public.saved_destinations(user_id);
CREATE INDEX IF NOT EXISTS idx_destinations_category ON public.destinations USING GIN(category);
CREATE INDEX IF NOT EXISTS idx_destinations_featured ON public.destinations(is_featured);

