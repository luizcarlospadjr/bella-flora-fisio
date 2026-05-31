import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Loader2, ArrowLeft, Calendar, Clock, Check, X, User, Heart, Sparkles, Phone, MessageSquare, AlertTriangle, CheckCircle2, ChevronRight, RefreshCw, ClipboardList } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'

interface Patient {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
}

interface Appointment {
  id: string
  therapist_id: string
  patient_id: string
  date: string
  status: 'scheduled' | 'completed' | 'canceled' | 'no_show'
  service: string | null
  price: number | null
  duration_minutes: number | null
  notes: string | null
  patient_confirmed: boolean | null
  created_at: string
  patient?: Patient
}

const timeSlots = ['08:00', '09:30', '14:00', '16:30', '18:00']

export default function TherapistAgenda() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [therapist, setTherapist] = useState<any>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  
  // Selected date states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Month Calendar states
  const [showMonthCalendar, setShowMonthCalendar] = useState<boolean>(false)
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(new Date())

  // Keep calendar view month in sync with selectedDate
  useEffect(() => {
    setCalendarViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
  }, [selectedDate])

  // Load profile and day data
  useEffect(() => {
    async function loadTherapistAndAppointments() {
      try {
        setLoading(true)
        const { data: { user }, error: authErr } = await supabase.auth.getUser()
        if (authErr || !user) {
          router.push('/login')
          return
        }
        setTherapist(user)
        await fetchDayAppointments(user.id, selectedDate)
      } catch (err) {
        console.error('Erro ao carregar agenda:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTherapistAndAppointments()
  }, [selectedDate])

  const fetchDayAppointments = async (therapistId: string, targetDate: Date) => {
    // Start and end of the target day
    const year = targetDate.getFullYear()
    const month = targetDate.getMonth()
    const day = targetDate.getDate()
    
    const startOfDay = new Date(year, month, day, 0, 0, 0, 0).toISOString()
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999).toISOString()

    const { data, error } = await supabase
      .from('appointments')
      .select('*, patient:profiles!appointments_patient_id_fkey(*)')
      .eq('therapist_id', therapistId)
      .gte('date', startOfDay)
      .lte('date', endOfDay)

    if (error) {
      console.error('Erro ao buscar consultas:', error)
      return
    }

    if (data) {
      setAppointments(data as Appointment[])
    }
  }

  // Attendance & control handlers
  const handleUpdateStatus = async (appointmentId: string, newStatus: 'completed' | 'no_show') => {
    if (!therapist) return
    try {
      setActionLoading(appointmentId)
      
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId)

      if (error) throw error

      // Update local state instantly
      setAppointments(prev => 
        prev.map(app => app.id === appointmentId ? { ...app, status: newStatus } : app)
      )
    } catch (err) {
      console.error('Erro ao atualizar status da consulta:', err)
      alert('Erro ao atualizar o status do atendimento. Tente novamente.')
    } finally {
      setActionLoading(null)
    }
  }

  // Date switching utilities
  const handleSetToday = () => {
    setSelectedDate(new Date())
  }

  const handleAdjustDay = (amount: number) => {
    const nextDate = new Date(selectedDate)
    nextDate.setDate(selectedDate.getDate() + amount)
    setSelectedDate(nextDate)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const [year, month, day] = e.target.value.split('-').map(Number)
      setSelectedDate(new Date(year, month - 1, day))
    }
  }

  const handleSelectCalendarDay = (day: number) => {
    const newDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), day)
    setSelectedDate(newDate)
    setShowMonthCalendar(false)
  }

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  // Formats selected date nicely: e.g. "31 de Maio, 2026 - Domingo"
  const formatSelectedDateHeader = () => {
    const day = selectedDate.getDate()
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    const month = months[selectedDate.getMonth()]
    const year = selectedDate.getFullYear()
    
    const weekdays = [
      'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
    ]
    const weekday = weekdays[selectedDate.getDay()]

    return {
      mainStr: `${day} de ${month}, ${year}`,
      weekdayStr: weekday
    }
  }

  const headerDate = formatSelectedDateHeader()

  // Match appointment to standard slot (using hour check)
  const getAppointmentForSlot = (slot: string) => {
    return appointments.find(app => {
      // Avoid canceled consultations
      if (app.status === 'canceled') return false
      
      const appDate = new Date(app.date)
      const hours = String(appDate.getHours()).padStart(2, '0')
      const minutes = String(appDate.getMinutes()).padStart(2, '0')
      const appTime = `${hours}:${minutes}`
      return appTime === slot
    })
  }

  // Calculate day metrics
  const activeAppointments = appointments.filter(app => app.status !== 'canceled')
  
  const completedCount = activeAppointments.filter(app => app.status === 'completed').length
  const pendingCount = activeAppointments.filter(app => app.status === 'scheduled').length
  const missedCount = activeAppointments.filter(app => app.status === 'no_show').length
  
  // A slot is free if there's no active appointment in it
  const freeSlotsCount = timeSlots.filter(slot => !getAppointmentForSlot(slot)).length

  const formattedInputDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`

  // Calendar calculations
  const viewYear = calendarViewDate.getFullYear()
  const viewMonth = calendarViewDate.getMonth()
  
  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDayIndex = getFirstDayOfMonth(viewYear, viewMonth)
  
  const daysArray: (number | null)[] = []
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d)
  }

  return (
    <>
      <Head>
        <title>Agenda Clínica Diária | Bella Flora Fisio</title>
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
          <header className="bg-white border-b border-purple-100/30 sticky top-0 z-50 shadow-sm shrink-0 px-4 py-2.5 flex items-center justify-between">
            <Link 
              href="/dashboard/fisioterapeuta"
              className="text-[#795465] hover:bg-purple-50 transition-colors p-1.5 rounded-full active:scale-95 flex items-center justify-center border border-purple-100/20"
            >
              <ArrowLeft className="w-4 h-4 text-[#70518d]" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#70518d] to-[#573974] flex items-center justify-center text-white shadow-sm">
                <Heart className="w-4 h-4 text-white fill-current" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-[#70518d]">
                  Bella Flora <span className="text-[#795465] font-light">Fisio</span>
                </span>
                <span className="block text-[8px] text-[#795465] font-semibold uppercase tracking-wider -mt-1">
                  Agenda Clínica
                </span>
              </div>
            </div>
            <button 
              onClick={() => therapist && fetchDayAppointments(therapist.id, selectedDate)}
              className="text-[#70518d] hover:bg-purple-50 p-1.5 rounded-full active:scale-95 border border-purple-100/20 flex items-center justify-center"
              title="Recarregar dados"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </header>

          <main className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5 scrollbar-none pb-24">
            
            {/* Date Control Panel */}
            <section className="bg-white border border-purple-100/20 rounded-2xl p-4 shadow-sm flex flex-col gap-3.5">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => handleAdjustDay(-1)}
                  className="px-3.5 py-1.5 border border-purple-100 text-[#795465] text-[10px] font-bold rounded-full hover:bg-purple-50 transition-colors active:scale-95"
                >
                  ◀ Ontem
                </button>
                
                <button
                  onClick={handleSetToday}
                  className="px-4 py-1.5 bg-[#70518d]/10 text-[#70518d] text-[10px] font-bold rounded-full hover:bg-[#70518d]/20 transition-colors active:scale-95"
                >
                  Hoje
                </button>

                <button
                  onClick={() => handleAdjustDay(1)}
                  className="px-3.5 py-1.5 border border-purple-100 text-[#795465] text-[10px] font-bold rounded-full hover:bg-purple-50 transition-colors active:scale-95"
                >
                  Amanhã ▶
                </button>
              </div>

              {/* Styled Input Date */}
              <div className="relative flex items-center justify-between border-t border-purple-100/10 pt-3">
                <div className="select-none">
                  <h3 className="font-extrabold text-sm text-[#1d1b1f] leading-tight">
                    {headerDate.mainStr}
                  </h3>
                  <p className="text-[10px] text-[#795465] font-semibold mt-0.5">
                    {headerDate.weekdayStr}
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowMonthCalendar(!showMonthCalendar)}
                  className={`flex items-center gap-1.5 border px-2.5 py-1.5 rounded-xl cursor-pointer transition-all active:scale-95 font-bold text-[10px] ${
                    showMonthCalendar 
                      ? 'bg-[#70518d] border-transparent text-white shadow-sm' 
                      : 'bg-slate-50 border-purple-100/40 text-[#70518d] hover:bg-purple-50/40'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Escolher Dia</span>
                </button>
              </div>

              {/* Expandable Premium Custom Month Calendar */}
              {showMonthCalendar && (
                <div className="mt-3.5 pt-3.5 border-t border-purple-100/10 flex flex-col gap-3.5">
                  {/* Calendar Month Selector Header */}
                  <div className="flex items-center justify-between px-1">
                    <button 
                      type="button"
                      onClick={() => {
                        const prevMonth = new Date(calendarViewDate)
                        prevMonth.setMonth(calendarViewDate.getMonth() - 1)
                        setCalendarViewDate(prevMonth)
                      }}
                      className="p-1 rounded-full hover:bg-purple-50 text-[#70518d] transition-all flex items-center justify-center border border-purple-100/20 active:scale-90"
                    >
                      <span className="material-symbols-outlined text-base">chevron_left</span>
                    </button>
                    <span className="text-xs font-extrabold text-[#70518d] uppercase tracking-wider">
                      {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(calendarViewDate)}
                    </span>
                    <button 
                      type="button"
                      onClick={() => {
                        const nextMonth = new Date(calendarViewDate)
                        nextMonth.setMonth(calendarViewDate.getMonth() + 1)
                        setCalendarViewDate(nextMonth)
                      }}
                      className="p-1 rounded-full hover:bg-purple-50 text-[#70518d] transition-all flex items-center justify-center border border-purple-100/20 active:scale-90"
                    >
                      <span className="material-symbols-outlined text-base">chevron_right</span>
                    </button>
                  </div>

                  {/* Calendar Weekday Names */}
                  <div className="grid grid-cols-7 text-center text-[9px] font-extrabold text-[#795465] uppercase select-none">
                    <span>Dom</span>
                    <span>Seg</span>
                    <span>Ter</span>
                    <span>Qua</span>
                    <span>Qui</span>
                    <span>Sex</span>
                    <span>Sáb</span>
                  </div>

                  {/* Calendar Days Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {daysArray.map((day, index) => {
                      if (day === null) {
                        return <div key={`empty-${index}`} className="h-8"></div>
                      }

                      const isSelected = selectedDate.getDate() === day &&
                                         selectedDate.getMonth() === viewMonth &&
                                         selectedDate.getFullYear() === viewYear

                      const isToday = new Date().getDate() === day &&
                                      new Date().getMonth() === viewMonth &&
                                      new Date().getFullYear() === viewYear

                      return (
                        <button
                          key={`day-${day}`}
                          type="button"
                          onClick={() => handleSelectCalendarDay(day)}
                          className={`h-8 w-8 rounded-full font-bold flex items-center justify-center mx-auto transition-all active:scale-90 ${
                            isSelected 
                              ? 'bg-gradient-to-br from-[#70518d] to-[#573974] text-white shadow-sm'
                              : isToday
                              ? 'border-2 border-[#70518d] text-[#70518d] hover:bg-purple-50'
                              : 'text-[#1d1b1f] hover:bg-purple-50/70'
                          }`}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Daily Summary Metrics - BENTO SECTION */}
            <section className="grid grid-cols-4 gap-2">
              
              {/* Já foram */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50/20 border border-emerald-100/50 p-2.5 rounded-xl shadow-xs flex flex-col items-center justify-center text-center">
                <span className="text-[8px] font-extrabold text-emerald-800 uppercase tracking-wider block mb-1">Já Fui / OK</span>
                <span className="font-extrabold text-base text-emerald-700">{completedCount}</span>
              </div>

              {/* Ainda faltam */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50/20 border border-purple-100/50 p-2.5 rounded-xl shadow-xs flex flex-col items-center justify-center text-center">
                <span className="text-[8px] font-extrabold text-[#70518d] uppercase tracking-wider block mb-1">Faltam</span>
                <span className="font-extrabold text-base text-[#70518d]">{pendingCount}</span>
              </div>

              {/* Não veio */}
              <div className="bg-gradient-to-br from-red-50 to-rose-50/20 border border-red-100/50 p-2.5 rounded-xl shadow-xs flex flex-col items-center justify-center text-center">
                <span className="text-[8px] font-extrabold text-red-800 uppercase tracking-wider block mb-1">Não Veio</span>
                <span className="font-extrabold text-base text-red-600">{missedCount}</span>
              </div>

              {/* Horários Livres */}
              <div className="bg-gradient-to-br from-slate-50 to-gray-50/20 border border-slate-100/50 p-2.5 rounded-xl shadow-xs flex flex-col items-center justify-center text-center">
                <span className="text-[8px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">Vagas</span>
                <span className="font-extrabold text-base text-slate-700">{freeSlotsCount}</span>
              </div>
            </section>

            {/* List of Time Slots */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between pl-1">
                <h3 className="text-xs font-bold text-[#70518d] uppercase tracking-wider">Cronograma do Dia</h3>
                <span className="text-[9px] font-bold text-[#795465]">Atendimentos Ordenados</span>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-purple-100/20 shadow-sm">
                  <Loader2 className="w-8 h-8 animate-spin text-[#70518d]" />
                  <p className="text-[10px] text-[#795465] font-semibold">Carregando consultas...</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {timeSlots.map((slot) => {
                    const appt = getAppointmentForSlot(slot)

                    if (appt) {
                      const isActioning = actionLoading === appt.id
                      const patient = appt.patient

                      return (
                        <div 
                          key={appt.id}
                          className={`bg-white border rounded-2xl p-4 shadow-sm transition-all relative overflow-hidden ${
                            appt.status === 'completed' 
                              ? 'border-emerald-200/60 bg-emerald-50/5' 
                              : appt.status === 'no_show'
                              ? 'border-red-100 bg-red-50/5'
                              : 'border-purple-100/30'
                          }`}
                        >
                          {/* Top row with Time and Badges */}
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-[#70518d] bg-purple-50 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-purple-100/30">
                                <Clock className="w-3 h-3 text-[#70518d]" />
                                {slot}
                              </span>
                              
                              {/* Service label */}
                              {appt.service && (
                                <span className="bg-slate-50 text-[#795465] px-2 py-0.5 rounded-lg text-[9px] font-bold border border-purple-100/10 truncate max-w-[130px]" title={appt.service}>
                                  {appt.service}
                                </span>
                              )}
                            </div>

                            {/* Status Indicator Badge */}
                            <div className="flex items-center gap-1.5 select-none shrink-0">
                              {appt.status === 'completed' && (
                                <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[8px] font-bold uppercase tracking-wider flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  Sessão Concluída
                                </span>
                              )}
                              {appt.status === 'no_show' && (
                                <span className="bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full border border-red-200 text-[8px] font-bold uppercase tracking-wider flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                  Paciente não veio
                                </span>
                              )}
                              {appt.status === 'scheduled' && (
                                <span className="bg-purple-50 text-[#70518d] px-2.5 py-0.5 rounded-full border border-purple-100/20 text-[8px] font-bold uppercase tracking-wider flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#70518d] animate-pulse"></span>
                                  Confirmado/Ativo
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Patient Box */}
                          <div className="flex items-center justify-between gap-3 border-t border-purple-100/10 pt-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <img 
                                alt={patient?.full_name || 'Paciente'} 
                                className="w-10 h-10 rounded-full object-cover border border-purple-100/20" 
                                src={patient?.avatar_url || '/assets/img/mariana_silva.png'} 
                              />
                              <div className="min-w-0">
                                <h4 className="font-extrabold text-xs text-[#1d1b1f] truncate leading-tight flex items-center gap-1.5">
                                  {patient?.full_name || 'Paciente sem nome'}
                                  <Link 
                                    href={`/dashboard/fisioterapeuta/prontuario?patient_id=${appt.patient_id}`}
                                    className="text-[#70518d] hover:underline"
                                    title="Ir para prontuário clínico"
                                  >
                                    <ClipboardList className="w-3 h-3 text-[#70518d]/70 inline" />
                                  </Link>
                                </h4>
                                <p className="text-[9px] text-[#795465] font-semibold mt-0.5 flex items-center gap-1 select-none">
                                  <Phone className="w-2.5 h-2.5 text-[#70518d]" />
                                  {patient?.phone || 'Sem telefone'}
                                </p>
                              </div>
                            </div>

                            {/* Presence Confirmation by Patient Badge */}
                            {appt.patient_confirmed && (
                              <div className="bg-emerald-50/80 border border-emerald-100 text-emerald-800 px-2 py-1 rounded-lg text-[8px] font-extrabold flex items-center gap-1 shrink-0 select-none shadow-xs">
                                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                Presença Confirmada!
                              </div>
                            )}
                          </div>

                          {/* Interactive Presence Controls (Only visible for scheduled state) */}
                          {appt.status === 'scheduled' && (
                            <div className="mt-3.5 pt-3 border-t border-purple-100/10 flex gap-2.5">
                              {isActioning ? (
                                <div className="w-full py-2 flex items-center justify-center gap-2 text-xs font-semibold text-[#795465]">
                                  <Loader2 className="w-4 h-4 animate-spin text-[#70518d]" />
                                  <span>Atualizando presença...</span>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleUpdateStatus(appt.id, 'no_show')}
                                    className="flex-1 py-2 border border-red-200 text-red-600 font-bold rounded-xl text-[10px] uppercase tracking-wide hover:bg-red-50/50 active:scale-95 transition-all flex items-center justify-center gap-1"
                                    title="Registrar que o paciente faltou à consulta"
                                  >
                                    <X className="w-3.5 h-3.5 text-red-500 stroke-[3]" />
                                    Paciente não veio
                                  </button>

                                  <button
                                    onClick={() => handleUpdateStatus(appt.id, 'completed')}
                                    className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-xl text-[10px] uppercase tracking-wide hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-1 shadow-sm"
                                    title="Registrar que o atendimento foi finalizado com sucesso"
                                  >
                                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                    Sessão Concluída
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    }

                    // FREE / AVAILABLE SLOT CARD
                    return (
                      <div 
                        key={slot}
                        className="bg-white/40 border border-dashed border-purple-100/30 p-4 rounded-2xl shadow-xs flex items-center justify-between gap-3 select-none"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-purple-100/10">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {slot}
                          </span>
                          
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-xs text-slate-400 truncate">
                              Horário Livre
                            </h4>
                            <p className="text-[9px] text-slate-400/90 font-medium">
                              Nenhum agendamento registrado
                            </p>
                          </div>
                        </div>

                        <span className="bg-emerald-50 text-[#70518d] border border-purple-100/20 px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-wider">
                          LIVRE
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </main>

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
            
            <Link 
              href="/dashboard/fisioterapeuta/chat" 
              className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
            >
              <span className="material-symbols-outlined text-lg mb-1">chat</span>
              <span className="text-[9px] font-semibold">Chat</span>
            </Link>
          </nav>

        </div>
      </div>
    </>
  )
}
