# 🔑 Usuários e Guia de Teste - Bella Flora Fisio

Este documento contém as credenciais de teste ativas e o passo a passo para você experimentar as diferentes visões (Fisioterapeuta, Paciente e Gestor de Clínica) no seu sistema publicado em produção.

* **URL do Sistema:** [https://bella-flora-fisio.vercel.app/](https://bella-flora-fisio.vercel.app/)

---

## 👥 Perfis de Teste Recomendados

Para testar o fluxo de ponta a ponta (comunicação, prontuários, controle de sessões, prescrição de exercícios e gerenciamento de clínica), recomendamos utilizar as três contas de teste pré-configuradas e homologadas abaixo:

### 1. Perfil Fisioterapeuta
* **E-mail:** `fisioterapeuta@teste.com`
* **Senha:** `123456`
* **Papel:** `therapist` (Fisioterapeuta)
* **O que testar nesta visão:**
  - Visualizar a lista de pacientes ativos na clínica vinculados à sua responsabilidade.
  - Vincular novos pacientes da clínica pendentes de fisioterapeuta responsável.
  - Abrir o prontuário de um paciente, registrar evolução clínica e pontuação de AFA.
  - Prescrever exercícios pélvicos domiciliares para a paciente.
  - Configurar o Plano Clínico na aba "Histórico" (total de sessões, frequência e notas confidenciais).
  - Enviar e responder dúvidas de pacientes via Chat em tempo real.

### 2. Perfil Paciente
* **E-mail:** `paciente_test_novo@gmail.com`
* **Senha:** `BellaFloraFisio2026!`
* **Papel:** `patient` (Paciente)
* **O que testar nesta visão:**
  - Acessar o atalho **"Meu Tratamento"** no dashboard: conferir contagem dinâmica de sessões (com base em evoluções reais do prontuário) e cronograma visual de frequência, comprovando a **privacidade absoluta** das notas confidenciais do prontuário.
  - Acessar a **"Rotina em Casa"** (feed de treinos domiciliares) e visualizar a barra de progresso do dia.
  - Executar e concluir o player de exercícios (ex: *Ponte Pélvica*), retornando à lista e confirmando a marcação verde de **`✓ Feito Hoje`** e o avanço da porcentagem diária de hoje.
  - Acessar a aba **"Profissional"**: filtrar profissionais por chips de especialidade e ver o atalho direto para o chat (liberado apenas para terapeutas que já acompanham o paciente).

### 3. Perfil Gestor (Administrador da Clínica)
* **E-mail:** `gestor@teste.com`
* **Senha:** `123456`
* **Papel:** `admin` (Gestor de Clínica)
* **O que testar nesta visão:**
  - Analisar o faturamento total da clínica gerado dinamicamente com base nas consultas cadastradas.
  - Monitorar a contagem em tempo real da Equipe Clínica (profissionais) e Pacientes ativos.
  - Cadastrar novos serviços clínicos com nome, preço, duração e terapeuta responsável.

---

## 🚀 Como Logar e Testar os 3 Perfis

Como a aplicação está integrada em tempo real ao Supabase Auth, você pode efetuar login diretamente pelas credenciais acima. Siga o roteiro de testes:

1. **Teste da Fisioterapeuta:**
   - Acesse [https://bella-flora-fisio.vercel.app/login](https://bella-flora-fisio.vercel.app/login).
   - Entre com `fisioterapeuta@teste.com` / `123456`.
   - Acesse **Prontuário** -> Selecione Mariana Silva (ou crie nova evolução) e configure o Plano de Tratamento na aba **Histórico**. Salve e veja a confirmação verde em tela.
   - Faça logout.

2. **Teste da Paciente:**
   - Faça login com `paciente_test_novo@gmail.com` / `BellaFloraFisio2026!`.
   - Clique no atalho **Meu Tratamento** e verifique se as sessões e dias da semana correspondem à configuração feita pela Fisioterapeuta. Certifique-se de que a nota confidencial digitada pela fisioterapeuta **não** é apresentada, garantindo segurança e privacidade.
   - Vá para a tela **Rotina em Casa**, clique em "Play" em *Ponte Pélvica*, conclua as sessões e verifique o badge verde de feito hoje na volta.
   - Faça logout.

3. **Teste do Gestor / Admin:**
   - Faça login com `gestor@teste.com` / `123456`.
   - Você será imediatamente direcionado para a central administrativa `/dashboard/admin`!
   - Navegue por `/dashboard/admin/servicos` para verificar o faturamento real e cadastrar novos serviços.

---

## 🛡️ Usuários Adicionais Registrados no Banco
Se você deseja experimentar novas combinações, o banco também conta com:

* **Fisioterapeuta Amanda:** `amanda_test@gmail.com` / `BellaFloraFisio2026!`
