import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Loader2, ArrowLeft, Play, Sparkles, Heart } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'

interface PrescribedExercise {
  id: string
  name: string
  subtitle: string
  series: number
  repetitions: string | number
  pause: string
  frequency: string
  description: string
  instructions: string[]
  icon?: string
  image_url?: string
}

export default function PatientTreatment() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [exercises, setExercises] = useState<PrescribedExercise[]>([])
  const [loading, setLoading] = useState(true)

  // Default exercises array representing initial state in case DB has no records yet
  const defaultExercises: PrescribedExercise[] = [
    {
      id: 'ponte_pelvica',
      name: 'Ponte Pélvica',
      subtitle: 'Com respiração diafragmática',
      series: 3,
      repetitions: 12,
      pause: '30s',
      frequency: '1 vez/dia',
      description: 'Trabalho de fortalecimento e estabilização para o assoalho pélvico e glúteos, essencial para a recuperação postural.',
      instructions: [
        'Mantenha a respiração fluida, evitando bloquear o ar durante a subida.',
        'Mantenha o abdômen contraído para proteger a lombar.',
        'Pressione os calcanhares contra o chão para ativar os glúteos corretamente.'
      ],
      image_url: '/assets/img/pelvic_bridge_exercise.png'
    },
    {
      id: 'alongamento_borboleta',
      name: 'Alongamento Borboleta',
      subtitle: 'Foco em relaxamento',
      series: 2,
      repetitions: '30 Segundos',
      pause: '30s',
      frequency: '2 vezes/dia',
      description: 'Exercício focado em alongamento e relaxamento dos adutores do quadril e relaxamento global.',
      instructions: [
        'Mantenha uma postura ereta e relaxada.',
        'Deixe os joelhos caírem suavemente para os lados.',
        'Respire profundamente na região abdominal.'
      ],
      icon: 'self_improvement'
    }
  ]

  useEffect(() => {
    async function loadTreatment() {
      try {
        // 1. Obtém o usuário logado
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          router.push('/login')
          return
        }
        setCurrentUser(user)

        // 2. Consulta o prontuário de evolução mais recente (tabela medical_records)
        const { data: latestRecord } = await supabase
          .from('medical_records')
          .select('prescribed_exercises')
          .eq('patient_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (latestRecord && latestRecord.prescribed_exercises) {
          let parsed: PrescribedExercise[] = []
          if (typeof latestRecord.prescribed_exercises === 'string') {
            parsed = JSON.parse(latestRecord.prescribed_exercises)
          } else {
            parsed = latestRecord.prescribed_exercises as unknown as PrescribedExercise[]
          }

          if (parsed && parsed.length > 0) {
            setExercises(parsed)
          } else {
            setExercises(defaultExercises)
          }
        } else {
          // Se não houver prontuário com exercícios, usa a prescrição padrão (default)
          setExercises(defaultExercises)
        }
      } catch (err) {
        console.error('Erro ao carregar plano de tratamento:', err)
        setExercises(defaultExercises)
      } finally {
        setLoading(false)
      }
    }

    loadTreatment()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff7fd] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#70518d]" />
          <p className="text-sm font-medium text-[#795465]">Carregando seu plano de tratamento...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Plano de Tratamento - Bella Flora Fisio</title>
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
              className="p-2 -ml-2 rounded-full hover:opacity-80 transition-opacity active:scale-95 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-[#795465]" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#70518d] to-[#573974] flex items-center justify-center text-white shadow-sm">
                <Heart className="w-4 h-4 text-white fill-current" />
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

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5 scrollbar-none pb-24">

            {/* Header Title Section */}
            <section className="flex flex-col gap-1">
              <h2 className="text-2xl text-[#1d1b1f] font-extrabold">Tratamento</h2>
              <p className="text-xs text-[#795465] font-medium">Acompanhe seu progresso e exercícios ativos domiciliares.</p>
            </section>

            {/* Treatment Phase Stats Card */}
            <section className="bg-gradient-to-br from-[#d8b4f8] to-[#f0dbff] p-5 rounded-2xl shadow-sm relative overflow-hidden border border-[#cdc3cf]/30">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 right-0 p-4 opacity-10 flex items-center justify-center text-[#70518d]">
                <span className="material-symbols-outlined text-[80px]" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
              </div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center px-3 py-1 bg-white/40 rounded-full text-[10px] font-bold text-[#1d1b1f] mb-3 backdrop-blur-sm">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-[#70518d]" /> Fase Ativa
                </div>
                <h3 className="text-lg text-[#1d1b1f] font-extrabold mb-1">Recuperação Pélvica</h3>
                <p className="text-xs text-[#1d1b1f]/85 font-medium">Semana 3 de 8</p>
                
                <div className="mt-3 w-full bg-white/30 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#70518d] h-full rounded-full" style={{ width: '35%' }}></div>
                </div>
                <p className="text-[10px] text-[#1d1b1f] font-bold mt-2 text-right">35% concluído</p>
              </div>
            </section>

            {/* Daily Exercises Feed */}
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#70518d] uppercase tracking-wider">Exercícios Diários</h4>
                <span className="text-[10px] font-bold bg-[#ffd8e7] text-[#795465] px-2.5 py-1 rounded-full shadow-sm">
                  {exercises.length} Atividades
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {exercises.map((exercise, index) => (
                  <div 
                    key={exercise.id || index}
                    className="flex gap-4 p-4 bg-white border border-purple-100/20 rounded-2xl shadow-sm active:scale-[0.98] transition-transform duration-200"
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-purple-50 border border-[#cdc3cf]/20 flex items-center justify-center text-[#70518d]/70">
                      {exercise.image_url ? (
                        <img 
                          alt={exercise.name} 
                          className="w-full h-full object-cover" 
                          src={exercise.image_url} 
                        />
                      ) : (
                        <span className="material-symbols-outlined text-[40px] text-[#70518d]/50" style={{ fontVariationSettings: "'FILL' 0" }}>
                          {exercise.icon || 'self_improvement'}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col justify-center flex-1 min-w-0">
                      <h5 className="text-sm text-[#1d1b1f] font-bold truncate">{exercise.name}</h5>
                      <p className="text-[11px] text-[#795465] font-medium mt-0.5 truncate">{exercise.subtitle}</p>
                      
                      <div className="flex gap-1.5 mt-2">
                        <span className="text-[9px] font-bold bg-[#fff7fd] text-[#795465] px-2 py-0.5 rounded-md border border-[#cdc3cf]/20">
                          {exercise.series} Séries
                        </span>
                        <span className="text-[9px] font-bold bg-[#fff7fd] text-[#795465] px-2 py-0.5 rounded-md border border-[#cdc3cf]/20">
                          {typeof exercise.repetitions === 'number' ? `${exercise.repetitions} Reps` : exercise.repetitions}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center">
                      <Link 
                        href={`/dashboard/paciente/exercicio/${exercise.id || index}`}
                        className="w-8 h-8 rounded-full bg-[#d8b4f8] text-[#1d1b1f] flex items-center justify-center hover:bg-[#70518d] hover:text-white transition-colors cursor-pointer shadow-sm active:scale-90" 
                        aria-label={`Iniciar ${exercise.name}`}
                      >
                        <Play className="w-4 h-4 text-[#70518d] fill-current" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>

          {/* Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto h-[76px] bg-white border-t border-purple-100/30 flex justify-around items-center px-4 pb-safe z-50 select-none">
            <Link 
              href="/dashboard/paciente" 
              className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
            >
              <span className="material-symbols-outlined text-lg mb-1">home</span>
              <span className="text-[9px] font-semibold">Início</span>
            </Link>
            
            <Link 
              href="/dashboard/paciente/tratamento" 
              className="flex flex-col items-center justify-center text-[#70518d] shrink-0"
            >
              <div className="bg-[#70518d]/10 text-[#70518d] rounded-full px-5 py-1 mb-1">
                <span className="material-symbols-outlined font-bold text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
              </div>
              <span className="text-[9px] font-extrabold">Tratamento</span>
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
