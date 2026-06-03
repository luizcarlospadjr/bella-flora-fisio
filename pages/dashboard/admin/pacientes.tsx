import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Search, Edit2, Check, X, ShieldAlert, ArrowLeft, Users, ArrowRightLeft, Loader2 } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'

interface Patient {
  id: string
  name: string
  phone: string
  status: 'active' | 'discharged' | 'inactive'
  therapistId: string
  therapistName: string
  registrationDate: string
  pendingTransfer?: {
    id: string
    targetTherapistId: string
    targetTherapistName: string
    justification: string
  }
}

interface TherapistOption {
  id: string
  name: string
}

const activeTherapists: TherapistOption[] = [
  { id: 'ther_1', name: 'Dra. Ana Costa' },
  { id: 'ther_2', name: 'Dra. Beatriz Santos' },
  { id: 'ther_3', name: 'Dra. Camila Melo' },
  { id: 'ther_4', name: 'Dra. Daniela Lima' }
]

const mockPatients: Patient[] = [
  {
    id: 'pat_1',
    name: 'Mariana Silva',
    phone: '(11) 99888-7777',
    status: 'active',
    therapistId: 'ther_1',
    therapistName: 'Dra. Ana Costa',
    registrationDate: '12/03/2026'
  },
  {
    id: 'pat_2',
    name: 'Fernanda Souza',
    phone: '(11) 98765-1234',
    status: 'active',
    therapistId: 'ther_1',
    therapistName: 'Dra. Ana Costa',
    registrationDate: '05/04/2026'
  },
  {
    id: 'pat_3',
    name: 'Juliana Lima',
    phone: '(11) 97654-5678',
    status: 'active',
    therapistId: 'ther_2',
    therapistName: 'Dra. Beatriz Santos',
    registrationDate: '18/02/2026'
  },
  {
    id: 'pat_4',
    name: 'Gabriela Rocha',
    phone: '(11) 96543-9012',
    status: 'discharged',
    therapistId: 'ther_3',
    therapistName: 'Dra. Camila Melo',
    registrationDate: '20/01/2026'
  },
  {
    id: 'pat_5',
    name: 'Patricia Albuquerque',
    phone: '(11) 95432-3456',
    status: 'inactive',
    therapistId: 'ther_4',
    therapistName: 'Dra. Daniela Lima',
    registrationDate: '10/05/2026'
  }
]

