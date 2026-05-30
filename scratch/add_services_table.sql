-- CREATE CLINIC SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.clinic_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    summary TEXT,
    duration TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    therapist_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.clinic_services ENABLE ROW LEVEL SECURITY;

-- Select policies
DROP POLICY IF EXISTS "clinic_services_public_read" ON public.clinic_services;
CREATE POLICY "clinic_services_public_read" ON public.clinic_services FOR SELECT USING (true);

-- Admin control policies
DROP POLICY IF EXISTS "clinic_services_admin_all" ON public.clinic_services;
CREATE POLICY "clinic_services_admin_all" ON public.clinic_services FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Seed initial services if table is empty
INSERT INTO public.clinic_services (name, icon, summary, duration, price)
SELECT 'Fisioterapeuta Pélvica', 'pregnant_woman', 'Atendimento especializado em fisioterapia pélvica e saúde íntima.', '50 minutos', 180.00
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_services WHERE name = 'Fisioterapeuta Pélvica');

INSERT INTO public.clinic_services (name, icon, summary, duration, price)
SELECT 'Massoterapia', 'spa', 'Massagem terapêutica para alívio de dores e relaxamento muscular.', '60 minutos', 150.00
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_services WHERE name = 'Massoterapia');

INSERT INTO public.clinic_services (name, icon, summary, duration, price)
SELECT 'Acupuntura', 'acupuncture', 'Técnica milenar chinesa para equilíbrio físico e energético.', '50 minutos', 160.00
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_services WHERE name = 'Acupuntura');

INSERT INTO public.clinic_services (name, icon, summary, duration, price)
SELECT 'Pilates Clínico', 'fitness_center', 'Pilates focado em reabilitação postural e fortalecimento pélvico.', '45 minutos', 140.00
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_services WHERE name = 'Pilates Clínico');
