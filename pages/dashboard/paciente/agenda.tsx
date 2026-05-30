import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Sparkles, Check, Heart, ShieldAlert } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'

interface TherapistProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  role: string
}

interface Service {
  id: string
  name: string
  icon: string
  price: number
  duration: string | null
  summary: string | null
  therapist_id: string | null
}

const timeSlots = ['08:00', '09:30', '14:00', '16:30', '18:00']

export default function PatientAgenda() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [therapists, setTherapists] = useState<TherapistProfile[]>([])
  const [selectedTherapist, setSelectedTherapist] = useState<TherapistProfile | null>(null)
  
  // Selection states
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date()) // Month navigator date
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate() + 1) // default to tomorrow
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Booked appointments in the selected day (for conflict check)
  const [bookedSlots, setBookedSlots] = useState<string[]>([])

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Obtém o usuário logado do Supabase Auth
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          router.push('/login')
          return
        }
        setCurrentUser(user)

        // 2. Busca o perfil do paciente para obter o therapist_id
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        let therapistId = userProfile?.therapist_id

        // Se não houver terapeuta vinculado, busca a partir de agendamentos passados
        if (!therapistId) {
          const { data: latestApp } = await supabase
            .from('appointments')
            .select('therapist_id')
            .eq('patient_id', user.id)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle()
          therapistId = latestApp?.therapist_id
        }

        // Se ainda assim não houver, busca a primeira terapeuta cadastrada como fallback
        if (!therapistId) {
          const { data: firstTherapist } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'therapist')
            .limit(1)
            .maybeSingle()
          therapistId = firstTherapist?.id
        }

        // 3. Carrega o perfil da fisioterapeuta responsável
        if (therapistId) {
          const { data: therapist } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', therapistId)
            .single()

          if (therapist) {
            setTherapists([therapist])
            setSelectedTherapist(therapist)
          }
        }

        // 4. Carrega os serviços dinamicamente da tabela clinic_services
        const { data: servicesList } = await supabase
          .from('clinic_services')
          .select('*')
          .order('name', { ascending: true })

        if (servicesList && servicesList.length > 0) {
          setServices(servicesList)
          setSelectedService(servicesList[0])
        }
      } catch (err) {
        console.error('Erro ao carregar dados de agendamento:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  // Monitora alterações na data selecionada ou fisioterapeuta para buscar conflitos de horários
  useEffect(() => {
    async function fetchBookedSlots() {
      if (!selectedTherapist) return

      try {
        const startOfDay = new Date(selectedYear, selectedMonth, selectedDay, 0, 0, 0, 0).toISOString()
        const endOfDay = new Date(selectedYear, selectedMonth, selectedDay, 23, 59, 59, 999).toISOString()

        const { data: appts } = await supabase
          .from('appointments')
          .select('date, status')
          .eq('therapist_id', selectedTherapist.id)
          .gte('date', startOfDay)
          .lte('date', endOfDay)
          .neq('status', 'canceled')

        setBookedSlots(appts?.map(a => a.date) || [])
      } catch (err) {
        console.error('Erro ao buscar consultas reservadas:', err)
      }
    }

    fetchBookedSlots()
  }, [selectedDay, selectedMonth, selectedYear, selectedTherapist])

  // Atualiza automaticamente o selectedTimeSlot escolhido para o primeiro slot válido disponível
  useEffect(() => {
    const isToday = new Date().getDate() === selectedDay && 
                    new Date().getMonth() === selectedMonth && 
                    new Date().getFullYear() === selectedYear
    
    const now = new Date()

    const firstValidSlot = timeSlots.find(slot => {
      const [slotHour, slotMinute] = slot.split(':').map(Number)
      const isSlotExpired = isToday && (
        slotHour < now.getHours() || 
        (slotHour === now.getHours() && slotMinute <= now.getMinutes())
      )

      const isSlotBooked = bookedSlots.some(bTime => {
        const bDate = new Date(bTime)
        const h = String(bDate.getHours()).padStart(2, '0')
        const m = String(bDate.getMinutes()).padStart(2, '0')
        return `${h}:${m}` === slot
      })

      return !isSlotExpired && !isSlotBooked
    })

    if (firstValidSlot) {
      setSelectedTimeSlot(firstValidSlot)
    } else {
      setSelectedTimeSlot('')
    }
  }, [selectedDay, selectedMonth, selectedYear, bookedSlots])

  // Lógica para gerar os dias do calendário do mês corrente
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const handlePrevMonth = () => {
    let newMonth = currentDate.getMonth() - 1
    let newYear = currentDate.getFullYear()
    if (newMonth < 0) {
      newMonth = 11
      newYear -= 1
    }
    const newDate = new Date(newYear, newMonth, 1)
    setCurrentDate(newDate)
    setSelectedMonth(newMonth)
    setSelectedYear(newYear)
  }

  const handleNextMonth = () => {
    let newMonth = currentDate.getMonth() + 1
    let newYear = currentDate.getFullYear()
    if (newMonth > 11) {
      newMonth = 0
      newYear += 1
    }
    const newDate = new Date(newYear, newMonth, 1)
    setCurrentDate(newDate)
    setSelectedMonth(newMonth)
    setSelectedYear(newYear)
  }

  // Confirma o agendamento no Supabase
  const handleConfirmBooking = async () => {
    if (!currentUser || !selectedTherapist || !selectedService || !selectedTimeSlot || submitting) return

    setSubmitting(true)

    try {
      // 1. Consolida a data e o horário escolhidos em formato ISO
      const [hours, minutes] = selectedTimeSlot.split(':')
      const bookingDate = new Date(selectedYear, selectedMonth, selectedDay)
      bookingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      
      const dateISO = bookingDate.toISOString()

      // 2. Insere na tabela appointments do Supabase
      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: currentUser.id,
          therapist_id: selectedTherapist.id,
          date: dateISO,
          status: 'scheduled',
          service: selectedService.name,
          price: selectedService.price,
          duration_minutes: parseInt(selectedService.duration || '50') || 50,
          notes: selectedService.name
        })

      if (error) throw error

      setBookingSuccess(true)
      
      // 3. Redireciona com feedback visual de sucesso após 2 segundos
      setTimeout(() => {
        router.push('/dashboard/paciente')
      }, 2000)

    } catch (err) {
      console.error('Erro ao salvar agendamento:', err)
      alert('Ocorreu um erro ao realizar seu agendamento. Por favor, tente novamente.')
      setSubmitting(false)
    }
  }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  // Renderizador do Calendário
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear)
    const firstDayIndex = getFirstDayOfMonth(selectedMonth, selectedYear)
    const daysCells = []

    // Células em branco antes do dia 1 do mês
    for (let i = 0; i < firstDayIndex; i++) {
      daysCells.push(<div key={`empty-${i}`} className="py-2"></div>)
    }

    // Células de dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDay === day
      const isToday = new Date().getDate() === day && new Date().getMonth() === selectedMonth && new Date().getFullYear() === selectedYear
      
      // Não permite agendar no passado ou aos domingos
      const dayDate = new Date(selectedYear, selectedMonth, day)
      const isPast = dayDate < new Date(new Date().setHours(0,0,0,0))
      const isSunday = dayDate.getDay() === 0
      const isDisabled = isPast || isSunday

      daysCells.push(
        <button
          key={`day-${day}`}
          disabled={isDisabled}
          onClick={() => setSelectedDay(day)}
          className={`py-2 text-center rounded-full text-xs font-semibold transition-all flex items-center justify-center h-8 w-8 mx-auto ${
            isSelected 
              ? 'bg-[#70518d] text-white font-bold shadow-md scale-110' 
              : isDisabled
                ? 'text-[#795465]/20 cursor-not-allowed'
                : isToday
                  ? 'border border-[#70518d] text-[#70518d] font-bold'
                  : 'text-[#1d1b1f] hover:bg-[#70518d]/10 cursor-pointer'
          }`}
        >
          {day}
        </button>
      )
    }

    return daysCells
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff7fd] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#70518d]" />
          <p className="text-sm font-medium text-[#795465]">Carregando calendário clínico...</p>
        </div>
      </div>
    )
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-[#fff7fd] via-white to-[#fdf4f5] flex flex-col items-center justify-center px-6">
        <div className="bg-white border border-purple-100/40 p-8 rounded-3xl shadow-xl flex flex-col items-center max-w-sm w-full text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-emerald-100 rounded-full blur-2xl pointer-events-none"></div>
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6 animate-bounce">
            <Check className="w-10 h-10" />
          </div>
          <h2 className="font-extrabold text-2xl text-[#1d1b1f] mb-3">Consulta Agendada!</h2>
          <p className="text-sm text-[#795465] leading-relaxed mb-6">
            Seu agendamento foi registrado com sucesso no banco de dados. Estamos ansiosos para te acompanhar no seu cuidado!
          </p>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-[#fff7fd] text-[#70518d] border border-purple-100/40">
            <Sparkles className="w-3.5 h-3.5" />
            REDIRECIONANDO...
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Agendar Consulta - Bella Flora Fisio</title>
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

      <div className="min-h-screen w-full bg-[#fff7fd] font-sans antialiased">
        <div className="relative w-full min-h-screen max-w-md mx-auto bg-[#fff7fd] flex flex-col">

          {/* Header */}
          <header className="bg-white px-5 py-3 border-b border-purple-100/30 flex items-center justify-between shrink-0 sticky top-0 z-50 shadow-sm">
            <Link 
              href="/dashboard/paciente"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-purple-50 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-[#795465]" />
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
                  Agendar Consulta
                </span>
              </div>
            </div>
            <div className="w-8"></div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5 scrollbar-none pb-24">

            {/* Selecione o Serviço */}
            <section>
              <h2 className="text-xs font-bold text-[#70518d] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#70518d] text-base">pregnant_woman</span>
                Selecione o Serviço
              </h2>
              <div className="flex overflow-x-auto gap-3 pb-2 -mx-5 px-5 scrollbar-none">
                {services.map((service) => {
                  const isSelected = selectedService?.id === service.id
                  return (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={`flex-none w-32 h-32 rounded-2xl flex flex-col items-center justify-center p-3 active:scale-95 transition-all border-2 ${
                        isSelected 
                          ? 'bg-[#70518d]/10 text-[#70518d] border-[#70518d] font-bold shadow-md' 
                          : 'bg-white text-[#1d1b1f] border-purple-100/40 hover:border-[#70518d]/50 shadow-sm'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-4xl mb-2 ${isSelected ? 'text-[#70518d]' : 'text-[#70518d]'}`}>
                        {service.icon}
                      </span>
                      <span className="text-[11px] text-center font-bold tracking-tight">{service.name}</span>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Escolha a Data */}
            <section>
              <h2 className="text-xs font-bold text-[#70518d] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#70518d] text-base">calendar_month</span>
                Escolha a Data
              </h2>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100/20">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-[#1d1b1f]">
                    {monthNames[selectedMonth]} {selectedYear}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={handlePrevMonth}
                      className="text-[#795465] p-1.5 hover:bg-purple-50 rounded-full transition-all flex items-center justify-center"
                    >
                      <ChevronLeft className="w-5 h-5 text-[#795465]" />
                    </button>
                    <button 
                      onClick={handleNextMonth}
                      className="text-[#795465] p-1.5 hover:bg-purple-50 rounded-full transition-all flex items-center justify-center"
                    >
                      <ChevronRight className="w-5 h-5 text-[#795465]" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-center mb-2 text-[11px] text-[#795465]/70 font-bold border-b border-purple-100/20 pb-2">
                  {weekdayNames.map((name) => (
                    <div key={name}>{name}</div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  {renderCalendar()}
                </div>
              </div>
            </section>

            {/* Horários Disponíveis */}
            <section>
              <h2 className="text-xs font-bold text-[#70518d] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#70518d] text-base">schedule</span>
                Horários Disponíveis
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {timeSlots.map((slot) => {
                  const isSelected = selectedTimeSlot === slot
                  
                  const isToday = new Date().getDate() === selectedDay && 
                                  new Date().getMonth() === selectedMonth && 
                                  new Date().getFullYear() === selectedYear
                  
                  const [slotHour, slotMinute] = slot.split(':').map(Number)
                  const now = new Date()
                  const isSlotExpired = isToday && (
                    slotHour < now.getHours() || 
                    (slotHour === now.getHours() && slotMinute <= now.getMinutes())
                  )

                  const isSlotBooked = bookedSlots.some(bTime => {
                    const bDate = new Date(bTime)
                    const h = String(bDate.getHours()).padStart(2, '0')
                    const m = String(bDate.getMinutes()).padStart(2, '0')
                    return `${h}:${m}` === slot
                  })

                  const isDisabled = isSlotExpired || isSlotBooked

                  return (
                    <button
                      key={slot}
                      disabled={isDisabled}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`h-12 rounded-2xl border flex items-center justify-center active:scale-95 transition-all text-xs font-bold ${
                        isSelected
                          ? 'bg-[#70518d]/10 text-[#70518d] border-[#70518d] shadow-md font-bold'
                          : isDisabled
                            ? 'bg-purple-50/10 border-purple-100/20 text-[#795465]/30 cursor-not-allowed line-through'
                            : 'bg-white border-purple-100/40 text-[#1d1b1f] hover:border-[#70518d]/50 shadow-sm'
                      }`}
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Profissional Responsável e Resumo */}
            {selectedTherapist && selectedService && (
              <section className="flex flex-col gap-4 animate-in fade-in duration-200">
                <div className="bg-[#70518d]/10 p-4 rounded-2xl flex items-center gap-4 border border-[#70518d]/10">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#70518d]/20">
                    <img 
                      src={selectedTherapist.avatar_url || '/assets/img/dra_beatriz_silva.png'} 
                      alt={selectedTherapist.full_name || 'Fisioterapeuta'} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider">Profissional Responsável</p>
                    <p className="text-sm font-bold text-[#1d1b1f]">Dra. {selectedTherapist.full_name}</p>
                  </div>
                </div>
                
                {selectedService.summary && (
                  <div className="bg-white p-4 rounded-2xl border border-purple-100/20 shadow-sm text-xs text-[#795465] font-semibold leading-relaxed">
                    <p className="font-bold text-[#70518d] mb-1.5 uppercase text-[9px] tracking-wider">Sobre a Especialidade</p>
                    {selectedService.summary}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-4 rounded-2xl border border-purple-100/20 shadow-sm">
                    <span className="material-symbols-outlined text-[#795465] mb-1">spa</span>
                    <p className="text-xs text-[#795465] font-bold">Duração Estimada</p>
                    <p className="text-xs text-[#795465]/70 font-semibold mt-0.5">{selectedService.duration || '50 minutos'}</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-2xl border border-purple-100/20 shadow-sm">
                    <span className="material-symbols-outlined text-[#795465] mb-1">payments</span>
                    <p className="text-xs text-[#70518d] font-bold">Investimento</p>
                    <p className="text-xs text-[#795465]/70 font-semibold mt-0.5">R$ {Number(selectedService.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </section>
            )}

            {/* Confirm Booking Button - inside main content flow */}
            <button 
              disabled={submitting || !selectedTimeSlot || !selectedService}
              onClick={handleConfirmBooking}
              className="w-full h-[52px] rounded-2xl bg-[#70518d] text-white font-bold text-sm flex items-center justify-center shadow-md active:scale-95 transition-all hover:bg-[#573974] disabled:opacity-40 disabled:pointer-events-none mt-1"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Agendando...
                </span>
              ) : !selectedTimeSlot ? (
                'Nenhum horário disponível para hoje'
              ) : (
                'Confirmar Agendamento'
              )}
            </button>

          </main>

          {/* Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 h-[76px] bg-white border-t border-purple-100/30 flex justify-around items-center px-4 pb-safe z-40 select-none max-w-md mx-auto">
            <Link 
              href="/dashboard/paciente" 
              className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
            >
              <span className="material-symbols-outlined text-lg mb-1">home</span>
              <span className="text-[9px] font-semibold">Início</span>
            </Link>
            
            <Link 
              href="/dashboard/paciente/tratamento" 
              className="flex flex-col items-center justify-center text-[#70518d] shrink-0"
            >
              <div className="bg-[#70518d]/10 text-[#70518d] rounded-full px-5 py-1 mb-1">
                <span className="material-symbols-outlined font-bold text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
              </div>
              <span className="text-[9px] font-extrabold">Tratamento</span>
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

