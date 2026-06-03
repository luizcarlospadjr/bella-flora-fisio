-- =========================================================================
-- MIGRATION: CRIAÇÃO DA TABELA DE TRANSFERÊNCIAS ÉTICAS E AJUSTES DE RLS
-- Execute este script no "SQL Editor" do seu painel do Supabase.
-- =========================================================================

-- 1. Criação da tabela transfer_requests
CREATE TABLE IF NOT EXISTS public.transfer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    current_therapist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_therapist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    justification TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilita RLS
ALTER TABLE public.transfer_requests ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas se existirem para evitar conflitos
DROP POLICY IF EXISTS "Permitir leitura de transferencias por qualquer usuario autenticado" ON public.transfer_requests;
DROP POLICY IF EXISTS "Permitir insercao de transferencias por usuarios autenticados" ON public.transfer_requests;
DROP POLICY IF EXISTS "Permitir atualizacao de transferencias pelos envolvidos ou admin" ON public.transfer_requests;

-- 2. Políticas RLS para transfer_requests
CREATE POLICY "Permitir leitura de transferencias por qualquer usuario autenticado" 
    ON public.transfer_requests FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir insercao de transferencias por usuarios autenticados" 
    ON public.transfer_requests FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir atualizacao de transferencias pelos envolvidos ou admin" 
    ON public.transfer_requests FOR UPDATE 
    USING (auth.uid() = current_therapist_id OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ));

-- 3. Nova Política RLS para profiles: Permitir que administradores (Gestão) atualizem qualquer perfil
-- Isso é fundamental para que o Admin possa definir o terapeuta inicial (quando o paciente está sem)
-- ou redefinir perfis diretamente.
DROP POLICY IF EXISTS "Permitir que admins controlem todos os perfis" ON public.profiles;
CREATE POLICY "Permitir que admins controlem todos os perfis"
    ON public.profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
