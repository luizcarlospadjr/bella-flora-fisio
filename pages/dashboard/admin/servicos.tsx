import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowLeft, Plus, Trash2, Loader2, Heart, Award, Sparkles, AlertCircle, Check, X, ShieldAlert } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'

interface Therapist {
  id: string
  full_name: string | null
}

interface Service {
  id: string
  name: string
  icon: string
  summary: string | null
  duration: string | null
  price: number
  therapist_id: string | null
  created_at: string
}

const presetIcons = [
  { id: 'pregnant_woman', label: 'Gestante/Pélvica', icon: 'pregnant_woman' },
  { id: 'spa', label: 'Massagem/Relaxamento', icon: 'spa' },
  { id: 'acupuncture', label: 'Acupuntura', icon: 'acupuncture' },
  { id: 'fitness_center', label: 'Pilates/Exercício', icon: 'fitness_center' },
  { id: 'medical_services', label: 'Clínico/Médico', icon: 'medical_services' },
  { id: 'favorite', label: 'Coração/Saúde', icon: 'favorite' },
  { id: 'self_care', label: 'Autocuidado', icon: 'self_care' },
  { id: 'psychology', label: 'Acolhimento', icon: 'psychology' }
]

export default function AdminServices() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [services, setServices] = useState<Service[]>([])
  
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('pregnant_woman')
  const [summary, setSummary] = useState('')
  const [therapistId, setTherapistId] = useState('')
  const [duration, setDuration] = useState('50 minutos')
  const [price, setPrice] = useState('180.00')

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          router.push('/login')
          return
        }

        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!userProfile || userProfile.role !== 'admin') {
          // Protect route
          if (userProfile?.role === 'therapist') {
            router.push('/dashboard/fisioterapeuta')
          } else {
            router.push('/dashboard/paciente')
          }
          return
        }
        setProfile(userProfile)

        // Load therapists
        const { data: therapistsList } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'therapist')
        setTherapists(therapistsList || [])

        // Load services
        await fetchServices()
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  async function fetchServices() {
    const { data: servicesList, error } = await supabase
      .from('clinic_services')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Erro ao carregar serviços:', error)
    } else {
      setServices(servicesList || [])
    }
  }

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setActionLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const { error } = await supabase
        .from('clinic_services')
        .insert({
          name: name.trim(),
          icon: selectedIcon,
          summary: summary.trim() || null,
          duration: duration.trim() || null,
          price: parseFloat(price) || 0,
          therapist_id: therapistId || null
        })

      if (error) throw error

      setSuccessMessage('Serviço cadastrado com sucesso!')
      
      // Clear form
      setName('')
      setSelectedIcon('pregnant_woman')
      setSummary('')
      setTherapistId('')
      setDuration('50 minutos')
      setPrice('180.00')

      // Reload services list
      await fetchServices()
    } catch (err: any) {
      console.error('Erro ao criar serviço:', err)
      setErrorMessage(err.message || 'Falha ao cadastrar o serviço.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteService = async (id: string) => {
    if (!confirm('Deseja realmente remover este serviço da clínica?')) return

    setActionLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const { error } = await supabase
        .from('clinic_services')
        .delete()
        .eq('id', id)

      if (error) throw error

      setSuccessMessage('Serviço removido com sucesso!')
      await fetchServices()
    } catch (err: any) {
      console.error('Erro ao excluir serviço:', err)
      setErrorMessage(err.message || 'Falha ao remover o serviço.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff7fd] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#70518d]" />
          <p className="text-sm font-medium text-[#795465]">Acessando Catálogo de Serviços...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Gerenciar Serviços | Direção | Bella Flora</title>
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
          <header className="bg-white px-5 py-3.5 border-b border-purple-100/30 flex items-center justify-between shrink-0 sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/admin" className="text-[#795465] hover:text-[#70518d] transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="font-extrabold text-sm tracking-tight text-[#70518d]">
                  Cadastrar Serviços
                </h1>
                <span className="block text-[8px] text-[#795465] font-semibold uppercase tracking-wider">
                  Configuração de Especialidades ({services.length})
                </span>
              </div>
            </div>
            
            <div className="w-8"></div>
          </header>

          <main className="flex-1 px-5 py-5 flex flex-col gap-5">
            
            {/* Feedback Messages */}
            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-start gap-2 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 flex items-start gap-2 text-xs font-semibold animate-fade-in">
                <Check className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form Card */}
            <section className="bg-white border border-purple-100/20 p-5 rounded-3xl shadow-sm flex flex-col gap-4">
              <h2 className="text-xs font-bold text-[#70518d] uppercase tracking-wider flex items-center gap-1.5 border-b border-purple-100/10 pb-2">
                <Plus className="w-4 h-4" />
                Novo Serviço ou Especialidade
              </h2>

              <form onSubmit={handleCreateService} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#795465] uppercase block">Nome do Serviço</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Fisioterapia Pélvica Avançada"
                    className="w-full h-10 px-3 border border-purple-100/30 rounded-xl text-xs font-medium placeholder-[#cdc3cf] focus:outline-none focus:border-[#70518d] shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-[#795465] uppercase block">Ícone do Serviço</label>
                  <div className="grid grid-cols-4 gap-2">
                    {presetIcons.map(item => {
                      const isSelected = selectedIcon === item.icon
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedIcon(item.icon)}
                          title={item.label}
                          className={`h-11 rounded-xl border flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'bg-[#70518d]/10 border-[#70518d] text-[#70518d]' 
                              : 'bg-white border-purple-100/20 text-[#795465] hover:border-purple-200'
                          }`}
                        >
                          <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#795465] uppercase block">Resumo / Descrição curta</label>
                  <textarea
                    value={summary}
                    onChange={e => setSummary(e.target.value)}
                    placeholder="Descreva brevemente o foco do atendimento e benefícios..."
                    rows={2}
                    className="w-full p-3 border border-purple-100/30 rounded-xl text-xs font-medium placeholder-[#cdc3cf] focus:outline-none focus:border-[#70518d] shadow-sm resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#795465] uppercase block">Profissional Responsável (Terapeuta)</label>
                  <select
                    value={therapistId}
                    onChange={e => setTherapistId(e.target.value)}
                    className="w-full h-10 px-3 border border-purple-100/30 rounded-xl text-xs font-semibold text-[#1d1b1f] focus:outline-none focus:border-[#70518d] shadow-sm bg-white"
                  >
                    <option value="">-- Usar terapeuta do paciente por padrão --</option>
                    {therapists.map(t => (
                      <option key={t.id} value={t.id}>
                        Dra. {t.full_name || 'Fisioterapeuta'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#795465] uppercase block">Duração</label>
                    <input
                      type="text"
                      required
                      value={duration}
                      onChange={e => setDuration(e.target.value)}
                      placeholder="Ex: 50 minutos"
                      className="w-full h-10 px-3 border border-purple-100/30 rounded-xl text-xs font-medium placeholder-[#cdc3cf] focus:outline-none focus:border-[#70518d] shadow-sm"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#795465] uppercase block">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="Ex: 180.00"
                      className="w-full h-10 px-3 border border-purple-100/30 rounded-xl text-xs font-medium placeholder-[#cdc3cf] focus:outline-none focus:border-[#70518d] shadow-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full h-11 bg-[#70518d] hover:bg-[#573974] disabled:bg-purple-300 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar e Adicionar Serviço'
                  )}
                </button>
              </form>
            </section>

            {/* Services List Section */}
            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-[#70518d] uppercase tracking-wider pl-1 select-none">Serviços Cadastrados</h3>

              <div className="space-y-3.5">
                {services.map(service => {
                  const matchingTherapist = therapists.find(t => t.id === service.therapist_id)
                  
                  return (
                    <div
                      key={service.id}
                      className="p-4 bg-white border border-purple-100/20 rounded-2xl shadow-sm transition-all hover:border-[#70518d]/30 flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#70518d] flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">{service.icon}</span>
                          </div>
                          <div>
                            <h4 className="font-extrabold text-[#1d1b1f] text-xs leading-snug">{service.name}</h4>
                            <p className="text-[9px] text-[#795465] font-semibold mt-0.5">
                              {service.duration || 'Sem duração'} • R$ {Number(service.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteService(service.id)}
                          disabled={actionLoading}
                          className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {service.summary && (
                        <p className="text-[10px] text-[#795465] font-semibold leading-relaxed border-t border-purple-100/10 pt-2.5">
                          {service.summary}
                        </p>
                      )}

                      <div className="flex justify-between items-center bg-purple-50/20 px-3 py-1.5 rounded-lg border border-purple-100/10 text-[9px]">
                        <span className="text-[#795465] font-bold">Atendimento por:</span>
                        <span className="font-extrabold text-[#70518d]">
                          {matchingTherapist ? `Dra. ${matchingTherapist.full_name}` : 'Qualquer profissional (padrão)'}
                        </span>
                      </div>
                    </div>
                  )
                })}

                {services.length === 0 && (
                  <div className="text-center py-10 bg-white border border-purple-100/20 rounded-2xl">
                    <ShieldAlert className="w-8 h-8 mx-auto text-[#795465] opacity-50 mb-2" />
                    <p className="text-xs font-semibold text-[#795465]">Nenhum serviço cadastrado.</p>
                  </div>
                )}
              </div>
            </section>

          </main>

          {/* Admin Bottom Navigation (TabBar) */}
          <nav className="fixed bottom-0 left-0 right-0 h-[76px] bg-white border-t border-purple-100/30 flex justify-around items-center px-4 pb-safe z-40 select-none max-w-md mx-auto">
            <Link 
              href="/dashboard/admin" 
              className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
            >
              <span className="material-symbols-outlined text-lg mb-1">home</span>
              <span className="text-[9px] font-semibold">Início</span>
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
