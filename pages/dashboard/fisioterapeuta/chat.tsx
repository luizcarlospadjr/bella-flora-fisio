import React, { useEffect, useState, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Loader2, Mic, ArrowLeft, Video, Phone, Send, Plus, Sparkles, ChevronRight } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  message_text: string | null
  attachment_url: string | null
  attachment_type: string | null
  created_at: string
}

export default function TherapistChat() {
  const router = useRouter()
  const [therapistProfile, setTherapistProfile] = useState<any>(null)
  const [patientProfile, setPatientProfile] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [painLevel, setPainLevel] = useState<number | null>(null)
  const [pulseActive, setPulseActive] = useState(false)
  const [loading, setLoading] = useState(true)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const painChannelRef = useRef<any>(null)

  useEffect(() => {
    let activeUser: any = null
    let activePatientId: string = ''
    let messagesSub: any = null

    async function loadChatData() {
      try {
        // 1. Obtém o usuário logado (fisioterapeuta)
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          router.push('/login')
          return
        }
        activeUser = user

        // 2. Consulta o perfil da fisioterapeuta
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

        // 3. Busca o primeiro paciente cadastrado vinculado a esta fisioterapeuta
        const { data: activePatient } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'patient')
          .eq('therapist_id', user.id)
          .limit(1)
          .maybeSingle()

        if (activePatient) {
          setPatientProfile(activePatient)
          activePatientId = activePatient.id

          // 4. Carrega as mensagens entre ambos
          const { data: chatMsgs } = await supabase
            .from('chat_messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activePatient.id}),and(sender_id.eq.${activePatient.id},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true })

          if (chatMsgs) {
            setMessages(chatMsgs)

            // Busca o último nível de dor a partir das mensagens passadas
            const painMsgs = chatMsgs
              .filter(m => m.sender_id === activePatient.id && m.message_text?.includes('Nível de dor registrado:'))
              .reverse()
            
            if (painMsgs.length > 0 && painMsgs[0].message_text) {
              const match = painMsgs[0].message_text.match(/Nível de dor registrado:\s*(\d+)/i)
              if (match) {
                setPainLevel(parseInt(match[1]))
              }
            }
          }

          // 5. Subscreve-se ao canal de Broadcast do Paciente para atualizações instantâneas de dor (Supabase Realtime)
          const painChannel = supabase.channel(`pain-channel-${activePatient.id}`, {
            config: {
              broadcast: { self: true }
            }
          })

          painChannel.on('broadcast', { event: 'pain-update' }, (payload) => {
            const newPain = payload.payload.painLevel
            setPainLevel(newPain)
            
            // Ativa animação de pulso visual no indicador de dor do cabeçalho
            setPulseActive(true)
            setTimeout(() => {
              setPulseActive(false)
            }, 3000)
          })

          painChannel.subscribe()
          painChannelRef.current = painChannel

          // 6. Subscreve ao canal Realtime do Supabase para novas mensagens no banco
          messagesSub = supabase
            .channel('therapist-messages-realtime')
            .on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: 'chat_messages'
            }, (payload) => {
              const newMsg = payload.new as Message
              if (
                (newMsg.sender_id === user.id && newMsg.receiver_id === activePatient.id) ||
                (newMsg.sender_id === activePatient.id && newMsg.receiver_id === user.id)
              ) {
                setMessages((prev) => {
                  if (prev.some((m) => m.id === newMsg.id)) return prev
                  return [...prev, newMsg]
                })

                // Se for um registro de dor, atualiza o cabeçalho dinamicamente
                if (newMsg.sender_id === activePatient.id && newMsg.message_text?.includes('Nível de dor registrado:')) {
                  const match = newMsg.message_text.match(/Nível de dor registrado:\s*(\d+)/i)
                  if (match) {
                    setPainLevel(parseInt(match[1]))
                    setPulseActive(true)
                    setTimeout(() => {
                      setPulseActive(false)
                    }, 3000)
                  }
                }
              }
            })
            .subscribe()
        }
      } catch (err) {
        console.error('Erro ao inicializar o chat do fisioterapeuta:', err)
      } finally {
        setLoading(false)
      }
    }

    loadChatData()

    return () => {
      if (messagesSub) supabase.removeChannel(messagesSub)
      if (painChannelRef.current) supabase.removeChannel(painChannelRef.current)
    }
  }, [router])

  // Rola o chat para o final ao receber novas mensagens
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    const text = inputText.trim()
    if (!text) return

    if (!therapistProfile) {
      alert('Erro: Seu perfil de fisioterapeuta não foi carregado corretamente.')
      return
    }

    if (!patientProfile) {
      // Modo de Demonstração: envia mensagem simulada localmente
      const mockMsg: Message = {
        id: Math.random().toString(),
        sender_id: therapistProfile.id,
        receiver_id: 'mock-patient',
        message_text: text,
        attachment_url: null,
        attachment_type: null,
        created_at: new Date().toISOString()
      }
      setMessages((prev) => [...prev, mockMsg])
      setInputText('')

      // Responde com uma resposta simulada da paciente após 1.2 segundos!
      setTimeout(() => {
        const autoReply: Message = {
          id: Math.random().toString(),
          sender_id: 'mock-patient',
          receiver_id: therapistProfile.id,
          message_text: 'Obrigada pelas orientações, Dra.! Consegui fazer a ponte pélvica hoje de manhã sem dores. Vou continuar a rotina que a senhora me prescreveu.',
          attachment_url: null,
          attachment_type: null,
          created_at: new Date().toISOString()
        }
        setMessages((prev) => [...prev, autoReply])
      }, 1200)
      return
    }

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

      if (error) {
        throw error
      }

      if (newMsg) {
        setMessages((prev) => [...prev, newMsg as Message])
      }
    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err)
      alert(`Erro ao enviar mensagem: ${err.message}`)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff7fd] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#70518d]" />
          <p className="text-sm font-medium text-[#795465]">Carregando Canal Clínico...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Bella Flora Fisio - Chat Clínico</title>
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

          {/* TopAppBar */}
          <header className="bg-white sticky top-0 z-50 border-b border-purple-100/30 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Link 
                href="/dashboard/fisioterapeuta"
                className="text-[#70518d] hover:bg-purple-50 transition-colors active:scale-95 duration-200 p-1.5 rounded-full flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <img 
                    alt={patientProfile?.full_name || 'Paciente'} 
                    className="w-9 h-9 rounded-full object-cover border border-purple-100/30 shadow-sm" 
                    src={patientProfile?.avatar_url || '/assets/img/mariana_silva.png'}
                  />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <h1 className="text-sm font-extrabold text-[#1d1b1f] leading-tight">
                    {patientProfile?.full_name || 'Mariana Costa (Simulada)'}
                  </h1>
                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider leading-none">Canal Seguro</p>
                </div>
              </div>
            </div>

            {/* Pain level dynamic monitor */}
            <div className="flex items-center gap-1">
              <span 
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] border transition-all duration-500 ${
                  pulseActive 
                    ? 'animate-bounce border-red-400 bg-red-100 text-red-700 scale-105 shadow-md shadow-red-200' 
                    : painLevel 
                      ? 'border-red-200 bg-red-50 text-red-600' 
                      : 'border-purple-100/30 bg-purple-50/20 text-[#795465]'
                }`}
              >
                <Sparkles className={`w-3 h-3 ${pulseActive ? 'animate-spin' : ''}`} />
                Dor: {painLevel !== null ? `${painLevel}/10` : '5/10'}
              </span>
              <button className="text-[#70518d] hover:bg-purple-50 p-1.5 rounded-full transition-all">
                <Video className="w-4.5 h-4.5" />
              </button>
            </div>
          </header>

          {/* Chat Messages Area */}
          <main className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 pb-36">
            {!patientProfile && (
              <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-3.5 flex flex-col gap-1 shadow-sm mb-2 select-none shrink-0">
                <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <span>⚠️ Modo de Demonstração</span>
                </div>
                <p className="text-[10px] text-amber-700 leading-relaxed font-semibold">
                  Nenhuma paciente cadastrada na plataforma ainda. O chat funcionará em modo **simulado** localmente para permitir o teste clínico completo!
                </p>
              </div>
            )}

            <div className="flex justify-center my-2">
              <span className="bg-purple-50/60 border border-purple-100/30 text-[#795465] text-[10px] font-semibold px-3 py-1 rounded-full shadow-sm">
                Hoje
              </span>
            </div>

            {messages.length === 0 && patientProfile ? (
              <div className="text-center text-xs font-semibold text-[#cdc3cf] my-10 px-6">
                Nenhuma mensagem trocada ainda. Envie uma orientação profissional para iniciar o atendimento.
              </div>
            ) : messages.length === 0 && !patientProfile ? (
              // Mensagens de exemplo para demonstração interativa
              <>
                <div className="flex items-end gap-2 max-w-[85%] self-start">
                  <div className="px-3.5 py-2.5 rounded-2xl border bg-white text-[#1d1b1f] border-purple-100/20 rounded-bl-sm shadow-[0px_2px_8px_rgba(0,0,0,0.04)]">
                    <p className="text-sm whitespace-pre-line leading-relaxed">Olá, Dra.! Fiz a Ponte Pélvica hoje de manhã. Senti um leve desconforto abdominal na última repetição, é normal?</p>
                    <div className="flex justify-end mt-1">
                      <span className="text-[9px] font-medium text-[#795465]">08:15</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-end gap-2 max-w-[85%] self-start">
                  <div className="px-3.5 py-2.5 rounded-2xl border bg-white text-[#1d1b1f] border-purple-100/20 rounded-bl-sm shadow-[0px_2px_8px_rgba(0,0,0,0.04)]">
                    <p className="text-sm whitespace-pre-line leading-relaxed">Nível de dor registrado: 4/10 (Desconforto Moderado) 😕</p>
                    <div className="flex justify-end mt-1">
                      <span className="text-[9px] font-medium text-[#795465]">08:16</span>
                    </div>
                  </div>
                </div>
              </>
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
                      <p className="text-sm whitespace-pre-line leading-relaxed">{msg.message_text}</p>
                      <div className="flex justify-end mt-1 gap-1 items-center">
                        <span className={`text-[9px] font-medium ${isMe ? 'opacity-80' : 'text-[#795465]'}`}>
                          {formatTime(msg.created_at)}
                        </span>
                        {isMe && <span className="text-[12px] opacity-80 leading-none">✓✓</span>}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={chatEndRef} />
          </main>

          {/* Dynamic Input Bar Area */}
          <div className="fixed bottom-[76px] left-0 right-0 z-40">
            <div className="max-w-md mx-auto px-4 py-2.5 bg-white/90 backdrop-blur-md border-t border-purple-100/20">
              <div className="relative flex items-center gap-2 bg-[#fff7fd] border border-purple-100/30 rounded-2xl p-1.5 shadow-sm">
                
                <button className="p-2 text-[#70518d] hover:bg-purple-50 rounded-full transition-colors">
                  <Plus className="w-5 h-5" />
                </button>

                <input 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Responder ao paciente..."
                  className="flex-grow bg-transparent border-none focus:ring-0 text-[#1d1b1f] px-2 py-2 placeholder:text-[#795465]/40 outline-none text-sm"
                  type="text"
                />

                <button className="p-2 text-[#70518d] hover:bg-purple-50 rounded-full transition-colors">
                  <Mic className="w-5 h-5" />
                </button>

                <button 
                  onClick={handleSendMessage}
                  className="bg-[#70518d] text-white p-2.5 rounded-full w-10 h-10 shadow-sm active:scale-95 transition-all duration-200 ml-0.5 hover:bg-[#573974] flex-shrink-0 flex items-center justify-center"
                >
                  <Send className="w-4 h-4 text-white fill-current" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Navigation */}
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
            
            <Link 
              href="/dashboard/fisioterapeuta/chat" 
              className="flex flex-col items-center justify-center text-[#70518d] shrink-0"
            >
              <div className="bg-[#70518d]/10 text-[#70518d] rounded-full px-5 py-1 mb-1">
                <span className="material-symbols-outlined font-bold text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
              </div>
              <span className="text-[9px] font-extrabold">Chat</span>
            </Link>
          </nav>

        </div>
      </div>
    </>
  )
}
