# 🔑 Usuários e Guia de Teste - Bella Flora Fisio

Este documento contém as credenciais de teste sugeridas e o passo a passo para você experimentar as diferentes visões (Fisioterapeuta, Paciente e Gestor de Clínica) no seu sistema publicado em produção.

* **URL do Sistema:** [https://bella-flora-fisio.vercel.app/](https://bella-flora-fisio.vercel.app/)

---

## 👥 Perfis de Teste Recomendados

Para testar o fluxo de ponta a ponta (comunicação, prontuários, prescrição de exercícios e gerenciamento de clínica), recomendamos utilizar ou cadastrar três contas separadas:

### 1. Perfil Fisioterapeuta
* **E-mail Sugerido:** `fisioterapeuta@teste.com`
* **Senha Sugerida:** `123456` *(ou qualquer senha com mais de 6 caracteres)*
* **Papel:** `therapist` (Fisioterapeuta)
* **O que testar nesta visão:**
  - Visualizar a lista de pacientes ativos na clínica.
  - Abrir o prontuário de um paciente, registrar evolução clínica e pontuação de AFA.
  - Prescrever exercícios pélvicos personalizados.
  - Acessar o chat e enviar mensagens com orientações para o paciente.

### 2. Perfil Paciente
* **E-mail Sugerido:** `paciente@teste.com`
* **Senha Sugerida:** `123456`
* **Papel:** `patient` (Paciente)
* **O que testar nesta visão:**
  - Acessar a agenda de consultas pélvicas.
  - Visualizar o plano de tratamento e a lista de exercícios para casa.
  - Executar um exercício prescrito (com contador de tempo dinâmico e micro-animações).
  - Enviar mensagens e dúvidas no chat para a fisioterapeuta.

### 3. Perfil Gestor (Administrador da Clínica)
* **E-mail Sugerido:** `gestor@teste.com`
* **Senha Sugerida:** `123456`
* **Papel:** `admin` (Gestor de Clínica)
* **O que testar nesta visão:**
  - Analisar o faturamento total e metas de crescimento da clínica.
  - Visualizar a equipe de profissionais ativos (fisioterapeutas).
  - Consultar alertas importantes de lotação de agenda e métricas de sessões.
  - Gerenciar atalhos de equipe, diretórios de pacientes e financeiro geral.

---

## 🚀 Como Cadastrar e Testar os 3 Perfis

Como a aplicação está integrada em tempo real ao Supabase Auth, você pode criar essas contas diretamente pela interface visual em segundos. Siga o roteiro:

1. **Acesse a Página de Cadastro:**
   Abra o link [https://bella-flora-fisio.vercel.app/register](https://bella-flora-fisio.vercel.app/register) no seu navegador.
   
2. **Crie a Fisioterapeuta:**
   - Preencha com o e-mail `fisioterapeuta@teste.com` e a senha `123456`.
   - Escolha a opção **"Fisioterapeuta"** no seletor de cargo.
   - Clique em **Cadastrar**. Você será redirecionado para o onboarding clínico.

3. **Crie o Paciente:**
   - Faça logout (ou abra uma **aba anônima** no navegador).
   - Acesse novamente [https://bella-flora-fisio.vercel.app/register](https://bella-flora-fisio.vercel.app/register).
   - Preencha com o e-mail `paciente@teste.com` e a senha `123456`.
   - Escolha a opção **"Paciente"** no seletor e conclua.

4. **Crie o Gestor / Admin:**
   - Abra mais uma aba anônima (ou faça logout).
   - Acesse [https://bella-flora-fisio.vercel.app/register](https://bella-flora-fisio.vercel.app/register).
   - Preencha com o e-mail `gestor@teste.com` e a senha `123456`.
   - Clique em **Cadastrar**. Na tela de **Escolha de Perfil**, clique no botão **"Sou Gestor de Clínica"**.
   - Você será imediatamente direcionado para a central administrativa `/dashboard/admin`!

5. **Experimente o Middleware de Segurança:**
   - Tente entrar na rota `/dashboard/admin` usando a conta de Paciente ou Fisioterapeuta.
   - O Middleware da aplicação identificará que o papel não é autorizado e redirecionará você de volta com total segurança para seu painel correto!

---

## 🛡️ Usuários Atuais Registrados
Se você deseja utilizar as contas criadas pelo subagente nos testes de homologação automatizados, a conta ativa no banco de dados de produção é:

| Nome do Usuário | E-mail | Cargo (Papel) |
| :--- | :--- | :--- |
| **Dra. Doutora Amanda** | `amanda_test@gmail.com` | Fisioterapeuta (`therapist`) |

*(Nota: Como o e-mail `amanda_test@gmail.com` foi confirmado pelo painel administrativo durante os testes internos, você pode usar essa conta ou criar novas contas utilizando qualquer e-mail no fluxo acima para simular novas clínicas e pacientes).*

