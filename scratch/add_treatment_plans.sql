-- ============================================================================
-- BELLA FLORA FISIO — Migration: public.treatment_plans Table + RLS Policies
-- Execute this script in the "SQL Editor" of your Supabase dashboard.
-- ============================================================================

-- 1. Create Treatment Plans Table
CREATE TABLE IF NOT EXISTS public.treatment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    therapist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_sessions INTEGER NOT NULL DEFAULT 8 CHECK (total_sessions > 0),
    frequency_days TEXT NOT NULL DEFAULT 'Segunda, Quarta',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Index for high performance query lookups
CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient ON public.treatment_plans(patient_id);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;

-- 3. Configure Policies for Clinical Privacy
-- Policy A: Patient and therapist can view the treatment plan
DROP POLICY IF EXISTS "treatment_plans_select" ON public.treatment_plans;
CREATE POLICY "treatment_plans_select" ON public.treatment_plans
    FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = therapist_id);

-- Policy B: Only therapists can modify or create treatment plans
DROP POLICY IF EXISTS "treatment_plans_all_therapist" ON public.treatment_plans;
CREATE POLICY "treatment_plans_all_therapist" ON public.treatment_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'therapist'
        )
    );

-- 4. Seed Treatment Plan for the Test Patient (4348e13c-2ba4-4df8-9d90-3aa86b0b1152)
-- Linked to the Demo Therapist (ccea9496-1436-4759-8320-22403dd04f29)
INSERT INTO public.treatment_plans (patient_id, therapist_id, total_sessions, frequency_days, notes)
VALUES (
    '4348e13c-2ba4-4df8-9d90-3aa86b0b1152', 
    'ccea9496-1436-4759-8320-22403dd04f29', 
    10, 
    'Terça, Quinta', 
    '[seed] Reabilitação pós-parto focando em ativação do assoalho pélvico profundo e estabilização de pelve.'
)
ON CONFLICT (patient_id) DO UPDATE 
SET 
    therapist_id = EXCLUDED.therapist_id,
    total_sessions = EXCLUDED.total_sessions,
    frequency_days = EXCLUDED.frequency_days,
    notes = EXCLUDED.notes;

SELECT 'Migration public.treatment_plans successfully completed!' AS migration_status;
