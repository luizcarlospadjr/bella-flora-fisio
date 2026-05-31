import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Mail, Lock, User, Phone, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function Register() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      // 1. Cria a conta no Supabase Auth com metadados adicionais
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
          },
        },
      })

      if (error) throw error

      if (data.user) {
        // Se a conta for criada com sucesso, redireciona para a escolha de perfil
        setSuccessMsg('Cadastro realizado com sucesso! Redirecionando...')
        setTimeout(() => {
          router.push('/escolha-perfil')
        }, 1500)
      }
    } catch (err: any) {
      console.error('Erro de cadastro:', err)
      setErrorMsg(err.message || 'Falha ao criar conta. Verifique os dados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Criar Conta | Bella Flora Fisio</title>
        <meta name="description" content="Cadastre-se na plataforma Bella Flora Fisio." />
      </Head>

      <div className="min-h-screen bg-[#fff7fd] text-[#1d1b1f] flex items-center justify-center p-4">
        <main className="w-full max-w-md bg-white border border-[#cdc3cf]/60 rounded-3xl p-8 shadow-[0px_4px_24px_rgba(112,81,141,0.06)] flex flex-col relative overflow-hidden">
          {/* Logo Section */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="h-11 w-11 rounded-full bg-[#f0dbff] flex items-center justify-center mb-3 text-[#70518d] shadow-sm">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
            </div>
            <h1 className="font-display font-bold text-xl tracking-tight text-[#70518d]">
              Bella Flora <span className="text-[#795465]">Fisio</span>
            </h1>
            <p className="text-[10px] font-bold text-[#795465]/80 uppercase tracking-wider mt-0.5">
              Fisioterapia Pélvica
            </p>
            <h2 className="text-sm font-medium text-[#4b454e] mt-3">Criar sua conta</h2>
          </div>

          {/* Form Section */}
          <form onSubmit={handleRegister} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>{successMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#1d1b1f] mb-1 pl-1" htmlFor="fullName">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#cdc3cf]" />
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="h-11 w-full bg-[#fff7fd]/60 border border-[#cdc3cf] rounded-xl pl-11 pr-4 text-sm text-[#1d1b1f] focus:outline-none focus:ring-2 focus:ring-[#d8b4f8] focus:border-[#70518d] transition-all placeholder:text-[#cdc3cf]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1d1b1f] mb-1 pl-1" htmlFor="phone">
                Celular / WhatsApp
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#cdc3cf]" />
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 90000-0000"
                  className="h-11 w-full bg-[#fff7fd]/60 border border-[#cdc3cf] rounded-xl pl-11 pr-4 text-sm text-[#1d1b1f] focus:outline-none focus:ring-2 focus:ring-[#d8b4f8] focus:border-[#70518d] transition-all placeholder:text-[#cdc3cf]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1d1b1f] mb-1 pl-1" htmlFor="email">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#cdc3cf]" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="h-11 w-full bg-[#fff7fd]/60 border border-[#cdc3cf] rounded-xl pl-11 pr-4 text-sm text-[#1d1b1f] focus:outline-none focus:ring-2 focus:ring-[#d8b4f8] focus:border-[#70518d] transition-all placeholder:text-[#cdc3cf]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1d1b1f] mb-1 pl-1" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#cdc3cf]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="h-11 w-full bg-[#fff7fd]/60 border border-[#cdc3cf] rounded-xl pl-11 pr-11 text-sm text-[#1d1b1f] focus:outline-none focus:ring-2 focus:ring-[#d8b4f8] focus:border-[#70518d] transition-all placeholder:text-[#cdc3cf]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#cdc3cf] hover:text-[#70518d] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full bg-[#70518d] text-white font-bold text-sm rounded-xl flex items-center justify-center shadow-md active:scale-[0.98] transition-all hover:bg-[#573974] disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cadastrando...
                </span>
              ) : (
                'Criar Conta'
              )}
            </button>
          </form>

          {/* Footer Section */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="w-full flex items-center gap-3">
              <div className="h-[1px] bg-[#cdc3cf]/40 flex-1"></div>
              <span className="text-[10px] font-bold text-[#795465] uppercase tracking-wider">ou</span>
              <div className="h-[1px] bg-[#cdc3cf]/40 flex-1"></div>
            </div>

            <p className="text-xs text-[#4b454e]">
              Já tem conta?{' '}
              <Link href="/login" className="font-bold text-[#70518d] hover:underline ml-1">
                Fazer login
              </Link>
            </p>
          </div>
        </main>
      </div>
    </>
  )
}
