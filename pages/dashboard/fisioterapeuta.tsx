import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ClipboardList, Calendar, Users, MessageSquare, LogOut, Loader2, Sparkles, Plus, ChevronRight, Check, X } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useToast } from '../../components/Toast'

export default function TherapistDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [patientsCount, setPatientsCount] = useState(0)
  const [sessionsCount, setSessionsCount] = useState(0)
  const [prescriptionsCount, setPrescriptionsCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [pendingTransfers, setPendingTransfers] = useState<any[]>([])
  const { showSuccess, showError, showWarning } = useToast()

  useEffect(() => {
    let messagesSub: any = null

    async function setupUnreadTracking() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .is('read_at', null)

      setUnreadCount(count || 0)

      messagesSub = supabase
        .channel('dashboard-unread-realtime')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'chat_messages'
        }, async () => {
          const { count: updatedCount } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', user.id)
            .is('read_at', null)
          setUnreadCount(updatedCount || 0)
        })
        .subscribe()
    }

    setupUnreadTracking()

    return () => {
      if (messagesSub) supabase.removeChannel(messagesSub)
    }
  }, [])

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

        // Load pending transfer requests for the current therapist
        try {
          const { data: dbTransfers, error: transError } = await supabase
            .from('transfer_requests')
            .select('*')
            .eq('current_therapist_id', user.id)
            .eq('status', 'pending')

          if (dbTransfers && dbTransfers.length > 0) {
            // Fetch names for patients and target therapists
            const patientIds = dbTransfers.map((t: any) => t.patient_id)
            const targetIds = dbTransfers.map((t: any) => t.target_therapist_id)
            const allUserIds = Array.from(new Set([...patientIds, ...targetIds]))

            const { data: userNames } = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', allUserIds)

            const nameMap = new Map((userNames || []).map((u: any) => [u.id, u.full_name]))

            const mappedTransfers = dbTransfers.map((t: any) => ({
              ...t,
              patientName: nameMap.get(t.patient_id) || 'Paciente',
              targetTherapistName: nameMap.get(t.target_therapist_id) || 'Fisioterapeuta'
            }))

            setPendingTransfers(mappedTransfers)
          } else {
            setPendingTransfers([])
          }
        } catch (transErr) {
          console.error('Erro ao buscar solicitações de transferência:', transErr)
        }
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

  const handleApproveTransfer = async (transferId: string, patientId: string, targetTherapistId: string) => {
    try {
      if (transferId.startsWith('tx_mock_')) {
        showSuccess('Transferência simulada aprovada com sucesso!')
        setPendingTransfers(prev => prev.filter(t => t.id !== transferId))
        setPatientsCount(prev => Math.max(0, prev - 1))
        return
      }

      // 1. Update transfer request status to 'approved'
      const { error: txError } = await supabase
        .from('transfer_requests')
        .update({ status: 'approved' })
        .eq('id', transferId)

      if (txError) throw txError

      // 2. Update patient's therapist_id in profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ therapist_id: targetTherapistId })
        .eq('id', patientId)

      if (profileError) throw profileError

      showSuccess('Transferência aprovada com sucesso!')

      // Remove from list and update metrics
      setPendingTransfers(prev => prev.filter(t => t.id !== transferId))
      setPatientsCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Erro ao aprovar transferência:', err)
      showError('Ocorreu um erro ao aprovar a transferência.')
    }
  }

  const handleRejectTransfer = async (transferId: string) => {
    try {
      if (transferId.startsWith('tx_mock_')) {
        showWarning('Transferência simulada recusada.')
        setPendingTransfers(prev => prev.filter(t => t.id !== transferId))
        return
      }

      // Update transfer request status to 'rejected'
      const { error: txError } = await supabase
        .from('transfer_requests')
        .update({ status: 'rejected' })
        .eq('id', transferId)

      if (txError) throw txError

      showWarning('Transferência recusada.')

      // Remove from list
      setPendingTransfers(prev => prev.filter(t => t.id !== transferId))
    } catch (err) {
      console.error('Erro ao recusar transferência:', err)
      showError('Ocorreu um erro ao recusar a transferência.')
    }
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
                <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
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
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  SESSÃO CLÍNICA ATIVA
                </div>
                <h2 className="font-extrabold text-lg leading-tight">Dra. {profile?.full_name || 'Fisioterapeuta'}</h2>
                <p className="text-[11px] text-purple-200/90 font-medium mt-1 leading-relaxed">
                  Gerencie suas consultas do dia, evolua prontuários e prescreva rotinas domiciliares de forma segura.
                </p>
              </div>
            </section>

            {/* Solicitações de Transferência Pendentes */}
            {pendingTransfers.length > 0 && (
              <section className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-[#b45309] uppercase tracking-wider pl-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm animate-pulse text-amber-600">warning</span>
                  Consentimento de Transferência Pendente
                </h3>
                {pendingTransfers.map((transfer) => (
                  <div 
                    key={transfer.id}
                    className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 p-4 rounded-2xl shadow-sm flex flex-col gap-3 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100/30 rounded-full blur-xl pointer-events-none"></div>
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <h4 className="font-bold text-amber-950 text-sm">{transfer.patientName}</h4>
                        <p className="text-[10px] text-amber-800 font-semibold mt-0.5">
                          Solicitação de transferência para <span className="font-bold">{transfer.targetTherapistName}</span>
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[8px] uppercase tracking-wider">
                        Pendente
                      </span>
                    </div>

                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-amber-200/30 text-[11px] text-amber-900 leading-relaxed font-medium">
                      <span className="font-bold text-amber-950 block mb-0.5">Justificativa da Gestão:</span>
                      "{transfer.justification}"
                    </div>

                    <div className="flex gap-2.5 mt-1 relative z-10">
                      <button
                        onClick={() => handleApproveTransfer(transfer.id, transfer.patient_id, transfer.target_therapist_id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all active:scale-[0.97]"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Autorizar
                      </button>
                      <button
                        onClick={() => handleRejectTransfer(transfer.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold rounded-xl transition-all active:scale-[0.97]"
                      >
                        <X className="w-3.5 h-3.5" />
                        Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            )}

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
                onClick={() => router.push('/dashboard/fisioterapeuta/agenda')}
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
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#70518d] flex items-center justify-center group-hover:scale-105 transition-transform relative">
                    <MessageSquare className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse"></span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-[#1d1b1f] text-sm">Mensagens Direct</h4>
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white rounded-full text-[8px] font-black px-1.5 py-0.2 animate-pulse select-none leading-none">
                          {unreadCount}
                        </span>
                      )}
                    </div>
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
              className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0 relative"
            >
              <span className="material-symbols-outlined text-lg mb-1">chat</span>
              <span className="text-[9px] font-semibold">Chat</span>
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
              )}
            </Link>
          </nav>

        </div>
      </div>
    </>
  )
}
