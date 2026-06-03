const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim() : '';
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Supabase environment variables not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  try {
    // Authenticate first to satisfy RLS "Permitir leitura de perfis por qualquer usuário autenticado"
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: 'gestor@teste.com',
      password: '123456'
    });

    if (authError) {
      console.warn('Warning: Authentication failed, attempting anonymous query:', authError.message);
    }

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) throw error;

    if (profiles && profiles.length > 0) {
      console.log('Colunas disponíveis em profiles:', Object.keys(profiles[0]));
    }

    const therapists = profiles.filter(p => p.role === 'therapist');
    const patients = profiles.filter(p => p.role === 'patient');

    console.log('\n===== DADOS DETALHADOS DOS FISIOTERAPEUTAS =====\n');
    therapists.forEach((t, i) => {
      console.log(`Fisioterapeuta #${i+1}: ${t.full_name || 'Sem nome'}`);
      console.log(`  - Cadastrado em: ${t.created_at ? new Date(t.created_at).toLocaleString('pt-BR') : 'N/A'}`);
      console.log(`  - Especialidade: ${t.specialty || 'Não cadastrada'}`);
      console.log(`  - Formação: ${t.education || 'Não cadastrada'}`);
      console.log(`  - Tempo de Atuação/Experiência: ${t.experience || 'Não cadastrado'}`);
      console.log(`  - Cursos/Certificados: ${t.courses || 'Nenhum curso cadastrado'}`);
      console.log(`  - Biografia/Sobre: ${t.bio || 'Sem biografia'}`);
      console.log('--------------------------------------------------\n');
    });
    console.log('\n===========================================\n');
  } catch (err) {
    console.error('Erro ao consultar banco de dados:', err);
  }
}

main();
