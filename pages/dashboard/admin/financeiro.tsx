import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Heart, ArrowLeft, TrendingUp, DollarSign, Wallet, ShieldCheck, Calendar } from 'lucide-react'

interface TherapistBilling {
  name: string
  sessions: number
  payout: string
  clinicProfit: string
}

const therapistBillings: TherapistBilling[] = [
  {
    name: 'Dra. Ana Costa',
    sessions: 48,
    payout: 'R$ 3.840',
    clinicProfit: 'R$ 2.560'
  },
  {
    name: 'Dra. Beatriz Santos',
    sessions: 32,
    payout: 'R$ 2.400',
    clinicProfit: 'R$ 1.960'
  },
  {
    name: 'Dra. Camila Melo',
    sessions: 24,
    payout: 'R$ 1.920',
    clinicProfit: 'R$ 1.280'
  },
  {
    name: 'Dra. Daniela Lima',
    sessions: 8,
    payout: 'R$ 640',
    clinicProfit: 'R$ 640'
  }
]

export default function AdminFinancial() {
  return (
    <>
      <Head>
        <title>Controle Financeiro | Direção | Bella Flora</title>
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

      <div className="min-h-screen w-full bg-[#fff7fd] font-sans antialiased overflow-x-hidden select-none">
        <div className="relative w-full min-h-screen max-w-md mx-auto bg-[#fff7fd] flex flex-col pb-24">
          
          {/* Header */}
          <header className="bg-white px-5 py-3.5 border-b border-purple-100/30 flex items-center justify-between shrink-0 sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/admin" className="text-[#795465] hover:text-[#70518d] transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="font-extrabold text-sm tracking-tight text-[#70518d]">
                  Controle Financeiro
                </h1>
                <span className="block text-[8px] text-[#795465] font-semibold uppercase tracking-wider">
                  Faturamento e Repasses
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 px-5 py-5 flex flex-col gap-4">
            
            {/* Consolidated Cashflow card */}
            <section className="bg-gradient-to-br from-[#70518d] to-[#573974] p-5 rounded-2xl shadow-md text-white border border-[#70518d]/30 relative overflow-hidden">
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
              <div className="relative z-10">
                <span className="text-[9px] font-bold text-purple-100 uppercase tracking-wider block mb-1">Caixa Geral da Clínica</span>
                <h2 className="font-extrabold text-2xl leading-none">R$ 14.850,00</h2>
                
                <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-purple-200/90 text-[10px] font-semibold block mb-0.5">Total de Repasses (Comissão):</span>
                    <span className="font-bold text-base text-purple-100">R$ 8.800,00</span>
                  </div>
                  <div>
                    <span className="text-purple-200/90 text-[10px] font-semibold block mb-0.5">Lucro Líquido Clínica:</span>
                    <span className="font-bold text-base text-emerald-300">R$ 6.050,00</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Monthly Growth Indicators */}
            <div className="flex gap-2.5 p-3 bg-purple-50 border border-purple-100/30 rounded-xl text-[10px] text-[#795465] font-semibold select-none items-center">
              <TrendingUp className="w-4 h-4 text-[#70518d] shrink-0" />
              <span>O faturamento clínico deste mês está <strong className="text-emerald-700 font-bold">+12% acima</strong> da meta projetada.</span>
            </div>

            {/* Therapist Billings split report */}
            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-[#70518d] uppercase tracking-wider pl-1 select-none">Split de Faturamento</h3>

              <div className="space-y-3">
                {therapistBillings.map((bill, index) => (
                  <div key={index} className="bg-white border border-purple-100/20 p-4 rounded-2xl shadow-sm hover:border-[#70518d]/20 transition-all flex flex-col gap-2.5">
                    <div className="flex justify-between items-center pb-2 border-b border-purple-100/5">
                      <h4 className="font-extrabold text-sm text-[#1d1b1f]">{bill.name}</h4>
                      <span className="text-[10px] font-bold bg-purple-50 text-[#70518d] px-2 py-0.5 rounded-md">
                        {bill.sessions} sessões
                      </span>
                    </div>

                    <div className="grid grid-cols-2 text-[10px] text-[#4b454e]">
                      <div>
                        <span className="text-[#795465] font-semibold block">Repasse (Devido):</span>
                        <span className="font-extrabold text-sm text-[#1d1b1f]">{bill.payout}</span>
                      </div>
                      <div>
                        <span className="text-[#795465] font-semibold block">Lucro Retido (Clínica):</span>
                        <span className="font-extrabold text-sm text-emerald-600">{bill.clinicProfit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SaaS Subscription Info */}
            <section className="bg-white border border-purple-100/20 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <h3 className="text-xs font-bold text-[#70518d] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-purple-100/10">
                <Wallet className="w-4 h-4 text-[#70518d]" />
                Assinatura do Software
              </h3>

              <div className="flex flex-col gap-3 text-xs leading-relaxed text-[#4b454e]">
                <div className="flex justify-between items-center">
                  <span className="text-[#795465] font-bold">Plano Contratado:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-50 text-[#70518d] border border-purple-100/30 font-bold text-[9px] uppercase tracking-wider">
                    Clínica Premium (SaaS)
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#795465] font-bold">Status da Assinatura:</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[9px] uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3" /> Ativa
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#795465] font-bold">Renovação Mensal:</span>
                  <span className="font-bold text-[#1d1b1f] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#795465]" />
                    15 de Junho de 2026
                  </span>
                </div>

                <div className="flex justify-between items-center border-t border-purple-100/10 pt-3">
                  <span className="text-[#795465] font-bold">Licenças de Terapeutas:</span>
                  <span className="font-bold text-[#1d1b1f]">
                    4 / 5 ativas
                  </span>
                </div>
              </div>
            </section>

          </main>

          {/* Admin Bottom Navigation (TabBar) */}
          <nav className="fixed bottom-0 left-0 right-0 h-[76px] bg-white border-t border-purple-100/30 flex justify-around items-center px-4 pb-safe z-40 select-none max-w-md mx-auto">
            <Link 
              href="/dashboard/admin" 
              className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
            >
              <span className="material-symbols-outlined text-lg mb-1">home</span>
              <span className="text-[9px] font-semibold">Início</span>
            </Link>
            
            <Link 
              href="/dashboard/admin/terapeutas" 
              className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
            >
              <span className="material-symbols-outlined text-lg mb-1">engineering</span>
              <span className="text-[9px] font-semibold">Terapeutas</span>
            </Link>

            <Link 
              href="/dashboard/admin/pacientes" 
              className="flex flex-col items-center justify-center text-[#795465] hover:text-[#70518d] shrink-0"
            >
              <span className="material-symbols-outlined text-lg mb-1">badge</span>
              <span className="text-[9px] font-semibold">Pacientes</span>
            </Link>
            
            <Link 
              href="/dashboard/admin/financeiro" 
              className="flex flex-col items-center justify-center text-[#70518d] shrink-0"
            >
              <div className="bg-[#70518d]/10 text-[#70518d] rounded-full px-5 py-1 mb-1">
                <span className="material-symbols-outlined font-bold text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              </div>
              <span className="text-[9px] font-extrabold">Financeiro</span>
            </Link>
          </nav>

        </div>
      </div>
    </>
  )
}
