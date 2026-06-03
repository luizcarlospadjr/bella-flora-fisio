-- SCHEMA DE MIGRAÇÃO POSTGRESQL PARA BELLA FLORA FISIO (SUPABASE)
-- Execute este script no "SQL Editor" do seu painel do Supabase para inicializar as tabelas, RLS e Triggers.

-- Habilita a extensão UUID caso não esteja ativa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. TIPOS ENUM PERSONALIZADOS
-- =========================================================================

-- Função utilitária para criar tipos ENUM caso não existam
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('therapist', 'patient');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
        CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'canceled', 'no_show');
    END IF;
END $$;

-- =========================================================================
-- 2. CRIAÇÃO DAS TABELAS
-- =========================================================================

-- Tabela: PROFILES (Perfis públicos de usuários conectados ao Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'patient',
    full_name TEXT,
    phone TEXT,
    email TEXT,
    avatar_url TEXT,
    crefito TEXT,
    specialty TEXT,
    education TEXT,
    experience TEXT,
    courses TEXT,
    bio TEXT,
    commission TEXT,
    status TEXT DEFAULT 'active',
    scale TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela: APPOINTMENTS (Consultas / Agendamentos)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    status appointment_status NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT chk_different_users CHECK (therapist_id <> patient_id)
);

-- Tabela: MEDICAL_RECORDS (Prontuários e evolução de sessões)
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_number INTEGER NOT NULL CHECK (session_number > 0),
    afa_score TEXT, -- Avaliação Funcional do Assoalho Pélvico (ex: AFA 3/5)
    evolution_notes TEXT NOT NULL,
    prescribed_exercises JSONB DEFAULT '[]'::jsonB, -- Lista de exercícios recomendados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT chk_different_users_records CHECK (therapist_id <> patient_id)
);

-- Tabela: CHAT_MESSAGES (Mensagens com suporte a texto e anexos)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_text TEXT,
    attachment_url TEXT, -- Link do bucket de Storage para imagem/vídeo do exercício
    attachment_type TEXT, -- Tipo de arquivo (ex: 'image/png', 'video/mp4', 'application/pdf')
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT chk_different_users_chat CHECK (sender_id <> receiver_id),
    -- Garante que a mensagem tenha conteúdo OU anexo
    CONSTRAINT chk_message_has_content CHECK (message_text IS NOT NULL OR attachment_url IS NOT NULL)
);

-- =========================================================================
-- 3. CRIAÇÃO DE ÍNDICES PARA ALTA PERFORMANCE
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_therapist ON public.appointments(therapist_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON public.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_receiver ON public.chat_messages(sender_id, receiver_id);

-- =========================================================================
-- 4. CONFIGURAÇÃO DE SEGURANÇA: ROW LEVEL SECURITY (RLS)
-- =========================================================================

-- Ativa RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: PROFILES
CREATE POLICY "Permitir leitura de perfis por qualquer usuário autenticado" 
    ON public.profiles FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir que usuários atualizem seus próprios perfis" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- POLÍTICAS: APPOINTMENTS
CREATE POLICY "Permitir que usuários vejam suas próprias consultas" 
    ON public.appointments FOR SELECT 
    USING (auth.uid() = patient_id OR auth.uid() = therapist_id);

CREATE POLICY "Permitir criação de consultas por usuários autenticados" 
    ON public.appointments FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização de consultas pelos envolvidos" 
    ON public.appointments FOR UPDATE 
    USING (auth.uid() = patient_id OR auth.uid() = therapist_id);

-- POLÍTICAS: MEDICAL_RECORDS (Sigilo Médico Pélvico)
CREATE POLICY "Permitir que pacientes leiam apenas seus próprios prontuários" 
    ON public.medical_records FOR SELECT 
    USING (auth.uid() = patient_id);

CREATE POLICY "Permitir controle total de prontuários por terapeutas" 
    ON public.medical_records FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'therapist'
        )
    );

-- POLÍTICAS: CHAT_MESSAGES
CREATE POLICY "Permitir que usuários leiam seu histórico de mensagens" 
    ON public.chat_messages FOR SELECT 
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Permitir envio de mensagens pelo remetente autenticado" 
    ON public.chat_messages FOR INSERT 
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Permitir marcar mensagens recebidas como lidas" 
    ON public.chat_messages FOR UPDATE 
    USING (auth.uid() = receiver_id);

-- =========================================================================
-- 5. TRIGGER AUTOMÁTICO: CRIAR PERFIL AO REGISTRAR NO SUPABASE AUTH
-- =========================================================================

-- Função que copia o novo usuário para public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, email, avatar_url, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        new.raw_user_meta_data->>'phone',
        new.email,
        new.raw_user_meta_data->>'avatar_url',
        COALESCE((new.raw_user_meta_data->>'role')::user_role, 'patient'::user_role)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger disparado ao criar usuário em auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- 6. BIBLIOTECA DE EXERCÍCIOS CLÍNICOS E MODELOS PERSONALIZADOS
-- =========================================================================

-- Tabela: EXERCISES_CATALOG (Biblioteca personalizada da fisioterapeuta)
CREATE TABLE IF NOT EXISTS public.exercises_catalog (
    id TEXT PRIMARY KEY,
    therapist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subtitle TEXT,
    series INTEGER DEFAULT 3,
    repetitions TEXT DEFAULT '10',
    pause TEXT DEFAULT '30s',
    frequency TEXT DEFAULT '1 vez/dia',
    description TEXT,
    instructions JSONB DEFAULT '[]'::jsonb,
    image_url TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativa RLS
ALTER TABLE public.exercises_catalog ENABLE ROW LEVEL SECURITY;

-- Políticas: EXERCISES_CATALOG
CREATE POLICY "Permitir leitura de exercícios por qualquer usuário autenticado" 
    ON public.exercises_catalog FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir controle total de exercícios pelo terapeuta criador" 
    ON public.exercises_catalog FOR ALL 
    USING (auth.uid() = therapist_id);

