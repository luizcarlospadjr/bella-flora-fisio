import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { 
  Activity, 
  Calendar, 
  MessageSquare, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp
} from 'lucide-react'

export default function Home() {
  return (
    <>
      <Head>
        <title>Bella Flora Fisio - Plataforma de Reabilitação Pélvica Premium</title>
        <meta name="description" content="Uma plataforma médica premium que conecta pacientes e fisioterapeutas em tempo real. Monitoramento ativo de dor e prescrição de exercícios." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-[#fff7fd] to-[#f9f1f7] flex flex-col font-sans">
        
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-purple-100/30 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#70518d] to-[#573974] flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-[#70518d]">
                  Bella Flora <span className="text-[#795465] font-light">Fisio</span>
                </span>
                <span className="block text-[9px] text-[#795465] font-semibold uppercase tracking-wider -mt-1">
                  Saúde Pélvica & Reabilitação
                </span>
              </div>
            </div>
            
            <Link 
              href="/escolha-perfil" 
              className="bg-[#70518d] hover:bg-[#573974] text-white font-semibold text-sm px-6 py-2.5 rounded-full shadow-sm hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center gap-2"
            >
              Iniciar Demonstração
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 max-w-6xl mx-auto px-6 py-12 md:py-20 w-full flex flex-col gap-16 md:gap-24">
          
          <section className="text-center flex flex-col items-center gap-6 max-w-3xl mx-auto">
            <span className="bg-[#70518d]/10 text-[#70518d] text-xs font-bold tracking-wider uppercase px-4 py-1.5 rounded-full">
              Tecnologia & Acolhimento Clínico
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#70518d] leading-tight">
              A evolução do cuidado em <span className="text-[#795465]">Fisioterapia Pélvica</span>
            </h1>
            <p className="text-slate-600 text-lg md:text-xl font-normal leading-relaxed max-w-2xl">
              Uma plataforma médica premium que conecta pacientes e fisioterapeutas em tempo real. Cuidado contínuo, monitoramento ativo de dor e prescrição interativa de exercícios para uma reabilitação segura e acolhedora.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
              <Link 
                href="/login?role=patient" 
                className="bg-[#70518d] hover:bg-[#573974] text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-purple-200/50 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-3"
              >
                <Users className="w-5 h-5" />
                Área do Paciente
              </Link>
              <Link 
                href="/login?role=therapist" 
                className="bg-white text-[#70518d] border border-purple-100 font-bold px-8 py-4 rounded-2xl shadow-md hover:bg-purple-50/50 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-3"
              >
                <Activity className="w-5 h-5" />
                Portal do Fisioterapeuta
              </Link>
            </div>
          </section>

          {/* Destaque Comercial: Telemetria de Dor */}
          <section className="relative rounded-3xl overflow-hidden bg-white p-8 md:p-12 shadow-xl border border-purple-100/20 flex flex-col md:flex-row items-center gap-12">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100/30 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex-1 flex flex-col gap-4">
              <span className="text-[#795465] font-bold text-sm tracking-wide uppercase">
                Diferencial Exclusivo
              </span>
              <h2 className="text-3xl font-extrabold text-[#70518d] leading-snug">
                Telemetria de Dor e Progresso Diário
              </h2>
              <p className="text-slate-600 leading-relaxed text-base">
                Nossa tecnologia de conexão instantânea permite que o paciente registre seus níveis de desconforto de forma extremamente simples no celular. O fisioterapeuta visualiza o gráfico de evolução no prontuário imediatamente, ajustando o plano de tratamento antes mesmo do próximo atendimento clínico.
              </p>
              
              <div className="flex flex-col gap-3 mt-2">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#795465]" />
                  <span className="font-semibold text-sm text-slate-700">Decisões clínicas baseadas em dados diários reais</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#795465]" />
                  <span className="font-semibold text-sm text-slate-700">Menor taxa de abandono do tratamento em casa</span>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full max-w-md bg-[#f3ecf2]/50 p-6 rounded-2xl border border-purple-100/30 flex flex-col gap-6 relative">
              {/* Simulador Visual do Produto */}
              <div className="flex items-center justify-between pb-4 border-b border-[#f3ecf2]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#70518d]/10 flex items-center justify-center text-[#70518d]">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Paciente Enviou Telemetria</p>
                    <p className="font-bold text-sm text-[#70518d]">Nível de Dor: 8/10</p>
                  </div>
                </div>
                <span className="bg-[#795465]/10 text-[#795465] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Sincronizado
                </span>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-100/20 flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span>Acompanhamento no Prontuário</span>
                  <span className="text-[#70518d]">Dra. Ana Costa</span>
                </div>
                <div className="h-4 bg-purple-50 rounded-full overflow-hidden flex">
                  <div className="h-full bg-[#70518d] rounded-full transition-all duration-500" style={{ width: '80%' }}></div>
                </div>
                <p className="text-xs text-slate-500 italic leading-relaxed">
                  "A dor da Mariana subiu para 8 hoje. O plano de exercícios em casa foi reduzido automaticamente para evitar sobrecarga."
                </p>
              </div>
            </div>
          </section>

          {/* Grid de Funcionalidades Principais */}
          <section className="flex flex-col gap-12">
            <div className="text-center flex flex-col gap-3 max-w-2xl mx-auto">
              <h2 className="text-3xl font-extrabold text-[#70518d]">
                Tudo o que sua reabilitação precisa
              </h2>
              <p className="text-slate-500 text-base">
                Um produto desenhado nos mínimos detalhes para oferecer conforto ao paciente e precisão ao profissional de saúde.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100/20 hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4">
                <div className="w-12 h-12 bg-[#70518d]/10 rounded-xl flex items-center justify-center text-[#70518d]">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#70518d]">Exercícios Gamificados</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Vídeos explicativos e cronômetro interativo guiam o paciente na execução correta de cada contração e alongamento pélvico na sua própria casa.
                </p>
              </div>
              
              {/* Card 2 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100/20 hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4">
                <div className="w-12 h-12 bg-[#70518d]/10 rounded-xl flex items-center justify-center text-[#70518d]">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#70518d]">Prontuário Livre de Papel</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Fisioterapeutas prescrevem planos de tratamento, editam evoluções clínicas e anexam documentos em um sistema de prontuário eletrônico unificado e limpo.
                </p>
              </div>
              
              {/* Card 3 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100/20 hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4">
                <div className="w-12 h-12 bg-[#70518d]/10 rounded-xl flex items-center justify-center text-[#70518d]">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#70518d]">Agenda Dinâmica</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Agendamento integrado de consultas presenciais e online, com envio automático de alertas, gerenciamento de reposições e painel de repasses.
                </p>
              </div>
            </div>
          </section>

          {/* Banner de Chamada para Ação Final */}
          <section className="bg-[#70518d] text-white rounded-3xl p-8 md:p-12 text-center flex flex-col items-center gap-6 shadow-xl relative overflow-hidden">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <h2 className="text-3xl md:text-4xl font-extrabold max-w-xl leading-tight">
              Pronto para vivenciar a experiência completa?
            </h2>
            <p className="text-purple-100 text-sm md:text-base max-w-lg leading-relaxed">
              Experimente agora mesmo o fluxo interativo completo de ponta a ponta simulando as telas reais de paciente e fisioterapeuta trabalhando juntos.
            </p>
            
            <Link 
              href="/escolha-perfil" 
              className="bg-white text-[#70518d] font-bold px-8 py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-lg flex items-center gap-2 mt-2"
            >
              Iniciar Demonstração do Produto
              <ArrowRight className="w-5 h-5" />
            </Link>
          </section>

        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-purple-100/30 py-8 text-center text-xs text-slate-500 px-6 mt-12">
          <p className="max-w-md mx-auto leading-relaxed">
            &copy; {new Date().getFullYear()} Bella Flora Fisio. Todos os direitos reservados. Projetado para uma experiência médica humanizada, ética e acolhedora.
          </p>
        </footer>

      </div>
    </>
  )
}
