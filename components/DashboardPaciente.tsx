import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { LogOut, User, ClipboardList, Calendar, Heart, Bell, MessageSquare, ChevronRight, Check, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

interface Therapist {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
}

interface Appointment {
  id: string
  date: string
  status: string
  notes: string | null
  therapist: Therapist | null
}

interface DashboardPacienteProps {
  patientName: string
  painLevel: number | null
  appointment: Appointment | null
  onLogout: () => Promise<void>
}

// Configuração de emojis e descrição de dor de acordo com o protótipo
const painConfigs: Record<number, { emoji: string; color: string; desc: string; bg: string }> = {
  1: { emoji: '😀', color: '#10b981', bg: '#ecfdf5', desc: 'Sem Dor / Muito Leve' },
  2: { emoji: '🙂', color: '#10b981', bg: '#ecfdf5', desc: 'Dor Leve' },
  3: { emoji: '😐', color: '#10b981', bg: '#ecfdf5', desc: 'Desconforto Leve' },
  4: { emoji: '😕', color: '#f59e0b', bg: '#fef3c7', desc: 'Desconforto Moderado' },
  5: { emoji: '🙁', color: '#f59e0b', bg: '#fef3c7', desc: 'Dor Moderada' },
  6: { emoji: '😖', color: '#f59e0b', bg: '#fef3c7', desc: 'Dor Forte' },
  7: { emoji: '😫', color: '#ef4444', bg: '#fee2e2', desc: 'Dor Muito Forte' },
  8: { emoji: '😩', color: '#ef4444', bg: '#fee2e2', desc: 'Dor Intensa' },
  9: { emoji: '😭', color: '#ef4444', bg: '#fee2e2', desc: 'Dor Muito Intensa' },
  10: { emoji: '😵', color: '#dc2626', bg: '#fef2f2', desc: 'Dor Insuportável' },
}

export default function DashboardPaciente({
  patientName,
  painLevel,
  appointment,
  onLogout
}: DashboardPacienteProps) {

  const [isConfirmed, setIsConfirmed] = useState(false)

  useEffect(() => {
    if (appointment) {
      const confirmed = localStorage.getItem(`confirmed_appt_${appointment.id}`) === 'true'
      setIsConfirmed(confirmed)
    }
  }, [appointment])

  const handleConfirmPresence = async () => {
    if (appointment) {
      try {
        localStorage.setItem(`confirmed_appt_${appointment.id}`, 'true')
        setIsConfirmed(true)
        
        await supabase
          .from('appointments')
          .update({ patient_confirmed: true })
          .eq('id', appointment.id)
      } catch (err) {
        console.error('Erro ao atualizar presença no banco:', err)
      }
    }
  }


  // Formata a data do agendamento de acordo com o padrão do protótipo
  const formatAppointmentDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = date.getDate()
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    const month = months[date.getMonth()]
    const dateFormatted = `${day} de ${month}`

    const weekdays = [
      'Dom', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sáb'
    ]
    const weekday = weekdays[date.getDay()]
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const timeFormatted = `${weekday}, às ${hours}:${minutes}`

    return { dateFormatted, timeFormatted }
  }

  const appointmentDetails = appointment ? formatAppointmentDate(appointment.date) : null
  const painConfig = painLevel ? painConfigs[painLevel] : null

  return (
    <>
      <Head>
        <title>Bella Flora Fisio - Portal do Paciente</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen w-full bg-[#fff7fd] font-sans antialiased overflow-x-hidden">
        <div className="relative w-full h-screen max-h-screen overflow-hidden max-w-md mx-auto bg-[#fff7fd] flex flex-col">

          {/* Premium Custom Navbar Header */}
          <header className="bg-white px-5 py-3 border-b border-purple-100/30 flex items-center justify-between shrink-0 z-40 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#70518d] to-[#573974] flex items-center justify-center text-white shadow-sm">
                <Heart className="w-4 h-4 text-white fill-current" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-[#70518d]">
                  Bella Flora <span className="text-[#795465] font-light">Fisio</span>
                </span>
                <span className="block text-[8px] text-[#795465] font-semibold uppercase tracking-wider -mt-1">
                  Portal de Saúde
                </span>
              </div>
            </div>
            
            <button 
              onClick={onLogout}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-purple-100 bg-purple-50/20 text-[#795465] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors active:scale-95 text-[10px] font-bold"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </header>

          {/* Main App Content Viewport */}
          <main className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5 scrollbar-none pb-24">
            
            {/* Elegant Welcome Greeting & Pain Card */}
            <section className="flex justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-purple-100/20 shadow-sm">
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold text-[#70518d] uppercase tracking-wider">Bem-vinda de volta</p>
                <h2 className="text-xl font-extrabold text-[#1d1b1f] truncate mt-0.5">Olá, {patientName.split(' ')[0]}</h2>
                <p className="text-[11px] text-[#795465] mt-0.5">Como está se sentindo hoje?</p>
              </div>
              
              {/* Dynamic Pain Display Bubble */}
              {painConfig ? (
                <div 
                  className="flex flex-col items-center justify-center p-3 rounded-2xl border border-purple-100/30 shrink-0 shadow-sm transition-transform active:scale-95 select-none"
                  style={{ backgroundColor: painConfig.bg }}
                  title={`Última dor: ${painLevel}/10 (${painConfig.desc})`}
                >
                  <span className="text-2xl leading-none">{painConfig.emoji}</span>
                  <span className="text-[9px] font-bold mt-1" style={{ color: painConfig.color }}>DOR: {painLevel}/10</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-200 shrink-0">
                  <span className="text-2xl leading-none">📋</span>
                  <span className="text-[9px] font-extrabold text-slate-400 mt-1 uppercase">Sem Dor</span>
                </div>
              )}
            </section>

            {/* Next Scheduled Appointment Section */}
            {appointment && appointmentDetails ? (
              <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#70518d] to-[#573974] p-5 text-white shadow-md border border-[#70518d]/30">
                {/* Visual Glassmorphic Accent */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 rounded-full text-[9px] font-bold text-purple-100 backdrop-blur-sm">
                    <Calendar className="w-3.5 h-3.5 text-purple-100" />
                    PRÓXIMA CONSULTA
                  </span>
                  <span className="text-[10px] font-bold bg-[#ffd8e7] text-[#795465] px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Clínica
                  </span>
                </div>
                
                <div className="bg-white/15 p-4 rounded-2xl border border-white/10 mb-4 backdrop-blur-sm">
                  <p className="text-lg font-extrabold leading-none">{appointmentDetails.dateFormatted}</p>
                  <p className="text-xs text-purple-100/90 font-medium mt-1.5">{appointmentDetails.timeFormatted}</p>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-white/10 relative z-10">
                  <div className="flex items-center gap-3">
                    <img 
                      alt={appointment.therapist?.full_name || 'Fisioterapeuta'} 
                      className="w-10 h-10 rounded-full object-cover border-2 border-white/30" 
                      src={appointment.therapist?.avatar_url || '/assets/img/dra_ana_costa.png'} 
                    />
                    <div>
                      <p className="text-xs font-bold leading-none">{appointment.therapist?.full_name || 'Dra. Ana Costa'}</p>
                      <p className="text-[10px] text-purple-200 mt-0.5">Fisioterapeuta Especialista</p>
                    </div>
                  </div>
                  
                  <Link 
                    href={`/dashboard/paciente/chat?therapist_id=${appointment.therapist?.id || ''}`}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <MessageSquare className="w-4 h-4 text-white" />
                  </Link>
                </div>

                {/* Confirm / Reschedule glassmorphic action buttons */}
                <div className="mt-4 pt-4 border-t border-white/10 flex gap-2.5 relative z-10">
                  {isConfirmed ? (
                    <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-2 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold w-full backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      Presença Confirmada!
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={handleConfirmPresence}
                        className="flex-grow h-9 rounded-xl bg-white/20 hover:bg-emerald-500/30 text-white flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-tight active:scale-95 transition-all border border-white/10"
                      >
                        <Check className="w-3.5 h-3.5 text-white" />
                        Confirmar
                      </button>
                      
                      <Link
                        href={`/dashboard/paciente/agenda?therapist_id=${appointment.therapist?.id || ''}&reschedule_appt_id=${appointment.id}`}
                        className="flex-grow h-9 rounded-xl bg-white/5 hover:bg-white/15 text-purple-100 flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-tight active:scale-95 transition-all border border-white/5"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-purple-200" />
                        Remarcar
                      </Link>
                    </>
                  )}
                </div>
              </section>
            ) : (
              /* Empty Appointment Card */
              <section className="bg-white rounded-3xl p-5 border border-purple-100/20 shadow-sm flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center mb-3 text-[#70518d]">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-extrabold text-[#1d1b1f]">Sem consultas pendentes</h3>
                <p className="text-[11px] text-[#795465] max-w-[210px] mt-1 leading-normal">
                  Você não possui sessões agendadas no momento.
                </p>
                <Link 
                  href="/dashboard/paciente/agenda"
                  className="mt-4 bg-[#70518d] hover:bg-[#573974] text-white text-xs font-extrabold px-6 py-2.5 rounded-full shadow-sm active:scale-95 transition-all duration-200"
                >
                  Agendar Consulta
                </Link>
              </section>
            )}

            {/* Quick Access Dashboard Grid */}
            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-[#70518d] uppercase tracking-wider">Acesso Rápido</h3>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Meu Tratamento */}
                <Link 
                  href="/dashboard/paciente/meu-tratamento"
                  className="bg-white p-4 rounded-2xl border border-purple-100/10 shadow-sm flex flex-col items-center justify-center text-center hover:scale-[1.02] active:scale-[0.98] transition-all hover:border-purple-200/50"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#70518d] flex items-center justify-center mb-2.5">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-extrabold text-[#1d1b1f]">Meu Tratamento</span>
                </Link>

                {/* Minha Agenda */}
                <Link 
                  href="/dashboard/paciente/agenda"
                  className="bg-white p-4 rounded-2xl border border-purple-100/10 shadow-sm flex flex-col items-center justify-center text-center hover:scale-[1.02] active:scale-[0.98] transition-all hover:border-purple-200/50"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-extrabold text-[#1d1b1f]">Minha Agenda</span>
                </Link>

                {/* Exercícios para Casa */}
                <Link 
                  href="/dashboard/paciente/tratamento"
                  className="bg-white p-4 rounded-2xl border border-purple-100/10 shadow-sm flex flex-col items-center justify-center text-center hover:scale-[1.02] active:scale-[0.98] transition-all hover:border-purple-200/50"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
                    <Heart className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-extrabold text-[#1d1b1f]">Rotina em Casa</span>
                </Link>

                {/* Meu Perfil */}
                <Link 
                  href="/dashboard/paciente/perfil"
                  className="bg-white p-4 rounded-2xl border border-purple-100/10 shadow-sm flex flex-col items-center justify-center text-center hover:scale-[1.02] active:scale-[0.98] transition-all hover:border-purple-200/50"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-2.5">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-extrabold text-[#1d1b1f]">Meu Perfil</span>
                </Link>
              </div>

              {/* Chat com Terapeuta - Full Width Quick Banner */}
              <Link 
                href={`/dashboard/paciente/chat?therapist_id=${appointment?.therapist?.id || ''}`}
                className="w-full bg-white p-4 rounded-2xl border border-purple-100/15 shadow-sm flex items-center justify-between hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#70518d] flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-extrabold text-[#1d1b1f]">Mensagens & Dúvidas</h4>
                    <p className="text-[10px] text-[#795465] mt-0.5">Converse diretamente com sua fisioterapeuta</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

            </section>
          </main>

          {/* Emulated Phone Bottom Navigation TabBar (Fixo no rodapé do frame) */}
          <nav className="absolute bottom-0 left-0 w-full h-[76px] bg-white border-t border-purple-100/30 flex justify-around items-center px-4 pb-safe z-40 select-none">
            <Link 
              href="/dashboard/paciente" 
              className="flex flex-col items-center justify-center text-[#70518d] shrink-0"
            >
              <div className="bg-[#70518d]/10 text-[#70518d] rounded-full px-5 py-1 mb-1">
                <span className="material-symbols-outlined font-bold text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
              </div>
              <span className="text-[9px] font-extrabold">Início</span>
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
              className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
            >
              <span className="material-symbols-outlined text-lg mb-1">person_search</span>
              <span className="text-[9px] font-semibold">Profissional</span>
            </Link>
            
            <Link 
              href="/dashboard/paciente/perfil" 
              className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
            >
              <span className="material-symbols-outlined text-lg mb-1">person</span>
              <span className="text-[9px] font-semibold">Perfil</span>
            </Link>
          </nav>

        </div>
      </div>
    </>
  )
}
