import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Loader2, Sparkles, Check, ChevronRight, AlertCircle, Info, Database, User, Award, Phone } from 'lucide-react'
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

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=150', // Female doctor/therapist 1
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150', // Professional woman 1
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150', // Female doctor/therapist 2
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=150', // Male professional 1
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150', // Male professional 2
]

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
  
  // Navigation wizard steps
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)

  // Step 1: Profile form fields
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [crefito, setCrefito] = useState('')
  const [specialty, setSpecialty] = useState('Fisioterapia Pélvica')
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0])
  const [education, setEducation] = useState('')
  const [experience, setExperience] = useState('')
  const [courses, setCourses] = useState('')
  const [bio, setBio] = useState('')

  // Step 2: Exercises catalog states
  const [exercises, setExercises] = useState<ExerciseTemplate[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [apiSource, setApiSource] = useState<'local' | 'wger'>('local')

  // Global UX states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

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
        
        // Pre-populate fields from existing database profiles
        setFullName(profile.full_name || '')
        setPhone(profile.phone || '')
        setSelectedAvatar(profile.avatar_url || PRESET_AVATARS[0])
        setEducation(profile.education || '')
        setExperience(profile.experience || '')
        setCourses(profile.courses || '')
        setBio(profile.bio || '')
        
        // Check user auth metadata fallback
        const userMeta = user.user_metadata || {}
        if (!profile.crefito) setCrefito(userMeta.crefito || '')
        else setCrefito(profile.crefito)
        
        if (!profile.specialty) setSpecialty(userMeta.specialty || 'Fisioterapia Pélvica')
        else setSpecialty(profile.specialty)
        
        if (!profile.education) setEducation(userMeta.education || '')
        if (!profile.experience) setExperience(userMeta.experience || '')
        if (!profile.courses) setCourses(userMeta.courses || '')
        if (!profile.bio) setBio(userMeta.bio || '')

        await loadExercises()
      } catch (err) {
        console.error('Erro no onboarding:', err)
        setErrorMsg('Erro ao autenticar perfil. Tente fazer login novamente.')
        setLoading(false)
      }
    }

    checkTherapist()
  }, [])

  const loadExercises = async () => {
    setLoading(true)
    setErrorMsg(null)
    
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
          const wgerExercises = data.results.slice(0, 4).map((item: any) => {
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

          wgerExercises.forEach((we: ExerciseTemplate) => {
            if (!combinedList.some(e => e.name.toLowerCase() === we.name.toLowerCase())) {
              combinedList.push(we)
              setSelectedIds(prev => [...prev, we.id])
            }
          })
          setApiSource('wger')
        }
      }
    } catch (apiErr) {
      console.warn('Wger API unreachable. Using premium local templates.', apiErr)
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

  const handleSaveProfileStep = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !phone.trim() || !crefito.trim() || !education.trim() || !experience.trim() || !bio.trim()) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios (Nome, Celular, CREFITO, Formação, Tempo de Atuação e Bio).')
      return
    }

    setSaving(true)
    setErrorMsg(null)

    try {
      // 1. Try to update public.profiles in database with all custom fields first
      try {
        const { error: profileErr } = await supabase
          .from('profiles')
          .update({
            full_name: fullName.trim(),
            phone: phone.trim(),
            avatar_url: selectedAvatar,
            crefito: crefito.trim(),
            specialty: specialty,
            education: education.trim(),
            experience: experience.trim(),
            courses: courses.trim(),
            bio: bio.trim()
          })
          .eq('id', therapist.id)

        if (profileErr) {
          if (profileErr.message.includes('column') || profileErr.message.includes('schema cache')) {
            console.warn('Custom columns missing in profiles table. Updating standard columns.')
            const { error: fallbackErr } = await supabase
              .from('profiles')
              .update({
                full_name: fullName.trim(),
                phone: phone.trim(),
                avatar_url: selectedAvatar
              })
              .eq('id', therapist.id)

            if (fallbackErr) throw fallbackErr
          } else {
            throw profileErr
          }
        }
      } catch (err) {
        console.warn('Database profiles update failed, falling back to standard columns:', err)
        const { error: fallbackErr } = await supabase
          .from('profiles')
          .update({
            full_name: fullName.trim(),
            phone: phone.trim(),
            avatar_url: selectedAvatar
          })
          .eq('id', therapist.id)

        if (fallbackErr) throw fallbackErr
      }

      // 2. Update user auth metadata
      const { error: authErr } = await supabase.auth.updateUser({
        data: {
          crefito: crefito.trim(),
          specialty: specialty,
          education: education.trim(),
          experience: experience.trim(),
          courses: courses.trim(),
          bio: bio.trim()
        }
      })

      if (authErr) throw authErr

      // Save to localStorage for immediate session hydration
      localStorage.setItem('bella_flora_therapist_crefito', crefito.trim())
      localStorage.setItem('bella_flora_therapist_specialty', specialty)
      localStorage.setItem('bella_flora_therapist_education', education.trim())
      localStorage.setItem('bella_flora_therapist_experience', experience.trim())
      localStorage.setItem('bella_flora_therapist_courses', courses.trim())
      localStorage.setItem('bella_flora_therapist_bio', bio.trim())

      setCurrentStep(2)
    } catch (err: any) {
      console.error('Erro ao atualizar dados do perfil:', err)
      setErrorMsg(err.message || 'Erro ao salvar dados do perfil. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleImportExercises = async () => {
    if (selectedIds.length === 0) {
      setErrorMsg('Por favor, selecione pelo menos 1 exercício para importar.')
      return
    }

    setSaving(true)
    setErrorMsg(null)

    const exercisesToImport = exercises.filter(e => selectedIds.includes(e.id))

    try {
      const insertData = exercisesToImport.map(ex => ({
        id: `${ex.id}_${therapist.id}`,
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
        if (error.code === '42P01') {
          console.warn('Table exercises_catalog missing in Supabase, utilizing localStorage fallback.')
          localStorage.setItem('bella_flora_custom_exercises', JSON.stringify(insertData))
        } else {
          throw error
        }
      } else {
        localStorage.removeItem('bella_flora_custom_exercises')
      }

      // Mark onboarding as completed
      localStorage.setItem('bella_flora_onboarding_completed', 'true')

      // Redirect to Dashboard home
      router.push('/dashboard/fisioterapeuta')
    } catch (err: any) {
      console.error('Erro ao importar exercícios:', err)
      setErrorMsg(err.message || 'Houve um erro técnico ao salvar os exercícios no banco de dados.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff7fd] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#70518d]" />
          <p className="text-sm font-medium text-[#795465]">Consultando catálogo da clínica...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Completar Cadastro Profissional | Bella Flora Fisio</title>
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
                <span className="material-symbols-outlined text-white text-base animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
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
            <section className="bg-gradient-to-br from-[#70518d] to-[#573974] p-5 rounded-2xl shadow-md text-white border border-[#70518d]/30 relative overflow-hidden select-none">
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center px-2 py-0.5 bg-white/20 rounded-full text-[9px] font-bold text-purple-100 mb-2.5 backdrop-blur-sm">
                  <Sparkles className="w-3 h-3 mr-1" />
                  PASSO {currentStep} DE 2: {currentStep === 1 ? 'SEU REGISTRO' : 'BIBLIOTECA'}
                </div>
                <h2 className="font-extrabold text-lg leading-tight">
                  {currentStep === 1 ? 'Complete seu Registro!' : 'Monte seu Catálogo!'}
                </h2>
                <p className="text-[11px] text-purple-200/90 font-medium mt-1 leading-relaxed">
                  {currentStep === 1 
                    ? 'Preencha seus dados de contato, registro do CREFITO, currículo e escolha uma foto profissional para seus pacientes identificarem você.'
                    : 'Selecione abaixo os modelos de exercícios padrão que deseja importar para prescrever aos seus pacientes na clínica.'}
                </p>
              </div>
            </section>

            {errorMsg && (
              <div className="w-full p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-start gap-2 select-none">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 1: FORM FLOW */}
            {currentStep === 1 ? (
              <form onSubmit={handleSaveProfileStep} className="flex flex-col gap-4">
                
                {/* 1. Basic Info Card */}
                <div className="flex flex-col gap-3.5 bg-white p-4 rounded-2xl border border-purple-100/20 shadow-sm">
                  <h3 className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5 select-none border-b border-purple-100/10 pb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">badge</span>
                    Identificação Básica
                  </h3>

                  {/* Full Name */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-[#795465] uppercase tracking-wider pl-0.5 flex items-center gap-1">
                      Nome Completo
                    </label>
                    <input 
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ex: Dra. Amanda Cardoso"
                      className="h-10 px-3.5 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full bg-slate-50/30"
                    />
                  </div>

                  {/* Phone & CREFITO */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-[#795465] uppercase tracking-wider pl-0.5 flex items-center gap-1">
                        Celular / WhatsApp
                      </label>
                      <input 
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ex: (11) 98888-8888"
                        className="h-10 px-3.5 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full bg-slate-50/30"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-[#795465] uppercase tracking-wider pl-0.5 flex items-center gap-1">
                        Registro CREFITO
                      </label>
                      <input 
                        type="text"
                        required
                        value={crefito}
                        onChange={(e) => setCrefito(e.target.value)}
                        placeholder="Ex: 123456-F"
                        className="h-10 px-3.5 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full bg-slate-50/30"
                      />
                    </div>
                  </div>

                  {/* Principal Specialty */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-[#795465] uppercase tracking-wider pl-0.5 flex items-center gap-1">
                      Especialidade Principal
                    </label>
                    <select
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="h-10 px-3.5 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full bg-slate-50/30 cursor-pointer"
                    >
                      <option value="Fisioterapia Pélvica">Fisioterapia Pélvica & Uroginecologia</option>
                      <option value="Saúde da Mulher">Saúde da Mulher & Obstetrícia</option>
                      <option value="Pilates Clínico">Pilates Clínico & Reabilitação</option>
                      <option value="Osteopatia Pélvica">Osteopatia Lombopélvica</option>
                    </select>
                  </div>
                </div>

                {/* 2. Education & Professional Credentials Card */}
                <div className="flex flex-col gap-3.5 bg-white p-4 rounded-2xl border border-purple-100/20 shadow-sm">
                  <h3 className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5 select-none border-b border-purple-100/10 pb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">school</span>
                    Formação & Atuação Profissional
                  </h3>

                  {/* Graduação / Formação Principal */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-[#795465] uppercase tracking-wider pl-0.5">
                      Formação / Graduação / Mestrado / Doutorado
                    </label>
                    <input 
                      type="text"
                      required
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      placeholder="Ex: Graduada em Fisioterapia pela USP • Pós-Graduada pela UNIFESP"
                      className="h-10 px-3.5 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full bg-slate-50/30"
                    />
                  </div>

                  {/* Tempo de Atuação */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-[#795465] uppercase tracking-wider pl-0.5">
                      Tempo de Atuação na Área
                    </label>
                    <input 
                      type="text"
                      required
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="Ex: 8 anos de atuação clínica"
                      className="h-10 px-3.5 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full bg-slate-50/30"
                    />
                  </div>

                  {/* Cursos / Certificações */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-[#795465] uppercase tracking-wider pl-0.5">
                      Cursos Extra & Certificações
                    </label>
                    <input 
                      type="text"
                      value={courses}
                      onChange={(e) => setCourses(e.target.value)}
                      placeholder="Ex: Pilates Clínico Avançado, Terapia Manual, Ginástica Hipopressiva"
                      className="h-10 px-3.5 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full bg-slate-50/30"
                    />
                  </div>
                </div>

                {/* 3. Biography Card */}
                <div className="flex flex-col gap-3.5 bg-white p-4 rounded-2xl border border-purple-100/20 shadow-sm">
                  <h3 className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5 select-none border-b border-purple-100/10 pb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">description</span>
                    Apresentação (Bio)
                  </h3>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-[#795465] uppercase tracking-wider pl-0.5">
                      Sobre Mim (Aparecerá para as pacientes)
                    </label>
                    <textarea 
                      required
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Fale um pouco sobre você, sua abordagem e como costuma acolher suas pacientes na área de Fisioterapia..."
                      className="p-3 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full resize-none bg-slate-50/30 h-24"
                    />
                  </div>
                </div>

                {/* 4. Avatar Selection Card */}
                <div className="flex flex-col gap-3 bg-white p-4 rounded-2xl border border-purple-100/20 shadow-sm">
                  <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5 select-none">
                    Escolha sua Foto de Perfil
                  </label>
                  
                  <div className="flex justify-between items-center gap-2 px-1 select-none">
                    {PRESET_AVATARS.map((avatar, idx) => {
                      const isSelected = selectedAvatar === avatar
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedAvatar(avatar)}
                          className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all active:scale-95 ${
                            isSelected 
                              ? 'border-[#70518d] ring-2 ring-[#70518d]/20 scale-105' 
                              : 'border-purple-100/35 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img 
                            src={avatar} 
                            alt={`Avatar ${idx}`} 
                            className="w-full h-full object-cover"
                          />
                        </button>
                      )
                    })}
                  </div>

                  {/* Input link optional fallback */}
                  <div className="flex flex-col gap-1 mt-2.5 pt-2.5 border-t border-purple-100/10">
                    <span className="text-[9px] font-bold text-[#795465] uppercase pl-0.5 select-none">Ou utilize seu próprio link de imagem</span>
                    <input 
                      type="text"
                      value={selectedAvatar}
                      onChange={(e) => setSelectedAvatar(e.target.value)}
                      placeholder="Cole a URL da sua foto..."
                      className="h-8 px-2.5 rounded-lg border border-purple-100/40 text-[10px] font-semibold focus:outline-none focus:border-[#70518d] w-full bg-slate-50/20"
                    />
                  </div>
                </div>

                {/* Sticky/Fixed bottom action */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 border-t border-purple-100/30 backdrop-blur-md z-45 max-w-md mx-auto select-none">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full h-12 bg-[#70518d] hover:bg-[#573974] text-white font-extrabold text-sm rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Salvando dados de registro...
                      </>
                    ) : (
                      <>
                        Salvar e Escolher Exercícios
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* STEP 2: EXERCISES FLOW */
              <div className="flex flex-col gap-4">
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
                          <div className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center border transition-all ${
                            isSelected 
                              ? 'bg-[#70518d] border-[#70518d] text-white' 
                              : 'border-purple-200 bg-transparent'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                          </div>

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

                {/* Sticky Bottom Actions */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 border-t border-purple-100/30 backdrop-blur-md z-45 max-w-md mx-auto select-none flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    disabled={saving}
                    className="flex-1 h-12 border border-purple-100 text-[#795465] font-bold text-sm rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    Voltar
                  </button>

                  <button
                    onClick={handleImportExercises}
                    disabled={saving || selectedIds.length === 0}
                    className="flex-[2] h-12 bg-[#70518d] hover:bg-[#573974] text-white font-extrabold text-sm rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Finalizando...
                      </>
                    ) : (
                      <>
                        Importar & Concluir
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </main>

        </div>
      </div>
    </>
  )
}
