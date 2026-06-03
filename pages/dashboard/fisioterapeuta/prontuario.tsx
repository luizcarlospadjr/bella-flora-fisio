import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Loader2, ArrowLeft, Search, Plus, Save, MessageSquare, Award, Clock, Sparkles, X, ChevronRight, Check, Users } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { useToast } from '../../../components/Toast'

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

interface MedicalRecord {
  id: string
  patient_id: string
  therapist_id: string
  session_number: number
  afa_score: string | null
  evolution_notes: string
  prescribed_exercises: any
  created_at: string
}

interface PatientProfile {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: string
  created_at: string
}

export default function TherapistProntuario() {
  const router = useRouter()
  const { showSuccess, showError, showWarning } = useToast()
  const { patient_id } = router.query

  const [loading, setLoading] = useState(true)
  const [therapist, setTherapist] = useState<any>(null)
  
  // List patients state
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Unassigned patients state for linking
  const [unassignedPatients, setUnassignedPatients] = useState<PatientProfile[]>([])
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkingId, setLinkingId] = useState<string | null>(null)

  // Active patient details
  const [activePatient, setActivePatient] = useState<PatientProfile | null>(null)
  const [activeTab, setActiveTab] = useState<'evolucao' | 'para_casa' | 'sessoes' | 'historico'>('evolucao')
  
  // Evolutions state
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editAfa, setEditAfa] = useState('')
  
  // New Evolution form
  const [showAddModal, setShowAddModal] = useState(false)
  const [newNotes, setNewNotes] = useState('')
  const [newAfa, setNewAfa] = useState('')
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [newTime, setNewTime] = useState(new Date().toTimeString().split(' ')[0].substring(0, 5))

  // Prescribed Exercises state (Para Casa Tab)
  const [prescribedExercises, setPrescribedExercises] = useState<PrescribedExercise[]>([])
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Treatment Plan Config State (for Therapist Histórico Tab)
  const [totalSessions, setTotalSessions] = useState<number>(8)
  const [frequencyDays, setFrequencyDays] = useState<string[]>([])
  const [treatmentPlanNotes, setTreatmentPlanNotes] = useState<string>('')
  const [planSaveSuccess, setPlanSaveSuccess] = useState<boolean>(false)

  // Clinical History & Documents Config States
  const [anamnese, setAnamnese] = useState<string>('')
  const [queixaPrincipal, setQueixaPrincipal] = useState<string>('')
  const [historySaveSuccess, setHistorySaveSuccess] = useState<boolean>(false)

  const [documents, setDocuments] = useState<any[]>([])
  const [docName, setDocName] = useState<string>('')
  const [docUrl, setDocUrl] = useState<string>('')
  const [docCategory, setDocCategory] = useState<string>('Exame Complementar')
  const [docSaveSuccess, setDocSaveSuccess] = useState<boolean>(false)

  // Document custom categories states and helper
  const [dynamicCategories, setDynamicCategories] = useState<string[]>(['Ultrassonografia', 'Exame Complementar', 'Ressonância', 'Avaliação Urodinâmica', 'Outro'])
  const [customCategoryInput, setCustomCategoryInput] = useState('')
  const [showCustomCategoryForm, setShowCustomCategoryForm] = useState(false)
  const [selectedDocCategoryTab, setSelectedDocCategoryTab] = useState<string>('Todos')

  const getAvailableCategories = () => {
    const docCategories = Array.from(new Set(documents.map(d => d.category)))
    const merged = Array.from(new Set([...dynamicCategories, ...docCategories]))
    return merged.filter(Boolean)
  }

  // Document Delete Confirmation
  const [docToDelete, setDocToDelete] = useState<any | null>(null)
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false)
  const [isDeletingDoc, setIsDeletingDoc] = useState<boolean>(false)

  // Record Delete Confirmation
  const [recordToDelete, setRecordToDelete] = useState<MedicalRecord | null>(null)
  const [confirmRecordPassword, setConfirmRecordPassword] = useState<string>('')
  const [showRecordDeleteConfirmModal, setShowRecordDeleteConfirmModal] = useState<boolean>(false)
  const [isDeletingRecord, setIsDeletingRecord] = useState<boolean>(false)

  // Custom Exercise Builder States
  const [customExercises, setCustomExercises] = useState<PrescribedExercise[]>([])
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customSubtitle, setCustomSubtitle] = useState('')
  const [customSeries, setCustomSeries] = useState(3)
  const [customReps, setCustomReps] = useState('10')
  const [customFreq, setCustomFreq] = useState('1 vez ao dia')
  const [customPause, setCustomPause] = useState('30s')
  const [customDesc, setCustomDesc] = useState('Exercício pélvico personalizado prescrito especificamente para suas necessidades.')

  // Standard exercises list for addition
  const standardExercisesList: PrescribedExercise[] = [
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
    },
    {
      id: 'alongamento_isquiotibiais',
      name: 'Alongamento de Isquiotibiais',
      subtitle: 'Com sustentação ativa',
      series: 3,
      repetitions: '15 Reps',
      pause: '60s',
      frequency: '2 vezes/dia',
      description: 'Alongamento voltado à cadeia posterior para diminuição de tensões pélvicas e posturais.',
      instructions: [
        'Mantenha a perna estendida até o limite confortável.',
        'Sustente a posição utilizando uma faixa auxiliar.',
        'Mantenha os ombros relaxados durante o alongamento.'
      ]
    },
    {
      id: 'contracoes_kegel',
      name: 'Contrações de Kegel',
      subtitle: 'Fortalecimento de assoalho pélvico',
      series: 3,
      repetitions: '10 de 5s',
      pause: '10s',
      frequency: '3 vezes/dia',
      description: 'Exercícios específicos para contração e fortalecimento isolado da musculatura do assoalho pélvico.',
      instructions: [
        'Contraia os músculos do assoalho pélvico como se estivesse segurando o fluxo urinário.',
        'Evite contrair abdômen, glúteos ou coxas simultaneamente.',
        'Mantenha a contração pelo tempo prescrito e relaxe completamente.'
      ]
    }
  ]

  // Catalog combining standard and custom exercises, ensuring no duplicates by ID
  const exercisesCatalog = [...standardExercisesList]
  customExercises.forEach(ex => {
    if (!exercisesCatalog.some(e => e.id === ex.id)) {
      exercisesCatalog.push(ex)
    }
  })

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        // 1. Get logged in therapist
        const { data: { user }, error: authErr } = await supabase.auth.getUser()
        if (authErr || !user) {
          router.push('/login')
          return
        }
        setTherapist(user)

        // 2. Fetch list of patients associated with this therapist
        const { data: patientList } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'patient')
          .eq('therapist_id', user.id)
          .order('full_name', { ascending: true })

        if (patientList) {
          setPatients(patientList)
        }

        // Fetch list of unassigned clinic patients (only patients that have no therapist attending)
        const { data: unassignedList } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'patient')
          .order('full_name', { ascending: true })

        if (unassignedList) {
          const unassigned = unassignedList.filter(p => !p.therapist_id || p.therapist_id === '')
          setUnassignedPatients(unassigned)
        }

        // 1.5. Load Therapist's Catalog (from database exercises_catalog or localStorage fallback)
        let loadedCatalog: PrescribedExercise[] = []
        try {
          const { data: dbCatalog, error: dbCatErr } = await supabase
            .from('exercises_catalog')
            .select('*')
            .eq('therapist_id', user.id)

          if (dbCatErr) {
            if (dbCatErr.code === '42P01') {
              console.warn('Table exercises_catalog missing, falling back to localStorage in prontuario.')
              const local = localStorage.getItem('bella_flora_custom_exercises')
              if (local) {
                loadedCatalog = JSON.parse(local)
              }
            } else {
              throw dbCatErr
            }
          } else if (dbCatalog && dbCatalog.length > 0) {
            loadedCatalog = dbCatalog.map((e: any) => ({
              id: e.id,
              name: e.name,
              subtitle: e.subtitle || '',
              series: e.series || 3,
              repetitions: e.repetitions || '10',
              pause: e.pause || '30s',
              frequency: e.frequency || '1 vez ao dia',
              description: e.description || '',
              instructions: e.instructions || []
            }))
          } else {
            // If table is empty in Supabase, check localStorage
            const local = localStorage.getItem('bella_flora_custom_exercises')
            if (local) {
              loadedCatalog = JSON.parse(local)
            }
          }
        } catch (catalogErr) {
          console.error('Error loading exercises catalog:', catalogErr)
        }

        // Set custom exercises loaded from the catalog
        setCustomExercises(loadedCatalog)

        // 3. Check if patient_id is present in URL query
        if (patient_id) {
          const selectedPatient = patientList?.find(p => p.id === patient_id)
          if (selectedPatient) {
            setActivePatient(selectedPatient)

            // Load treatment plan configurations
            try {
              const { data: planData } = await supabase
                .from('treatment_plans')
                .select('*')
                .eq('patient_id', selectedPatient.id)
                .maybeSingle()

              if (planData) {
                setTotalSessions(planData.total_sessions || 8)
                if (planData.frequency_days) {
                  const days = planData.frequency_days.split(',').map((d: string) => d.trim()).filter(Boolean)
                  setFrequencyDays(days)
                } else {
                  setFrequencyDays([])
                }
                setTreatmentPlanNotes(planData.notes || '')
              } else {
                setTotalSessions(8)
                setFrequencyDays([])
                setTreatmentPlanNotes('')
              }
            } catch (planErr) {
              console.error('Erro ao buscar plano de tratamento:', planErr)
            }

            // Load clinical history (anamnese & queixa principal)
            try {
              const { data: historyData } = await supabase
                .from('patient_histories')
                .select('*')
                .eq('patient_id', selectedPatient.id)
                .maybeSingle()

              if (historyData) {
                setAnamnese(historyData.anamnese || '')
                setQueixaPrincipal(historyData.queixa_principal || '')
              } else {
                setAnamnese('')
                setQueixaPrincipal('')
              }
            } catch (histErr) {
              console.error('Erro ao buscar histórico clínico:', histErr)
            }

            // Load patient documents
            try {
              const { data: docsData } = await supabase
                .from('patient_documents')
                .select('*')
                .eq('patient_id', selectedPatient.id)
                .order('created_at', { ascending: true })

              if (docsData) {
                setDocuments(docsData)
              } else {
                setDocuments([])
              }
            } catch (docsErr) {
              console.error('Erro ao buscar documentos complementares:', docsErr)
            }
            
            // 4. Fetch medical records / evolutions for this patient
            const { data: medRecords } = await supabase
              .from('medical_records')
              .select('*')
              .eq('patient_id', selectedPatient.id)
              .order('created_at', { ascending: false })

            if (medRecords) {
              setRecords(medRecords)
              
              // Load prescribed exercises from the latest record (if any)
              if (medRecords.length > 0 && medRecords[0].prescribed_exercises) {
                const exercises = medRecords[0].prescribed_exercises as PrescribedExercise[]
                setPrescribedExercises(exercises)

                // Populate any custom exercises from database record back into local builder catalog
                const standardIds = ['ponte_pelvica', 'alongamento_borboleta', 'alongamento_isquiotibiais', 'contracoes_kegel']
                const customs = exercises.filter(e => !standardIds.includes(e.id))
                
                // Merge customs into loadedCatalog by matching IDs to avoid duplicates
                const mergedCustoms = [...loadedCatalog]
                customs.forEach(c => {
                  if (!mergedCustoms.some(mc => mc.id === c.id)) {
                    mergedCustoms.push(c)
                  }
                })
                setCustomExercises(mergedCustoms)
              } else {
                setPrescribedExercises([])
                setCustomExercises(loadedCatalog)
              }
            }
          }
        } else {
          setActivePatient(null)
          setRecords([])
          setPrescribedExercises([])
          setCustomExercises(loadedCatalog)
          setTotalSessions(8)
          setFrequencyDays([])
          setTreatmentPlanNotes('')
          setAnamnese('')
          setQueixaPrincipal('')
          setDocuments([])
          setDocName('')
          setDocUrl('')
          setDocCategory('Exame Complementar')
        }
      } catch (err) {
        console.error('Erro ao carregar dados do prontuário:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router, patient_id])

  // Search logic filter
  const filteredPatients = patients.filter(patient => 
    (patient.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Format timestamp safely
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Link an unassigned patient to this therapist
  const handleLinkPatient = async (patientId: string) => {
    if (!therapist) return
    try {
      setLinkingId(patientId)
      const { error } = await supabase
        .from('profiles')
        .update({ therapist_id: therapist.id })
        .eq('id', patientId)

      if (error) throw error

      const linkedPatient = unassignedPatients.find(p => p.id === patientId)
      if (linkedPatient) {
        setPatients(prev => [...prev, { ...linkedPatient, therapist_id: therapist.id }].sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '')))
        setUnassignedPatients(prev => prev.filter(p => p.id !== patientId))
      }
      
      setShowLinkModal(false)
      router.push(`/dashboard/fisioterapeuta/prontuario?patient_id=${patientId}`)
    } catch (err) {
      console.error('Erro ao vincular paciente:', err)
      showError('Erro ao vincular paciente. Tente novamente.')
    } finally {
      setLinkingId(null)
    }
  }

  // Create a new evolution session
  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activePatient || !therapist || !newNotes.trim()) return

    try {
      setLoading(true)
      const nextSessionNumber = records.length + 1
      
      const createdTimestamp = new Date(`${newDate}T${newTime}:00`).toISOString()

      const { data, error } = await supabase
        .from('medical_records')
        .insert({
          patient_id: activePatient.id,
          therapist_id: therapist.id,
          session_number: nextSessionNumber,
          afa_score: newAfa.trim() || null,
          evolution_notes: newNotes.trim(),
          prescribed_exercises: prescribedExercises,
          created_at: createdTimestamp
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setRecords([data, ...records])
        setNewNotes('')
        setNewAfa('')
        setShowAddModal(false)
      }
    } catch (err) {
      showError('Erro ao salvar evolução')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Inline edit functions
  const startEdit = (rec: MedicalRecord) => {
    setEditingRecordId(rec.id)
    setEditText(rec.evolution_notes)
    setEditAfa(rec.afa_score || '')
  }

  const saveEdit = async (id: string) => {
    if (!editText.trim()) return
    try {
      setLoading(true)
      const { error } = await supabase
        .from('medical_records')
        .update({
          evolution_notes: editText.trim(),
          afa_score: editAfa.trim() || null
        })
        .eq('id', id)

      if (error) throw error

      setRecords(records.map(r => r.id === id ? { ...r, evolution_notes: editText, afa_score: editAfa } : r))
      setEditingRecordId(null)
    } catch (err) {
      showError('Erro ao salvar edições')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Exercise Prescriber handlers
  const handleToggleExercise = (exercise: any) => {
    const exists = prescribedExercises.some(e => e.id === exercise.id)
    if (exists) {
      setPrescribedExercises(prescribedExercises.filter(e => e.id !== exercise.id))
    } else {
      setPrescribedExercises([...prescribedExercises, exercise])
    }
  }

  const handleUpdateRepetitions = (id: string, reps: string) => {
    setPrescribedExercises(prescribedExercises.map(e => e.id === id ? { ...e, repetitions: reps } : e))
  }

  const handleUpdateSeries = (id: string, series: number) => {
    setPrescribedExercises(prescribedExercises.map(e => e.id === id ? { ...e, series } : e))
  }

  const handleUpdateFrequency = (id: string, frequency: string) => {
    setPrescribedExercises(prescribedExercises.map(e => e.id === id ? { ...e, frequency } : e))
  }

  const handleUpdatePause = (id: string, pause: string) => {
    setPrescribedExercises(prescribedExercises.map(e => e.id === id ? { ...e, pause } : e))
  }

  const handleUpdateSubtitle = (id: string, text: string) => {
    setPrescribedExercises(prescribedExercises.map(e => e.id === id ? { ...e, subtitle: text } : e))
  }

  const persistCustomExercise = async (newEx: PrescribedExercise) => {
    if (!therapist) return
    try {
      const { error } = await supabase
        .from('exercises_catalog')
        .insert({
          id: newEx.id,
          therapist_id: therapist.id,
          name: newEx.name,
          subtitle: newEx.subtitle,
          series: newEx.series,
          repetitions: newEx.repetitions,
          pause: newEx.pause,
          frequency: newEx.frequency,
          description: newEx.description,
          instructions: newEx.instructions || ['Realize o exercício conforme as orientações clínicas acima.'],
          icon: newEx.icon || 'fitness_center'
        })

      if (error) {
        if (error.code === '42P01') {
          console.warn('Table exercises_catalog missing, persisting custom exercise to localStorage.')
          const local = localStorage.getItem('bella_flora_custom_exercises')
          const localList = local ? JSON.parse(local) : []
          localList.push(newEx)
          localStorage.setItem('bella_flora_custom_exercises', JSON.stringify(localList))
        } else {
          console.error('Error saving custom exercise to DB:', error)
        }
      }
    } catch (err) {
      console.error('Failed to persist custom exercise:', err)
    }
  }

  const handleAddCustomExercise = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customName.trim()) return

    const newExercise: PrescribedExercise = {
      id: 'custom_' + Date.now(),
      name: customName.trim(),
      subtitle: customSubtitle.trim() || 'Orientação personalizada',
      series: customSeries,
      repetitions: customReps.trim(),
      pause: customPause.trim() || '30s',
      frequency: customFreq.trim() || '1 vez ao dia',
      description: customDesc.trim(),
      instructions: ['Realize o exercício conforme as orientações clínicas acima.']
    }

    setCustomExercises([...customExercises, newExercise])
    setPrescribedExercises([...prescribedExercises, newExercise])
    
    // Persist to DB catalog or localStorage
    persistCustomExercise(newExercise)
    
    // Clear and close
    setCustomName('')
    setCustomSubtitle('')
    setCustomSeries(3)
    setCustomReps('10')
    setCustomFreq('1 vez ao dia')
    setCustomPause('30s')
    setCustomDesc('Exercício pélvico personalizado prescrito especificamente para suas necessidades.')
    setShowCustomModal(false)
  }

  const handleSaveExercises = async () => {
    if (!activePatient || !therapist) return
    try {
      setLoading(true)
      
      // Upsert into active patient's latest record if available, or create a stub evolution
      if (records.length > 0) {
        const latestRecord = records[0]
        const { error } = await supabase
          .from('medical_records')
          .update({
            prescribed_exercises: prescribedExercises
          })
          .eq('id', latestRecord.id)

        if (error) throw error
        setRecords(records.map((r, idx) => idx === 0 ? { ...r, prescribed_exercises: prescribedExercises } : r))
      } else {
        const { data, error } = await supabase
          .from('medical_records')
          .insert({
            patient_id: activePatient.id,
            therapist_id: therapist.id,
            session_number: 1,
            afa_score: null,
            evolution_notes: 'Prescrição inicial de rotina domiciliar.',
            prescribed_exercises: prescribedExercises
          })
          .select()
          .single()

        if (error) throw error
        setRecords([data])
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      showError('Erro ao salvar plano de exercícios')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTreatmentPlan = async () => {
    if (!activePatient || !therapist) return
    try {
      setLoading(true)
      const freqStr = frequencyDays.join(', ')
      
      const { error } = await supabase
        .from('treatment_plans')
        .upsert({
          patient_id: activePatient.id,
          therapist_id: therapist.id,
          total_sessions: totalSessions,
          frequency_days: freqStr,
          notes: treatmentPlanNotes
        }, { onConflict: 'patient_id' })

      if (error) throw error

      setPlanSaveSuccess(true)
      setTimeout(() => setPlanSaveSuccess(false), 3000)
    } catch (err) {
      showError('Erro ao salvar plano de tratamento clínico')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveClinicalHistory = async () => {
    if (!activePatient || !therapist) return
    try {
      setLoading(true)
      const { error } = await supabase
        .from('patient_histories')
        .upsert({
          patient_id: activePatient.id,
          therapist_id: therapist.id,
          anamnese: anamnese,
          queixa_principal: queixaPrincipal,
          updated_at: new Date().toISOString()
        }, { onConflict: 'patient_id' })

      if (error) throw error

      setHistorySaveSuccess(true)
      setTimeout(() => setHistorySaveSuccess(false), 3000)
    } catch (err) {
      showError('Erro ao salvar histórico clínico')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activePatient || !therapist || !docName.trim() || !docUrl.trim()) return

    try {
      setLoading(true)

      let finalCategory = docCategory
      if (showCustomCategoryForm && customCategoryInput.trim()) {
        finalCategory = customCategoryInput.trim()
        if (!dynamicCategories.includes(finalCategory)) {
          setDynamicCategories([...dynamicCategories, finalCategory])
        }
      }

      const { data, error } = await supabase
        .from('patient_documents')
        .insert({
          patient_id: activePatient.id,
          therapist_id: therapist.id,
          name: docName.trim(),
          file_url: docUrl.trim(),
          category: finalCategory
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setDocuments([...documents, data])
        setDocName('')
        setDocUrl('')
        setDocCategory('Exame Complementar')
        setShowCustomCategoryForm(false)
        setCustomCategoryInput('')
        setDocSaveSuccess(true)
        setTimeout(() => setDocSaveSuccess(false), 3000)
      }
    } catch (err) {
      showError('Erro ao salvar documento complementar')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDocumentClick = (doc: any) => {
    setDocToDelete(doc)
    setConfirmPassword('')
    setShowDeleteConfirmModal(true)
  }

  const handleConfirmDeleteDocument = async () => {
    if (!docToDelete || !therapist) return
    setIsDeletingDoc(true)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: therapist.email,
        password: confirmPassword
      })

      if (authError) {
        showError('Senha incorreta! Não foi possível excluir o documento de forma segura.')
        setIsDeletingDoc(false)
        return
      }

      const { error } = await supabase
        .from('patient_documents')
        .delete()
        .eq('id', docToDelete.id)

      if (error) throw error

      setDocuments(documents.filter(d => d.id !== docToDelete.id))
      setShowDeleteConfirmModal(false)
      setDocToDelete(null)
      setConfirmPassword('')
      showSuccess('Documento complementar excluído com sucesso!')
    } catch (err) {
      showError('Erro ao excluir documento complementar')
      console.error(err)
    } finally {
      setIsDeletingDoc(false)
    }
  }

  const handleDeleteRecordClick = (rec: MedicalRecord) => {
    setRecordToDelete(rec)
    setConfirmRecordPassword('')
    setShowRecordDeleteConfirmModal(true)
  }

  const handleConfirmDeleteRecord = async () => {
    if (!recordToDelete || !therapist) return
    setIsDeletingRecord(true)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: therapist.email,
        password: confirmRecordPassword
      })

      if (authError) {
        showError('Senha incorreta! Não foi possível excluir a evolução de forma segura.')
        setIsDeletingRecord(false)
        return
      }

      const { error } = await supabase
        .from('medical_records')
        .delete()
        .eq('id', recordToDelete.id)

      if (error) throw error

      setRecords(records.filter(r => r.id !== recordToDelete.id))
      setShowRecordDeleteConfirmModal(false)
      setRecordToDelete(null)
      setConfirmRecordPassword('')
      setEditingRecordId(null)
      showSuccess('Evolução clínica excluída com sucesso!')
    } catch (err) {
      showError('Erro ao excluir evolução clínica')
      console.error(err)
    } finally {
      setIsDeletingRecord(false)
    }
  }
 
  if (loading && !activePatient && patients.length === 0) {
    return (
      <div className="min-h-screen bg-[#fff7fd] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#70518d]" />
          <p className="text-sm font-medium text-[#795465]">Acessando prontuários seguros...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Prontuário Clínico Pélvico | Bella Flora Fisio</title>
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

          {/* Navigation TopBar */}
          <header className="bg-white border-b border-purple-100/30 sticky top-0 z-50 shadow-sm shrink-0 px-4 py-2.5 flex items-center justify-between">
            {activePatient ? (
              <button 
                onClick={() => router.push('/dashboard/fisioterapeuta/prontuario')}
                className="text-[#795465] hover:bg-purple-50 transition-colors p-1.5 rounded-full active:scale-95 flex items-center justify-center border border-purple-100/20"
              >
                <ArrowLeft className="w-4 h-4 text-[#70518d]" />
              </button>
            ) : (
              <Link 
                href="/dashboard/fisioterapeuta"
                className="text-[#795465] hover:bg-purple-50 transition-colors p-1.5 rounded-full active:scale-95 flex items-center justify-center border border-purple-100/20"
              >
                <ArrowLeft className="w-4 h-4 text-[#70518d]" />
              </Link>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#70518d] to-[#573974] flex items-center justify-center text-white shadow-sm">
                <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-[#70518d]">
                  Bella Flora <span className="text-[#795465] font-light">Fisio</span>
                </span>
                <span className="block text-[8px] text-[#795465] font-semibold uppercase tracking-wider -mt-1">
                  Prontuário Digital
                </span>
              </div>
            </div>
            <div className="w-8"></div>
          </header>

          {/* 1. SELECTION SCREEN VIEW (When no patient_id is selected) */}
          {!activePatient ? (
            <main className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5 scrollbar-none pb-24">
              <section className="flex items-center justify-between pl-1">
                <div>
                  <h2 className="text-xl font-extrabold text-[#1d1b1f]">Pacientes Ativas</h2>
                  <p className="text-[11px] text-[#795465] font-medium">Selecione uma paciente para evoluir.</p>
                </div>
                <button
                  onClick={() => setShowLinkModal(true)}
                  className="flex items-center gap-1.5 bg-[#70518d] hover:bg-[#573974] text-white px-3.5 py-1.5 rounded-full text-[10px] font-bold shadow-sm transition-all active:scale-95 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Vincular Paciente
                </button>
              </section>

              {/* Search Input Bar */}
              <div className="relative w-full h-11 shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar paciente pelo nome..."
                  className="w-full h-full pl-11 pr-4 rounded-xl border border-purple-100/40 bg-white focus:outline-none focus:ring-2 focus:ring-[#70518d]/10 focus:border-[#70518d] font-semibold text-xs text-[#1d1b1f] placeholder:text-slate-400 transition-all shadow-sm"
                />
              </div>

              {/* List Patients */}
              <div className="flex flex-col gap-3">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map(patient => (
                    <button 
                      key={patient.id}
                      onClick={() => router.push(`/dashboard/fisioterapeuta/prontuario?patient_id=${patient.id}`)}
                      className="w-full bg-white hover:bg-purple-50/10 transition-all p-4 rounded-2xl flex items-center justify-between border border-purple-100/20 shadow-sm active:scale-[0.99] text-left"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img 
                          alt={patient.full_name || 'Paciente'} 
                          className="w-11 h-11 rounded-full object-cover shrink-0 border border-purple-100/20" 
                          src={patient.avatar_url || '/assets/img/mariana_silva.png'} 
                        />
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-sm text-[#1d1b1f] truncate">
                            {patient.full_name || 'Paciente sem Nome'}
                          </h3>
                          <p className="text-[10px] text-[#795465] font-semibold mt-0.5 truncate flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-[#70518d] rounded-full"></span>
                            Fisioterapia Pélvica
                          </p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#fff7fd] text-[#70518d] border border-purple-100/30 flex items-center justify-center shrink-0">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="bg-white border border-purple-100/20 rounded-2xl p-8 text-center flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-[#fff7fd] rounded-full flex items-center justify-center text-slate-400">
                      <Search className="w-5 h-5 text-[#795465]" />
                    </div>
                    <h3 className="font-extrabold text-xs text-[#1d1b1f]">Nenhum registro encontrado</h3>
                    <p className="text-[10px] text-[#795465] max-w-[200px]">
                      Não encontramos nenhuma paciente ativa com o nome "{searchQuery}".
                    </p>
                  </div>
                )}
              </div>
            </main>
          ) : (
            /* 2. DYNAMIC TABBED PATIENT PRONTUÁRIO */
            <main className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5 scrollbar-none pb-24">
              
              {/* Patient Header Card */}
              <section className="bg-white rounded-2xl p-4 flex items-center justify-between border border-purple-100/20 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <img 
                    alt={activePatient.full_name || 'Paciente'} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#70518d]/20" 
                    src={activePatient.avatar_url || '/assets/img/mariana_silva.png'} 
                  />
                  <div>
                    <h2 className="font-extrabold text-sm text-[#1d1b1f] leading-tight">
                      {activePatient.full_name || 'Paciente'}
                    </h2>
                    <p className="text-[10px] text-[#795465] font-semibold mt-0.5">
                      32 anos • ID: PR-{activePatient.id.substring(0, 5).toUpperCase()}
                    </p>
                  </div>
                </div>

                <Link 
                  href={`/dashboard/fisioterapeuta/chat?patient_id=${activePatient.id}`}
                  className="w-9 h-9 rounded-full bg-[#fff7fd] hover:bg-purple-50 text-[#70518d] border border-purple-100/30 flex items-center justify-center transition-all active:scale-90 shadow-sm"
                  title="Mensagens em tempo real"
                >
                  <MessageSquare className="w-4.5 h-4.5" />
                </Link>
              </section>

              {/* Tabbed Navigation Bar */}
              <nav className="flex border-b border-purple-100/20 overflow-x-auto gap-4 scrollbar-none font-bold text-xs select-none">
                <button 
                  onClick={() => setActiveTab('evolucao')}
                  className={`pb-2 border-b-2 px-1 whitespace-nowrap transition-all ${
                    activeTab === 'evolucao' 
                      ? 'border-[#70518d] text-[#70518d] font-extrabold' 
                      : 'border-transparent text-[#795465] hover:text-[#70518d]'
                  }`}
                >
                  Evoluções ({records.length})
                </button>
                <button 
                  onClick={() => setActiveTab('para_casa')}
                  className={`pb-2 border-b-2 px-1 whitespace-nowrap transition-all ${
                    activeTab === 'para_casa' 
                      ? 'border-[#70518d] text-[#70518d] font-extrabold' 
                      : 'border-transparent text-[#795465] hover:text-[#70518d]'
                  }`}
                >
                  Para Casa ({prescribedExercises.length})
                </button>
                <button 
                  onClick={() => setActiveTab('sessoes')}
                  className={`pb-2 border-b-2 px-1 whitespace-nowrap transition-all ${
                    activeTab === 'sessoes' 
                      ? 'border-[#70518d] text-[#70518d] font-extrabold' 
                      : 'border-transparent text-[#795465] hover:text-[#70518d]'
                  }`}
                >
                  Sessões
                </button>
                <button 
                  onClick={() => setActiveTab('historico')}
                  className={`pb-2 border-b-2 px-1 whitespace-nowrap transition-all ${
                    activeTab === 'historico' 
                      ? 'border-[#70518d] text-[#70518d] font-extrabold' 
                      : 'border-transparent text-[#795465] hover:text-[#70518d]'
                  }`}
                >
                  Histórico
                </button>
              </nav>

              {/* TAB CONTENT: EVOLUÇÃO */}
              {activeTab === 'evolucao' && (
                <section className="flex flex-col gap-4">
                  
                  {/* Header of Section */}
                  <div className="flex justify-between items-center pl-1">
                    <h3 className="text-xs font-bold text-[#70518d] uppercase tracking-wider">Sessões Realizadas</h3>
                    <button 
                      onClick={() => setShowAddModal(true)}
                      className="flex items-center gap-1 bg-[#70518d] hover:bg-[#573974] text-white px-3.5 py-1.5 rounded-full text-[10px] font-bold shadow-sm transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Nova Evolução
                    </button>
                  </div>

                  {/* Vertical Timeline */}
                  <div className="relative border-l border-purple-100/60 ml-3.5 flex flex-col gap-5 pt-1">
                    {records.length > 0 ? (
                      records.map((rec) => (
                        <div key={rec.id} className="relative pl-6">
                          {/* Dot */}
                          <span className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#70518d] border-2 border-white shadow-sm"></span>

                          {editingRecordId === rec.id ? (
                            /* INLINE RECORD EDIT MODE */
                            <div className="bg-white border border-[#70518d] p-4 rounded-2xl shadow-md flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-extrabold text-[#70518d]">
                                  Sessão #{rec.session_number}
                                </span>
                                <input 
                                  type="text"
                                  value={editAfa}
                                  onChange={(e) => setEditAfa(e.target.value)}
                                  placeholder="AFA (ex: AFA 3/5)"
                                  className="h-8 px-2.5 rounded-lg border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-28"
                                />
                              </div>
                              <textarea 
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full p-2.5 rounded-lg border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] resize-none h-20"
                                placeholder="Notas da evolução..."
                              />
                              <div className="flex justify-between items-center text-[10px]">
                                <button 
                                  type="button"
                                  onClick={() => handleDeleteRecordClick(rec)}
                                  className="px-2.5 py-1.5 border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors"
                                >
                                  Excluir
                                </button>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => setEditingRecordId(null)}
                                    className="px-2.5 py-1.5 border border-purple-100 text-[#795465] font-bold rounded-lg"
                                  >
                                    Cancelar
                                  </button>
                                  <button 
                                    onClick={() => saveEdit(rec.id)}
                                    className="px-3.5 py-1.5 bg-[#70518d] text-white font-bold rounded-lg flex items-center gap-1"
                                  >
                                    <Save className="w-3 h-3" />
                                    Salvar
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* READ VIEW RECORD CARD */
                            <div className="bg-white border border-purple-100/20 p-4 rounded-2xl shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-extrabold text-[#70518d]">
                                      Sessão #{rec.session_number}
                                    </span>
                                    {rec.afa_score && (
                                      <span className="bg-[#fff7fd] text-[#70518d] px-2 py-0.5 rounded text-[9px] font-bold border border-purple-100/20">
                                        {rec.afa_score}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[9px] text-[#795465] font-bold mt-1 flex items-center gap-1 select-none">
                                    <Clock className="w-3 h-3 text-[#70518d]" />
                                    {formatDate(rec.created_at)}
                                  </p>
                                </div>

                                <button 
                                  onClick={() => startEdit(rec)}
                                  className="p-1 rounded-full hover:bg-[#fff7fd] text-slate-400 hover:text-[#70518d] transition-colors"
                                >
                                  <span className="material-symbols-outlined text-base">edit</span>
                                </button>
                              </div>

                              <p className="text-xs text-[#1d1b1f] font-medium leading-relaxed mt-1">
                                {rec.evolution_notes}
                              </p>

                              {/* Prescribed exercise pill markers */}
                              {rec.prescribed_exercises && (rec.prescribed_exercises as any[]).length > 0 && (
                                <div className="mt-2.5 pt-2 border-t border-purple-100/10 flex flex-wrap gap-1.5 select-none">
                                  {(rec.prescribed_exercises as any[]).map((ex, i) => (
                                    <span 
                                      key={i}
                                      className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-50 text-[#70518d] text-[9px] font-bold border border-purple-100/30"
                                    >
                                      {ex.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="bg-white border border-purple-100/20 rounded-2xl p-8 text-center flex flex-col items-center gap-3.5 ml-4">
                        <Award className="w-8 h-8 text-[#70518d]" />
                        <div>
                          <h4 className="font-extrabold text-xs text-[#1d1b1f]">Sem evoluções registradas</h4>
                          <p className="text-[10px] text-[#795465] max-w-[180px] mt-0.5 leading-relaxed">
                            Esta paciente ainda não possui evoluções perineais. Toque em "Nova Evolução" para inaugurar.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* TAB CONTENT: PARA CASA (Exercise Prescriber) */}
              {activeTab === 'para_casa' && (
                <section className="flex flex-col gap-4">
                  <div className="flex justify-between items-center pl-1 gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-[#70518d] uppercase tracking-wider">Prescrever Rotina</h3>
                      <p className="text-[9px] text-[#795465] font-semibold mt-0.5">Selecione e parametrize os treinos.</p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => setShowCustomModal(true)}
                        className="flex items-center gap-1 bg-[#70518d]/10 hover:bg-[#70518d]/20 text-[#70518d] px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm transition-all active:scale-95 border border-purple-100/30"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Customizado
                      </button>

                      <button 
                        onClick={handleSaveExercises}
                        className="flex items-center gap-1 bg-[#70518d] hover:bg-[#573974] text-white px-3.5 py-1.5 rounded-full text-[10px] font-bold shadow-sm transition-all active:scale-95"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Salvar Plano
                      </button>
                    </div>
                  </div>

                  {saveSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-600 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                      <Check className="w-4.5 h-4.5 stroke-[3]" />
                      <span>Sucesso! Prescrição salva e enviada!</span>
                    </div>
                  )}

                  {/* Exercises Checklist Grid */}
                  <div className="flex flex-col gap-3">
                    {exercisesCatalog.map((exercise) => {
                      const isSelected = prescribedExercises.some(e => e.id === exercise.id)
                      const prescribedItem = prescribedExercises.find(e => e.id === exercise.id)

                      return (
                        <div 
                          key={exercise.id} 
                          className={`bg-white border rounded-2xl p-4 shadow-sm transition-all ${
                            isSelected ? 'border-[#70518d] ring-1 ring-[#70518d]/20' : 'border-purple-100/20'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1 select-none">
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => handleToggleExercise(exercise)}
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                  isSelected ? 'bg-[#70518d] border-transparent text-white' : 'border-purple-100/40 bg-white'
                                }`}
                              >
                                {isSelected && <span className="text-[10px] font-bold">✓</span>}
                              </button>
                              <div>
                                <h4 className="font-extrabold text-sm text-[#1d1b1f]">{exercise.name}</h4>
                                <p className="text-[10px] text-[#795465] font-semibold">{prescribedItem?.subtitle || exercise.subtitle}</p>
                              </div>
                            </div>
                          </div>

                          {/* Detail panel opened when active */}
                          {isSelected && prescribedItem && (
                            <div className="mt-3 pt-3 border-t border-purple-100/10 flex flex-col gap-3 select-none">
                              
                              {/* Series and Reps */}
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-[#795465]">Séries:</span>
                                  <div className="flex items-center gap-1.5">
                                    <button 
                                      onClick={() => handleUpdateSeries(exercise.id, Math.max(1, prescribedItem.series - 1))}
                                      className="w-6 h-6 rounded bg-[#fff7fd] border border-purple-100/30 font-bold text-xs flex items-center justify-center active:scale-90 text-[#70518d]"
                                    >
                                      -
                                    </button>
                                    <span className="font-extrabold text-xs text-[#1d1b1f] w-4 text-center">{prescribedItem.series}</span>
                                    <button 
                                      onClick={() => handleUpdateSeries(exercise.id, prescribedItem.series + 1)}
                                      className="w-6 h-6 rounded bg-[#fff7fd] border border-purple-100/30 font-bold text-xs flex items-center justify-center active:scale-90 text-[#70518d]"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-[#795465]">Repetições:</span>
                                  <input 
                                    type="text"
                                    value={prescribedItem.repetitions}
                                    onChange={(e) => handleUpdateRepetitions(exercise.id, e.target.value)}
                                    className="h-7 w-16 px-2 border border-purple-100/40 rounded-lg text-center text-xs font-semibold focus:outline-none focus:border-[#70518d]"
                                  />
                                </div>
                              </div>

                              {/* Freq and Pause */}
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-[#795465]">Frequência:</span>
                                  <input 
                                    type="text"
                                    value={prescribedItem.frequency}
                                    onChange={(e) => handleUpdateFrequency(exercise.id, e.target.value)}
                                    className="h-7 w-28 px-2 border border-purple-100/40 rounded-lg text-center text-xs font-semibold focus:outline-none focus:border-[#70518d]"
                                  />
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-[#795465]">Pausa:</span>
                                  <input 
                                    type="text"
                                    value={prescribedItem.pause}
                                    onChange={(e) => handleUpdatePause(exercise.id, e.target.value)}
                                    className="h-7 w-16 px-2 border border-purple-100/40 rounded-lg text-center text-xs font-semibold focus:outline-none focus:border-[#70518d]"
                                  />
                                </div>
                              </div>

                              {/* Custom Subtitle / Orientation */}
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-[#795465]">Orientação Personalizada:</span>
                                <input 
                                  type="text"
                                  value={prescribedItem.subtitle}
                                  onChange={(e) => handleUpdateSubtitle(exercise.id, e.target.value)}
                                  placeholder="Ex: Realizar de manhã, focar no repouso..."
                                  className="w-full h-8 px-2.5 rounded-lg border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d]"
                                />
                              </div>

                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* TAB CONTENT: SESSOES (Plan Config) */}
              {activeTab === 'sessoes' && (
                <section className="flex flex-col gap-4">
                  {/* 1. Progress / Clinician Summary Info Card */}
                  <div className="flex items-center justify-between pl-1">
                    <h3 className="text-xs font-bold text-[#70518d] uppercase tracking-wider">Resumo do Plano</h3>
                    <span className="text-[9px] font-bold bg-purple-50 text-[#70518d] px-2 py-0.5 rounded border border-purple-100/20 select-none">
                      Sessões Clínicas
                    </span>
                  </div>
                  
                  <div className="bg-white border border-purple-100/20 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
                    <div className="flex items-start gap-3 border-b border-purple-100/10 pb-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-[#70518d] shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#1d1b1f]">Programa de Reabilitação</h4>
                        <p className="text-[10px] text-[#795465] leading-relaxed mt-0.5">
                          Status clínico ativo, com evolução em tempo real baseada nos feedbacks do assoalho pélvico.
                        </p>
                      </div>
                    </div>
 
                    <div className="flex flex-col gap-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#795465] font-semibold">Total de Consultas:</span>
                        <span className="text-[#1d1b1f] font-bold">{records.length} consultas</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#795465] font-semibold">Último AFA Perineal:</span>
                        <span className="text-[#1d1b1f] font-bold">
                          {records.length > 0 ? (records[0].afa_score || 'Não avaliado') : 'Não avaliado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Clinical Treatment Plan Settings Widget */}
                  <div className="flex items-center justify-between pl-1 mt-2">
                    <h3 className="text-xs font-bold text-[#70518d] uppercase tracking-wider">Configuração de Sessões</h3>
                    <span className="text-[9px] font-bold bg-purple-50 text-[#70518d] px-2 py-0.5 rounded border border-purple-100/20 select-none">
                      Meu Tratamento
                    </span>
                  </div>

                  <div className="bg-white border border-purple-100/20 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                    {planSaveSuccess && (
                      <div className="p-3 bg-green-50 border border-green-200 text-green-600 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm select-none">
                        <Check className="w-4.5 h-4.5 stroke-[3]" />
                        <span>Plano de tratamento atualizado com sucesso!</span>
                      </div>
                    )}

                    {/* Total Sessions Selector */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5 select-none">
                        Total de Sessões Clínicas
                      </label>
                      <div className="grid grid-cols-6 gap-1.5">
                        {[5, 8, 10, 12, 15, 20].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setTotalSessions(num)}
                            className={`py-2 rounded-lg border text-xs font-extrabold transition-all active:scale-95 ${
                              totalSessions === num
                                ? 'bg-[#70518d] border-transparent text-white shadow-sm'
                                : 'bg-slate-50 border-purple-100/10 text-[#795465] hover:bg-purple-50/50'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Frequency Weekdays Checklist */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5 select-none">
                        Frequência Semanal Recomendada
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((day) => {
                          const isChecked = frequencyDays.includes(day)
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                if (isChecked) {
                                  setFrequencyDays(frequencyDays.filter(d => d !== day))
                                } else {
                                  setFrequencyDays([...frequencyDays, day])
                                }
                              }}
                              className={`py-2 px-1 rounded-lg border text-[10px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1 ${
                                isChecked
                                  ? 'bg-[#70518d]/10 border-[#70518d] text-[#70518d]'
                                  : 'bg-white border-purple-100/20 text-[#795465]'
                              }`}
                            >
                              {isChecked && <span className="text-[10px]">✓</span>}
                              {day}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Therapist Notes (Confidential) */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5 flex justify-between select-none">
                        <span>Notas Clínicas do Tratamento</span>
                        <span className="text-[8px] text-slate-400 font-semibold normal-case">Visível apenas para clínica</span>
                      </label>
                      <textarea
                        value={treatmentPlanNotes}
                        onChange={(e) => setTreatmentPlanNotes(e.target.value)}
                        placeholder="Observações confidenciais, progresso ou foco do tratamento clínico..."
                        className="p-3 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full resize-none h-20"
                      />
                    </div>

                    <button
                      onClick={handleSaveTreatmentPlan}
                      className="w-full py-3 bg-[#70518d] text-white rounded-full font-bold hover:bg-[#573974] transition-colors shadow-md mt-1 flex items-center justify-center gap-1.5 text-xs active:scale-95"
                    >
                      <Save className="w-4 h-4 text-white" />
                      Salvar Plano Clínico
                    </button>
                  </div>
                </section>
              )}

              {/* TAB CONTENT: HISTORICO */}
              {activeTab === 'historico' && (
                <section className="flex flex-col gap-4">
                  {/* 1. Anamnese Form Card */}
                  <div className="flex items-center justify-between pl-1">
                    <h3 className="text-xs font-bold text-[#70518d] uppercase tracking-wider">Histórico Clínico & Anamnese</h3>
                    <span className="text-[8px] text-slate-400 font-semibold normal-case select-none">Acesso exclusivo profissional</span>
                  </div>

                  <div className="bg-white border border-purple-100/20 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                    {historySaveSuccess && (
                      <div className="p-3 bg-green-50 border border-green-200 text-green-600 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm select-none">
                        <Check className="w-4.5 h-4.5 stroke-[3]" />
                        <span>Histórico clínico salvo com sucesso!</span>
                      </div>
                    )}

                    {/* Queixa Principal */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5 select-none">
                        Queixa Principal
                      </label>
                      <input 
                        type="text"
                        value={queixaPrincipal}
                        onChange={(e) => setQueixaPrincipal(e.target.value)}
                        placeholder="Ex: Dificuldade na contração, dor pélvica crônica..."
                        className="h-10 px-3 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full"
                      />
                    </div>

                    {/* Anamnese Geral */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5 select-none">
                        Anamnese & Histórico Geral
                      </label>
                      <textarea
                        value={anamnese}
                        onChange={(e) => setAnamnese(e.target.value)}
                        placeholder="Ex: Paciente de 40 anos nasceu dia 15/08/1985, apresenta queixa de dificuldade na contração voluntária e perda urinária ao esforço..."
                        className="p-3 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full resize-none h-28"
                      />
                    </div>

                    <button
                      onClick={handleSaveClinicalHistory}
                      className="w-full py-3 bg-[#70518d] text-white rounded-full font-bold hover:bg-[#573974] transition-colors shadow-md mt-1 flex items-center justify-center gap-1.5 text-xs active:scale-95"
                    >
                      <Save className="w-4 h-4 text-white" />
                      Salvar Histórico Clínico
                    </button>
                  </div>

                  {/* 2. Documents & Exames Complementares Card */}
                  <div className="flex items-center justify-between pl-1 mt-2">
                    <h3 className="text-xs font-bold text-[#70518d] uppercase tracking-wider">Documentos & Exames</h3>
                  </div>

                  <div className="bg-white border border-purple-100/20 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                    {docSaveSuccess && (
                      <div className="p-3 bg-green-50 border border-green-200 text-green-600 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm select-none">
                        <Check className="w-4.5 h-4.5 stroke-[3]" />
                        <span>Documento adicionado com sucesso!</span>
                      </div>
                    )}

                    {/* Header showing total count */}
                    <div className="flex justify-between items-center pl-0.5">
                      <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider select-none">
                        Documentos Cadastrados
                      </label>
                      <span className="text-[9px] bg-purple-50 text-[#70518d] px-1.5 py-0.2 rounded border border-purple-100/20 font-bold select-none">
                        {documents.length} no total
                      </span>
                    </div>

                    {/* Dynamic Sub-tab Folders */}
                    {documents.length > 0 && (
                      <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none font-bold text-[9px] select-none">
                        {Array.from(new Set(['Todos', ...documents.map(d => d.category)])).filter(Boolean).map((cat) => {
                          const count = cat === 'Todos' 
                            ? documents.length 
                            : documents.filter(d => d.category === cat).length
                          
                          const isActive = selectedDocCategoryTab === cat

                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setSelectedDocCategoryTab(cat)}
                              className={`px-3 py-1.5 rounded-full border whitespace-nowrap transition-all active:scale-95 flex items-center gap-1 ${
                                isActive
                                  ? 'bg-[#70518d] border-transparent text-white shadow-sm'
                                  : 'bg-[#fff7fd]/40 border-purple-100/20 text-[#795465] hover:bg-purple-50'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>folder</span>
                              <span>{cat}</span>
                              <span className={`px-1.5 py-0.2 rounded-full text-[8px] ${
                                isActive ? 'bg-white/20 text-white' : 'bg-purple-100/50 text-[#70518d]'
                              }`}>
                                {count}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Documents List */}
                    <div className="flex flex-col gap-2.5">
                      {documents.length > 0 ? (
                        documents
                          .filter(doc => selectedDocCategoryTab === 'Todos' || doc.category === selectedDocCategoryTab)
                          .map((doc) => (
                            <div 
                              key={doc.id}
                              className="p-3.5 bg-[#fff7fd]/40 border border-purple-100/20 rounded-xl flex items-center justify-between gap-3 shadow-sm"
                            >
                              <div className="min-w-0">
                                <h4 className="font-extrabold text-xs text-[#1d1b1f] truncate flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[#70518d] text-sm select-none">description</span>
                                  {doc.name}
                                </h4>
                                <p className="text-[9px] text-[#795465] font-semibold mt-0.5 flex items-center gap-2">
                                  <span className="bg-purple-100/50 text-[#70518d] px-1.5 py-0.2 rounded border border-purple-100/20 text-[8px] uppercase font-bold tracking-wider">{doc.category}</span>
                                  <span>•</span>
                                  <span>{formatDate(doc.created_at)}</span>
                                </p>
                                <a 
                                  href={doc.file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[9px] text-[#70518d] font-bold hover:underline mt-1 inline-flex items-center gap-1"
                                >
                                  Ver Documento Original ↗
                                </a>
                              </div>

                              <button
                                onClick={() => handleDeleteDocumentClick(doc)}
                                className="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                title="Excluir documento de forma segura"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </div>
                          ))
                      ) : (
                        <div className="py-6 text-center border border-dashed border-purple-100/30 rounded-xl text-slate-400 flex flex-col items-center gap-1.5 select-none">
                          <span className="material-symbols-outlined text-xl">folder_zip</span>
                          <p className="text-[10px] font-bold text-[#1d1b1f]">Nenhum exame cadastrado</p>
                          <p className="text-[8px] text-[#795465] max-w-[180px] leading-normal">
                            Nenhum documento ou exame complementar cadastrado para esta paciente nesta pasta.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* New Document Addition Form - ALWAYS visible directly below the list of saved documents */}
                    <div className="mt-4 pt-4 border-t border-dashed border-purple-100/30">
                      <div className="flex items-center gap-1.5 mb-3 pl-0.5 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <h4 className="text-[9px] font-bold text-[#70518d] uppercase tracking-wider">
                          Adicionar Novo Documento / Exame
                        </h4>
                      </div>

                      <form onSubmit={handleSaveDocument} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5 select-none">
                            Nome do Documento / Exame
                          </label>
                          <input 
                            type="text"
                            required
                            value={docName}
                            onChange={(e) => setDocName(e.target.value)}
                            placeholder="Ex: Ultrassonografia Pélvica, Ressonância..."
                            className="h-10 px-3 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full bg-white shadow-sm"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5 select-none">
                            Link do Documento (Imagem/PDF/Arquivo)
                          </label>
                          <input 
                            type="text"
                            required
                            value={docUrl}
                            onChange={(e) => setDocUrl(e.target.value)}
                            placeholder="Ex: https://link-exame.com/ultrassonografia.png"
                            className="h-10 px-3 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full bg-white shadow-sm"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3 items-end">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5 select-none">
                              Categoria
                            </label>
                            <select
                              value={docCategory}
                              onChange={(e) => {
                                if (e.target.value === '__add_new__') {
                                  setShowCustomCategoryForm(true)
                                  setDocCategory('')
                                } else {
                                  setShowCustomCategoryForm(false)
                                  setDocCategory(e.target.value)
                                }
                              }}
                              className="h-10 px-3 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] bg-white w-full shadow-sm"
                            >
                              {getAvailableCategories().map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                              <option value="__add_new__">+ Adicionar Nova Categoria...</option>
                            </select>
                          </div>

                          <button
                            type="submit"
                            className="h-10 bg-[#70518d] text-white rounded-xl font-bold hover:bg-[#573974] transition-colors shadow-md text-xs active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            Salvar Exame
                          </button>
                        </div>

                        {showCustomCategoryForm && (
                          <div className="flex flex-col gap-1 bg-[#fff7fd]/60 p-3 rounded-xl border border-purple-100/20 mt-1">
                            <label className="text-[9px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5 select-none flex justify-between">
                              <span>Nova Categoria Customizada</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCustomCategoryForm(false)
                                  setDocCategory('Exame Complementar')
                                  setCustomCategoryInput('')
                                }}
                                className="text-red-500 hover:text-red-700 font-extrabold text-[9px] uppercase tracking-normal"
                              >
                                Cancelar
                              </button>
                            </label>
                            <div className="flex gap-2 mt-1">
                              <input 
                                type="text"
                                required
                                value={customCategoryInput}
                                onChange={(e) => setCustomCategoryInput(e.target.value)}
                                placeholder="Ex: Hemograma, Raio X, Ultrassom..."
                                className="h-9 px-3 rounded-lg border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] bg-white w-full"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (customCategoryInput.trim()) {
                                    const cleanCat = customCategoryInput.trim()
                                    if (!dynamicCategories.includes(cleanCat)) {
                                      setDynamicCategories([...dynamicCategories, cleanCat])
                                    }
                                    setDocCategory(cleanCat)
                                    setShowCustomCategoryForm(false)
                                    setCustomCategoryInput('')
                                  } else {
                                    setShowCustomCategoryForm(false)
                                    setDocCategory('Exame Complementar')
                                  }
                                }}
                                className="px-3.5 h-9 bg-[#70518d] text-white rounded-lg font-bold hover:bg-[#573974] transition-colors text-xs active:scale-95 flex items-center justify-center"
                              >
                                Ok
                              </button>
                            </div>
                          </div>
                        )}
                      </form>
                    </div>
                  </div>
                </section>
              )}

              {/* Modal de Confirmação Segura para Exclusão de Documento */}
              {showDeleteConfirmModal && docToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                  <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl transition-all scale-100 opacity-100 flex flex-col gap-4">
                    
                    <div className="flex justify-between items-center pb-2 border-b border-purple-100/10 select-none">
                      <h3 className="text-sm font-extrabold text-red-600 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-red-600">warning</span>
                        Confirmar Exclusão
                      </h3>
                      <button 
                        onClick={() => {
                          setShowDeleteConfirmModal(false)
                          setDocToDelete(null)
                          setConfirmPassword('')
                        }}
                        className="text-[#795465] p-1 rounded-full hover:bg-purple-50 flex items-center justify-center"
                      >
                        <X className="w-4.5 h-4.5 text-[#795465]" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-[#1d1b1f] font-bold">
                        Deseja realmente excluir o documento <span className="text-[#70518d]">"{docToDelete.name}"</span>?
                      </p>
                      <p className="text-[10px] text-[#795465] font-semibold leading-relaxed">
                        Esta ação é permanente e removerá o exame complementar do prontuário clínico. Para autorizar a exclusão de forma segura, digite sua senha de login abaixo:
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-1">
                      <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5 select-none">
                        Sua Senha de Acesso
                      </label>
                      <input 
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Digite sua senha..."
                        className="h-10 px-3 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full"
                      />
                    </div>

                    <div className="flex gap-3 mt-2">
                      <button
                        onClick={() => {
                          setShowDeleteConfirmModal(false)
                          setDocToDelete(null)
                          setConfirmPassword('')
                        }}
                        disabled={isDeletingDoc}
                        className="flex-1 py-2.5 border border-purple-100 text-[#795465] font-bold rounded-xl text-xs active:scale-95 transition-all select-none"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleConfirmDeleteDocument}
                        disabled={isDeletingDoc || !confirmPassword.trim()}
                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        {isDeletingDoc ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Excluindo...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-xs">delete</span>
                            <span>Confirmar OK</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* Modal de Confirmação Segura para Exclusão de Evolução */}
              {showRecordDeleteConfirmModal && recordToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                  <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl transition-all scale-100 opacity-100 flex flex-col gap-4">
                    
                    <div className="flex justify-between items-center pb-2 border-b border-purple-100/10 select-none">
                      <h3 className="text-sm font-extrabold text-red-600 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-red-600">warning</span>
                        Confirmar Exclusão de Evolução
                      </h3>
                      <button 
                        onClick={() => {
                          setShowRecordDeleteConfirmModal(false)
                          setRecordToDelete(null)
                          setConfirmRecordPassword('')
                        }}
                        className="text-[#795465] p-1 rounded-full hover:bg-purple-50 flex items-center justify-center"
                      >
                        <X className="w-4.5 h-4.5 text-[#795465]" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-[#1d1b1f] font-bold">
                        Deseja realmente excluir a <span className="text-[#70518d]">Sessão #{recordToDelete.session_number}</span>?
                      </p>
                      <p className="text-[10px] text-[#795465] font-semibold leading-relaxed">
                        Esta ação é permanente e removerá a evolução clínica do prontuário. Para autorizar a exclusão de forma segura, digite sua senha de login abaixo:
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-1">
                      <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5 select-none">
                        Sua Senha de Acesso
                      </label>
                      <input 
                        type="password"
                        required
                        value={confirmRecordPassword}
                        onChange={(e) => setConfirmRecordPassword(e.target.value)}
                        placeholder="Digite sua senha..."
                        className="h-10 px-3 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full"
                      />
                    </div>

                    <div className="flex gap-3 mt-2">
                      <button
                        onClick={() => {
                          setShowRecordDeleteConfirmModal(false)
                          setRecordToDelete(null)
                          setConfirmRecordPassword('')
                        }}
                        disabled={isDeletingRecord}
                        className="flex-1 py-2.5 border border-purple-100 text-[#795465] font-bold rounded-xl text-xs active:scale-95 transition-all select-none"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleConfirmDeleteRecord}
                        disabled={isDeletingRecord || !confirmRecordPassword.trim()}
                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        {isDeletingRecord ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Excluindo...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-xs">delete</span>
                            <span>Confirmar OK</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              )}
            </main>
          )}

          {/* Bottom Navigation TabBar */}
          <nav className="fixed bottom-0 left-0 right-0 h-[76px] bg-white border-t border-purple-100/30 flex justify-around items-center px-4 pb-safe z-40 select-none max-w-md mx-auto">
            <Link 
              href="/dashboard/fisioterapeuta" 
              className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
            >
              <span className="material-symbols-outlined text-lg mb-1">home</span>
              <span className="text-[9px] font-semibold">Início</span>
            </Link>
            
            <Link 
              href="/dashboard/fisioterapeuta/prontuario" 
              className="flex flex-col items-center justify-center text-[#70518d] shrink-0"
            >
              <div className="bg-[#70518d]/10 text-[#70518d] rounded-full px-5 py-1 mb-1">
                <span className="material-symbols-outlined font-bold text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
              </div>
              <span className="text-[9px] font-extrabold">Prontuário</span>
            </Link>
            
            <Link 
              href="/dashboard/fisioterapeuta/chat" 
              className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
            >
              <span className="material-symbols-outlined text-lg mb-1">chat</span>
              <span className="text-[9px] font-semibold">Chat</span>
            </Link>
          </nav>

          {/* Nova Evolução Modal Add Form */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl transition-all scale-100 opacity-100 flex flex-col gap-4">
                
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-extrabold text-[#1d1b1f] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#70518d]" />
                    Lançar Evolução
                  </h3>
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="text-[#795465] p-1 rounded-full hover:bg-purple-50 flex items-center justify-center"
                  >
                    <X className="w-4.5 h-4.5 text-[#795465]" />
                  </button>
                </div>

                <form onSubmit={handleCreateRecord} className="flex flex-col gap-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5">
                      Data da Sessão
                    </label>
                    <input 
                      type="date"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="h-10 px-3 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5">
                      Horário da Sessão
                    </label>
                    <input 
                      type="time"
                      required
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="h-10 px-3 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5">
                      Avaliação Perineal (AFA)
                    </label>
                    <input 
                      type="text"
                      placeholder="Ex: AFA 3/5, AFA 4/5"
                      value={newAfa}
                      onChange={(e) => setNewAfa(e.target.value)}
                      className="h-10 px-3 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5">
                      Evolução Clínica & Notas
                    </label>
                    <textarea 
                      required
                      placeholder="Descrição clínica da evolução e comportamento muscular..."
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      className="p-3 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full resize-none h-20"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-[#70518d] text-white rounded-full font-bold hover:bg-[#573974] transition-colors shadow-md mt-2 flex items-center justify-center gap-1.5 text-xs active:scale-95"
                  >
                    Gravar no Prontuário
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Adicionar Exercício Personalizado Modal Form */}
          {showCustomModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl transition-all scale-100 opacity-100 flex flex-col gap-4">
                
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-extrabold text-[#1d1b1f] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#70518d]" />
                    Criar Exercício
                  </h3>
                  <button 
                    onClick={() => setShowCustomModal(false)}
                    className="text-[#795465] p-1 rounded-full hover:bg-purple-50 flex items-center justify-center"
                  >
                    <X className="w-4.5 h-4.5 text-[#795465]" />
                  </button>
                </div>

                <form onSubmit={handleAddCustomExercise} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5">
                      Nome do Exercício
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Massagem Perineal"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="h-10 px-3 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5">
                      Orientação Rápida
                    </label>
                    <input 
                      type="text"
                      placeholder="Ex: Foco no relaxamento perineal"
                      value={customSubtitle}
                      onChange={(e) => setCustomSubtitle(e.target.value)}
                      className="h-10 px-3 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5">
                        Séries
                      </label>
                      <input 
                        type="number"
                        min="1"
                        required
                        value={customSeries}
                        onChange={(e) => setCustomSeries(parseInt(e.target.value))}
                        className="h-10 px-3 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5">
                        Repetições
                      </label>
                      <input 
                        type="text"
                        required
                        value={customReps}
                        onChange={(e) => setCustomReps(e.target.value)}
                        className="h-10 px-3 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5">
                        Frequência
                      </label>
                      <input 
                        type="text"
                        required
                        value={customFreq}
                        onChange={(e) => setCustomFreq(e.target.value)}
                        className="h-10 px-3 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5">
                        Pausa
                      </label>
                      <input 
                        type="text"
                        required
                        value={customPause}
                        onChange={(e) => setCustomPause(e.target.value)}
                        className="h-10 px-3 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider pl-0.5">
                      Instruções Detalhadas
                    </label>
                    <textarea 
                      placeholder="Indique a postura correta, tempo de repouso ou respiração..."
                      value={customDesc}
                      onChange={(e) => setCustomDesc(e.target.value)}
                      className="p-3 rounded-xl border border-purple-100/40 text-xs font-semibold focus:outline-none focus:border-[#70518d] w-full resize-none h-16"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-[#70518d] text-white rounded-full font-bold hover:bg-[#573974] transition-colors shadow-md mt-2 flex items-center justify-center gap-1.5 text-xs active:scale-95"
                  >
                    Adicionar e Prescrever
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Vincular Paciente da Clínica Modal */}
          {showLinkModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl transition-all scale-100 opacity-100 flex flex-col gap-4 max-h-[80vh]">
                
                <div className="flex justify-between items-center pb-2 border-b border-purple-100/10">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#1d1b1f]">
                      Vincular Paciente da Clínica
                    </h3>
                    <p className="text-[9px] text-[#795465] font-semibold mt-0.5">
                      Pacientes cadastrados sem fisioterapeuta responsável
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowLinkModal(false)}
                    className="text-[#795465] p-1 rounded-full hover:bg-purple-50 flex items-center justify-center shrink-0"
                  >
                    <X className="w-4.5 h-4.5 text-[#795465]" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                  {unassignedPatients.length > 0 ? (
                    unassignedPatients.map(patient => (
                      <div 
                        key={patient.id} 
                        className="p-3 bg-[#fff7fd]/40 border border-purple-100/10 rounded-xl flex items-center justify-between gap-3 text-left"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img 
                            alt={patient.full_name || 'Paciente'} 
                            className="w-9 h-9 rounded-full object-cover shrink-0 border border-purple-100/20" 
                            src={patient.avatar_url || '/assets/img/mariana_silva.png'} 
                          />
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-xs text-[#1d1b1f] truncate">
                              {patient.full_name || 'Paciente sem Nome'}
                            </h4>
                            <p className="text-[8px] text-[#795465] font-semibold mt-0.5 truncate">
                              Tel: {patient.phone || 'Sem telefone'}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleLinkPatient(patient.id)}
                          disabled={linkingId !== null}
                          className="bg-[#70518d] hover:bg-[#573974] disabled:opacity-50 text-white font-extrabold text-[9px] px-3 py-1.5 rounded-lg active:scale-95 transition-all shrink-0 shadow-sm"
                        >
                          {linkingId === patient.id ? 'Vinculando...' : 'Vincular a Mim'}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-slate-400 flex flex-col items-center gap-2">
                      <Users className="w-8 h-8 text-[#795465] opacity-40" />
                      <p className="text-xs font-bold text-[#1d1b1f]">Nenhum paciente pendente</p>
                      <p className="text-[9px] text-[#795465] max-w-[200px] leading-relaxed">
                        Todos os pacientes cadastrados na clínica já possuem uma fisioterapeuta responsável designada.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
