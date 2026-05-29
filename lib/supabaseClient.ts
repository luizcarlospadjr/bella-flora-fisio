import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('sua-url-aqui') || supabaseAnonKey.includes('seu-anon-key-aqui')) {
  console.warn(
    'AVISO: O Supabase está rodando com valores de marcação de posição (placeholders). Por favor, configure as variáveis reais no seu arquivo .env.local para habilitar a conexão do banco de dados e autenticação.'
  )
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
