import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { User, Stethoscope, HelpCircle, Loader2, AlertCircle, ShieldAlert } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function EscolhaPerfil() {
  const router = useRouter()
  const [sessionUser, setSessionUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null) // 'patient', 'therapist' ou 'admin'
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    async function checkUser() {
      // 1. Obtém o usuário ativo do Supabase
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        console.warn('Nenhum usuário logado. Redirecionando para login...')
        router.push('/login')
        return
      }

      setSessionUser(user)

      // 2. Verifica se o usuário já possui um cargo definido para evitar refazer a escolha
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile && profile.role) {
        if (profile.role === 'admin') {
          router.push('/dashboard/admin')
        } else if (profile.role === 'therapist') {
          const onboardingDone = localStorage.getItem('bella_flora_onboarding_completed') === 'true'
          if (onboardingDone) {
            router.push('/dashboard/fisioterapeuta')
          } else {
            router.push('/dashboard/fisioterapeuta/onboarding')
          }
        } else {
          router.push('/dashboard/paciente')
        }
      } else {
        setLoading(false)
      }
    }

    checkUser()
  }, [router])

  const selectRole = async (role: 'patient' | 'therapist' | 'admin') => {
    if (!sessionUser) return
    setErrorMsg(null)
    setUpdating(role)

    try {
      // Atualiza o cargo na tabela public.profiles
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', sessionUser.id)

      if (error) throw error

      // Redireciona para o dashboard correto
      if (role === 'admin') {
        router.push('/dashboard/admin')
      } else if (role === 'therapist') {
        router.push('/dashboard/fisioterapeuta/onboarding')
      } else {
        router.push('/dashboard/paciente')
      }
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err)
      setErrorMsg(err.message || 'Falha ao salvar seu perfil. Tente novamente.')
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff7fd] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#70518d]" />
          <p className="text-sm font-medium text-[#795465]">Carregando seu perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Escolha de Perfil | Bella Flora Fisio</title>
        <meta name="description" content="Selecione seu tipo de perfil de acesso no Bella Flora Fisio." />
      </Head>

      <div className="min-h-screen bg-[#fff7fd] text-[#1d1b1f] flex flex-col items-center justify-center p-4">
        {/* Header Title */}
        <header className="mb-6 text-center">
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#70518d] tracking-tight">
            Escolha de Perfil
          </h1>
          <p className="text-xs font-semibold text-[#795465] uppercase tracking-wider mt-1">
            Bella Flora Fisio
          </p>
        </header>

        {/* Main Content Card */}
        <main className="w-full max-w-md bg-white border border-[#cdc3cf]/60 rounded-3xl p-8 shadow-[0px_4px_24px_rgba(112,81,141,0.06)] flex flex-col items-center relative overflow-hidden">
          
          {/* Botanical / Spa Header Graphic */}
          <div className="w-full h-44 bg-[#f9f1f7] rounded-2xl mb-6 overflow-hidden flex items-center justify-center relative border border-[#cdc3cf]/30">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#d8b4f8]/20 to-[#fdcde1]/20"></div>
            <span className="material-symbols-outlined text-[64px] text-[#70518d]/30 animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
          </div>

          <p className="text-sm text-[#4b454e] text-center mb-6 leading-relaxed">
            Bem-vindo à Bella Flora Fisio. Por favor, selecione seu tipo de acesso para continuarmos sua jornada de saúde.
          </p>

          {errorMsg && (
            <div className="w-full p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium flex items-start gap-2 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="w-full space-y-4">
            {/* Button: Patient */}
            <button
              onClick={() => selectRole('patient')}
              disabled={updating !== null}
              className="w-full h-[52px] rounded-2xl bg-[#70518d] text-white font-bold text-sm flex items-center justify-center gap-2.5 hover:bg-[#573974] active:scale-[0.98] transition-all shadow-md disabled:opacity-50 disabled:pointer-events-none"
            >
              {updating === 'patient' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Configurando...
                </>
              ) : (
                <>
                  <User className="w-5 h-5" />
                  Sou Paciente
                </>
              )}
            </button>

            {/* Button: Therapist */}
            <button
              onClick={() => selectRole('therapist')}
              disabled={updating !== null}
              className="w-full h-[52px] rounded-2xl bg-white text-[#795465] font-bold text-sm flex items-center justify-center gap-2.5 border-2 border-[#795465]/30 hover:bg-[#fdcde1]/15 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:pointer-events-none"
            >
              {updating === 'therapist' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#795465]" />
                  Configurando...
                </>
              ) : (
                <>
                  <Stethoscope className="w-5 h-5" />
                  Sou Fisioterapeuta
                </>
              )}
            </button>

            {/* Button: Admin */}
            <button
              onClick={() => selectRole('admin')}
              disabled={updating !== null}
              className="w-full h-[52px] rounded-2xl bg-white text-[#70518d] font-bold text-sm flex items-center justify-center gap-2.5 border-2 border-[#70518d]/30 hover:bg-[#70518d]/5 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:pointer-events-none"
            >
              {updating === 'admin' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#70518d]" />
                  Configurando...
                </>
              ) : (
                <>
                  <ShieldAlert className="w-5 h-5" />
                  Sou Gestor de Clínica
                </>
              )}
            </button>
          </div>

          {/* Help Link */}
          <div className="mt-8">
            <a
              href="#"
              className="text-xs font-bold text-[#70518d] hover:text-[#573974] hover:underline flex items-center justify-center gap-1"
            >
              <HelpCircle className="w-4 h-4" />
              Precisa de ajuda com o acesso?
            </a>
          </div>
        </main>
      </div>
    </>
  )
}
