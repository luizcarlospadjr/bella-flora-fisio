import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    try {
      // 1. Autentica o usuário com o Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // 2. Consulta o perfil do usuário na tabela de perfis
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (profileError || !profile) {
          // Se o perfil não existir ou não tiver role, manda escolher o perfil
          router.push('/escolha-perfil')
          return
        }

        // 3. Redirecionamento baseado no cargo (role)
        if (profile.role === 'therapist') {
          router.push('/dashboard/fisioterapeuta')
        } else {
          router.push('/dashboard/paciente')
        }
      }
    } catch (err: any) {
      console.error('Erro de login:', err)
      setErrorMsg(err.message || 'Credenciais inválidas. Verifique seus dados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Login | Bella Flora Fisio</title>
        <meta name="description" content="Acesse seu painel clínico ou área do paciente no Bella Flora Fisio." />
      </Head>

      <div className="min-h-screen bg-[#fff7fd] text-[#1d1b1f] flex items-center justify-center p-4">
        <main className="w-full max-w-md bg-white border border-[#cdc3cf]/60 rounded-3xl p-8 shadow-[0px_4px_24px_rgba(112,81,141,0.06)] flex flex-col relative overflow-hidden">
          {/* Logo Section */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="h-12 w-12 rounded-full bg-[#f0dbff] flex items-center justify-center mb-3 text-[#70518d] shadow-sm">
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
            </div>
            <h1 className="font-display font-bold text-2xl tracking-tight text-[#70518d]">
              Bella Flora <span className="text-[#795465]">Fisio</span>
            </h1>
            <p className="text-xs font-semibold text-[#795465]/80 uppercase tracking-wider mt-0.5">
              Fisioterapia Pélvica
            </p>
            <h2 className="text-sm font-medium text-[#4b454e] mt-4">Bem-vindo de volta</h2>
          </div>

          {/* Form Section */}
          <form onSubmit={handleLogin} className="space-y-6">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#1d1b1f] mb-1.5 pl-1" htmlFor="email">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#cdc3cf] transition-colors" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="h-12 w-full bg-[#fff7fd]/60 border border-[#cdc3cf] rounded-xl pl-12 pr-4 text-sm text-[#1d1b1f] focus:outline-none focus:ring-2 focus:ring-[#d8b4f8] focus:border-[#70518d] transition-all placeholder:text-[#cdc3cf] shadow-inner"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5 pl-1">
                <label className="text-xs font-semibold text-[#1d1b1f]" htmlFor="password">
                  Senha
                </label>
                <Link
                  href="#"
                  className="text-[11px] font-bold text-[#70518d] hover:text-[#573974] transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#cdc3cf] transition-colors" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 w-full bg-[#fff7fd]/60 border border-[#cdc3cf] rounded-xl pl-12 pr-12 text-sm text-[#1d1b1f] focus:outline-none focus:ring-2 focus:ring-[#d8b4f8] focus:border-[#70518d] transition-all placeholder:text-[#cdc3cf] shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#cdc3cf] hover:text-[#70518d] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full bg-[#70518d] text-white font-bold text-sm rounded-xl flex items-center justify-center shadow-md active:scale-[0.98] transition-all hover:bg-[#573974] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Footer Section */}
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="w-full flex items-center gap-3">
              <div className="h-[1px] bg-[#cdc3cf]/40 flex-1"></div>
              <span className="text-[10px] font-bold text-[#795465] uppercase tracking-wider">ou</span>
              <div className="h-[1px] bg-[#cdc3cf]/40 flex-1"></div>
            </div>

            <p className="text-xs text-[#4b454e]">
              Ainda não tem conta?{' '}
              <Link href="/register" className="font-bold text-[#70518d] hover:underline ml-1">
                Criar conta
              </Link>
            </p>
          </div>
        </main>
      </div>
    </>
  )
}