export default function AdminPatients() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [therapistsList, setTherapistsList] = useState<TherapistOption[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [activePatient, setActivePatient] = useState<Patient | null>(null)

  // Edit states
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editStatus, setEditStatus] = useState<'active' | 'discharged' | 'inactive'>('active')
  const [editTherapistId, setEditTherapistId] = useState('')
  const [justification, setJustification] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        
        // 1. Fetch real therapists
        const { data: dbTherapists, error: therError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'therapist')

        if (therError) throw therError

        const realTherapists: TherapistOption[] = (dbTherapists || []).map(t => ({
          id: t.id,
          name: t.full_name || 'Fisioterapeuta Sem Nome'
        }))

        const mergedTherapists = [
          ...realTherapists,
          ...activeTherapists.filter(mt => !realTherapists.some(rt => rt.id === mt.id || rt.name.toLowerCase() === mt.name.toLowerCase()))
        ]
        setTherapistsList(mergedTherapists)

        // 2. Fetch pending transfer requests
        const { data: dbTransfers } = await supabase
          .from('transfer_requests')
          .select('*')
          .eq('status', 'pending')

        // 3. Fetch real patients
        const { data: dbProfiles, error: patError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'patient')

        if (patError) throw patError

        const dbPatients: Patient[] = (dbProfiles || []).map(p => {
          const therapist = mergedTherapists.find(t => t.id === p.therapist_id)
          const pendingTransfer = (dbTransfers || []).find(t => t.patient_id === p.id)
          
          let mappedPending = undefined
          if (pendingTransfer) {
            const targetTherapistName = mergedTherapists.find(t => t.id === pendingTransfer.target_therapist_id)?.name || 'Fisioterapeuta'
            mappedPending = {
              id: pendingTransfer.id,
              targetTherapistId: pendingTransfer.target_therapist_id,
              targetTherapistName,
              justification: pendingTransfer.justification
            }
          }

          return {
            id: p.id,
            name: p.full_name || 'Paciente Novo',
            phone: p.phone || 'Sem celular',
            status: (p.status === 'discharged' || p.status === 'inactive') ? p.status : 'active',
            therapistId: p.therapist_id || '',
            therapistName: therapist ? therapist.name : 'Sem Fisioterapeuta',
            registrationDate: p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : 'Recém-criado',
            pendingTransfer: mappedPending
          }
        })

        // Merge patients, avoiding duplicates with mock patients
        const filteredMock = mockPatients.filter(mp => 
          !dbPatients.some(dp => dp.name.toLowerCase() === mp.name.toLowerCase() || dp.id === mp.id)
        )

        setPatients([...dbPatients, ...filteredMock])
      } catch (err) {
        console.error('Erro ao buscar dados do painel:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.therapistName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openEditModal = (patient: Patient) => {
    setActivePatient(patient)
    setEditName(patient.name)
    setEditPhone(patient.phone)
    setEditStatus(patient.status)
    setEditTherapistId(patient.therapistId)
    setJustification('')
    setShowEditModal(true)
  }

  const handleEditPatient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activePatient || !editName.trim()) return

    const therapistName = editTherapistId
      ? (therapistsList.find(t => t.id === editTherapistId)?.name || 'Sem Fisioterapeuta')
      : 'Sem Fisioterapeuta'

    // Check if it's an ethical transfer
    const isTransfer = activePatient.therapistId && editTherapistId && activePatient.therapistId !== editTherapistId

    try {
      const isMock = activePatient.id.startsWith('pat_')

      if (isTransfer) {
        if (!justification.trim()) {
          alert('Por favor, informe a justificativa para a transferência ética do paciente.')
          return
        }

        if (!isMock) {
          // Insert transfer request in Supabase
          const { data: insertData, error: txError } = await supabase
            .from('transfer_requests')
            .insert({
              patient_id: activePatient.id,
              current_therapist_id: activePatient.therapistId,
              target_therapist_id: editTherapistId,
              justification: justification.trim(),
              status: 'pending'
            })
            .select()
            .single()

          if (txError) throw txError

          // Update local state to show pending transfer in the UI
          setPatients(patients.map(p => 
            p.id === activePatient.id
              ? {
                  ...p,
                  name: editName.trim(),
                  phone: editPhone.trim(),
                  status: editStatus,
                  pendingTransfer: {
                    id: insertData.id,
                    targetTherapistId: editTherapistId,
                    targetTherapistName: therapistName,
                    justification: justification.trim()
                  }
                }
              : p
          ))
        } else {
          // Mock patient local sync
          setPatients(patients.map(p => 
            p.id === activePatient.id
              ? {
                  ...p,
                  name: editName.trim(),
                  phone: editPhone.trim(),
                  status: editStatus,
                  pendingTransfer: {
                    id: 'tx_mock_' + Date.now(),
                    targetTherapistId: editTherapistId,
                    targetTherapistName: therapistName,
                    justification: justification.trim()
                  }
                }
              : p
          ))
        }
        alert('Solicitação de transferência ética enviada com sucesso ao fisioterapeuta responsável!')
      } else {
        // Direct assignment (patient has no previous therapist, or therapist was cleared, or same therapist)
        if (!isMock) {
          const { error } = await supabase
            .from('profiles')
            .update({
              full_name: editName.trim(),
              phone: editPhone.trim(),
              status: editStatus,
              therapist_id: editTherapistId || null
            })
            .eq('id', activePatient.id)

          if (error) throw error
        }

        setPatients(patients.map(p => 
          p.id === activePatient.id
            ? {
                ...p,
                name: editName.trim(),
                phone: editPhone.trim(),
                status: editStatus,
                therapistId: editTherapistId,
                therapistName,
                pendingTransfer: undefined
              }
            : p
        ))
      }

      setShowEditModal(false)
      setActivePatient(null)
      setJustification('')
    } catch (err) {
      console.error('Erro ao salvar alterações do paciente:', err)
      alert('Erro ao salvar alterações do paciente.')
    }
  }

  return (
    <>
      <Head>
        <title>Diretório de Pacientes | Direção | Bella Flora</title>
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

      <div className="min-h-screen w-full bg-[#fff7fd] font-sans antialiased overflow-x-hidden select-none">
        <div className="relative w-full min-h-screen max-w-md mx-auto bg-[#fff7fd] flex flex-col pb-24">
          
          {/* Header */}
          <header className="bg-white px-5 py-3.5 border-b border-purple-100/30 flex items-center justify-between shrink-0 sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/admin" className="text-[#795465] hover:text-[#70518d] transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="font-extrabold text-sm tracking-tight text-[#70518d]">
                  Diretório de Pacientes
                </h1>
                <span className="block text-[8px] text-[#795465] font-semibold uppercase tracking-wider">
                  Pacientes da Clínica ({patients.length})
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 px-5 py-5 flex flex-col gap-4">
            
            {/* Search Bar */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#795465] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar paciente ou fisioterapeuta..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-white border border-purple-100/30 rounded-2xl text-xs font-medium placeholder-[#cdc3cf] focus:outline-none focus:border-[#70518d]/40 shadow-sm"
              />
            </div>

            <div className="space-y-3.5">
              {loading ? (
                <div className="text-center py-12 bg-white border border-purple-100/20 rounded-2xl flex flex-col items-center justify-center gap-2.5">
                  <Loader2 className="w-7 h-7 animate-spin text-[#70518d]" />
                  <p className="text-[11px] font-bold text-[#795465]">Buscando pacientes...</p>
                </div>
              ) : (
                <>
                  {filteredPatients.map(pat => (
                    <div
                      key={pat.id}
                      className={`p-4 bg-white border rounded-2xl shadow-sm transition-all relative flex flex-col gap-3 ${
                        pat.status === 'discharged'
                          ? 'border-emerald-100 bg-emerald-50/5'
                          : pat.status === 'inactive'
                          ? 'border-red-50 bg-red-50/5 opacity-80'
                          : 'border-purple-100/20 hover:border-[#70518d]/30'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-50 text-[#70518d] font-bold text-xs flex items-center justify-center">
                            {pat.name[0]}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-[#1d1b1f] text-sm flex items-center gap-1.5 flex-wrap">
                              {pat.name}
                              {pat.status === 'discharged' ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[8px] uppercase tracking-wider">
                                  Alta Médica
                                </span>
                              ) : pat.status === 'inactive' ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 font-bold text-[8px] uppercase tracking-wider">
                                  Inativo
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-purple-50 text-[#70518d] border border-purple-100/30 font-bold text-[8px] uppercase tracking-wider">
                                  Ativo
                                </span>
                              )}
                            </h4>
                            <p className="text-[10px] text-[#795465] font-semibold">Contato: {pat.phone}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => openEditModal(pat)}
                          className="p-2 rounded-full hover:bg-purple-50 text-[#795465] hover:text-[#70518d] transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Therapist assignment and metadata */}
                      <div className="flex flex-col gap-2 border-t border-purple-100/10 pt-3 text-[10px] text-[#4b454e]">
                        <div className="flex justify-between items-center">
                          <span className="text-[#795465] font-semibold">Fisioterapeuta Responsável:</span>
                          <span className="font-bold text-[#70518d] flex items-center gap-1 bg-[#70518d]/5 px-2 py-0.5 rounded border border-[#70518d]/10">
                            <Users className="w-3.5 h-3.5 shrink-0" />
                            {pat.therapistName}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[9px] text-[#795465] font-semibold pt-1">
                          <span>Data de Ingressão:</span>
                          <span>{pat.registrationDate}</span>
                        </div>

                        {/* Pending Transfer Alert */}
                        {pat.pendingTransfer && (
                          <div className="mt-2 p-2.5 bg-amber-50/50 border border-amber-100 rounded-xl flex flex-col gap-1 text-[9px] text-amber-800 animate-pulse">
                            <div className="flex items-center gap-1 font-bold">
                              <span className="material-symbols-outlined text-[12px] leading-none">hourglass_empty</span>
                              Transferência Ética Solicitada
                            </div>
                            <p className="font-semibold text-amber-900 leading-snug">
                              Aguardando consentimento da {pat.therapistName} para transferir para a <strong>{pat.pendingTransfer.targetTherapistName}</strong>.
                            </p>
                            <p className="italic text-[8px] bg-white/70 p-1.5 rounded border border-amber-100/50 mt-0.5 text-amber-800">
                              Justificativa: "{pat.pendingTransfer.justification}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {filteredPatients.length === 0 && (
                    <div className="text-center py-10 bg-white border border-purple-100/20 rounded-2xl">
                      <ShieldAlert className="w-8 h-8 mx-auto text-[#795465] opacity-50 mb-2" />
                      <p className="text-xs font-semibold text-[#795465]">Nenhum paciente encontrado.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>

          {/* Edit Patient Modal */}
          {showEditModal && activePatient && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-purple-100/20 shadow-xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex justify-between items-center pb-2 border-b border-purple-100/10">
                  <h3 className="font-extrabold text-sm text-[#70518d]">Editar Paciente</h3>
                  <button onClick={() => { setShowEditModal(false); setActivePatient(null); }} className="text-[#795465] hover:text-[#70518d]">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleEditPatient} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#795465] uppercase block">Nome do Paciente</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full h-10 px-3 border border-purple-100/30 rounded-xl text-xs focus:outline-none focus:border-[#70518d]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#795465] uppercase block">Telefone de Contato</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      className="w-full h-10 px-3 border border-purple-100/30 rounded-xl text-xs focus:outline-none focus:border-[#70518d]"
                    />
                  </div>

                  {/* Transfer / Reassign Therapist */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#795465] uppercase block flex items-center gap-1">
                      <ArrowRightLeft className="w-3 h-3 text-[#70518d]" />
                      Transferir Fisioterapeuta Responsável
                    </label>
                    <select
                      value={editTherapistId}
                      onChange={e => setEditTherapistId(e.target.value)}
                      className="w-full h-10 px-3 border border-purple-100/30 rounded-xl text-xs bg-white focus:outline-none focus:border-[#70518d]"
                    >
                      <option value="">Sem Fisioterapeuta</option>
                      {therapistsList.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Ethical Transfer Justification Field */}
                  {activePatient && activePatient.therapistId && editTherapistId && activePatient.therapistId !== editTherapistId && (
                    <div className="space-y-1 bg-amber-50/30 p-3 rounded-xl border border-amber-100/40 animate-in fade-in slide-in-from-top-1 duration-150">
                      <label className="text-[9px] font-bold text-amber-700 uppercase block flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        Justificativa de Transferência Ética *
                      </label>
                      <textarea
                        required
                        value={justification}
                        onChange={e => setJustification(e.target.value)}
                        placeholder="Explique o motivo de transferir o paciente de seu terapeuta atual (obrigatório)..."
                        rows={2}
                        className="w-full p-2.5 border border-amber-200/50 rounded-xl text-xs focus:outline-none focus:border-amber-500 bg-white placeholder-amber-700/30 text-[#1d1b1f] font-medium resize-none"
                      />
                    </div>
                  )}

                  {/* Patient Status selection */}
                  <div className="space-y-2 border-t border-purple-100/10 pt-3">
                    <label className="text-[9px] font-bold text-[#795465] uppercase block">Status Clínico</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditStatus('active')}
                        className={`flex-1 h-9 rounded-lg border text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                          editStatus === 'active'
                            ? 'bg-[#70518d]/10 border-[#70518d] text-[#70518d]'
                            : 'border-purple-100/30 bg-transparent text-[#795465]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" /> Ativo
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditStatus('discharged')}
                        className={`flex-1 h-9 rounded-lg border text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                          editStatus === 'discharged'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                            : 'border-purple-100/30 bg-transparent text-[#795465]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 animate-pulse" /> Alta Médica
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setEditStatus('inactive')}
                        className={`flex-1 h-9 rounded-lg border text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                          editStatus === 'inactive'
                            ? 'bg-red-50 border-red-500 text-red-600'
                            : 'border-purple-100/30 bg-transparent text-[#795465]'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" /> Inativo
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 bg-[#70518d] hover:bg-[#573974] text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] mt-3"
                  >
                    Salvar Alterações
                  </button>
                </form>
              </div>
            </div>
          )}

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
              className="flex flex-col items-center justify-center text-[#70518d] shrink-0"
            >
              <div className="bg-[#70518d]/10 text-[#70518d] rounded-full px-5 py-1 mb-1">
                <span className="material-symbols-outlined font-bold text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
              </div>
              <span className="text-[9px] font-extrabold">Pacientes</span>
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
