-- CREATE POLICY FOR THERAPISTS TO UPDATE PATIENT PROFILES
DROP POLICY IF EXISTS "Permitir que terapeutas atualizem perfis de pacientes" ON public.profiles;
CREATE POLICY "Permitir que terapeutas atualizem perfis de pacientes"
    ON public.profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'therapist'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'therapist'
        )
    );
