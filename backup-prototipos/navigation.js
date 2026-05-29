// navigation.js - Controle de Navegação Global Bella Flora Fisio
function initNavigation() {
    const path = window.location.pathname;
    const pageName = path.split('/').pop();
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role') || localStorage.getItem('user_role') || 'patient';

    console.warn(`[Navigation] Carregado na página: ${pageName}, Perfil: ${role}, Path: ${path}`);

    // Salvar role no localStorage para persistir entre páginas
    if (urlParams.get('role')) {
        localStorage.setItem('user_role', role);
    }

    // Auxiliar: navegar preservando role
    function nav(url) {
        window.location.href = url + (url.includes('?') ? '&' : '?') + 'role=' + role;
    }

    // --- 1. Redirecionamento da Splash Screen ---
    if (pageName === 'splash_screen.html' || pageName === '') {
        setTimeout(() => { window.location.href = 'escolha_de_perfil.html'; }, 2000);
        return;
    }

    // --- 2. Escolha de Perfil ---
    if (pageName === 'escolha_de_perfil.html') {
        document.querySelectorAll('button').forEach(btn => {
            const text = btn.textContent.trim().toLowerCase();
            if (text.includes('paciente')) {
                btn.addEventListener('click', () => {
                    localStorage.setItem('user_role', 'patient');
                    window.location.href = 'login.html?role=patient';
                });
            } else if (text.includes('fisioterapeuta')) {
                btn.addEventListener('click', () => {
                    localStorage.setItem('user_role', 'therapist');
                    window.location.href = 'login.html?role=therapist';
                });
            }
        });
        return;
    }

    // --- 3. Página de Login ---
    if (pageName === 'login.html') {
        const buttons = Array.from(document.querySelectorAll('button'));
        const loginBtn = buttons.find(btn => btn.textContent.trim().toLowerCase() === 'entrar');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetRole = urlParams.get('role') || 'patient';
                localStorage.setItem('user_role', targetRole);
                if (targetRole === 'therapist') {
                    window.location.href = 'home_fisioterapeuta.html?role=therapist';
                } else {
                    window.location.href = 'home_paciente.html?role=patient';
                }
            });
        }
        // Toggle de visibilidade da senha
        const togglePasswordBtn = buttons.find(btn => {
            const icon = btn.querySelector('.material-symbols-outlined');
            return icon && (icon.textContent.trim() === 'visibility_off' || icon.textContent.trim() === 'visibility');
        });
        const passwordInput = document.getElementById('password');
        if (togglePasswordBtn && passwordInput) {
            togglePasswordBtn.addEventListener('click', () => {
                const icon = togglePasswordBtn.querySelector('.material-symbols-outlined');
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    if (icon) icon.textContent = 'visibility';
                } else {
                    passwordInput.type = 'password';
                    if (icon) icon.textContent = 'visibility_off';
                }
            });
        }
        return;
    }

    // =====================================================================
    // 4. HANDLERS ESPECÍFICOS POR PÁGINA (todas as funcionalidades)
    // =====================================================================

    // --- HOME DO PACIENTE ---
    if (pageName === 'home_paciente.html') {
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;
            const ariaLabel = button.getAttribute('aria-label') || '';
            const spanText = button.querySelector('.material-symbols-outlined')?.textContent.trim() || '';
            const buttonText = button.textContent.trim();

            if (ariaLabel === 'Chat with doctor' || spanText === 'forum') {
                e.preventDefault(); e.stopPropagation();
                nav('chat.html');
            } else if (buttonText.includes('Agendar') || spanText === 'add_circle') {
                e.preventDefault(); e.stopPropagation();
                nav('agendamento_de_consulta_padronizado.html');
            }
        });
    }

    // --- HOME DO FISIOTERAPEUTA ---
    if (pageName === 'home_fisioterapeuta.html') {
        document.querySelectorAll('main section div.cursor-pointer, main section div.flex-row.cursor-pointer').forEach(card => {
            card.addEventListener('click', () => nav('pronturio_-_histrico_com_edio_livre.html'));
        });
    }

    // --- MINHA AGENDA PACIENTE ---
    if (pageName === 'minha_agenda_paciente.html') {
        wireButtonsByText({
            'marcar': 'agendamento_de_consulta_padronizado.html',
            'nova consulta': 'agendamento_de_consulta_padronizado.html',
            'agendar': 'agendamento_de_consulta_padronizado.html',
        });
        // Tornar cards de consulta clicáveis
        document.querySelectorAll('main div[class*="rounded"]').forEach(card => {
            const icon = card.querySelector('.material-symbols-outlined');
            if (icon && icon.textContent.trim() === 'chevron_right') {
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => nav('agendamento_de_reposio_paciente.html'));
            }
        });
    }

    // --- AGENDAMENTO DE CONSULTA ---
    if (pageName === 'agendamento_de_consulta_padronizado.html') {
        // Tornar os serviços selecionáveis visualmente
        const serviceButtons = document.querySelectorAll('main button');
        serviceButtons.forEach(btn => {
            const text = btn.textContent.trim().toLowerCase();
            if (['massoterapia', 'acupuntura', 'pélvica', 'pilates'].some(s => text.includes(s))) {
                btn.addEventListener('click', () => {
                    serviceButtons.forEach(b => b.classList.remove('ring-2', 'ring-primary'));
                    btn.classList.add('ring-2', 'ring-primary');
                });
            }
        });
        // Tornar slots de horário selecionáveis
        document.querySelectorAll('button').forEach(btn => {
            if (/^\d{2}:\d{2}$/.test(btn.textContent.trim())) {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('button').forEach(b => {
                        if (/^\d{2}:\d{2}$/.test(b.textContent.trim())) {
                            b.classList.remove('bg-primary', 'text-on-primary');
                            b.classList.add('bg-surface-container-low', 'text-on-surface');
                        }
                    });
                    btn.classList.remove('bg-surface-container-low', 'text-on-surface');
                    btn.classList.add('bg-primary', 'text-on-primary');
                });
            }
        });
        // Botão Confirmar Agendamento
        wireButtonsByText({
            'confirmar': null // handled below
        });
        const allBtns = Array.from(document.querySelectorAll('button'));
        const confirmBtn = allBtns.find(b => b.textContent.toLowerCase().includes('confirmar'));
        if (confirmBtn) {
            confirmBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Sincronizar com o banco de dados se disponível
                if (window.BellaFloraSync) {
                    window.BellaFloraSync.bookAppointment({
                        patientName: 'Mariana Costa',
                        treatment: 'Fisioterapia Pélvica',
                        timeSlot: '14:00',
                        date: '25/11/2023'
                    });
                }
                // Feedback visual
                confirmBtn.textContent = '✓ Consulta Agendada!';
                confirmBtn.classList.add('bg-tertiary', 'text-on-tertiary');
                setTimeout(() => nav('minha_agenda_paciente.html'), 1500);
            });
        }
    }

    // --- PERFIL DO PACIENTE ---
    if (pageName === 'perfil_do_paciente.html') {
        wireButtonsByText({
            'avaliações': 'plano_de_tratamento_paciente.html',
            'planos de tratamento': 'plano_de_tratamento_paciente.html',
            'notificações': 'notificaes.html',
            'sair': null
        });
        // Botão Sair da Conta
        const sairBtn = Array.from(document.querySelectorAll('button')).find(b => 
            b.textContent.toLowerCase().includes('sair'));
        if (sairBtn) {
            sairBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('user_role');
                window.location.href = 'escolha_de_perfil.html';
            });
        }
    }

    // --- PERFIL DA FISIOTERAPEUTA (VISÃO DO PACIENTE) ---
    if (pageName === 'perfil_da_fisioterapeuta_paciente_-_padronizado.html') {
        wireButtonsByText({
            'enviar mensagem': 'chat.html',
            'ver agenda': 'agendamento_de_consulta_padronizado.html',
            'mensagem': 'chat.html',
            'agenda': 'agendamento_de_consulta_padronizado.html',
        });
    }

    // --- PERFIL DO FISIOTERAPEUTA (PRÓPRIO) ---
    if (pageName === 'perfil_do_fisioterapeuta.html') {
        wireButtonsByText({
            'ver histórico': 'histrico_de_repasses_fisioterapeuta.html',
            'histórico': 'histrico_de_repasses_fisioterapeuta.html',
            'mensagens': 'chat_premium_-_dra_ana_costa.html',
        });
        // Botão Sair da Conta
        const sairBtn = Array.from(document.querySelectorAll('button')).find(b => 
            b.textContent.toLowerCase().includes('sair'));
        if (sairBtn) {
            sairBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('user_role');
                window.location.href = 'escolha_de_perfil.html';
            });
        }
    }

    // --- NOTIFICAÇÕES ---
    if (pageName === 'notificaes.html') {
        // Tornar cards de notificação clicáveis
        document.querySelectorAll('main div[class*="bg-surface"]').forEach(card => {
            card.style.cursor = 'pointer';
            const text = card.textContent.toLowerCase();
            card.addEventListener('click', () => {
                if (text.includes('consulta') || text.includes('agenda')) {
                    nav(role === 'therapist' ? 'index.html' : 'minha_agenda_paciente.html');
                } else if (text.includes('mensagem') || text.includes('chat')) {
                    nav(role === 'therapist' ? 'chat_premium_-_dra_ana_costa.html' : 'chat.html');
                } else if (text.includes('documento') || text.includes('prontuário')) {
                    nav('pronturio_-_histrico_com_edio_livre.html');
                } else {
                    nav(role === 'therapist' ? 'home_fisioterapeuta.html' : 'home_paciente.html');
                }
            });
        });
    }

    // --- PLANO DE TRATAMENTO (PACIENTE) ---
    if (pageName === 'plano_de_tratamento_paciente.html') {
        // Clique em qualquer card de exercício leva aos detalhes
        document.querySelectorAll('main div[class*="bg-surface"]').forEach(ex => {
            if (ex.querySelector('.material-symbols-outlined')) {
                ex.style.cursor = 'pointer';
                ex.addEventListener('click', () => nav('detalhes_do_exerccio_-_fluxo_de_concluso_dinmico.html'));
            }
        });
    }

    // --- PLANO DE TRATAMENTO (FISIOTERAPEUTA) ---
    if (pageName === 'plano_de_tratamento_fisioterapeuta.html') {
        const salvarBtn = Array.from(document.querySelectorAll('button')).find(b => 
            b.textContent.toLowerCase().includes('salvar') || b.textContent.toLowerCase().includes('publicar'));
        if (salvarBtn) {
            salvarBtn.addEventListener('click', (e) => {
                e.preventDefault();
                salvarBtn.textContent = '✓ Plano Salvo com Sucesso!';
                salvarBtn.classList.add('bg-tertiary', 'text-on-tertiary');
                setTimeout(() => nav('home_fisioterapeuta.html'), 1500);
            });
        }
    }

    // --- PRONTUÁRIO (TODAS AS VARIAÇÕES) ---
    if (pageName.includes('pronturio')) {
        // Conectar tabs do prontuário
        const allButtons = Array.from(document.querySelectorAll('button, a'));
        allButtons.forEach(btn => {
            const text = btn.textContent.trim().toLowerCase();
            if (text === 'histórico' || text === 'histórico') {
                btn.style.cursor = 'pointer';
                btn.addEventListener('click', (e) => { e.preventDefault(); nav('pronturio_-_histrico_com_edio_livre.html'); });
            } else if (text === 'documentos') {
                btn.style.cursor = 'pointer';
                btn.addEventListener('click', (e) => { e.preventDefault(); nav('pronturio_-_confirmao_de_excluso_de_documento.html'); });
            } else if (text === 'evolução') {
                btn.style.cursor = 'pointer';
                btn.addEventListener('click', (e) => { e.preventDefault(); nav('evoluo_do_paciente_-_sesso_10_editvel.html'); });
            } else if (text === 'para casa') {
                btn.style.cursor = 'pointer';
                btn.addEventListener('click', (e) => { e.preventDefault(); nav('pronturio_-_para_casa_dinmico_com_frequncia.html'); });
            }
        });
        // Conectar botões de chat nos cards de paciente dentro dos prontuários
        allButtons.forEach(btn => {
            const icon = btn.querySelector('.material-symbols-outlined');
            if (icon && (icon.textContent.trim() === 'chat' || icon.textContent.trim() === 'forum' || icon.textContent.trim() === 'message')) {
                btn.addEventListener('click', (e) => { e.preventDefault(); nav('chat_premium_-_dra_ana_costa.html'); });
            }
        });
    }

    // --- EVOLUÇÃO DO PACIENTE ---
    if (pageName.includes('evoluo_do_paciente')) {
        // Conectar tabs
        const allLinks = Array.from(document.querySelectorAll('a, button'));
        allLinks.forEach(link => {
            const text = link.textContent.trim().toLowerCase();
            if (text === 'histórico') { link.addEventListener('click', (e) => { e.preventDefault(); nav('pronturio_-_histrico_com_edio_livre.html'); }); }
            else if (text === 'documentos') { link.addEventListener('click', (e) => { e.preventDefault(); nav('pronturio_-_confirmao_de_excluso_de_documento.html'); }); }
            else if (text === 'para casa') { link.addEventListener('click', (e) => { e.preventDefault(); nav('pronturio_-_para_casa_dinmico_com_frequncia.html'); }); }
        });
    }

    // --- LISTA DE PACIENTES ---
    if (pageName === 'lista_de_pacientes_-_busca_e_filtro_ativo.html') {
        document.querySelectorAll('main div[class*="bg-surface"]').forEach(row => {
            row.style.cursor = 'pointer';
            row.addEventListener('click', () => nav('pronturio_-_histrico_com_edio_livre.html'));
        });
    }

    // --- LISTA DE PROFISSIONAIS ---
    if (pageName === 'lista_de_profissionais_-_busca_e_filtro_inteligente.html') {
        document.querySelectorAll('main div[class*="bg-surface"]').forEach(doc => {
            doc.style.cursor = 'pointer';
            doc.addEventListener('click', () => nav('perfil_da_fisioterapeuta_paciente_-_padronizado.html'));
        });
    }

    // --- HISTÓRICO FINANCEIRO ---
    if (pageName === 'histrico_de_repasses_fisioterapeuta.html') {
        // Tornar cards de transação clicáveis (feedback visual)
        document.querySelectorAll('article, main div[class*="bg-surface"]').forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                card.classList.add('ring-2', 'ring-primary');
                setTimeout(() => card.classList.remove('ring-2', 'ring-primary'), 1000);
            });
        });
    }

    // --- CHAT SIMPLIFICADO DO PACIENTE (mockup padronizado) ---
    if (pageName === 'chat_com_fisioterapeuta_paciente_-_padronizado.html') {
        // Redirecionar para o chat funcional com sync
        const sendBtns = Array.from(document.querySelectorAll('button'));
        sendBtns.forEach(btn => {
            const icon = btn.querySelector('.material-symbols-outlined');
            if (icon && icon.textContent.trim() === 'send') {
                btn.addEventListener('click', () => nav('chat.html'));
            }
        });
    }

    // =====================================================================
    // 5. BOTTOM NAVBARS - Lógica expandida com suporte a typos e labels EN
    // =====================================================================
    const allNavs = document.querySelectorAll('nav');
    allNavs.forEach(bottomNav => {
        const navLinks = bottomNav.querySelectorAll('a, button');
        navLinks.forEach(link => {
            const textEl = link.querySelector('span:not(.material-symbols-outlined)');
            const iconEl = link.querySelector('.material-symbols-outlined');
            if (!iconEl) return;

            const text = (textEl ? textEl.textContent.trim().toLowerCase() : '');
            const icon = iconEl.textContent.trim().toLowerCase();

            if (role === 'therapist') {
                // Jornada Fisioterapeuta
                if (matchAny(text, icon, ['início', 'incio', 'home'], ['home'])) {
                    wireNav(link, 'home_fisioterapeuta.html');
                } else if (matchAny(text, icon, ['atendimento', 'agenda', 'schedule'], ['calendar_today', 'today', 'event_note'])) {
                    wireNav(link, 'index.html');
                } else if (matchAny(text, icon, ['paciente', 'patients'], ['groups', 'people'])) {
                    wireNav(link, 'lista_de_pacientes_-_busca_e_filtro_ativo.html');
                } else if (matchAny(text, icon, ['perfil', 'prefil', 'profile'], ['person'])) {
                    wireNav(link, 'perfil_do_fisioterapeuta.html');
                }
            } else {
                // Jornada Paciente
                if (matchAny(text, icon, ['início', 'incio', 'home'], ['home'])) {
                    wireNav(link, 'home_paciente.html');
                } else if (matchAny(text, icon, ['tratamento', 'agenda', 'treatment', 'schedule'], ['medical_services', 'healing', 'calendar_today'])) {
                    wireNav(link, 'minha_agenda_paciente.html');
                } else if (matchAny(text, icon, ['profissional', 'pros', 'professional'], ['person_search', 'search'])) {
                    wireNav(link, 'lista_de_profissionais_-_busca_e_filtro_inteligente.html');
                } else if (matchAny(text, icon, ['perfil', 'prefil', 'profile'], ['person'])) {
                    wireNav(link, 'perfil_do_paciente.html');
                }
            }
        });
    });

    // =====================================================================
    // 6. BOTÃO GLOBAL DE VOLTAR
    // =====================================================================
    const backIcons = document.querySelectorAll('header .material-symbols-outlined');
    backIcons.forEach(icon => {
        if (icon.textContent.trim() === 'arrow_back') {
            const parentBtn = icon.closest('button') || icon.closest('a');
            if (parentBtn) {
                parentBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Ir direto para a Home correspondente ao perfil
                    nav(role === 'therapist' ? 'home_fisioterapeuta.html' : 'home_paciente.html');
                });
            }
        }
    });

    // =====================================================================
    // AUXILIARES
    // =====================================================================

    // Verifica se text ou icon corresponde a qualquer valor das listas
    function matchAny(text, icon, textMatches, iconMatches) {
        return textMatches.some(t => text.includes(t)) || iconMatches.some(i => icon === i);
    }

    // Conecta um link/botão de navegação ao destino
    function wireNav(element, targetUrl) {
        const urlWithRole = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'role=' + role;
        if (element.tagName === 'A') {
            element.setAttribute('href', urlWithRole);
            element.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = urlWithRole;
            });
        } else {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = urlWithRole;
            });
        }
    }

    // Conecta botões por texto parcial ao destino
    function wireButtonsByText(mappings) {
        const buttons = Array.from(document.querySelectorAll('button, a[href="#"], div[role="button"]'));
        buttons.forEach(btn => {
            const text = btn.textContent.trim().toLowerCase();
            for (const [keyword, target] of Object.entries(mappings)) {
                if (text.includes(keyword) && target) {
                    btn.style.cursor = 'pointer';
                    btn.addEventListener('click', (e) => { e.preventDefault(); nav(target); });
                    break;
                }
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
} else {
    initNavigation();
}
