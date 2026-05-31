import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Loader2, ArrowLeft, Play, Sparkles, Trophy, Clipboard, HelpCircle, Heart } from 'lucide-react'
import { supabase } from '../../../../lib/supabaseClient'

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

export default function ExercisePlayer() {
  const router = useRouter()
  const { id } = router.query
  const [exercise, setExercise] = useState<PrescribedExercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentProgress, setCurrentProgress] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCongrats, setShowCongrats] = useState(false)
  const [buttonState, setButtonState] = useState<'idle' | 'success'>('idle')

  const defaultExercises: PrescribedExercise[] = [
    {
      id: 'ponte_pelvica',
      name: 'Ponte Pélvica',
      subtitle: 'Com respiração diafragmática',
      series: 3,
      repetitions: 12,
      pause: '30s',
      frequency: '3 vezes/dia',
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
    if (!router.isReady) return

    async function loadExercise() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        let exerciseList = defaultExercises

        if (user) {
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
              exerciseList = parsed
            }
          }
        }

        // Tenta encontrar o exercício por ID
        let found = exerciseList.find((ex) => ex.id === id)

        // Se não encontrar por ID de texto e for um índice numérico
        if (!found && typeof id === 'string' && !isNaN(Number(id))) {
          const idx = parseInt(id)
          if (idx >= 0 && idx < exerciseList.length) {
            found = exerciseList[idx]
          }
        }

        // Caso ainda não encontre, fallback para o primeiro exercício default
        if (!found) {
          found = defaultExercises.find((ex) => ex.id === id) || defaultExercises[0]
        }

        setExercise(found)

        // Carrega o progresso atual do Session Storage
        const storageKey = `exercise_${found.id || id}_progress`
        const saved = sessionStorage.getItem(storageKey)
        if (saved) {
          setCurrentProgress(parseInt(saved))
        }
      } catch (err) {
        console.error('Erro ao carregar exercício:', err)
        setExercise(defaultExercises[0])
      } finally {
        setLoading(false)
      }
    }

    loadExercise()
  }, [router.isReady, id])

  if (loading || !exercise) {
    return (
      <div className="min-h-screen bg-[#fff7fd] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#70518d]" />
          <p className="text-sm font-medium text-[#795465]">Preparando seu exercício...</p>
        </div>
      </div>
    )
  }

  // Extrai o número total de sessões recomendadas baseado na frequência ou nas séries
  const parseTotalSessions = (freq: string): number => {
    const match = freq.match(/(\d+)\s*(vezes|vez|x)/i)
    if (match) {
      return parseInt(match[1])
    }
    return exercise.series || 3
  }

  const totalSessions = parseTotalSessions(exercise.frequency)

  const handleComplete = async () => {
    setIsProcessing(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && currentProgress >= totalSessions) {
        const { error } = await supabase.from('exercise_completions').insert({
          patient_id: user.id,
          exercise_id: exercise.id || id,
          exercise_name: exercise.name,
          series_done: exercise.series
        })
        if (error) {
          console.error('Erro ao registrar conclusão no banco:', error)
        }
      }
    } catch (err) {
      console.error('Erro de autenticação:', err)
    }

    setTimeout(() => {
      setIsProcessing(false)
      const storageKey = `exercise_${exercise.id || id}_progress`

      if (currentProgress >= totalSessions) {
        // Alcançou a última sessão -> exibe modal comemorativo
        setShowCongrats(true)
      } else {
        // Registra sessão intermediária, muda botão para sucesso e volta
        const nextProg = currentProgress + 1
        setCurrentProgress(nextProg)
        sessionStorage.setItem(storageKey, String(nextProg))

        setButtonState('success')
        setTimeout(() => {
          router.back()
        }, 800)
      }
    }, 1000)
  }

  const handleResetAndClose = () => {
    const storageKey = `exercise_${exercise.id || id}_progress`
    sessionStorage.setItem(storageKey, '1')
    setCurrentProgress(1)
    setShowCongrats(false)
    router.back()
  }

  return (
    <>
      <Head>
        <title>{exercise.name} - Bella Flora Fisio</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <style>{`
          body {
            font-family: 'Manrope', sans-serif;
            background-color: #fff7fd;
          }
          .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          }
          .glass-player {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          .modal-overlay {
            background-color: rgba(29, 27, 31, 0.4);
            backdrop-filter: blur(4px);
          }
        `}</style>
      </Head>

      <div className="min-h-screen w-full bg-[#fff7fd] font-sans antialiased overflow-x-hidden">
        <div className="relative w-full h-screen max-h-screen overflow-hidden max-w-md mx-auto bg-[#fff7fd] flex flex-col">

          {/* Sticky Header */}
          <header className="sticky top-0 z-50 bg-white px-5 py-3 border-b border-purple-100/30 flex items-center justify-between shrink-0 shadow-sm">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#795465] hover:bg-purple-50 active:scale-95 transition-all -ml-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#70518d] to-[#573974] flex items-center justify-center text-white shadow-sm">
                <Heart className="w-4 h-4 text-white fill-current" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-[#70518d]">
                  Bella Flora <span className="text-[#795465] font-light">Fisio</span>
                </span>
                <span className="block text-[8px] text-[#795465] font-semibold uppercase tracking-wider -mt-1">
                  Exercício
                </span>
              </div>
            </div>
            <div className="w-8"></div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5 pb-32">

            {/* Exercise Large Media Player */}
            <section className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-md group shrink-0">
              {exercise.image_url ? (
                <img
                  alt={exercise.name}
                  className="w-full h-full object-cover grayscale-[10%] group-hover:scale-105 transition-transform duration-700"
                  src={exercise.image_url}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#70518d] to-[#d8b4f8] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[80px] text-white/70" style={{ fontVariationSettings: "'FILL' 0" }}>
                    {exercise.icon || 'self_improvement'}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <button
                  className="glass-player w-16 h-16 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform duration-200 shadow-lg"
                  aria-label="Play exercise animation"
                >
                  <Play className="w-8 h-8 fill-current" />
                </button>
              </div>
              {/* Video Progress Overlay Simulation */}
              <div className="absolute bottom-4 left-4 right-4 h-1 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-[#70518d] w-[35%] rounded-full animate-pulse"></div>
              </div>
            </section>

            {/* Exercise Title & Subtitle */}
            <section className="bg-white rounded-2xl border border-purple-100/20 shadow-sm p-5 flex flex-col gap-1.5">
              <h2 className="text-xl text-[#1d1b1f] font-extrabold">{exercise.name}</h2>
              <p className="text-sm text-[#795465] font-medium leading-relaxed">
                {exercise.description}
              </p>
            </section>

            {/* Exercise Metrics Grid */}
            <section className="grid grid-cols-4 gap-2">
              <div className="bg-white border border-purple-100/20 p-2 py-4 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-1 text-center">
                <span className="material-symbols-outlined text-[#70518d] text-xl">rebase_edit</span>
                <span className="text-base text-[#70518d] font-bold">{exercise.series}</span>
                <span className="text-[9px] font-bold text-[#795465] uppercase tracking-wider">Séries</span>
              </div>

              <div className="bg-white border border-purple-100/20 p-2 py-4 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-1 text-center">
                <span className="material-symbols-outlined text-[#70518d] text-xl">repeat</span>
                <span className="text-base text-[#70518d] font-bold">
                  {typeof exercise.repetitions === 'number' ? exercise.repetitions : exercise.repetitions.split(' ')[0]}
                </span>
                <span className="text-[9px] font-bold text-[#795465] uppercase tracking-wider">Reps</span>
              </div>

              <div className="bg-white border border-purple-100/20 p-2 py-4 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-1 text-center">
                <span className="material-symbols-outlined text-[#70518d] text-xl">timer</span>
                <span className="text-base text-[#70518d] font-bold">{exercise.pause}</span>
                <span className="text-[9px] font-bold text-[#795465] uppercase tracking-wider">Pausas</span>
              </div>

              <div className="bg-white border border-purple-100/20 p-2 py-4 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-1 text-center">
                <span className="material-symbols-outlined text-[#70518d] text-xl">calendar_today</span>
                <span className="text-base text-[#70518d] font-bold">
                  {totalSessions}x
                </span>
                <span className="text-[9px] font-bold text-[#795465] uppercase tracking-wider">Freq</span>
              </div>
            </section>

            {/* Professional Instructions */}
            {exercise.instructions && exercise.instructions.length > 0 && (
              <section className="bg-white rounded-2xl border border-purple-100/20 shadow-sm p-5 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Clipboard className="w-16 h-16 text-[#70518d]" />
                </div>

                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#70518d] font-bold">verified_user</span>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#70518d]">Instruções da Fisioterapeuta</h3>
                </div>

                <ul className="space-y-3 text-xs text-[#795465] leading-relaxed">
                  {exercise.instructions.map((instruction, idx) => (
                    <li key={idx} className="flex gap-2 items-start">
                      <span className="text-[#70518d] font-bold select-none">•</span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Session Progress Counter Tag */}
            <div className="flex justify-center mt-2">
              <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#795465]/10 border border-[#795465]/20 text-[#795465] text-xs font-bold gap-2">
                <span className="w-2 h-2 rounded-full bg-[#795465] animate-pulse"></span>
                {currentProgress <= totalSessions
                  ? `Sessão ${currentProgress} de ${totalSessions}`
                  : `Concluído ${totalSessions} de ${totalSessions}`
                }
              </span>
            </div>
          </main>

          {/* Bottom Action Button */}
          <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center">
            <div className="w-full max-w-md p-4 bg-white/85 backdrop-blur-lg border-t border-purple-100/30">
              {buttonState === 'success' ? (
                <button
                  disabled
                  className="w-full h-[52px] bg-green-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg"
                >
                  <span className="material-symbols-outlined font-bold">check_circle</span>
                  Sessão Registrada!
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={isProcessing}
                  className="w-full h-[52px] bg-[#70518d] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all hover:brightness-105"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined font-bold">task_alt</span>
                      <span>Concluir Exercício</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Celebratory Modal */}
          {showCongrats && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 modal-overlay">
              <div className="bg-white w-full max-w-xs rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center gap-5 border border-purple-100/20 transform scale-100 transition-transform duration-300">
                <div className="w-16 h-16 bg-[#70518d]/10 rounded-full flex items-center justify-center text-[#70518d]">
                  <Trophy className="w-8 h-8" />
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="font-extrabold text-xl text-[#70518d]">Parabéns!</h3>
                  <p className="font-medium text-xs text-[#795465] leading-relaxed">
                    Você concluiu todas as sessões do exercício diário <span className="font-bold text-[#1d1b1f]">{exercise.name}</span>!
                  </p>
                </div>

                <button
                  onClick={handleResetAndClose}
                  className="w-full h-[48px] bg-[#70518d] text-white rounded-full font-bold shadow-md hover:bg-[#573974] active:scale-95 transition-all text-sm"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
