import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Heart, Loader2, Sparkles, Check, ChevronRight, AlertCircle, Info, Database } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'

interface ExerciseTemplate {
  id: string
  name: string
  subtitle: string
  series: number
  repetitions: string
  pause: string
  frequency: string
  description: string
  instructions: string[]
  image_url?: string
  icon?: string
}

// Curated high-quality PT-BR pelvic rehab exercises for immediate fallback and default import
const premiumPelvicExercises: ExerciseTemplate[] = [
  {
    id: 'kegel_basico',
    name: 'Kegel Progressivo',
    subtitle: 'Fortalecimento do assoalho pélvico',
    series: 3,
    repetitions: '10 repetições de 5s',
    pause: '10s',
    frequency: '3 vezes ao dia',
    description: 'Ativação isolada e sustentada das fibras musculares lentas e rápidas do assoalho pélvico para fortalecimento e controle.',
    instructions: [
      'Contraia a musculatura do assoalho pélvico (como se fosse segurar o xixi ou gases).',
      'Mantenha a contração ativa por 5 segundos com respiração normal.',
      'Relaxe completamente por 10 segundos antes da próxima repetição.'
    ],
    icon: 'self_improvement'
  },
  {
    id: 'ponte_pelvica_adutores',
    name: 'Ponte Pélvica com Adução',
    subtitle: 'Ativação sinérgica',
    series: 3,
    repetitions: '12 repetições',
    pause: '30s',
    frequency: '1 vez ao dia',
    description: 'Ponte associada à ativação de adutores (apertando uma bola leve entre os joelhos) para estimular a co-contração do assoalho pélvico.',
    instructions: [
      'Deite-se de costas com os joelhos dobrados e coloque uma almofada ou bola macia entre eles.',
      'Pressione levemente a almofada e eleve o quadril pressionando os calcanhares no chão.',
      'Mantenha o quadril elevado por 2 segundos, contraindo o abdômen e a musculatura pélvica, e retorne lentamente.'
    ],
    icon: 'fitness_center'
  },
  {
    id: 'gato_camelo_mobilidade',
    name: 'Alongamento Gato-Camelo',
    subtitle: 'Mobilidade lombopélvica',
    series: 3,
    repetitions: '10 repetições completas',
    pause: '20s',
    frequency: '2 vezes ao dia',
    description: 'Excelente para liberação de tensões lombopélvicas, auxiliando no alívio de dor e ganho de percepção postural da pelve.',
    instructions: [
      'Fique em quatro apoios com as mãos sob os ombros e joelhos sob os quadris.',
      'Arqueie as costas para cima empurrando o chão e soltando o ar (Gato), relaxando o pescoço.',
      'Inale empurrando o abdômen para baixo e erguendo o peito e o quadril (Camelo).'
    ],
    icon: 'accessibility'
  },
  {
    id: 'respiracao_diafragmatica',
    name: 'Respiração Diafragmática',
    subtitle: 'Controle de pressões e relaxamento',
    series: 2,
    repetitions: '5 minutos',
    pause: 'Sem pausas',
    frequency: '2 vezes ao dia',
    description: 'Respiração profunda voltada para a diminuição da pressão intra-abdominal, promovendo relaxamento e alongamento passivo do assoalho pélvico.',
    instructions: [
      'Deite-se de forma confortável, coloque uma mão no peito e outra no abdômen.',
      'Inspire pelo nariz direcionando o ar para expandir a barriga (a mão no peito se move muito pouco).',
      'Exhale pela boca suavemente, sentindo a barriga esvaziar e o assoalho pélvico relaxar por completo.'
    ],
    icon: 'air'
  },
  {
    id: 'alongamento_sapo',
    name: 'Alongamento de Adutores (Sapo)',
    subtitle: 'Abertura e relaxamento pélvico',
    series: 2,
    repetitions: '45 segundos sustentados',
    pause: '30s',
    frequency: '1 vez ao dia',
    description: 'Foco no relaxamento de adutores de quadril, área que acumula muita tensão reflexa ligada a dores pélvicas crônicas.',
    instructions: [
      'De joelhos sobre um colchonete macio, afaste os joelhos o máximo que conseguir de forma confortável.',
      'Apoie os cotovelos no chão à frente e deslize o quadril ligeiramente para trás.',
      'Respire profundamente, permitindo que a musculatura interna das coxas e da pelve se alongue e relaxe.'
    ],
    icon: 'spa'
  },
  {
    id: 'kegel_rapido',
    name: 'Contrações Rápidas de Kegel',
    subtitle: 'Fibras rápidas (reflexo de tosse/espirro)',
    series: 3,
    repetitions: '10 contrações rápidas',
    pause: '20s',
    frequency: '3 vezes ao dia',
    description: 'Treinamento de contrações curtas e vigorosas voltadas para preparar os músculos contra aumentos súbitos de pressão (tosse, espirro ou risada).',
    instructions: [
      'Realize uma contração rápida e forte da musculatura pélvica.',
      'Relaxe imediatamente e de forma completa.',
      'Repita o ciclo rapidamente até concluir a série, sem segurar a respiração.'
    ],
    icon: 'bolt'
  }
]

