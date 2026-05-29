import React, { useEffect, useState, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Loader2, Mic, StopCircle, Plus, Send, X, ArrowLeft, Video, Phone, Paperclip, Smile, Image as ImageIcon, FileText, Activity, Heart } from 'lucide-react'
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

const painEmojis: Record<number, { emoji: string; color: string; desc: string }> = {
  1: { emoji: '😀', color: '#4ade80', desc: 'Sem Dor / Muito Leve' },
  2: { emoji: '🙂', color: '#4ade80', desc: 'Leve' },
  3: { emoji: '😐', color: '#4ade80', desc: 'Desconforto Leve' },
  4: { emoji: '😕', color: '#facc15', desc: 'Desconforto Moderado' },
  5: { emoji: '🙁', color: '#facc15', desc: 'Dor Moderada' },
  6: { emoji: '😖', color: '#facc15', desc: 'Dor Forte' },
  7: { emoji: '😫', color: '#f87171', desc: 'Dor Muito Forte' },
  8: { emoji: '😩', color: '#f87171', desc: 'Dor Intensa' },
  9: { emoji: '😭', color: '#ef4444', desc: 'Dor Muito Intensa' },
  10: { emoji: '😵', color: '#dc2626', desc: 'Dor Insuportável' }
}

export default function PatientChat() {
  const router = useRouter()
  const [patientProfile, setPatientProfile] = useState<any>(null)
  const [therapistProfile, setTherapistProfile] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)

  // Modals & Menu State
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [showPainModal, setShowPainModal] = useState(false)
  const [painValue, setPainValue] = useState(5)

  // Refs for auto scroll and realtime channels
  const chatEndRef = useRef<HTMLDivElement>(null)
  const painChannelRef = useRef<any>(null)

  useEffect(() => {
    let activeUser: any = null
    let activeTherapistId: string = ''
    let messagesSub: any = null

    async function loadChatData() {
      try {
        // 1. Obtém o usuário logado
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          router.push('/login')
          return
        }
        activeUser = user

        // 2. Consulta o perfil do paciente
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          if (profile.role !== 'patient') {
            router.push('/dashboard/fisioterapeuta')
            return
          }
          setPatientProfile(profile)
        }

        // 3. Obtém o ID da fisioterapeuta a partir do último agendamento
        const { data: latestApp } = await supabase
          .from('appointments')
          .select('therapist_id')
          .eq('patient_id', user.id)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle()

        let therapistId = latestApp?.therapist_id

        // Se não houver agendamento, busca qualquer perfil com papel 'therapist'
        if (!therapistId) {
          const { data: anyTherapist } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'therapist')
            .limit(1)
            .maybeSingle()
          therapistId = anyTherapist?.id
        }

        activeTherapistId = therapistId

        if (therapistId) {
          // Busca o perfil completo da fisioterapeuta
          const { data: therapist } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', therapistId)
            .single()

          setTherapistProfile(therapist)

          // 4. Carrega as mensagens de chat entre ambos
          const { data: chatMsgs } = await supabase
            .from('chat_messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${therapistId}),and(sender_id.eq.${therapistId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true })

          if (chatMsgs) {
            setMessages(chatMsgs)
          }

          // 5. Inicializa o canal de Broadcast para o nível de dor
          const painChannel = supabase.channel(`pain-channel-${user.id}`, {
            config: {
              broadcast: { self: true }
            }
          })
          painChannel.subscribe()
          painChannelRef.current = painChannel

          // 6. Inscreve-se no canal Realtime do Supabase para novas mensagens no banco
          messagesSub = supabase
            .channel('patient-messages-realtime')
            .on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: 'chat_messages'
            }, (payload) => {
              const newMsg = payload.new as Message
              if (
                (newMsg.sender_id === user.id && newMsg.receiver_id === therapistId) ||
                (newMsg.sender_id === therapistId && newMsg.receiver_id === user.id)
              ) {
                setMessages((prev) => {
                  if (prev.some((m) => m.id === newMsg.id)) return prev
                  return [...prev, newMsg]
                })
              }
            })
            .subscribe()
        }
      } catch (err) {
        console.error('Erro ao inicializar o chat:', err)
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

    if (!patientProfile) {
      alert('Erro: Seu perfil de paciente não foi carregado corretamente. Por favor, recarregue a página.')
      return
    }

    if (!therapistProfile) {
      // Modo de Demonstração: adiciona mensagem apenas localmente no estado do React para simular a interatividade!
      const mockMsg: Message = {
        id: Math.random().toString(),
        sender_id: patientProfile.id,
        receiver_id: 'mock-therapist',
        message_text: text,
        attachment_url: null,
        attachment_type: null,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, mockMsg]);
      setInputText('')
      
      // Responde com uma resposta simulada da fisioterapeuta após 1.2 segundos!
      setTimeout(() => {
        const autoReply: Message = {
          id: Math.random().toString(),
          sender_id: 'mock-therapist',
          receiver_id: patientProfile.id,
          message_text: 'Olá! Sou a Dra. Ana Costa. Esta é uma resposta automática simulada do portal pélvico. Quando cadastrar uma fisioterapeuta real no sistema, nossa conversa ficará ativa no banco de dados com criptografia RLS!',
          attachment_url: null,
          attachment_type: null,
          created_at: new Date().toISOString()
        };
        setMessages((prev) => [...prev, autoReply]);
      }, 1200);
      return;
    }

    setInputText('')

    try {
      // Envia a mensagem inserindo no banco do Supabase
      const { data: newMsg, error } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: patientProfile.id,
          receiver_id: therapistProfile.id,
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
      alert(`Erro ao enviar mensagem: ${err.message || 'Erro desconhecido. Verifique suas políticas RLS.'}`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  // Registra a dor no banco de dados e envia Broadcast Realtime
  const handleSubmitPainLevel = async () => {
    if (!patientProfile) {
      alert('Erro: Seu perfil de paciente não foi carregado.')
      return
    }

    const config = painEmojis[painValue]
    const messageText = `Nível de dor registrado: ${painValue}/10 (${config.desc}) ${config.emoji}`

    setShowPainModal(false)

    if (!therapistProfile) {
      // Modo de Demonstração: adiciona registro de dor apenas localmente no estado do React para simular a interatividade!
      const mockMsg: Message = {
        id: Math.random().toString(),
        sender_id: patientProfile.id,
        receiver_id: 'mock-therapist',
        message_text: messageText,
        attachment_url: null,
        attachment_type: null,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, mockMsg]);
      
      // Responde com uma resposta simulada da fisioterapeuta após 1.2 segundos!
      setTimeout(() => {
        const autoReply: Message = {
          id: Math.random().toString(),
          sender_id: 'mock-therapist',
          receiver_id: patientProfile.id,
          message_text: `Recebi o seu nível de dor registrado de ${painValue}/10 (${config.desc}). Vou analisar na sua próxima evolução e ajustar os exercícios pélvicos se necessário. Continue se cuidando!`,
          attachment_url: null,
          attachment_type: null,
          created_at: new Date().toISOString()
        };
        setMessages((prev) => [...prev, autoReply]);
      }, 1200);
      return;
    }

    try {
      // 1. Grava no banco de dados para histórico
      const { data: newMsg, error } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: patientProfile.id,
          receiver_id: therapistProfile.id,
          message_text: messageText
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      if (newMsg) {
        setMessages((prev) => [...prev, newMsg as Message])
      }

      // 2. Transmite dinamicamente via Realtime Broadcast para atualizar na tela do Fisioterapeuta instantaneamente!
      if (painChannelRef.current) {
        await painChannelRef.current.send({
          type: 'broadcast',
          event: 'pain-update',
          payload: { painLevel: painValue }
        })
      }
    } catch (err: any) {
      console.error('Erro ao registrar nível de dor:', err)
      alert(`Erro ao salvar nível de dor: ${err.message}`)
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
          <p className="text-sm font-medium text-[#795465]">Carregando Chat Seguro...</p>
        </div>
      </div>
    )
  }

  const currentPainConfig = painEmojis[painValue]

  return (
    <>
      <Head>
        <title>Bella Flora Fisio - Chat</title>
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

          {/* Header - Chat variant with back arrow + therapist info */}
          <header className="sticky top-0 z-50 bg-white px-4 py-2.5 border-b border-purple-100/30 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Link 
                href="/dashboard/paciente"
                className="text-[#70518d] hover:bg-purple-50 transition-colors active:scale-95 duration-200 p-1.5 rounded-full flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <img 
                    alt={therapistProfile?.full_name || 'Fisioterapeuta'} 
                    className="w-9 h-9 rounded-full object-cover border border-purple-100/30 shadow-sm" 
                    src={therapistProfile?.avatar_url || '/assets/img/dra_ana_costa.png'}
                  />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <h1 className="text-sm font-extrabold text-[#1d1b1f] leading-tight">
                    {therapistProfile?.full_name || 'Dra. Ana Costa'}
                  </h1>
                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Online</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button className="hover:bg-purple-50 p-2 rounded-full transition-all text-[#70518d]">
                <Video className="w-4.5 h-4.5" />
              </button>
              <button className="hover:bg-purple-50 p-2 rounded-full transition-all text-[#70518d]">
                <Phone className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Chat Messages Area */}
          <main className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 pb-36">
            {!therapistProfile && (
              <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-3.5 flex flex-col gap-1 shadow-sm mb-2 select-none shrink-0">
                <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <span>⚠️ Modo de Demonstração</span>
                </div>
                <p className="text-[10px] text-amber-700 leading-relaxed font-semibold">
                  Nenhuma fisioterapeuta está cadastrada no sistema. O chat funcionará de forma interativa **simulada** localmente para teste imediato de navegação!
                </p>
              </div>
            )}
            <div className="flex justify-center my-2">
              <span className="bg-purple-50/60 border border-purple-100/30 text-[#795465] text-[10px] font-semibold px-3 py-1 rounded-full shadow-sm">
                Hoje
              </span>
            </div>

            {messages.length === 0 ? (
              <div className="text-center text-xs font-semibold text-[#cdc3cf] my-10 px-6">
                Nenhuma mensagem trocada ainda. Envie uma mensagem para iniciar o contato com sua Fisioterapeuta.
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === patientProfile?.id
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
                
                <button 
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  className="p-2 text-[#70518d] hover:bg-purple-50 rounded-full transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>

                <input 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Escreva sua mensagem..."
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

          {/* Attachment Menu Sheet */}
          {showAttachmentMenu && (
            <div 
              onClick={() => setShowAttachmentMenu(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-white rounded-t-3xl shadow-2xl p-6 transition-all transform translate-y-0"
              >
                <div className="w-12 h-1.5 bg-purple-100/60 rounded-full mx-auto mb-6"></div>
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <button 
                    onClick={() => setShowAttachmentMenu(false)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#fff7fd] hover:bg-purple-50 transition-colors border border-purple-100/20"
                  >
                    <div className="w-12 h-12 rounded-full bg-purple-50 text-[#70518d] flex items-center justify-center">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-[#1d1b1f] text-center font-bold">Enviar Imagem/<br/>Vídeo</span>
                  </button>

                  <button 
                    onClick={() => setShowAttachmentMenu(false)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#fff7fd] hover:bg-purple-50 transition-colors border border-purple-100/20"
                  >
                    <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-[#1d1b1f] text-center font-bold">Exame Clínico<br/>(PDF)</span>
                  </button>

                  <button 
                    onClick={() => {
                      setShowAttachmentMenu(false)
                      setShowPainModal(true)
                    }}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#fff7fd] hover:bg-purple-50 transition-colors border border-purple-100/20"
                  >
                    <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-red-600" />
                    </div>
                    <span className="text-xs text-[#1d1b1f] text-center font-bold">Registrar Nível<br/>de Dor</span>
                  </button>

                  <button 
                    onClick={() => setShowAttachmentMenu(false)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#fff7fd] hover:bg-purple-50 transition-colors border border-purple-100/20"
                  >
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                      <span className="material-symbols-outlined">fitness_center</span>
                    </div>
                    <span className="text-xs text-[#1d1b1f] text-center font-bold">Ver Meus<br/>Exercícios</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pain Scale Modal */}
          {showPainModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl transition-all scale-100 opacity-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-extrabold text-[#1d1b1f] flex items-center gap-1.5">
                    <Activity className="w-5 h-5 text-[#70518d]" />
                    Nível de Dor
                  </h3>
                  <button 
                    onClick={() => setShowPainModal(false)}
                    className="text-[#795465] p-1 rounded-full hover:bg-purple-50 flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-[#795465]" />
                  </button>
                </div>

                <div className="flex flex-col items-center gap-6">
                  <div className="text-6xl animate-bounce">{currentPainConfig.emoji}</div>
                  <div className="w-full px-2">
                    <input 
                      type="range"
                      min="1"
                      max="10"
                      value={painValue}
                      onChange={(e) => setPainValue(parseInt(e.target.value))}
                      className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-[#70518d]" 
                    />
                    <div className="flex justify-between mt-2 text-xs font-bold text-[#795465]/70">
                      <span>1 (Muito Leve)</span>
                      <span>10 (Insuportável)</span>
                    </div>
                  </div>
                  
                  <p 
                    className="text-lg font-bold text-center" 
                    style={{ color: currentPainConfig.color }}
                  >
                    {currentPainConfig.desc}
                  </p>

                  <button 
                    onClick={handleSubmitPainLevel}
                    className="w-full py-3 bg-[#70518d] text-white rounded-full font-bold hover:bg-[#573974] transition-colors shadow-md mt-2 flex items-center justify-center gap-1.5"
                  >
                    Registrar Dor
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Navigation TabBar */}
          <nav className="fixed bottom-0 left-0 right-0 h-[76px] bg-white border-t border-purple-100/30 z-40 select-none">
            <div className="max-w-md mx-auto h-full flex justify-around items-center px-4">
              <Link 
                href="/dashboard/paciente" 
                className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
              >
                <span className="material-symbols-outlined text-lg mb-1">home</span>
                <span className="text-[9px] font-semibold">Início</span>
              </Link>
              
              <Link 
                href="/dashboard/paciente/tratamento" 
                className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
              >
                <span className="material-symbols-outlined text-lg mb-1">medical_services</span>
                <span className="text-[9px] font-semibold">Tratamento</span>
              </Link>
              
              <Link 
                href="/dashboard/paciente/chat" 
                className="flex flex-col items-center justify-center text-[#70518d] shrink-0"
              >
                <div className="bg-[#70518d]/10 text-[#70518d] rounded-full px-5 py-1 mb-1">
                  <span className="material-symbols-outlined font-bold text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>person_search</span>
                </div>
                <span className="text-[9px] font-extrabold">Profissional</span>
              </Link>
              
              <Link 
                href="/dashboard/paciente/perfil" 
                className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
              >
                <span className="material-symbols-outlined text-lg mb-1">person</span>
                <span className="text-[9px] font-semibold">Perfil</span>
              </Link>
            </div>
          </nav>

        </div>
      </div>
    </>
  )
}
