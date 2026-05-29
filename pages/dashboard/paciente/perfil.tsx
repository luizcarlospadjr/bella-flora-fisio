import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowLeft, Loader2, Save, User, Phone, Mail, Award, Sparkles, Check, Heart } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'

const PRESET_AVATARS = [
  '/assets/img/mariana_silva.png',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
]

export default function PatientProfilePage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  
  // Form fields
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      try {
        // 1. Obtém o usuário ativo do Supabase Auth
        const { data: { user }, error: authErr } = await supabase.auth.getUser()
        if (authErr || !user) {
          router.push('/login')
          return
        }
        setCurrentUser(user)

        // 2. Consulta o perfil correspondente na tabela public.profiles
        const { data: userProfile, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileErr || !userProfile) {
          router.push('/escolha-perfil')
          return
        }

        setProfile(userProfile)
        setFullName(userProfile.full_name || '')
        setPhone(userProfile.phone || '')
        setSelectedAvatar(userProfile.avatar_url || PRESET_AVATARS[0])

      } catch (err) {
        console.error('Erro ao carregar dados do perfil:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || saving) return

    setSaving(true)
    setSaveSuccess(false)

    try {
      // Atualiza o prontuário de perfil no Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
          avatar_url: selectedAvatar
        })
        .eq('id', currentUser.id)

      if (error) throw error

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)

    } catch (err) {
      console.error('Erro ao salvar perfil:', err)
      alert('Ocorreu um erro ao atualizar seu perfil. Por favor, tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff7fd] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#70518d]" />
          <p className="text-sm font-medium text-[#795465]">Acessando seus dados seguros...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Meu Perfil | Bella Flora Fisio</title>
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
              className="text-[#795465] hover:opacity-80 transition-opacity p-1.5 -ml-1.5 rounded-full active:scale-95 flex items-center justify-center"
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
                  Portal de Saúde
                </span>
              </div>
            </div>
            <div className="w-8"></div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5 scrollbar-none pb-24">
            
            {/* Header Title Section */}
            <section className="flex flex-col gap-1">
              <h2 className="text-xl font-extrabold text-[#1d1b1f]">Meu Perfil</h2>
              <p className="text-[11px] text-[#795465] font-medium">Gerencie suas informações cadastrais e de contato.</p>
            </section>

            {/* Premium Account Card */}
            <section className="bg-gradient-to-br from-[#70518d] to-[#573974] p-5 rounded-2xl shadow-md relative overflow-hidden text-white border border-[#70518d]/30">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-white/40">
                  <img 
                    alt={fullName || 'Paciente'} 
                    className="w-full h-full object-cover" 
                    src={selectedAvatar} 
                  />
                </div>
                <div className="min-w-0">
                  <div className="inline-flex items-center px-2 py-0.5 bg-white/20 rounded-full text-[9px] font-bold text-purple-100 mb-1 backdrop-blur-sm">
                    <Sparkles className="w-3 h-3 mr-1" />
                    PACIENTE ATIVA
                  </div>
                  <h3 className="font-extrabold text-sm leading-tight truncate">{fullName || 'Paciente Bella Flora'}</h3>
                  <p className="text-[10px] text-purple-200/90 font-medium mt-0.5 truncate">{currentUser?.email}</p>
                </div>
              </div>
            </section>

            {/* Main Edit Profile Form */}
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              
              {/* Avatar Selector Grid */}
              <div className="bg-white border border-purple-100/20 p-4 rounded-2xl shadow-sm flex flex-col gap-3">
                <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider">Escolha seu Avatar</label>
                <div className="flex justify-between items-center gap-2 overflow-x-auto pb-1">
                  {PRESET_AVATARS.map((avatar, idx) => {
                    const isSelected = selectedAvatar === avatar
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`relative w-12 h-12 rounded-full overflow-hidden border-2 shrink-0 transition-all ${
                          isSelected ? 'border-[#70518d] scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#70518d]/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white font-bold stroke-[3]" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Inputs Group */}
              <div className="bg-white border border-purple-100/20 p-4 rounded-2xl shadow-sm flex flex-col gap-4">
                
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Nome Completo
                  </label>
                  <input 
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome para o prontuário clínico"
                    className="w-full h-11 px-3 rounded-xl border border-purple-100/40 focus:outline-none focus:ring-2 focus:ring-[#70518d]/10 focus:border-[#70518d] font-semibold text-xs text-[#1d1b1f] placeholder:text-slate-400 transition-all"
                  />
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#70518d] uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    Telefone de Contato
                  </label>
                  <input 
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full h-11 px-3 rounded-xl border border-purple-100/40 focus:outline-none focus:ring-2 focus:ring-[#70518d]/10 focus:border-[#70518d] font-semibold text-xs text-[#1d1b1f] placeholder:text-slate-400 transition-all"
                  />
                </div>

                {/* Email (Read Only) */}
                <div className="flex flex-col gap-1.5 opacity-70">
                  <label className="text-[10px] font-bold text-[#795465] uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    E-mail de Login (Não editável)
                  </label>
                  <div className="w-full h-11 px-3 rounded-xl border border-purple-100/40 bg-slate-50 flex items-center font-semibold text-xs text-slate-500">
                    {currentUser?.email}
                  </div>
                </div>
              </div>

              {/* Licença Pélvica Info */}
              <div className="bg-white border border-purple-100/20 rounded-2xl p-4 flex gap-3.5 items-start shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-[#70518d] shrink-0 border border-purple-100">
                  <Award className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#1d1b1f]">Plataforma Bella Flora Fisio</h4>
                  <p className="text-[10px] text-[#795465] leading-relaxed mt-0.5">
                    Seus dados estão protegidos por criptografia de ponta a ponta e chaves de segurança PostgreSQL (RLS). Apenas sua fisioterapeuta responsável possui acesso ao seu prontuário sob sigilo ético clínico.
                  </p>
                </div>
              </div>

              {/* Save Action Bar */}
              <div className="mt-1">
                {saveSuccess ? (
                  <div 
                    className="w-full h-12 bg-green-600 text-white rounded-xl shadow-md font-bold flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5 stroke-[3]" />
                    Perfil Atualizado!
                  </div>
                ) : (
                  <button 
                    type="submit"
                    disabled={saving}
                    className="w-full h-12 bg-[#70518d] hover:bg-[#573974] text-white rounded-xl shadow-md font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Salvar Alterações</span>
                      </>
                    )}
                  </button>
                )}
              </div>

            </form>
          </main>

          {/* Bottom Navigation */}
          <nav className="absolute bottom-0 left-0 w-full h-[76px] bg-white border-t border-purple-100/30 flex justify-around items-center px-4 pb-safe z-40 select-none">
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
              className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
            >
              <span className="material-symbols-outlined text-lg mb-1">person_search</span>
              <span className="text-[9px] font-semibold">Profissional</span>
            </Link>
            
            <Link 
              href="/dashboard/paciente/perfil" 
              className="flex flex-col items-center justify-center text-[#70518d] shrink-0"
            >
              <div className="bg-[#70518d]/10 text-[#70518d] rounded-full px-5 py-1 mb-1">
                <span className="material-symbols-outlined font-bold text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              </div>
              <span className="text-[9px] font-extrabold">Perfil</span>
            </Link>
          </nav>

        </div>
      </div>
    </>
  )
}
