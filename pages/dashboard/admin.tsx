import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Heart, TrendingUp, Users, DollarSign, Activity, ChevronRight, LogOut, Loader2, Sparkles, Award, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

export default function AdminDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAdminData() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          router.push('/login')
          return
        }

        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (userProfile) {
          // If role is not admin, protect route and redirect to proper dashboard
          if (userProfile.role !== 'admin') {
            if (userProfile.role === 'therapist') {
              router.push('/dashboard/fisioterapeuta')
            } else {
              router.push('/dashboard/paciente')
            }
            return
          }
          setProfile(userProfile)
        } else {
          router.push('/escolha-perfil')
        }
      } catch (err) {
        console.error('Erro ao carregar dados administrativos:', err)
      } finally {
        setLoading(false)
      }
    }

    loadAdminData()
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
          <p className="text-sm font-medium text-[#795465]">Acessando Central Administrativa...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Painel Administrativo | Bella Flora Fisio</title>
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
        <div className="relative w-full min-h-screen max-w-md mx-auto bg-[#fff7fd] flex flex-col pb-24">
          
          {/* Header */}
          <header className="bg-white px-5 py-3 border-b border-purple-100/30 flex items-center justify-between shrink-0 sticky top-0 z-50 shadow-sm select-none">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#70518d] to-[#573974] flex items-center justify-center text-white shadow-sm">
                <Heart className="w-4 h-4 text-white fill-current" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-[#70518d]">
                  Bella Flora <span className="text-[#795465] font-light">Fisio</span>
                </span>
                <span className="block text-[8px] text-[#795465] font-semibold uppercase tracking-wider -mt-1">
                  Direção da Clínica
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

          <main className="flex-1 px-5 py-5 flex flex-col gap-5 scrollbar-none">
            
            {/* Welcome Banner Card */}
            <section className="bg-gradient-to-br from-[#70518d] to-[#573974] p-5 rounded-2xl shadow-md relative overflow-hidden text-white border border-[#70518d]/30">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center px-2 py-0.5 bg-white/20 rounded-full text-[9px] font-bold text-purple-100 mb-2.5 backdrop-blur-sm">
                  <Sparkles className="w-3 h-3 mr-1" />
                  PAINEL DO GESTOR
                </div>
                <h2 className="font-extrabold text-lg leading-tight">Olá, {profile?.full_name || 'Gestor'}</h2>
                <p className="text-[11px] text-purple-200/90 font-medium mt-1 leading-relaxed">
                  Gerencie a equipe de fisioterapeutas, analise o faturamento e mantenha o padrão clínico de excelência da sua clínica.
                </p>
              </div>
            </section>

            {/* Core Metrics Grid */}
            <section className="grid grid-cols-2 gap-3.5 select-none">
              <div className="bg-white border border-purple-100/20 p-4 rounded-2xl shadow-sm flex flex-col gap-1 hover:border-[#70518d]/20 transition-all">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                  <DollarSign className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold text-[#795465] uppercase tracking-wider block">Faturamento</span>
                <span className="font-extrabold text-base text-[#1d1b1f]">R$ 14.850</span>
                <span className="text-[8px] font-semibold text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" /> +12% este mês
                </span>
              </div>

              <div className="bg-white border border-purple-100/20 p-4 rounded-2xl shadow-sm flex flex-col gap-1 hover:border-[#70518d]/20 transition-all">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-[#70518d] flex items-center justify-center mb-1">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold text-[#795465] uppercase tracking-wider block">Equipe Clínica</span>
                <span className="font-extrabold text-base text-[#1d1b1f]">4 Terapeutas</span>
                <span className="text-[8px] font-semibold text-[#795465]">28 Pacientes ativos</span>
              </div>

              <div className="bg-white border border-purple-100/20 p-4 rounded-2xl shadow-sm flex flex-col gap-1 hover:border-[#70518d]/20 transition-all">
                <div className="w-7 h-7 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center mb-1">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold text-[#795465] uppercase tracking-wider block">Atendimentos</span>
                <span className="font-extrabold text-base text-[#1d1b1f]">142 Sessões</span>
                <span className="text-[8px] font-semibold text-pink-600">Média de 4.8 por dia</span>
              </div>

              <div className="bg-white border border-purple-100/20 p-4 rounded-2xl shadow-sm flex flex-col gap-1 hover:border-[#70518d]/20 transition-all">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
                  <Award className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold text-[#795465] uppercase tracking-wider block">Taxa de Alta</span>
                <span className="font-extrabold text-base text-[#1d1b1f]">94.2%</span>
                <span className="text-[8px] font-semibold text-blue-600">Alto sucesso clínico</span>
              </div>
            </section>

            {/* Quick Alerts */}
            <section className="bg-white border border-purple-100/20 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <h3 className="text-xs font-bold text-[#70518d] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-purple-100/10 select-none">
                <AlertCircle className="w-4 h-4" />
                Alertas da Clínica
              </h3>
              
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 p-2 bg-purple-50/50 rounded-xl border border-purple-100/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#70518d] mt-1.5 shrink-0"></div>
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-bold text-[#1d1b1f]">Dra. Ana Costa</span> atingiu 90% da capacidade de agenda esta semana.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 bg-emerald-50/40 rounded-xl border border-emerald-100/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                  <div className="text-[11px] leading-relaxed">
                    Faturamento do consultório superou a meta estipulada em <span className="font-bold text-emerald-700">R$ 1.250</span>.
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Actions Portal Links */}
            <section className="flex flex-col gap-3.5">
              <h3 className="text-xs font-bold text-[#70518d] uppercase tracking-wider pl-1 select-none">Atalhos Administrativos</h3>
              
              {/* Navigate: Therapists */}
              <div 
                onClick={() => router.push('/dashboard/admin/terapeutas')}
                className="bg-white border border-purple-100/20 p-4 rounded-2xl shadow-sm hover:border-[#70518d]/30 transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#70518d] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-lg">engineering</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1d1b1f] text-sm">Gerenciar Terapeutas</h4>
                    <p className="text-[10px] text-[#795465] font-semibold">Editar perfis, comissões e escalas</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#795465]" />
              </div>

              {/* Navigate: Patients */}
              <div 
                onClick={() => router.push('/dashboard/admin/pacientes')}
                className="bg-white border border-purple-100/20 p-4 rounded-2xl shadow-sm hover:border-[#70518d]/30 transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#70518d] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-lg">badge</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1d1b1f] text-sm">Diretório de Pacientes</h4>
                    <p className="text-[10px] text-[#795465] font-semibold">Editar status, contatos e transferir profissionais</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#795465]" />
              </div>

              {/* Navigate: Financial */}
              <div 
                onClick={() => router.push('/dashboard/admin/financeiro')}
                className="bg-white border border-purple-100/20 p-4 rounded-2xl shadow-sm hover:border-[#70518d]/30 transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#70518d] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-lg">payments</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1d1b1f] text-sm">Controle Financeiro</h4>
                    <p className="text-[10px] text-[#795465] font-semibold">Relatório de repasses e faturamento</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#795465]" />
              </div>
            </section>

          </main>

          {/* Bottom Navigation TabBar for Administrator */}
          <nav className="fixed bottom-0 left-0 right-0 h-[76px] bg-white border-t border-purple-100/30 flex justify-around items-center px-4 pb-safe z-40 select-none max-w-md mx-auto">
            <Link 
              href="/dashboard/admin" 
              className="flex flex-col items-center justify-center text-[#70518d] shrink-0"
            >
              <div className="bg-[#70518d]/10 text-[#70518d] rounded-full px-5 py-1 mb-1">
                <span className="material-symbols-outlined font-bold text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
              </div>
              <span className="text-[9px] font-extrabold">Início</span>
            </Link>
            
            <Link 
              href="/dashboard/admin/terapeutas" 
              className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
            >
              <span className="material-symbols-outlined text-lg mb-1">engineering</span>
              <span className="text-[9px] font-semibold">Terapeutas</span>
            </Link>

            <Link 
              href="/dashboard/admin/pacientes" 
              className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
            >
              <span className="material-symbols-outlined text-lg mb-1">badge</span>
              <span className="text-[9px] font-semibold">Pacientes</span>
            </Link>
            
            <Link 
              href="/dashboard/admin/financeiro" 
              className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
            >
              <span className="material-symbols-outlined text-lg mb-1">payments</span>
              <span className="text-[9px] font-semibold">Financeiro</span>
            </Link>
          </nav>

        </div>
      </div>
    </>
  )
}
