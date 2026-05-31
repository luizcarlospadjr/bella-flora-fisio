ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_confirmed BOOLEAN DEFAULT FALSE;
