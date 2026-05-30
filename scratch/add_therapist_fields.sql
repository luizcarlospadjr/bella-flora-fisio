-- MIGRATION: ADD THERAPIST DETAILS FOR PROFESSIONALS LISTING
-- Execute this script in the "SQL Editor" of your Supabase dashboard.

-- 1. Add new columns to public.profiles if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Enable therapist profiles updates or make sure they have premium initial values
UPDATE public.profiles 
SET 
  specialization = 'Fisioterapia Pélvica & Obstétrica', 
  education = 'Universidade Federal de São Paulo (UNIFESP)',
  bio = 'Com mais de 10 anos de experiência, busco oferecer um atendimento humanizado e focado na saúde integral da mulher. Minha abordagem combina evidência científica com acolhimento.'
WHERE role = 'therapist' AND (full_name LIKE '%Ana%' OR full_name LIKE '%Amanda%');

UPDATE public.profiles 
SET 
  specialization = 'Pilates Clínico & Postura', 
  education = 'USP - Especialização em Disfunções Pélvicas',
  bio = 'Especialista em reabilitação postural e saúde da mulher através do método Pilates Clínico. Trabalho com foco em ergonomia e fortalecimento do assoalho pélvico.'
WHERE role = 'therapist' AND (full_name LIKE '%Beatriz%' OR full_name LIKE '%Silva%');
