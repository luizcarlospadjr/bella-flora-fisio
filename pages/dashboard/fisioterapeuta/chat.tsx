import React, { useEffect, useState, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Loader2, Mic, ArrowLeft, Video, Phone, Send, Plus, Sparkles, ChevronRight, MessageSquare, Users, Check } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { useToast } from '../../../components/Toast'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  message_text: string | null
  attachment_url: string | null
  attachment_type: string | null
  read_at: string | null
  created_at: string
}

interface Patient {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
}

export default function TherapistChat() {
  const router = useRouter()
  const { showError } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [therapistProfile, setTherapistProfile] = useState<any>(null)
  
  // Patients list (Directory)
  const [patients, setPatients] = useState<Patient[]>([])
  
  // Unread messages counts mapping patientId -> count
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [globalUnreadCount, setGlobalUnreadCount] = useState(0)

  // Last message snippet mapping patientId -> last Message
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({})

  // Active chat room states
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [patientProfile, setPatientProfile] = useState<Patient | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [painLevel, setPainLevel] = useState<number | null>(null)
  const [pulseActive, setPulseActive] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const painChannelRef = useRef<any>(null)
  
  // Reference to track active patient inside closures
  const activePatientIdRef = useRef<string | null>(null)

  // 1. Initial Load: Authenticate and Load therapist directory
  useEffect(() => {
    async function loadDirectory() {
      try {
        setLoading(true)
        const { data: { user }, error: authErr } = await supabase.auth.getUser()
        if (authErr || !user) {
          router.push('/login')
          return
        }

        // Fetch therapist profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          if (profile.role !== 'therapist') {
            router.push('/dashboard/paciente')
            return
          }
          setTherapistProfile(profile)
        }

        // Fetch all patients assigned to this therapist
        const { data: patientsList } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'patient')
          .eq('therapist_id', user.id)
          .order('full_name', { ascending: true })

        if (patientsList) {
          setPatients(patientsList)
          await refreshDirectoryMetrics(user.id, patientsList)
        }
      } catch (err) {
        console.error('Erro ao carregar diretório de chat:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDirectory()
  }, [])

  // 2. Fetch last messages and unread counts for each patient
  const refreshDirectoryMetrics = async (therapistId: string, patientList: Patient[]) => {
    if (patientList.length === 0) return

    try {
      // Fetch all messages involving the therapist
      const { data: allMessages } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`sender_id.eq.${therapistId},receiver_id.eq.${therapistId}`)
        .order('created_at', { ascending: true })

      if (!allMessages) return

      const counts: Record<string, number> = {}
      const lasts: Record<string, Message> = {}
      let globalUnread = 0

      patientList.forEach(patient => {
        // Filter messages for this patient
        const pMsgs = allMessages.filter(
          m => (m.sender_id === patient.id && m.receiver_id === therapistId) ||
               (m.sender_id === therapistId && m.receiver_id === patient.id)
        )

        // Find last message
        if (pMsgs.length > 0) {
          lasts[patient.id] = pMsgs[pMsgs.length - 1]
        }

        // Compute unread count (messages sent by patient to therapist where read_at is null)
        const unreads = pMsgs.filter(m => m.sender_id === patient.id && m.receiver_id === therapistId && !m.read_at).length
        counts[patient.id] = unreads
        globalUnread += unreads
      })

      setUnreadCounts(counts)
      setLastMessages(lasts)
      setGlobalUnreadCount(globalUnread)
    } catch (err) {
      console.error('Erro ao processar métricas do diretório:', err)
    }
  }

  // 3. Select patient and open active chat room
  const handleSelectPatient = async (patientId: string) => {
    if (!therapistProfile) return
    
    const patient = patients.find(p => p.id === patientId)
    if (!patient) return

    setSelectedPatientId(patientId)
    activePatientIdRef.current = patientId
    setPatientProfile(patient)
    setMessages([])
    setPainLevel(null)

    try {
      // Mark all unread messages from this patient as read in Supabase
      await supabase
        .from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', patientId)
        .eq('receiver_id', therapistProfile.id)
        .is('read_at', null)

      // Reload messages list
      const { data: chatMsgs } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(sender_id.eq.${therapistProfile.id},receiver_id.eq.${patientId}),and(sender_id.eq.${patientId},receiver_id.eq.${therapistProfile.id})`)
        .order('created_at', { ascending: true })

      if (chatMsgs) {
        setMessages(chatMsgs)
        
        // Extract pain level from last messages
        const painMsgs = chatMsgs
          .filter(m => m.sender_id === patientId && m.message_text?.includes('Nível de dor registrado:'))
          .reverse()
        
        if (painMsgs.length > 0 && painMsgs[0].message_text) {
          const match = painMsgs[0].message_text.match(/Nível de dor registrado:\s*(\d+)/i)
          if (match) {
            setPainLevel(parseInt(match[1]))
          }
        }
      }

      // Refresh directory counters locally
      setUnreadCounts(prev => ({ ...prev, [patientId]: 0 }))
      // Recompute global unread count
      const updatedUnreadCount = Object.entries(unreadCounts)
        .filter(([pId]) => pId !== patientId)
        .reduce((sum, [_, cnt]) => sum + cnt, 0)
      setGlobalUnreadCount(updatedUnreadCount)

      // Connect to Realtime pain broadcast
      if (painChannelRef.current) supabase.removeChannel(painChannelRef.current)
      
      const painChannel = supabase.channel(`pain-channel-${patientId}`, {
        config: { broadcast: { self: true } }
      })

      painChannel.on('broadcast', { event: 'pain-update' }, (payload) => {
        setPainLevel(payload.payload.painLevel)
        setPulseActive(true)
        setTimeout(() => setPulseActive(false), 3000)
      })

      painChannel.subscribe()
      painChannelRef.current = painChannel

    } catch (err) {
      console.error('Erro ao abrir chat do paciente:', err)
    }
  }

  // Handle deep-linking patient_id from route queries
  useEffect(() => {
    if (router.isReady && router.query.patient_id && patients.length > 0) {
      const patientId = router.query.patient_id as string
      handleSelectPatient(patientId)
    }
  }, [router.isReady, router.query.patient_id, patients])

  // Realtime subscription for incoming messages
  useEffect(() => {
    if (!therapistProfile) return

    const messagesSub = supabase
      .channel('therapist-chat-realtime-global')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, async (payload) => {
        const newMsg = payload.new as Message
        
        // If this message belongs to the active room
        const activeId = activePatientIdRef.current
        if (activeId && 
          ((newMsg.sender_id === therapistProfile.id && newMsg.receiver_id === activeId) ||
           (newMsg.sender_id === activeId && newMsg.receiver_id === therapistProfile.id))
        ) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })

          // Mark message as read instantly since the chat is open!
          if (newMsg.sender_id === activeId && newMsg.receiver_id === therapistProfile.id) {
            await supabase
              .from('chat_messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', newMsg.id)
          }

          // Handle pain level updates
          if (newMsg.sender_id === activeId && newMsg.message_text?.includes('Nível de dor registrado:')) {
            const match = newMsg.message_text.match(/Nível de dor registrado:\s*(\d+)/i)
            if (match) {
              setPainLevel(parseInt(match[1]))
              setPulseActive(true)
              setTimeout(() => setPulseActive(false), 3000)
            }
          }
        }

        // Refresh metrics (last message and unread count badges) for the directory view
        await refreshDirectoryMetrics(therapistProfile.id, patients)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(messagesSub)
      if (painChannelRef.current) supabase.removeChannel(painChannelRef.current)
    }
  }, [therapistProfile, patients])

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Back to patient list directory
  const handleBackToDirectory = () => {
    setSelectedPatientId(null)
    activePatientIdRef.current = null
    setPatientProfile(null)
    setMessages([])
    setPainLevel(null)
    
    // Clear URL query to avoid auto re-selection
    router.replace('/dashboard/fisioterapeuta/chat', undefined, { shallow: true })
  }

  // Send message implementation
  const handleSendMessage = async () => {
    const text = inputText.trim()
    if (!text || !therapistProfile || !patientProfile) return

    setInputText('')

    try {
      const { data: newMsg, error } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: therapistProfile.id,
          receiver_id: patientProfile.id,
          message_text: text
        })
        .select()
        .single()

      if (error) throw error

      if (newMsg) {
        setMessages((prev) => [...prev, newMsg as Message])
        // Instantly refresh directory metrics locally
        setLastMessages(prev => ({ ...prev, [patientProfile.id]: newMsg as Message }))
      }
    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err)
      showError(`Erro ao enviar mensagem: ${err.message}`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  if (loading && patients.length === 0) {
    return (
      <div className="min-h-screen bg-[#fff7fd] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#70518d]" />
          <p className="text-sm font-medium text-[#795465]">Carregando Canal de Mensagens...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Canal Clínico Direct | Bella Flora Fisio</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <style>{`
          body {
            font-family: 'Manrope', sans-serif;
            background: #fff7fd;
            height: 100vh;
            overflow: hidden;
          }
        `}</style>
      </Head>

      <div className="min-h-screen w-full bg-[#fff7fd] font-sans antialiased overflow-x-hidden">
        <div className="relative w-full min-h-screen max-w-md mx-auto bg-[#fff7fd] flex flex-col">

          {/* VIEW A: CHAT DIRECTORY / LIST OF PATIENTS */}
          {!selectedPatientId ? (
            <>
              {/* Directory TopBar */}
              <header className="bg-white sticky top-0 z-50 border-b border-purple-100/30 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <Link 
                    href="/dashboard/fisioterapeuta"
                    className="text-[#70518d] hover:bg-purple-50 transition-colors active:scale-95 duration-200 p-1.5 rounded-full flex items-center justify-center"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                  <div>
                    <h1 className="text-sm font-extrabold text-[#1d1b1f] leading-tight">
                      Mensagens Direct
                    </h1>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                      Chat Seguro Clínico
                    </p>
                  </div>
                </div>
                
                {globalUnreadCount > 0 && (
                  <span className="bg-red-500 text-white rounded-full text-[9px] font-black px-2.5 py-0.5 animate-pulse">
                    {globalUnreadCount} não lidas
                  </span>
                )}
              </header>

              {/* Directory Contacts Feed */}
              <main className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 scrollbar-none pb-24">
                <div className="pl-1">
                  <h3 className="text-xs font-bold text-[#70518d] uppercase tracking-wider">Meus Contatos pélvicos</h3>
                  <p className="text-[10px] text-[#795465] mt-0.5">Selecione uma paciente para iniciar o chat direto.</p>
                </div>

                <div className="flex flex-col gap-3">
                  {patients.length > 0 ? (
                    patients.map((patient) => {
                      const unread = unreadCounts[patient.id] || 0
                      const lastMsg = lastMessages[patient.id]

                      return (
                        <button
                          key={patient.id}
                          onClick={() => handleSelectPatient(patient.id)}
                          className="w-full bg-white hover:bg-purple-50/10 transition-all p-4 rounded-2xl flex items-center justify-between border border-purple-100/20 shadow-sm active:scale-[0.99] text-left relative"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="relative shrink-0">
                              <img 
                                alt={patient.full_name || 'Paciente'} 
                                className="w-11 h-11 rounded-full object-cover border border-purple-100/20" 
                                src={patient.avatar_url || '/assets/img/mariana_silva.png'} 
                              />
                              {unread > 0 && (
                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full animate-ping"></span>
                              )}
                            </div>
                            
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="flex justify-between items-baseline gap-2">
                                <h3 className="font-extrabold text-xs text-[#1d1b1f] truncate leading-tight">
                                  {patient.full_name || 'Paciente sem Nome'}
                                </h3>
                                {lastMsg && (
                                  <span className="text-[8px] text-slate-400 font-semibold shrink-0">
                                    {formatTime(lastMsg.created_at)}
                                  </span>
                                )}
                              </div>
                              
                              <p className={`text-[10px] truncate mt-1 ${unread > 0 ? 'text-[#70518d] font-bold' : 'text-slate-400 font-medium'}`}>
                                {lastMsg ? lastMsg.message_text : 'Nenhuma mensagem trocada.'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {unread > 0 ? (
                              <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-extrabold text-[10px] shadow-sm animate-pulse">
                                {unread}
                              </span>
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-[#fff7fd] text-[#70518d] border border-purple-100/30 flex items-center justify-center">
                                <ChevronRight className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    })
                  ) : (
                    <div className="bg-white border border-purple-100/20 rounded-2xl p-8 text-center flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-[#fff7fd] rounded-full flex items-center justify-center text-slate-400">
                        <Users className="w-5 h-5 text-[#795465]" />
                      </div>
                      <h3 className="font-extrabold text-xs text-[#1d1b1f]">Nenhum paciente vinculado</h3>
                      <p className="text-[10px] text-[#795465] max-w-[200px]">
                        Você não possui pacientes associados ao seu prontuário clínico de atendimento ainda.
                      </p>
                    </div>
                  )}
                </div>
              </main>
            </>
          ) : (
            /* VIEW B: ACTIVE CHAT ROOM VIEW */
            <>
              {/* Room TopBar */}
              <header className="bg-white sticky top-0 z-50 border-b border-purple-100/30 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <button 
                    onClick={handleBackToDirectory}
                    className="text-[#70518d] hover:bg-purple-50 transition-colors active:scale-95 duration-200 p-1.5 rounded-full flex items-center justify-center border border-purple-100/10"
                    title="Voltar para a lista"
                  >
                    <ArrowLeft className="w-4.5 h-4.5" />
                  </button>
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <img 
                        alt={patientProfile?.full_name || 'Paciente'} 
                        className="w-9 h-9 rounded-full object-cover border border-purple-100/30 shadow-sm" 
                        src={patientProfile?.avatar_url || '/assets/img/mariana_silva.png'}
                      />
                      <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 border border-white rounded-full"></div>
                    </div>
                    <div>
                      <h1 className="text-xs font-extrabold text-[#1d1b1f] leading-tight truncate max-w-[120px]">
                        {patientProfile?.full_name}
                      </h1>
                      <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider leading-none">Canal Ativo</p>
                    </div>
                  </div>
                </div>

                {/* Pain level monitor */}
                <div className="flex items-center gap-1 shrink-0">
                  <span 
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[9px] border transition-all duration-500 ${
                      pulseActive 
                        ? 'animate-bounce border-red-400 bg-red-100 text-red-700 scale-105 shadow-md shadow-red-200' 
                        : painLevel !== null 
                          ? 'border-red-200 bg-red-50 text-red-600' 
                          : 'border-purple-100/30 bg-purple-50/20 text-[#795465]'
                    }`}
                  >
                    <Sparkles className={`w-3 h-3 ${pulseActive ? 'animate-spin' : ''}`} />
                    Dor: {painLevel !== null ? `${painLevel}/10` : 'Normal'}
                  </span>
                  
                  <button className="text-[#70518d] hover:bg-purple-50 p-1.5 rounded-full transition-all">
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </header>

              {/* Chat Message Viewport */}
              <main className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 pb-36">
                <div className="flex justify-center my-1 select-none">
                  <span className="bg-purple-50/60 border border-purple-100/30 text-[#795465] text-[9px] font-semibold px-2.5 py-0.5 rounded-full shadow-xs">
                    Canal Seguro e Criptografado
                  </span>
                </div>

                {messages.length === 0 ? (
                  <div className="text-center text-xs font-semibold text-[#cdc3cf] my-10 px-6">
                    Nenhuma mensagem trocada ainda. Envie uma orientação profissional para iniciar o atendimento.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === therapistProfile?.id
                    return (
                      <div 
                        key={msg.id}
                        className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'self-end' : 'self-start'}`}
                      >
                        <div 
                          className={`px-3.5 py-2.5 rounded-2xl border ${
                            isMe 
                              ? 'bg-[#70518d] text-white border-transparent rounded-br-sm shadow-[0px_4px_12px_rgba(112,81,141,0.15)]' 
                              : 'bg-white text-[#1d1b1f] border-purple-100/20 rounded-bl-sm shadow-[0px_2px_8px_rgba(0,0,0,0.04)]'
                          }`}
                        >
                          <p className="text-xs whitespace-pre-line leading-relaxed">{msg.message_text}</p>
                          <div className="flex justify-end mt-1 gap-1 items-center">
                            <span className={`text-[8px] font-medium ${isMe ? 'opacity-80' : 'text-[#795465]'}`}>
                              {formatTime(msg.created_at)}
                            </span>
                            {isMe && (
                              <span className="text-[10px] opacity-85 leading-none flex items-center gap-0.2 select-none">
                                <Check className="w-2.5 h-2.5 stroke-[3] text-purple-100" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={chatEndRef} />
              </main>

              {/* Message Input Panel */}
              <div className="fixed bottom-[76px] left-0 right-0 z-40 select-none">
                <div className="max-w-md mx-auto px-4 py-2.5 bg-white/95 backdrop-blur-md border-t border-purple-100/20">
                  <div className="relative flex items-center gap-2 bg-[#fff7fd] border border-purple-100/30 rounded-2xl p-1.5 shadow-xs">
                    
                    <button className="p-2 text-[#70518d] hover:bg-purple-50 rounded-full transition-colors shrink-0">
                      <Plus className="w-4.5 h-4.5" />
                    </button>

                    <input 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Responder ao paciente..."
                      className="flex-grow bg-transparent border-none focus:ring-0 text-[#1d1b1f] px-2 py-1.5 placeholder:text-[#795465]/40 outline-none text-xs"
                      type="text"
                    />

                    <button className="p-2 text-[#70518d] hover:bg-purple-50 rounded-full transition-colors shrink-0">
                      <Mic className="w-4.5 h-4.5" />
                    </button>

                    <button 
                      onClick={handleSendMessage}
                      className="bg-[#70518d] text-white p-2.5 rounded-full w-9 h-9 shadow-sm active:scale-95 transition-all duration-200 ml-0.5 hover:bg-[#573974] flex-shrink-0 flex items-center justify-center"
                    >
                      <Send className="w-3.5 h-3.5 text-white fill-current" />
                    </button>
                  </div>
                </div>
              </div>
            </>
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
              className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
            >
              <span className="material-symbols-outlined text-lg mb-1">assignment</span>
              <span className="text-[9px] font-semibold">Prontuário</span>
            </Link>
            
            <button 
              onClick={handleBackToDirectory}
              className="flex flex-col items-center justify-center text-[#70518d] shrink-0 relative"
            >
              <div className="bg-[#70518d]/10 text-[#70518d] rounded-full px-5 py-1 mb-1">
                <span className="material-symbols-outlined font-bold text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
              </div>
              <span className="text-[9px] font-extrabold">Chat</span>
              {globalUnreadCount > 0 && (
                <span className="absolute top-1 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
              )}
            </button>
          </nav>

        </div>
      </div>
    </>
  )
}
