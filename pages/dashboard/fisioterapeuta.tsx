import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Heart, ClipboardList, Calendar, Users, MessageSquare, LogOut, Loader2, Sparkles, Plus, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

export default function TherapistDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [patientsCount, setPatientsCount] = useState(0)
  const [sessionsCount, setSessionsCount] = useState(0)
  const [prescriptionsCount, setPrescriptionsCount] = useState(0)

  useEffect(() => {
    async function loadData() {
      // 1. Obtém o usuário logado
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        router.push('/login')
        return
      }

      // 2. Consulta os dados do perfil
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (userProfile) {
        // Se por acaso o papel não for fisioterapeuta, o middleware protege
        if (userProfile.role !== 'therapist') {
          router.push('/dashboard/paciente')
          return
        }

        // Verifica se completou o onboarding
        const onboardingDone = localStorage.getItem('bella_flora_onboarding_completed') === 'true'
        if (!onboardingDone) {
          // Checa se há exercícios no banco de dados para evitar loops infinitos caso a pessoa já tenha importado em outra máquina
          const { data: dbExercises } = await supabase
            .from('exercises_catalog')
            .select('id')
            .eq('therapist_id', user.id)
            .limit(1)

          const hasLocalExercises = !!localStorage.getItem('bella_flora_custom_exercises')
          
          if ((!dbExercises || dbExercises.length === 0) && !hasLocalExercises) {
            router.push('/dashboard/fisioterapeuta/onboarding')
            return
          } else {
            localStorage.setItem('bella_flora_onboarding_completed', 'true')
          }
        }

        // Load real database metrics for this therapist
        const { data: therapistPatients } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'patient')
          .eq('therapist_id', user.id)

        if (therapistPatients) {
          setPatientsCount(therapistPatients.length)
        }

        const { data: dbRecords } = await supabase
          .from('medical_records')
          .select('patient_id, prescribed_exercises')
          .eq('therapist_id', user.id)

        if (dbRecords) {
          // Total sessions
          setSessionsCount(dbRecords.length)

          // Total prescriptions (records with non-empty exercises)
          let pCount = 0
          dbRecords.forEach(r => {
            if (r.prescribed_exercises && Array.isArray(r.prescribed_exercises) && r.prescribed_exercises.length > 0) {
              pCount++
            }
          })
          setPrescriptionsCount(pCount)
        }

        setProfile(userProfile)
      } else {
        router.push('/escolha-perfil')
      }
      setLoading(false)
    }

    loadData()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff7fd] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#70518d]" />
          <p className="text-sm font-medium text-[#795465]">Acessando sua Área Clínica...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Painel da Fisioterapeuta | Bella Flora Fisio</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <style>{`
          body {
            font-family: 'Manrope', sans-serif;
            background-color: #fff7fd;
          }
        `}</style>
      </Head>

      <div className="min-h-screen w-full bg-[#fff7fd] font-sans antialiased overflow-x-hidden">
        <div className="relative w-full min-h-screen max-w-md mx-auto bg-[#fff7fd] flex flex-col">

          {/* Header */}
          <header className="bg-white px-5 py-3 border-b border-purple-100/30 flex items-center justify-between shrink-0 sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#70518d] to-[#573974] flex items-center justify-center text-white shadow-sm">
                <Heart className="w-4 h-4 text-white fill-current" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-[#70518d]">
                  Bella Flora <span className="text-[#795465] font-light">Fisio</span>
                </span>
                <span className="block text-[8px] text-[#795465] font-semibold uppercase tracking-wider -mt-1">
                  Área da Fisioterapeuta
                </span>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-purple-100 bg-purple-50/20 text-[#795465] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors active:scale-95 text-[10px] font-bold"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </header>

          {/* Main Content Viewport */}
          <main className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5 scrollbar-none pb-24">
            
            {/* Welcome Premium Card */}
            <section className="bg-gradient-to-br from-[#70518d] to-[#573974] p-5 rounded-2xl shadow-md relative overflow-hidden text-white border border-[#70518d]/30">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center px-2 py-0.5 bg-white/20 rounded-full text-[9px] font-bold text-purple-100 mb-2.5 backdrop-blur-sm">
                  <Sparkles className="w-3 h-3 mr-1" />
                  SESSÃO CLÍNICA ATIVA
                </div>
                <h2 className="font-extrabold text-lg leading-tight">Dra. {profile?.full_name || 'Fisioterapeuta'}</h2>
                <p className="text-[11px] text-purple-200/90 font-medium mt-1 leading-relaxed">
                  Gerencie suas consultas do dia, evolua prontuários e prescreva rotinas domiciliares de forma segura.
                </p>
              </div>
            </section>

            {/* Quick Metrics Grid */}
            <section className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-purple-100/20 p-3 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
                <span className="text-[9px] font-bold text-[#795465] uppercase tracking-wider block mb-1">Pacientes</span>
                <span className="font-extrabold text-base text-[#1d1b1f]">{patientsCount}</span>
              </div>
              <div className="bg-white border border-purple-100/20 p-3 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
                <span className="text-[9px] font-bold text-[#795465] uppercase tracking-wider block mb-1">Sessões</span>
                <span className="font-extrabold text-base text-[#1d1b1f]">{sessionsCount}</span>
              </div>
              <div className="bg-white border border-purple-100/20 p-3 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
                <span className="text-[9px] font-bold text-[#795465] uppercase tracking-wider block mb-1">Prescrições</span>
                <span className="font-extrabold text-base text-[#1d1b1f]">{prescriptionsCount}</span>
              </div>
            </section>

            {/* SaaS Actions Section */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between mb-1 pl-1">
                <h3 className="text-xs font-bold text-[#70518d] uppercase tracking-wider">Painel de Controle</h3>
                <button 
                  onClick={() => router.push('/dashboard/fisioterapeuta/prontuario')}
                  className="flex items-center gap-1 px-3 py-1 bg-[#70518d] hover:bg-[#573974] text-white text-[10px] font-bold rounded-full shadow-sm transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Novo Paciente
                </button>
              </div>
              
              {/* Card 1: Meus Pacientes */}
              <div 
                onClick={() => router.push('/dashboard/fisioterapeuta/prontuario')}
                className="bg-white border border-purple-100/20 p-4 rounded-2xl shadow-sm hover:border-[#70518d]/30 transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#70518d] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1d1b1f] text-sm">Meus Pacientes</h4>
                    <p className="text-[10px] text-[#795465] font-semibold">Lista de prontuários e contatos</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#795465]" />
              </div>

              {/* Card 2: Prontuário & Evoluções */}
              <div 
                onClick={() => router.push('/dashboard/fisioterapeuta/prontuario')}
                className="bg-white border border-purple-100/20 p-4 rounded-2xl shadow-sm hover:border-[#70518d]/30 transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#70518d] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1d1b1f] text-sm">Prontuário & Evoluções</h4>
                    <p className="text-[10px] text-[#795465] font-semibold">Lançar novas sessões e notas AFA</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#795465]" />
              </div>

              {/* Card 3: Agenda Clínica */}
              <div 
                className="bg-white border border-purple-100/20 p-4 rounded-2xl shadow-sm hover:border-[#70518d]/30 transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#70518d] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1d1b1f] text-sm">Agenda Clínica</h4>
                    <p className="text-[10px] text-[#795465] font-semibold">Visualização do calendário e horários</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#795465]" />
              </div>

              {/* Card 4: Mensagens Chat */}
              <div 
                onClick={() => router.push('/dashboard/fisioterapeuta/chat')}
                className="bg-white border border-purple-100/20 p-4 rounded-2xl shadow-sm hover:border-[#70518d]/30 transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#70518d] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1d1b1f] text-sm">Mensagens Direct</h4>
                    <p className="text-[10px] text-[#795465] font-semibold">Chat pélvico direto com pacientes</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#795465]" />
              </div>
            </section>

            {/* Account Details */}
            <section className="bg-white border border-purple-100/20 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <h3 className="text-xs font-bold text-[#70518d] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-purple-100/10 select-none">
                <Sparkles className="w-4 h-4" />
                Dados do seu Registro Clínico
              </h3>
              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#795465] font-semibold">Fisioterapeuta:</span>
                  <span className="text-[#1d1b1f] font-bold">Dra. {profile?.full_name || 'Não cadastrado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#795465] font-semibold">Contato cadastrado:</span>
                  <span className="text-[#1d1b1f] font-bold">{profile?.phone || 'Não cadastrado'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#795465] font-semibold">Perfil de Acesso:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-50 text-[#70518d] border border-purple-100/30 font-bold text-[9px] uppercase tracking-wider">
                    Fisioterapeuta Pélvica
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#795465] font-semibold">Licença da Clínica:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[9px] uppercase tracking-wider">
                    Licença Ativa (SaaS)
                  </span>
                </div>
              </div>
            </section>
          </main>

          {/* Bottom Navigation TabBar */}
          <nav className="fixed bottom-0 left-0 right-0 h-[76px] bg-white border-t border-purple-100/30 flex justify-around items-center px-4 pb-safe z-40 select-none max-w-md mx-auto">
            <Link 
              href="/dashboard/fisioterapeuta" 
              className="flex flex-col items-center justify-center text-[#70518d] shrink-0"
            >
              <div className="bg-[#70518d]/10 text-[#70518d] rounded-full px-5 py-1 mb-1">
                <span className="material-symbols-outlined font-bold text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
              </div>
              <span className="text-[9px] font-extrabold">Início</span>
            </Link>
            
            <Link 
              href="/dashboard/fisioterapeuta/prontuario" 
              className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
            >
              <span className="material-symbols-outlined text-lg mb-1">assignment</span>
              <span className="text-[9px] font-semibold">Prontuário</span>
            </Link>
            
            <Link 
              href="/dashboard/fisioterapeuta/chat" 
              className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
            >
              <span className="material-symbols-outlined text-lg mb-1">chat</span>
              <span className="text-[9px] font-semibold">Chat</span>
            </Link>
          </nav>

        </div>
      </div>
    </>
  )
}
