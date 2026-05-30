-- ============================================================================
-- BELLA FLORA FISIO — Migration: support tables, columns, storage, RLS
-- Idempotent. Safe to re-run. Additive only (no drops of existing data).
-- ============================================================================

-- 1) APPOINTMENTS: pricing + service type for booking/financials -------------
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS service TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 50;

-- 2) EXERCISE_COMPLETIONS: patient marks a prescribed exercise as done --------
CREATE TABLE IF NOT EXISTS public.exercise_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL,
    exercise_name TEXT,
    series_done INTEGER,
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_completions_patient ON public.exercise_completions(patient_id);
CREATE INDEX IF NOT EXISTS idx_completions_date ON public.exercise_completions(completed_at);
ALTER TABLE public.exercise_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "completions_patient_all" ON public.exercise_completions;
CREATE POLICY "completions_patient_all" ON public.exercise_completions
    FOR ALL USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "completions_therapist_read" ON public.exercise_completions;
CREATE POLICY "completions_therapist_read" ON public.exercise_completions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'therapist')
    );

-- 3) PAIN_LOGS: structured pain tracking (replaces chat-message scraping) -----
CREATE TABLE IF NOT EXISTS public.pain_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    level INTEGER NOT NULL CHECK (level >= 0 AND level <= 10),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_pain_patient ON public.pain_logs(patient_id);
ALTER TABLE public.pain_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pain_patient_all" ON public.pain_logs;
CREATE POLICY "pain_patient_all" ON public.pain_logs
    FOR ALL USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "pain_therapist_read" ON public.pain_logs;
CREATE POLICY "pain_therapist_read" ON public.pain_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'therapist')
    );

-- 4) STORAGE: 'media' bucket for chat attachments & avatars -------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "media_authenticated_read" ON storage.objects;
CREATE POLICY "media_authenticated_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_authenticated_insert" ON storage.objects;
CREATE POLICY "media_authenticated_insert" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "media_owner_update" ON storage.objects;
CREATE POLICY "media_owner_update" ON storage.objects
    FOR UPDATE USING (bucket_id = 'media' AND auth.uid() = owner);

DROP POLICY IF EXISTS "media_owner_delete" ON storage.objects;
CREATE POLICY "media_owner_delete" ON storage.objects
    FOR DELETE USING (bucket_id = 'media' AND auth.uid() = owner);

-- Report
SELECT json_build_object(
  'appointments_cols', (SELECT json_agg(column_name ORDER BY column_name) FROM information_schema.columns WHERE table_schema='public' AND table_name='appointments' AND column_name IN ('service','price','duration_minutes')),
  'new_tables', (SELECT json_agg(table_name ORDER BY table_name) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('exercise_completions','pain_logs')),
  'bucket', (SELECT id FROM storage.buckets WHERE id='media'),
  'new_policies', (SELECT json_agg(policyname ORDER BY policyname) FROM pg_policies WHERE policyname LIKE 'completions_%' OR policyname LIKE 'pain_%' OR policyname LIKE 'media_%')
) AS migration_result;
