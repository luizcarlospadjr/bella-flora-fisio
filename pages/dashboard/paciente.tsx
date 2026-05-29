import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import DashboardPaciente from '../../components/DashboardPaciente'

export default function PatientDashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [appointment, setAppointment] = useState<any>(null)
  const [painLevel, setPainLevel] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Obtém o usuário logado do Supabase Auth
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
          router.push('/login')
          return
        }

        // 2. Consulta os dados do perfil na tabela public.profiles
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (userProfile) {
          // Se o perfil não for do tipo paciente, redireciona para a rota apropriada
          if (userProfile.role !== 'patient') {
            router.push('/dashboard/fisioterapeuta')
            return
          }
          setProfile(userProfile)
        } else {
          router.push('/escolha-perfil')
          return
        }

        // 3. Consulta a próxima consulta ativa na tabela public.appointments
        // Realiza um join PostgREST com a tabela profiles usando a chave estrangeira do terapeuta
        const { data: nextApp } = await supabase
          .from('appointments')
          .select(`
            id,
            date,
            status,
            notes,
            therapist:profiles!appointments_therapist_id_fkey (
              full_name,
              avatar_url,
              phone
            )
          `)
          .eq('patient_id', user.id)
          .eq('status', 'scheduled')
          .gte('date', new Date().toISOString())
          .order('date', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (nextApp) {
          setAppointment(nextApp)
        }

        // 4. Busca o último nível de dor registrado no chat do paciente
        const { data: latestPainMsg } = await supabase
          .from('chat_messages')
          .select('message_text')
          .eq('sender_id', user.id)
          .like('message_text', '%Nível de dor registrado:%')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (latestPainMsg && latestPainMsg.message_text) {
          const match = latestPainMsg.message_text.match(/Nível de dor registrado:\s*(\d+)/i)
          if (match) {
            setPainLevel(parseInt(match[1]))
          }
        }

      } catch (err) {
        console.error('Erro ao carregar dados do paciente:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff7fd] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#70518d]" />
          <p className="text-sm font-medium text-[#795465]">Acessando sua Área Segura...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardPaciente
      patientName={profile?.full_name || 'Paciente'}
      painLevel={painLevel}
      appointment={appointment}
      onLogout={handleLogout}
    />
  )
}

