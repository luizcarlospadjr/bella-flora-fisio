import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Plus, Search, Edit2, Check, X, ShieldAlert, ArrowLeft, Loader2, Sparkles } from 'lucide-react'

interface Therapist {
  id: string
  name: string
  crefito: string
  phone: string
  email: string
  patientsCount: number
  commission: string
  status: 'active' | 'suspended'
  scale: string
  specialty?: string
  education?: string
  experience?: string
  courses?: string
  bio?: string
}

const mockTherapists: Therapist[] = [
  {
    id: 'ther_1',
    name: 'Dra. Ana Costa',
    crefito: '28491-F',
    phone: '(11) 98765-4321',
    email: 'ana.costa@bellaflora.com.br',
    patientsCount: 12,
    commission: '60%',
    status: 'active',
    scale: 'Seg à Sex - 08h às 17h'
  },
  {
    id: 'ther_2',
    name: 'Dra. Beatriz Santos',
    crefito: '39420-F',
    phone: '(11) 97654-3210',
    email: 'beatriz.santos@bellaflora.com.br',
    patientsCount: 8,
    commission: '55%',
    status: 'active',
    scale: 'Seg, Qua, Sex - 08h às 14h'
  },
  {
    id: 'ther_3',
    name: 'Dra. Camila Melo',
    crefito: '48210-F',
    phone: '(11) 96543-2109',
    email: 'camila.melo@bellaflora.com.br',
    patientsCount: 6,
    commission: 'R$ 80 / sessão',
    status: 'active',
    scale: 'Ter e Qui - 13h às 20h'
  },
  {
    id: 'ther_4',
    name: 'Dra. Daniela Lima',
    crefito: '19830-F',
    phone: '(11) 95432-1098',
    email: 'daniela.lima@bellaflora.com.br',
    patientsCount: 2,
    commission: '50%',
    status: 'suspended',
    scale: 'Sábado - 08h às 13h'
  }
]

import { supabase } from '../../../lib/supabaseClient'

