-- ============================================================================
-- BELLA FLORA FISIO — Migration: public.patient_histories & public.patient_documents
-- Only accessible by clinicians ('therapist' role) and admins ('admin' role).
-- Patients do NOT have read or write permissions to these tables.
-- ============================================================================

-- 1. Create Patient Histories (Anamnese & Queixa Principal)
CREATE TABLE IF NOT EXISTS public.patient_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    therapist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    anamnese TEXT NOT NULL,
    queixa_principal TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and indexes for patient_histories
CREATE INDEX IF NOT EXISTS idx_patient_histories_patient ON public.patient_histories(patient_id);
ALTER TABLE public.patient_histories ENABLE ROW LEVEL SECURITY;

-- 2. Create Patient Documents (Exames Complementares)
CREATE TABLE IF NOT EXISTS public.patient_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Geral',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and indexes for patient_documents
CREATE INDEX IF NOT EXISTS idx_patient_documents_patient ON public.patient_documents(patient_id);
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for patient_histories (Clinical Privacy)
-- Only therapist or admin profiles can read/write histories
DROP POLICY IF EXISTS "patient_histories_clinician_access" ON public.patient_histories;
CREATE POLICY "patient_histories_clinician_access" ON public.patient_histories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('therapist', 'admin')
        )
    );

-- 4. RLS Policies for patient_documents (Clinical Privacy)
-- Only therapist or admin profiles can read/write documents
DROP POLICY IF EXISTS "patient_documents_clinician_access" ON public.patient_documents;
CREATE POLICY "patient_documents_clinician_access" ON public.patient_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('therapist', 'admin')
        )
    );

SELECT 'Migration of clinical histories and documents completed successfully!' AS migration_status;
