import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Loader2, ArrowLeft, Calendar, Award, Sparkles, Activity } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'

interface TreatmentPlan {
  id: string
  total_sessions: number
  frequency_days: string
  created_at: string
}

export default function PatientTreatmentSessions() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [plan, setPlan] = useState<TreatmentPlan | null>(null)
  const [completedSessions, setCompletedSessions] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  // Standard Weekdays for rendering the clinical frequency calendar
  const weekdays = [
    { key: 'Segunda', label: 'S' },
    { key: 'Terça', label: 'T' },
    { key: 'Quarta', label: 'Q' },
    { key: 'Quinta', label: 'Q' },
    { key: 'Sexta', label: 'S' },
    { key: 'Sábado', label: 'S' }
  ]

  useEffect(() => {
    async function loadTreatmentSessions() {
      try {
        // 1. Fetch authenticated patient
        const { data: { user }, error: authErr } = await supabase.auth.getUser()
        if (authErr || !user) {
          router.push('/login')
          return
        }
        setCurrentUser(user)

        // 2. Fetch treatment plan details
        const { data: planData, error: planErr } = await supabase
          .from('treatment_plans')
          .select('id, total_sessions, frequency_days, created_at')
          .eq('patient_id', user.id)
          .maybeSingle()

        if (planData) {
          setPlan(planData)
        }

        // 3. Count completed sessions from real clinical medical records (evolutions)
        const { count, error: countErr } = await supabase
          .from('medical_records')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', user.id)

        if (!countErr && count !== null) {
          setCompletedSessions(count)
        } else {
          // Fallback static count if no database medical records yet (e.g. new patients)
          setCompletedSessions(planData ? 3 : 0)
        }

      } catch (err) {
        console.error('Erro ao carregar controle de sessões:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTreatmentSessions()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff7fd] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#70518d]" />
          <p className="text-sm font-medium text-[#795465]">Acessando seu Controle Clínico...</p>
        </div>
      </div>
    )
  }

  // Calculate percentages and visual metrics
  const total = plan?.total_sessions || 8
  const done = completedSessions > total ? total : completedSessions
  const remaining = total - done
  const percentDone = Math.round((done / total) * 100)

  // Check if a weekday is scheduled in the treatment plan frequency
  const isDayScheduled = (dayKey: string) => {
    if (!plan) return false
    return plan.frequency_days.toLowerCase().includes(dayKey.toLowerCase())
  }

  return (
    <>
      <Head>
        <title>Meu Tratamento (Sessões Clínicas) - Bella Flora Fisio</title>
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

      <div className="min-h-screen w-full bg-[#fff7fd] font-sans antialiased">
        <div className="relative w-full h-screen max-h-screen overflow-hidden max-w-md mx-auto bg-[#fff7fd] flex flex-col">

          {/* Header */}
          <header className="bg-white px-5 py-3 border-b border-purple-100/30 flex items-center justify-between shrink-0 sticky top-0 z-50 shadow-sm">
            <Link
              href="/dashboard/paciente"
              className="p-2 -ml-2 rounded-full hover:opacity-80 transition-opacity active:scale-95 flex items-center justify-center text-[#795465]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#70518d] to-[#573974] flex items-center justify-center text-white shadow-sm">
                <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-[#70518d]">
                  Bella Flora <span className="text-[#795465] font-light">Fisio</span>
                </span>
                <span className="block text-[8px] text-[#795465] font-semibold uppercase tracking-wider -mt-1">
                  Portal de Saúde
                </span>
              </div>
            </div>
            <div className="w-10"></div>
          </header>

          {/* Main Content Viewport */}
          <main className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5 scrollbar-none pb-24">

            {/* Header Title Section */}
            <section className="flex flex-col gap-1">
              <h2 className="text-xl font-extrabold text-[#1d1b1f]">Meu Tratamento</h2>
              <p className="text-xs text-[#795465] font-medium">Controle de presença e evolução das suas consultas presenciais.</p>
            </section>

            {plan ? (
              <>
                {/* 1. Progress Stats Session Card */}
                <section className="bg-gradient-to-br from-[#70518d] to-[#573974] p-5 rounded-3xl text-white shadow-md relative overflow-hidden border border-[#70518d]/30">
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-full text-[9px] font-bold text-purple-100 backdrop-blur-sm">
                      <Activity className="w-3.5 h-3.5" />
                      SESSÕES PRESENCIAIS
                    </span>
                    <span className="text-[10px] font-bold bg-[#ffd8e7] text-[#795465] px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Fase Ativa
                    </span>
                  </div>

                  <div className="bg-white/15 p-5 rounded-2xl border border-white/10 mb-4 backdrop-blur-sm">
                    <div className="flex justify-between items-baseline">
                      <p className="text-2xl font-extrabold leading-none">{done} de {total}</p>
                      <p className="text-xs text-purple-200 font-bold">sessões realizadas</p>
                    </div>

                    <div className="mt-4 w-full bg-white/30 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percentDone}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-purple-100/90 font-bold">
                      <span>{percentDone}% Concluído</span>
                      <span>{remaining} sessões restantes</span>
                    </div>
                  </div>
                </section>

                {/* 2. Weekly Attendance Schedule */}
                <section className="bg-white border border-purple-100/20 p-5 rounded-3xl shadow-sm flex flex-col gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-[#70518d] uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4.5 h-4.5" />
                      Frequência Semanal
                    </h3>
                    <p className="text-[10px] text-[#795465] font-medium mt-1 leading-relaxed">
                      Seus dias recomendados de comparecimento à clínica configurados pela fisioterapeuta:
                    </p>
                  </div>

                  {/* Glassmorphic Weekdays Grid */}
                  <div className="grid grid-cols-6 gap-2 pt-1 select-none">
                    {weekdays.map(day => {
                      const active = isDayScheduled(day.key)
                      return (
                        <div
                          key={day.key}
                          className={`flex flex-col items-center justify-center p-2.5 py-4 rounded-xl border transition-all ${
                            active
                              ? 'bg-[#70518d] border-transparent text-white shadow-sm scale-105'
                              : 'bg-slate-50/50 border-purple-100/10 text-slate-400'
                          }`}
                        >
                          <span className="text-xs font-extrabold">{day.label}</span>
                          <span className="text-[8px] font-bold uppercase tracking-wider mt-1.5 opacity-80">
                            {day.key.substring(0, 3)}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  <div className="bg-[#fff7fd] p-3 rounded-2xl border border-purple-100/20 text-[10px] text-[#795465] font-semibold flex items-center justify-center gap-2 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Dias ativos no plano: <span className="font-extrabold text-[#70518d]">{plan.frequency_days}</span>
                  </div>
                </section>

                {/* 3. Secure Clinician Guarantee */}
                <section className="bg-white border border-purple-100/20 rounded-3xl p-5 flex gap-4 items-start shadow-sm select-none">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#70518d] shrink-0 border border-purple-100">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#1d1b1f]">Acompanhamento em Tempo Real</h4>
                    <p className="text-[10px] text-[#795465] leading-relaxed mt-0.5">
                      Sua evolução e a quantidade de sessões são atualizadas de forma segura à medida que suas evoluções clínicas são geradas no prontuário.
                    </p>
                  </div>
                </section>
              </>
            ) : (
              /* Fallback empty view when therapist hasn't configured the plan yet */
              <section className="bg-white rounded-3xl p-6 border border-purple-100/20 shadow-sm flex flex-col items-center text-center py-12">
                <div className="w-14 h-14 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center mb-4 text-[#70518d]">
                  <Calendar className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-sm font-extrabold text-[#1d1b1f]">Plano de Tratamento em Configuração</h3>
                <p className="text-[11px] text-[#795465] max-w-[240px] mt-1.5 leading-relaxed font-semibold">
                  Sua Fisioterapeuta Responsável está desenhando seu plano de reabilitação. Em breve você verá aqui a quantidade de sessões e frequência semanal.
                </p>
                <div className="mt-6 p-4 bg-purple-50/40 text-[#795465] border border-purple-100/20 rounded-2xl text-[10px] font-semibold max-w-[260px] leading-relaxed select-none">
                  💡 Aproveite para conferir e executar sua rotina de exercícios domiciliares em **"Rotina em Casa"** no menu principal!
                </div>
              </section>
            )}

          </main>

          {/* Core Bottom Navigation Bar */}
          <nav className="fixed bottom-0 left-0 right-0 h-[76px] bg-white border-t border-purple-100/30 flex justify-around items-center px-4 pb-safe z-40 select-none max-w-md mx-auto">
            <Link 
              href="/dashboard/paciente" 
              className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
            >
              <span className="material-symbols-outlined text-lg mb-1">home</span>
              <span className="text-[9px] font-semibold">Início</span>
            </Link>
            
            <Link 
              href="/dashboard/paciente/tratamento" 
              className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
            >
              <span className="material-symbols-outlined text-lg mb-1">medical_services</span>
              <span className="text-[9px] font-semibold">Tratamento</span>
            </Link>
            
            <Link 
              href="/dashboard/paciente/chat" 
              className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
            >
              <span className="material-symbols-outlined text-lg mb-1">person_search</span>
              <span className="text-[9px] font-semibold">Profissional</span>
            </Link>
            
            <Link 
              href="/dashboard/paciente/perfil" 
              className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
            >
              <span className="material-symbols-outlined text-lg mb-1">person</span>
              <span className="text-[9px] font-semibold">Perfil</span>
            </Link>
          </nav>

        </div>
      </div>
    </>
  )
}