export default function TherapistOnboarding() {
  const router = useRouter()
  const [therapist, setTherapist] = useState<any>(null)
  const [exercises, setExercises] = useState<ExerciseTemplate[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [apiSource, setApiSource] = useState<'local' | 'wger'>('local')

  useEffect(() => {
    async function checkTherapist() {
      try {
        const { data: { user }, error: authErr } = await supabase.auth.getUser()
        if (authErr || !user) {
          router.push('/login')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!profile || profile.role !== 'therapist') {
          router.push('/escolha-perfil')
          return
        }

        setTherapist(profile)
        await loadExercises()
      } catch (err) {
        console.error('Erro no onboarding:', err)
        setErrorMsg('Erro ao autenticar perfil. Tente fazer login novamente.')
        setLoading(false)
      }
    }

    checkTherapist()
  }, [])

  // Dynamic fetch to wger API with immediate PT-BR template fallbacks
  const loadExercises = async () => {
    setLoading(true)
    setErrorMsg(null)
    
    // We pre-populate with our high-quality PT-BR pelvic templates
    const combinedList: ExerciseTemplate[] = [...premiumPelvicExercises]
    setSelectedIds(premiumPelvicExercises.map(e => e.id)) // Pre-select all by default

    try {
      // Fetch from wger API (Category 10 is 'Core / Stability' exercises, Language 2 is English)
      const res = await fetch('https://wger.de/api/v2/exercise/?language=2&category=10', {
        headers: { 'Accept': 'application/json' }
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data && data.results && data.results.length > 0) {
          // Format wger results and filter out duplicates
          const wgerExercises = data.results.slice(0, 4).map((item: any) => {
            // Strip HTML tags from description
            const cleanDesc = (item.description || '')
              .replace(/<[^>]*>/g, '')
              .replace(/\s+/g, ' ')
              .trim()
              .substring(0, 150) + '...'

            return {
              id: `wger_${item.id}`,
              name: item.name,
              subtitle: 'Fortalecimento Core (wger API)',
              series: 3,
              repetitions: '12 repetições',
              pause: '45s',
              frequency: '1 vez ao dia',
              description: cleanDesc,
              instructions: [
                'Execute o movimento de maneira controlada.',
                'Mantenha a ativação abdominal constante.',
                'Evite compensações com a região lombar.'
              ],
              icon: 'fitness_center'
            }
          })

          // Merge wger exercises into list (avoiding any duplicate names just in case)
          wgerExercises.forEach((we: ExerciseTemplate) => {
            if (!combinedList.some(e => e.name.toLowerCase() === we.name.toLowerCase())) {
              combinedList.push(we)
              setSelectedIds(prev => [...prev, we.id]) // Pre-select wger too
            }
          })
          setApiSource('wger')
        }
      }
    } catch (apiErr) {
      console.warn('Wger API unreachable (possibly CORS or down). Using premium local templates.', apiErr)
      setApiSource('local')
    } finally {
      setExercises(combinedList)
      setLoading(false)
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleImport = async () => {
    if (selectedIds.length === 0) {
      setErrorMsg('Por favor, selecione pelo menos 1 exercício para importar.')
      return
    }

    setImporting(true)
    setErrorMsg(null)

    const exercisesToImport = exercises.filter(e => selectedIds.includes(e.id))

    try {
      // 1. Insert into Supabase table public.exercises_catalog
      const insertData = exercisesToImport.map(ex => ({
        id: ex.id,
        therapist_id: therapist.id,
        name: ex.name,
        subtitle: ex.subtitle,
        series: ex.series,
        repetitions: ex.repetitions,
        pause: ex.pause,
        frequency: ex.frequency,
        description: ex.description,
        instructions: ex.instructions,
        icon: ex.icon || 'fitness_center'
      }))

      const { error } = await supabase
        .from('exercises_catalog')
        .insert(insertData)

      if (error) {
        // If table doesn't exist, we fallback silently to localStorage to guarantee review functionality
        if (error.code === '42P01') {
          console.warn('Table exercises_catalog missing in Supabase, utilizing localStorage fallback.')
          localStorage.setItem('bella_flora_custom_exercises', JSON.stringify(exercisesToImport))
        } else {
          throw error
        }
      } else {
        // Clear any old local storage items if DB write succeeded
        localStorage.removeItem('bella_flora_custom_exercises')
      }

      // Mark onboarding as completed
      localStorage.setItem('bella_flora_onboarding_completed', 'true')

      // Redirect to Dashboard home
      router.push('/dashboard/fisioterapeuta')
    } catch (err: any) {
      console.error('Erro ao importar exercícios:', err)
      setErrorMsg(err.message || 'Houve um erro técnico ao salvar os exercícios no banco de dados.')
      setImporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff7fd] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#70518d]" />
          <p className="text-sm font-medium text-[#795465]">Consultando catálogo da API wger...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Onboarding Clínica | Bella Flora Fisio</title>
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
        <div className="relative w-full min-h-screen max-w-md mx-auto bg-[#fff7fd] flex flex-col pb-28">
          
          {/* Header */}
          <header className="bg-white px-5 py-4 border-b border-purple-100/30 flex items-center justify-between sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#70518d] to-[#573974] flex items-center justify-center text-white shadow-sm">
                <Heart className="w-4 h-4 text-white fill-current animate-pulse" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-[#70518d]">
                  Bella Flora <span className="text-[#795465] font-light">Fisio</span>
                </span>
                <span className="block text-[8px] text-[#795465] font-semibold uppercase tracking-wider -mt-1">
                  Onboarding do Terapeuta
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 px-5 py-5 flex flex-col gap-4">
            {/* Step Welcome Card */}
            <section className="bg-gradient-to-br from-[#70518d] to-[#573974] p-5 rounded-2xl shadow-md text-white border border-[#70518d]/30 relative overflow-hidden">
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center px-2 py-0.5 bg-white/20 rounded-full text-[9px] font-bold text-purple-100 mb-2.5 backdrop-blur-sm">
                  <Sparkles className="w-3 h-3 mr-1" />
                  PASSO 1 DE 1: SEU CATÁLOGO
                </div>
                <h2 className="font-extrabold text-lg leading-tight">Monte sua Biblioteca!</h2>
                <p className="text-[11px] text-purple-200/90 font-medium mt-1 leading-relaxed">
                  Selecione abaixo os modelos de exercícios padrão que deseja importar para prescrever aos seus pacientes na clínica.
                </p>
              </div>
            </section>

            {/* API Status Alert */}
            <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-100/30 rounded-xl text-[10px] text-[#795465] font-medium select-none">
              {apiSource === 'wger' ? (
                <>
                  <Database className="w-4 h-4 text-[#70518d] shrink-0" />
                  <span>Conectado à <strong>API Aberta wger</strong>. Exercícios de mobilidade e core adicionais importados com sucesso!</span>
                </>
              ) : (
                <>
                  <Info className="w-4 h-4 text-[#70518d] shrink-0" />
                  <span>Modo local ativado. 6 exercícios especializados em Reabilitação Pélvica estão prontos para importação.</span>
                </>
              )}
            </div>

            {errorMsg && (
              <div className="w-full p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-start gap-2 select-none">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Exercise Catalog Grid */}
            <section className="flex flex-col gap-3">
              <h3 className="text-[10px] font-extrabold text-[#70518d] uppercase tracking-wider pl-1 select-none">
                Exercícios Disponíveis ({exercises.length})
              </h3>

              <div className="space-y-3">
                {exercises.map((ex) => {
                  const isSelected = selectedIds.includes(ex.id)
                  return (
                    <div
                      key={ex.id}
                      onClick={() => toggleSelect(ex.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-3 relative select-none ${
                        isSelected 
                          ? 'bg-white border-[#70518d] shadow-[0px_4px_16px_rgba(112,81,141,0.06)]' 
                          : 'bg-white/70 border-purple-100/20 hover:border-[#70518d]/30 hover:bg-white'
                      }`}
                    >
                      {/* Checkbox Icon Indicator */}
                      <div className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center border transition-all ${
                        isSelected 
                          ? 'bg-[#70518d] border-[#70518d] text-white' 
                          : 'border-purple-200 bg-transparent'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                      </div>

                      {/* Info Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-[#1d1b1f] text-sm leading-tight">
                            {ex.name}
                          </h4>
                          {ex.id.startsWith('wger_') && (
                            <span className="text-[8px] font-extrabold bg-[#70518d]/10 text-[#70518d] px-1 rounded">wger API</span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#795465] font-semibold mt-0.5">
                          {ex.subtitle}
                        </p>
                        <p className="text-[11px] text-[#4b454e] mt-2 leading-relaxed">
                          {ex.description}
                        </p>

                        {/* Prescription specs tags preview */}
                        <div className="flex gap-2 flex-wrap mt-3 text-[9px] font-bold text-[#795465] uppercase tracking-wider">
                          <span className="bg-[#fff7fd] border border-purple-100/20 px-2 py-0.5 rounded-md">
                            {ex.series} séries
                          </span>
                          <span className="bg-[#fff7fd] border border-purple-100/20 px-2 py-0.5 rounded-md">
                            {ex.repetitions}
                          </span>
                          <span className="bg-[#fff7fd] border border-purple-100/20 px-2 py-0.5 rounded-md">
                            Pausa: {ex.pause}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </main>

          {/* Sticky Bottom Actions */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 border-t border-purple-100/30 backdrop-blur-md z-45 max-w-md mx-auto select-none">
            <button
              onClick={handleImport}
              disabled={importing || selectedIds.length === 0}
              className="w-full h-12 bg-[#70518d] hover:bg-[#573974] text-white font-extrabold text-sm rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {importing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Importando exercícios...
                </>
              ) : (
                <>
                  Importar selecionados ({selectedIds.length})
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