export default function AdminTherapists() {
  const [therapists, setTherapists] = useState<Therapist[]>(mockTherapists)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeTherapist, setActiveTherapist] = useState<Therapist | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedTherapistId, setExpandedTherapistId] = useState<string | null>(null)

  // Add Form States
  const [newName, setNewName] = useState('')
  const [newCrefito, setNewCrefito] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newCommission, setNewCommission] = useState('50%')
  const [newScale, setNewScale] = useState('Seg à Sex - 08h às 17h')

  // Edit Form States
  const [editName, setEditName] = useState('')
  const [editCrefito, setEditCrefito] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editCommission, setEditCommission] = useState('')
  const [editScale, setEditScale] = useState('')
  const [editStatus, setEditStatus] = useState<'active' | 'suspended'>('active')
  const [editSpecialty, setEditSpecialty] = useState('')
  const [editEducation, setEditEducation] = useState('')
  const [editExperience, setEditExperience] = useState('')
  const [editCourses, setEditCourses] = useState('')
  const [editBio, setEditBio] = useState('')

  // Load therapists from database
  useEffect(() => {
    async function loadTherapists() {
      try {
        setLoading(true)
        const { data: dbProfiles, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'therapist')

        if (error) throw error

        // Count patients grouped by therapist
        const { data: patientsList } = await supabase
          .from('profiles')
          .select('id, therapist_id')
          .eq('role', 'patient')

        const therapistPatientsMap: Record<string, number> = {}
        patientsList?.forEach(p => {
          if (p.therapist_id) {
            therapistPatientsMap[p.therapist_id] = (therapistPatientsMap[p.therapist_id] || 0) + 1
          }
        })

        const dbTherapists: Therapist[] = (dbProfiles || []).map(p => ({
          id: p.id,
          name: p.full_name || 'Fisioterapeuta',
          crefito: p.crefito || 'Pendente',
          phone: p.phone || 'Sem celular',
          email: p.email || (p.full_name ? `${p.full_name.toLowerCase().replace(/\s+/g, '')}@bellaflora.com.br` : 'contato@bellaflora.com.br'),
          patientsCount: therapistPatientsMap[p.id] || 0,
          commission: p.commission || '50%',
          status: p.status || 'active',
          scale: p.scale || 'Seg à Sex - 08h às 17h',
          specialty: p.specialty || '',
          education: p.education || '',
          experience: p.experience || '',
          courses: p.courses || '',
          bio: p.bio || ''
        }))

        // Merge, excluding mock therapists that match database therapists' names
        const filteredMock = mockTherapists.filter(mt => 
          !dbTherapists.some(dt => dt.name.toLowerCase() === mt.name.toLowerCase() || dt.id === mt.id)
        )

        setTherapists([...dbTherapists, ...filteredMock])
      } catch (err) {
        console.error('Erro ao buscar terapeutas:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTherapists()
  }, [])

  const filteredTherapists = therapists.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.crefito.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddTherapist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newCrefito.trim()) return

    const newTher: Therapist = {
      id: 'ther_' + Date.now(),
      name: newName.trim(),
      crefito: newCrefito.trim(),
      phone: newPhone.trim() || '(11) 99999-9999',
      email: newEmail.trim() || 'contato@bellaflora.com.br',
      patientsCount: 0,
      commission: newCommission,
      status: 'active',
      scale: newScale,
      specialty: '',
      education: '',
      experience: '',
      courses: '',
      bio: ''
    }

    setTherapists([...therapists, newTher])
    
    // Clear and close
    setNewName('')
    setNewCrefito('')
    setNewPhone('')
    setNewEmail('')
    setNewCommission('50%')
    setNewScale('Seg à Sex - 08h às 17h')
    setShowAddModal(false)
  }

  const openEditModal = (therapist: Therapist) => {
    setActiveTherapist(therapist)
    setEditName(therapist.name)
    setEditCrefito(therapist.crefito)
    setEditPhone(therapist.phone)
    setEditEmail(therapist.email)
    setEditCommission(therapist.commission)
    setEditScale(therapist.scale)
    setEditStatus(therapist.status)
    setEditSpecialty(therapist.specialty || '')
    setEditEducation(therapist.education || '')
    setEditExperience(therapist.experience || '')
    setEditCourses(therapist.courses || '')
    setEditBio(therapist.bio || '')
    setShowEditModal(true)
  }

  const handleEditTherapist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeTherapist || !editName.trim()) return

    try {
      const isMock = activeTherapist.id.startsWith('ther_')

      if (!isMock) {
        // Try updating all fields
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: editName.trim(),
            crefito: editCrefito.trim(),
            phone: editPhone.trim(),
            commission: editCommission.trim(),
            scale: editScale.trim(),
            status: editStatus,
            specialty: editSpecialty.trim(),
            education: editEducation.trim(),
            experience: editExperience.trim(),
            courses: editCourses.trim(),
            bio: editBio.trim()
          })
          .eq('id', activeTherapist.id)

        if (error) {
          console.warn("Failed to update custom fields, falling back to standard ones:", error)
          // Fallback update without custom columns
          const { error: fallbackError } = await supabase
            .from('profiles')
            .update({
              full_name: editName.trim(),
              phone: editPhone.trim()
            })
            .eq('id', activeTherapist.id)

          if (fallbackError) throw fallbackError
        }
      }

      setTherapists(therapists.map(t => 
        t.id === activeTherapist.id 
          ? {
              ...t,
              name: editName.trim(),
              crefito: editCrefito.trim(),
              phone: editPhone.trim(),
              email: editEmail.trim(),
              commission: editCommission,
              scale: editScale,
              status: editStatus,
              specialty: editSpecialty.trim(),
              education: editEducation.trim(),
              experience: editExperience.trim(),
              courses: editCourses.trim(),
              bio: editBio.trim()
            }
          : t
      ))

      setShowEditModal(false)
      setActiveTherapist(null)
    } catch (err) {
      console.error("Erro ao atualizar terapeuta:", err)
      alert("Erro ao salvar alterações do terapeuta.")
    }
  }

  return (
    <>
      <Head>
        <title>Gerenciar Terapeutas | Direção | Bella Flora</title>
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
                  Gerenciar Terapeutas
                </h1>
                <span className="block text-[8px] text-[#795465] font-semibold uppercase tracking-wider">
                  Equipe Clínica ({therapists.length})
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#70518d] hover:bg-[#573974] text-white text-[10px] font-bold rounded-full shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova
            </button>
          </header>

          <main className="flex-1 px-5 py-5 flex flex-col gap-4">
            
            {/* Search Bar */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#795465] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar terapeuta ou CREFITO..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-white border border-purple-100/30 rounded-2xl text-xs font-medium placeholder-[#cdc3cf] focus:outline-none focus:border-[#70518d]/40 shadow-sm"
              />
            </div>

            {/* Therapists List */}
            <div className="space-y-3.5">
              {loading ? (
                <div className="text-center py-12 bg-white border border-purple-100/20 rounded-2xl flex flex-col items-center justify-center gap-2.5">
                  <Loader2 className="w-7 h-7 animate-spin text-[#70518d]" />
                  <p className="text-[11px] font-bold text-[#795465]">Buscando terapeutas...</p>
                </div>
              ) : (
                filteredTherapists.map(ther => (
                  <div
                    key={ther.id}
                    className={`p-4 bg-white border rounded-2xl shadow-sm transition-all relative flex flex-col gap-3 ${
                      ther.status === 'suspended' 
                        ? 'border-red-100 bg-red-50/10' 
                        : 'border-purple-100/20 hover:border-[#70518d]/30'
                    }`}
                  >
                    {/* Status Indicator */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-50 text-[#70518d] font-bold text-xs flex items-center justify-center">
                          {ther.name.split(' ').pop()?.[0]}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-[#1d1b1f] text-sm flex items-center gap-1.5">
                            {ther.name}
                            {ther.status === 'suspended' && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 font-bold text-[8px] uppercase tracking-wider">
                                Suspenso
                              </span>
                            )}
                          </h4>
                          <p className="text-[10px] text-[#795465] font-semibold">CREFITO: {ther.crefito}</p>
                        </div>
                      </div>
                      
                      {/* Action Button: Edit */}
                      <button
                        onClick={() => openEditModal(ther)}
                        className="p-2 rounded-full hover:bg-purple-50 text-[#795465] hover:text-[#70518d] transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 border-t border-purple-100/10 pt-3 text-[10px] text-[#4b454e]">
                      <div>
                        <span className="text-[#795465] font-semibold block mb-0.5">Contato:</span>
                        <span className="font-bold text-[#1d1b1f]">{ther.phone}</span>
                      </div>
                      <div>
                        <span className="text-[#795465] font-semibold block mb-0.5">Comissão/Repasse:</span>
                        <span className="font-bold text-[#1d1b1f]">{ther.commission}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[#795465] font-semibold block mb-0.5">Escala / Turno:</span>
                        <span className="font-bold text-[#1d1b1f]">{ther.scale}</span>
                      </div>
                    </div>

                    {/* Patients active metric */}
                    <div className="flex justify-between items-center bg-purple-50/30 p-2.5 rounded-xl border border-purple-100/10 text-[10px]">
                      <span className="text-[#795465] font-bold">Pacientes vinculados:</span>
                      <span className="font-extrabold text-[#70518d] bg-white px-2 py-0.5 rounded-md border border-purple-100/20">
                        {ther.patientsCount} pacientes
                      </span>
                    </div>

                    {/* Collapsible Professional Profile */}
                    <div className="border-t border-purple-100/10 pt-2 flex flex-col gap-2">
                      <button
                        onClick={() => setExpandedTherapistId(expandedTherapistId === ther.id ? null : ther.id)}
                        className="text-[10px] font-bold text-[#70518d] hover:text-[#573974] flex items-center justify-between py-1 transition-colors"
                      >
                        <span>{expandedTherapistId === ther.id ? 'Ocultar Perfil Profissional' : 'Ver Perfil Profissional'}</span>
                        <span className="material-symbols-outlined text-[16px] leading-none">
                          {expandedTherapistId === ther.id ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                        </span>
                      </button>

                      {expandedTherapistId === ther.id && (
                        <div className="bg-[#70518d]/5 p-3 rounded-xl border border-[#70518d]/10 text-[10px] space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                          <div>
                            <span className="text-[#795465] font-semibold block mb-0.5">Especialidade:</span>
                            <span className="font-bold text-[#1d1b1f]">{ther.specialty || 'Não informada'}</span>
                          </div>
                          <div>
                            <span className="text-[#795465] font-semibold block mb-0.5">Formação Acadêmica:</span>
                            <span className="font-bold text-[#1d1b1f]">{ther.education || 'Não informada'}</span>
                          </div>
                          <div>
                            <span className="text-[#795465] font-semibold block mb-0.5">Tempo de Atuação / Experiência:</span>
                            <span className="font-bold text-[#1d1b1f]">{ther.experience || 'Não informada'}</span>
                          </div>
                          <div>
                            <span className="text-[#795465] font-semibold block mb-0.5">Cursos e Certificações:</span>
                            <span className="font-bold text-[#1d1b1f]">{ther.courses || 'Nenhum curso cadastrado'}</span>
                          </div>
                          <div>
                            <span className="text-[#795465] font-semibold block mb-0.5">Biografia / Sobre:</span>
                            <span className="font-medium text-[#4b454e] italic block bg-white p-2 rounded-lg border border-purple-100/10">
                              {ther.bio || 'Sem biografia disponível.'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {!loading && filteredTherapists.length === 0 && (
                <div className="text-center py-10 bg-white border border-purple-100/20 rounded-2xl">
                  <ShieldAlert className="w-8 h-8 mx-auto text-[#795465] opacity-50 mb-2" />
                  <p className="text-xs font-semibold text-[#795465]">Nenhuma terapeuta encontrada.</p>
                </div>
              )}
            </div>
          </main>

          {/* Add Therapist Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-purple-100/20 shadow-xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex justify-between items-center pb-2 border-b border-purple-100/10">
                  <h3 className="font-extrabold text-sm text-[#70518d]">Cadastrar Fisioterapeuta</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-[#795465] hover:text-[#70518d]">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddTherapist} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#795465] uppercase block">Nome da Fisioterapeuta</label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="Ex: Dra. Juliana Souza"
                      className="w-full h-10 px-3 border border-purple-100/30 rounded-xl text-xs focus:outline-none focus:border-[#70518d]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#795465] uppercase block">CREFITO</label>
                      <input
                        type="text"
                        required
                        value={newCrefito}
                        onChange={e => setNewCrefito(e.target.value)}
                        placeholder="Ex: 12345-F"
                        className="w-full h-10 px-3 border border-purple-100/30 rounded-xl text-xs focus:outline-none focus:border-[#70518d]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#795465] uppercase block">Telefone</label>
                      <input
                        type="text"
                        value={newPhone}
                        onChange={e => setNewPhone(e.target.value)}
                        placeholder="Ex: (11) 98888-8888"
                        className="w-full h-10 px-3 border border-purple-100/30 rounded-xl text-xs focus:outline-none focus:border-[#70518d]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#795465] uppercase block">E-mail Corporativo</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder="Ex: juliana.souza@bellaflora.com"
                      className="w-full h-10 px-3 border border-purple-100/30 rounded-xl text-xs focus:outline-none focus:border-[#70518d]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#795465] uppercase block">Repasse / Comissão</label>
                      <input
                        type="text"
                        value={newCommission}
                        onChange={e => setNewCommission(e.target.value)}
                        placeholder="Ex: 50% ou R$ 80"
                        className="w-full h-10 px-3 border border-purple-100/30 rounded-xl text-xs focus:outline-none focus:border-[#70518d]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#795465] uppercase block">Escala de Trabalho</label>
                      <input
                        type="text"
                        value={newScale}
                        onChange={e => setNewScale(e.target.value)}
                        placeholder="Ex: Seg a Sex"
                        className="w-full h-10 px-3 border border-purple-100/30 rounded-xl text-xs focus:outline-none focus:border-[#70518d]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 bg-[#70518d] hover:bg-[#573974] text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] mt-3"
                  >
                    Salvar e Cadastrar
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Edit Therapist Modal */}
          {showEditModal && activeTherapist && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-purple-100/20 shadow-xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center pb-2 border-b border-purple-100/10">
                  <h3 className="font-extrabold text-sm text-[#70518d]">Editar Fisioterapeuta</h3>
                  <button onClick={() => { setShowEditModal(false); setActiveTherapist(null); }} className="text-[#795465] hover:text-[#70518d]">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleEditTherapist} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#795465] uppercase block">Nome da Fisioterapeuta</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full h-10 px-3 border border-purple-100/30 rounded-xl text-xs focus:outline-none focus:border-[#70518d]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#795465] uppercase block">CREFITO</label>
                      <input
                        type="text"
                        required
                        value={editCrefito}
                        onChange={e => setEditCrefito(e.target.value)}
                        className="w-full h-10 px-3 border border-purple-100/30 rounded-xl text-xs focus:outline-none focus:border-[#70518d]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#795465] uppercase block">Telefone</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={e => setEditPhone(e.target.value)}
                        className="w-full h-10 px-3 border border-purple-100/30 rounded-xl text-xs focus:outline-none focus:border-[#70518d]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#795465] uppercase block">E-mail Corporativo</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      className="w-full h-10 px-3 border border-purple-100/30 rounded-xl text-xs focus:outline-none focus:border-[#70518d]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#795465] uppercase block">Repasse / Comissão</label>
                      <input
                        type="text"
                        value={editCommission}
                        onChange={e => setEditCommission(e.target.value)}
                        className="w-full h-10 px-3 border border-purple-100/30 rounded-xl text-xs focus:outline-none focus:border-[#70518d]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#795465] uppercase block">Escala de Trabalho</label>
                      <input
                        type="text"
                        value={editScale}
                        onChange={e => setEditScale(e.target.value)}
                        className="w-full h-10 px-3 border border-purple-100/30 rounded-xl text-xs focus:outline-none focus:border-[#70518d]"
                      />
                    </div>
                  </div>

                  {/* Perfil Profissional */}
                  <div className="space-y-3.5 border-t border-purple-100/10 pt-3">
                    <h4 className="text-[10px] font-extrabold text-[#70518d] uppercase tracking-wider">Perfil Profissional</h4>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#795465] uppercase block">Especialidade principal</label>
                      <input
                        type="text"
                        value={editSpecialty}
                        onChange={e => setEditSpecialty(e.target.value)}
                        placeholder="Ex: Fisioterapia Pélvica"
                        className="w-full h-10 px-3 border border-purple-100/30 rounded-xl text-xs focus:outline-none focus:border-[#70518d]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#795465] uppercase block">Formação Acadêmica</label>
                      <input
                        type="text"
                        value={editEducation}
                        onChange={e => setEditEducation(e.target.value)}
                        placeholder="Ex: Bacharelado, Pós-graduação"
                        className="w-full h-10 px-3 border border-purple-100/30 rounded-xl text-xs focus:outline-none focus:border-[#70518d]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#795465] uppercase block">Tempo de Atuação</label>
                        <input
                          type="text"
                          value={editExperience}
                          onChange={e => setEditExperience(e.target.value)}
                          placeholder="Ex: 5 anos"
                          className="w-full h-10 px-3 border border-purple-100/30 rounded-xl text-xs focus:outline-none focus:border-[#70518d]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#795465] uppercase block">Cursos / Certificados</label>
                        <input
                          type="text"
                          value={editCourses}
                          onChange={e => setEditCourses(e.target.value)}
                          placeholder="Ex: Pilates, Reabilitação"
                          className="w-full h-10 px-3 border border-purple-100/30 rounded-xl text-xs focus:outline-none focus:border-[#70518d]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#795465] uppercase block">Biografia / Sobre</label>
                      <textarea
                        value={editBio}
                        onChange={e => setEditBio(e.target.value)}
                        placeholder="Escreva uma breve biografia da profissional..."
                        rows={3}
                        className="w-full p-3 border border-purple-100/30 rounded-xl text-xs focus:outline-none focus:border-[#70518d] resize-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-purple-100/10 pt-3">
                    <label className="text-[9px] font-bold text-[#795465] uppercase block">Status da Conta</label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setEditStatus('active')}
                        className={`flex-1 h-9 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          editStatus === 'active'
                            ? 'bg-[#70518d]/10 border-[#70518d] text-[#70518d]'
                            : 'border-purple-100/30 bg-transparent text-[#795465]'
                        }`}
                      >
                        <Check className="w-4 h-4" /> Ativo
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setEditStatus('suspended')}
                        className={`flex-1 h-9 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          editStatus === 'suspended'
                            ? 'bg-red-50 border-red-500 text-red-600'
                            : 'border-purple-100/30 bg-transparent text-[#795465]'
                        }`}
                      >
                        <X className="w-4 h-4" /> Suspenso
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
              className="flex flex-col items-center justify-center text-[#70518d] shrink-0"
            >
              <div className="bg-[#70518d]/10 text-[#70518d] rounded-full px-5 py-1 mb-1">
                <span className="material-symbols-outlined font-bold text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>engineering</span>
              </div>
              <span className="text-[9px] font-extrabold">Terapeutas</span>
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
