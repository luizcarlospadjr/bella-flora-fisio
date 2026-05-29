// sync.js - Motor de Sincronização Online e em Tempo Real (Firebase & LocalStorage)
(function() {
    console.log("[Sync] Inicializando motor de sincronização...");

    // 1. Configuração do Firebase (Credenciais de Demonstração Públicas e Seguras)
    const firebaseConfig = {
        apiKey: "AIzaSyD-demo-key-for-bella-flora-fisio-sync",
        authDomain: "bella-flora-fisio.firebaseapp.com",
        projectId: "bella-flora-fisio",
        storageBucket: "bella-flora-fisio.appspot.com",
        messagingSenderId: "1234567890",
        appId: "1:1234567890:web:demoapp"
    };

    let db = null;
    let isFirebaseReady = false;

    // Tentar carregar o Firebase se os scripts do CDN estiverem disponíveis no escopo global e não for chave de demonstração
    const isDemoKey = firebaseConfig.apiKey.includes("demo-key");
    if (window.firebase && !isDemoKey) {
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            db = firebase.firestore();
            isFirebaseReady = true;
            console.log("[Sync] Firebase Firestore carregado com sucesso!");
        } catch (e) {
            console.warn("[Sync] Falha ao inicializar o Firebase. Usando fallback de LocalStorage.", e);
        }
    } else {
        if (isDemoKey) {
            console.log("[Sync] Credenciais de Demonstração detectadas. Usando LocalStorage em tempo real para simulação local.");
        } else {
            console.log("[Sync] Firebase CDN não detectado. Usando fallback de LocalStorage em tempo real.");
        }
    }

    // 2. Interface Unificada de Sincronização (Firebase <=> REST API <=> LocalStorage)
    const syncEngine = {
        // Enviar uma mensagem de chat
        sendMessage: async (chatId, message) => {
            const msgData = {
                sender: message.sender, // 'patient' ou 'therapist'
                text: message.text,
                timestamp: Date.now(),
                painLevel: message.painLevel || null,
                recordingUrl: message.recordingUrl || null
            };

            if (isFirebaseReady) {
                try {
                    await db.collection("chats").doc(chatId).collection("messages").add(msgData);
                    return;
                } catch (e) {
                    console.error("[Sync] Erro no Firestore sendMessage:", e);
                }
            }

            // Tentar enviar para o Servidor REST local
            let sentToAPI = false;
            try {
                const res = await fetch(`/api/chat?id=${chatId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(msgData)
                });
                if (res.ok) {
                    sentToAPI = true;
                    // Sincronizar resposta e salvar em LocalStorage para consistência local
                    const msgsRes = await fetch(`/api/chat?id=${chatId}`);
                    if (msgsRes.ok) {
                        const msgs = await msgsRes.json();
                        localStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(msgs));
                    }
                }
            } catch (e) {
                // Silencioso (servidor local desligado ou offline)
            }

            if (!sentToAPI) {
                // Fallback completo de LocalStorage puro
                const localKey = `chat_messages_${chatId}`;
                const msgs = JSON.parse(localStorage.getItem(localKey) || "[]");
                msgs.push(msgData);
                localStorage.setItem(localKey, JSON.stringify(msgs));
            }

            // Disparar evento de storage para sincronizar abas no mesmo navegador instantaneamente
            window.dispatchEvent(new Event('storage'));
        },

        // Escutar mensagens em tempo real
        onMessages: (chatId, callback) => {
            let lastJson = "";
            const handleData = (msgs) => {
                const json = JSON.stringify(msgs);
                if (json !== lastJson) {
                    lastJson = json;
                    callback(msgs);
                }
            };

            if (isFirebaseReady) {
                return db.collection("chats").doc(chatId).collection("messages")
                    .orderBy("timestamp", "asc")
                    .onSnapshot(snapshot => {
                        const msgs = [];
                        snapshot.forEach(doc => msgs.push(doc.data()));
                        callback(msgs);
                    }, error => {
                        console.error("[Sync] Erro no Firestore listen messages:", error);
                        setupLocalStorageListen(`chat_messages_${chatId}`, callback);
                    });
            } else {
                // 1. Escuta instantânea do LocalStorage no mesmo navegador
                const cancelLocalListen = setupLocalStorageListen(`chat_messages_${chatId}`, handleData);

                // 2. Polling ativo para sincronizar outros dispositivos (ex: Celular <-> PC na mesma rede)
                const pollInterval = setInterval(async () => {
                    try {
                        const res = await fetch(`/api/chat?id=${chatId}`);
                        if (res.ok) {
                            const msgs = await res.json();
                            if (msgs && msgs.length > 0) {
                                localStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(msgs));
                                handleData(msgs);
                            }
                        }
                    } catch (e) {
                        // Silencioso
                    }
                }, 1000);

                return () => {
                    cancelLocalListen();
                    clearInterval(pollInterval);
                };
            }
        },

        // Criar um agendamento de consulta
        bookAppointment: async (appointment) => {
            const data = {
                id: appointment.id || `app-${Date.now()}`,
                patientName: appointment.patientName,
                treatment: appointment.treatment,
                timeSlot: appointment.timeSlot, // Ex: "08:00"
                date: appointment.date || "25/10/2023",
                status: appointment.status || "Confirmado",
                timestamp: Date.now()
            };

            if (isFirebaseReady) {
                try {
                    await db.collection("appointments").doc(data.id).set(data);
                    return;
                } catch (e) {
                    console.error("[Sync] Erro no Firestore bookAppointment:", e);
                }
            }

            let sentToAPI = false;
            try {
                const res = await fetch(`/api/appointments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (res.ok) {
                    sentToAPI = true;
                    const listRes = await fetch(`/api/appointments`);
                    if (listRes.ok) {
                        const list = await listRes.json();
                        localStorage.setItem("appointments", JSON.stringify(list));
                    }
                }
            } catch (e) {
                // Silencioso
            }

            if (!sentToAPI) {
                const appointments = JSON.parse(localStorage.getItem("appointments") || "[]");
                appointments.push(data);
                localStorage.setItem("appointments", JSON.stringify(appointments));
            }

            window.dispatchEvent(new Event('storage'));
        },

        // Escutar agendamentos em tempo real
        onAppointments: (callback) => {
            let lastJson = "";
            const handleData = (apps) => {
                const json = JSON.stringify(apps);
                if (json !== lastJson) {
                    lastJson = json;
                    callback(apps);
                }
            };

            if (isFirebaseReady) {
                return db.collection("appointments").onSnapshot(snapshot => {
                    const apps = [];
                    snapshot.forEach(doc => apps.push(doc.data()));
                    callback(apps);
                }, error => {
                    console.error("[Sync] Erro no Firestore listen appointments:", error);
                    setupLocalStorageListen("appointments", callback);
                });
            } else {
                // 1. Escuta instantânea do LocalStorage no mesmo navegador
                const cancelLocalListen = setupLocalStorageListen("appointments", handleData);

                // 2. Polling ativo para sincronizar outros dispositivos
                const pollInterval = setInterval(async () => {
                    try {
                        const res = await fetch(`/api/appointments`);
                        if (res.ok) {
                            const list = await res.json();
                            if (list) {
                                localStorage.setItem("appointments", JSON.stringify(list));
                                handleData(list);
                            }
                        }
                    } catch (e) {
                        // Silencioso
                    }
                }, 1000);

                return () => {
                    cancelLocalListen();
                    clearInterval(pollInterval);
                };
            }
        },

        // Cancelar um agendamento
        cancelAppointment: async (appId) => {
            if (isFirebaseReady) {
                try {
                    await db.collection("appointments").doc(appId).delete();
                    return;
                } catch (e) {
                    console.error("[Sync] Erro no Firestore cancelAppointment:", e);
                }
            }

            let deletedFromAPI = false;
            try {
                const res = await fetch(`/api/appointments?id=${appId}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    deletedFromAPI = true;
                    const listRes = await fetch(`/api/appointments`);
                    if (listRes.ok) {
                        const list = await listRes.json();
                        localStorage.setItem("appointments", JSON.stringify(list));
                    }
                }
            } catch (e) {
                // Silencioso
            }

            if (!deletedFromAPI) {
                let appointments = JSON.parse(localStorage.getItem("appointments") || "[]");
                appointments = appointments.filter(app => app.id !== appId);
                localStorage.setItem("appointments", JSON.stringify(appointments));
            }

            window.dispatchEvent(new Event('storage'));
        },

        // Atualizar dor ou progresso do paciente
        updatePatientState: async (patientId, state) => {
            const data = {
                latestPain: state.painLevel,
                latestExercise: state.exerciseName || null,
                timestamp: Date.now()
            };

            if (isFirebaseReady) {
                try {
                    await db.collection("patient_states").doc(patientId).set(data, { merge: true });
                    return;
                } catch (e) {
                    console.error("[Sync] Erro no Firestore updatePatientState:", e);
                }
            }

            let sentToAPI = false;
            try {
                const res = await fetch(`/api/patient_state?id=${patientId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (res.ok) {
                    sentToAPI = true;
                    localStorage.setItem(`state_${patientId}`, JSON.stringify(data));
                }
            } catch (e) {
                // Silencioso
            }

            if (!sentToAPI) {
                localStorage.setItem(`state_${patientId}`, JSON.stringify(data));
            }

            window.dispatchEvent(new Event('storage'));
        },

        // Escutar dor ou progresso em tempo real
        onPatientState: (patientId, callback) => {
            let lastJson = "";
            const handleData = (state) => {
                const json = JSON.stringify(state);
                if (json !== lastJson) {
                    lastJson = json;
                    callback(state);
                }
            };

            if (isFirebaseReady) {
                return db.collection("patient_states").doc(patientId).onSnapshot(doc => {
                    if (doc.exists) callback(doc.data());
                }, error => {
                    console.error("[Sync] Erro no Firestore listen patient state:", error);
                    setupLocalStorageListen(`state_${patientId}`, callback);
                });
            } else {
                // 1. Escuta instantânea do LocalStorage no mesmo navegador
                const cancelLocalListen = setupLocalStorageListen(`state_${patientId}`, handleData);

                // 2. Polling ativo para sincronizar outros dispositivos
                const pollInterval = setInterval(async () => {
                    try {
                        const res = await fetch(`/api/patient_state?id=${patientId}`);
                        if (res.ok) {
                            const state = await res.json();
                            if (state && Object.keys(state).length > 0) {
                                localStorage.setItem(`state_${patientId}`, JSON.stringify(state));
                                handleData(state);
                            }
                        }
                    } catch (e) {
                        // Silencioso
                    }
                }, 1000);

                return () => {
                    cancelLocalListen();
                    clearInterval(pollInterval);
                };
            }
        }
    };

    // Helper para escutar alterações no LocalStorage em tempo real (entre abas)
    function setupLocalStorageListen(key, callback) {
        const loadAndCall = () => {
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    callback(JSON.parse(data));
                } catch (e) {
                    callback(data);
                }
            }
        };

        // Chamar imediatamente para carregar dados existentes
        loadAndCall();

        // Registrar escuta do evento do browser
        const handler = (e) => {
            if (e.key === key || !e.key) {
                loadAndCall();
            }
        };
        window.addEventListener('storage', handler);

        // Retornar função de cancelamento de escuta
        return () => {
            window.removeEventListener('storage', handler);
        };
    }

    // Expor motor no escopo global
    window.BellaFloraSync = syncEngine;

    // --- 3. Integrações de Telas Específicas ---
    const pageName = window.location.pathname.split('/').pop();

    // A. Tela de Chat do Paciente (chat.html)
    if (pageName === 'chat.html') {
        setTimeout(() => {
            const inputField = document.getElementById('message-input') || document.querySelector('input[type="text"]');
            if (!inputField) return;

            // Escutar novas mensagens
            window.BellaFloraSync.onMessages("mariana_ana", (messages) => {
                renderMessages(messages, 'patient');
            });

            // Sobrescrever a função global sendMessage do HTML
            window.sendMessage = function() {
                const text = inputField.value.trim();
                if (!text) return;

                window.BellaFloraSync.sendMessage("mariana_ana", {
                    sender: 'patient',
                    text: text
                });
                inputField.value = '';
            };

            // Sobrescrever a função global submitPainLevel do HTML
            window.submitPainLevel = function() {
                const slider = document.getElementById('pain-slider');
                if (!slider) return;
                const pain = slider.value;
                const painEmojis = {
                    1: { emoji: '😀', color: '#4ade80', desc: 'Sem Dor / Muito Leve' },
                    2: { emoji: '🙂', color: '#4ade80', desc: 'Leve' },
                    3: { emoji: '😐', color: '#4ade80', desc: 'Desconforto Leve' },
                    4: { emoji: '😕', color: '#facc15', desc: 'Desconforto Moderado' },
                    5: { emoji: '🙁', color: '#facc15', desc: 'Dor Moderada' },
                    6: { emoji: '😖', color: '#facc15', desc: 'Dor Forte' },
                    7: { emoji: '😫', color: '#f87171', desc: 'Dor Muito Forte' },
                    8: { emoji: '😩', color: '#f87171', desc: 'Dor Intensa' },
                    9: { emoji: '😭', color: '#ef4444', desc: 'Dor Muito Intensa' },
                    10: { emoji: '😵', color: '#dc2626', desc: 'Dor Insuportável' }
                };
                const config = painEmojis[pain] || { emoji: '😐', desc: 'Desconforto Moderado' };
                const text = `Nível de dor registrado: ${pain}/10 (${config.desc}) ${config.emoji}`;

                window.BellaFloraSync.sendMessage("mariana_ana", {
                    sender: 'patient',
                    text: text,
                    painLevel: pain
                });
                window.BellaFloraSync.updatePatientState("mariana", { painLevel: pain });
                
                if (typeof closePainModal === 'function') {
                    closePainModal();
                }
            };
        }, 200);
    }

    // B. Tela de Chat Premium do Fisioterapeuta (chat_premium_-_dra_ana_costa.html)
    if (pageName === 'chat_premium_-_dra_ana_costa.html' || pageName === 'chat_com_paciente_fisioterapeuta.html') {
        setTimeout(() => {
            const inputField = document.getElementById('message-input') || document.querySelector('input[type="text"]');

            // Escutar e renderizar mensagens
            window.BellaFloraSync.onMessages("mariana_ana", (messages) => {
                renderMessages(messages, 'therapist');
            });

            // Escutar dor em tempo real na barra de cabeçalho
            window.BellaFloraSync.onPatientState("mariana", (state) => {
                const headerPain = document.getElementById('latest-pain-level');
                if (headerPain && state.latestPain) {
                    headerPain.textContent = `Dor: ${state.latestPain}/10`;
                }
            });

            // Sobrescrever a função global sendMessage do HTML
            window.sendMessage = function() {
                if (!inputField) return;
                const text = inputField.value.trim();
                if (!text) return;

                window.BellaFloraSync.sendMessage("mariana_ana", {
                    sender: 'therapist',
                    text: text
                });
                inputField.value = '';
            };
        }, 200);
    }

    // C. Tela de Agendamento do Paciente (agendamento_de_consulta_padronizado.html)
    if (pageName === 'agendamento_de_consulta_padronizado.html') {
        setTimeout(() => {
            const bookForm = document.querySelector('form');
            if (bookForm) {
                bookForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const selectedTime = document.querySelector('#time-select')?.value || "11:00";
                    const selectedDate = document.querySelector('#date-select')?.value || "25/10/2023";
                    
                    window.BellaFloraSync.bookAppointment({
                        patientName: "Mariana Costa",
                        treatment: "Fisioterapia Pélvica",
                        timeSlot: selectedTime,
                        date: selectedDate
                    }).then(() => {
                        window.location.href = 'minha_agenda_paciente.html';
                    });
                });
            }
        }, 500);
    }

    // D. Tela de Agenda do Fisioterapeuta (index.html)
    if (pageName === 'index.html') {
        setTimeout(() => {
            // Escutar novos agendamentos em tempo real
            window.BellaFloraSync.onAppointments((appointments) => {
                appointments.forEach(app => {
                    updateAgendaSlot(app);
                });
            });
        }, 500);
    }

    // Auxiliar: Renderização de mensagens no chat
    function renderMessages(messages, viewer = 'patient') {
        const container = document.getElementById('chat-canvas') || document.getElementById('chat-messages-container') || document.querySelector('main div.flex-col');
        if (!container) return;

        // Limpar mensagens atuais
        container.innerHTML = '';

        // Adicionar o divisor de data "Hoje" no início
        const dateDivider = document.createElement('div');
        dateDivider.className = 'flex justify-center my-2';
        dateDivider.innerHTML = '<span class="bg-surface-container-low border border-outline-variant/30 text-on-surface-variant font-label-md text-label-md px-3 py-1 rounded-full shadow-sm">Hoje</span>';
        container.appendChild(dateDivider);

        messages.forEach(msg => {
            const isMe = msg.sender === viewer;
            
            // Formatar hora
            let formattedTime = '09:00';
            if (msg.timestamp) {
                const date = new Date(msg.timestamp);
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                formattedTime = `${hours}:${minutes}`;
            }

            const messageDiv = document.createElement('div');
            
            if (msg.imageUrl) {
                // Mensagem com Imagem
                messageDiv.className = `flex flex-col gap-2 max-w-[85%] ${isMe ? 'self-end' : 'self-start'} fade-in`;
                messageDiv.innerHTML = `
                    <div class="${isMe ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface'} p-2 rounded-[16px] ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'} shadow-[0px_2px_8px_rgba(0,0,0,0.04)] border border-outline-variant/20">
                        <img src="${msg.imageUrl}" class="w-full rounded-xl object-cover mb-2" alt="Anexo" />
                        <p class="font-body-md text-body-md px-2 pb-1">${msg.text}</p>
                        <div class="flex justify-end px-2 gap-1 items-center">
                            <span class="font-label-md text-[10px] ${isMe ? 'opacity-80' : 'text-on-surface-variant'}">${formattedTime}</span>
                            ${isMe ? '<span class="material-symbols-outlined text-[14px]">done_all</span>' : ''}
                        </div>
                    </div>
                `;
            } else {
                // Mensagem normal de texto
                messageDiv.className = `flex items-end gap-2 max-w-[85%] ${isMe ? 'self-end' : 'self-start'} fade-in`;
                
                if (isMe) {
                    messageDiv.innerHTML = `
                        <div class="bg-primary text-on-primary p-inset-card rounded-[16px] rounded-br-sm shadow-[0px_4px_12px_rgba(112,81,141,0.15)]">
                            <p class="font-body-md text-body-md">${msg.text}</p>
                            <div class="flex justify-end mt-1 gap-1 items-center">
                                <span class="font-label-md text-[10px] opacity-80">${formattedTime}</span>
                                <span class="material-symbols-outlined text-[14px]">done_all</span>
                            </div>
                        </div>
                    `;
                } else {
                    messageDiv.innerHTML = `
                        <div class="bg-surface-container text-on-surface p-inset-card rounded-[16px] rounded-bl-sm shadow-[0px_2px_8px_rgba(0,0,0,0.04)] border border-outline-variant/20">
                            <p class="font-body-md text-body-md">${msg.text}</p>
                            <div class="flex justify-end mt-1">
                                <span class="font-label-md text-[10px] text-on-surface-variant">${formattedTime}</span>
                            </div>
                        </div>
                    `;
                }
            }
            container.appendChild(messageDiv);
        });

        // Rolar até o final
        container.scrollTop = container.scrollHeight;
    }

    // Auxiliar: Atualiza slots de horários na agenda do Fisio
    function updateAgendaSlot(appointment) {
        const slotBtn = document.querySelector(`[data-time="${appointment.timeSlot}"]`);
        if (!slotBtn) return;

        const parentDiv = slotBtn.parentElement;
        if (!parentDiv) return;

        // Transformar o slot livre em ocupado
        const occupiedCard = `
            <div class="w-full bg-primary-container rounded-xl p-inset-card flex flex-col gap-2 shadow-sm relative" id="app-card-${appointment.id}">
                <div class="flex justify-between items-start">
                    <span class="font-label-md text-label-md text-on-primary-container bg-primary-fixed-dim/30 px-2 py-0.5 rounded-full inline-block">Agendado</span>
                    <button onclick="window.BellaFloraSync.cancelAppointment('${appointment.id}')" class="text-error font-bold text-xs">Cancelar</button>
                </div>
                <div class="flex items-center gap-3 mt-1">
                    <div class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-primary">
                        ${appointment.patientName.charAt(0)}
                    </div>
                    <div>
                        <h3 class="font-subtitle-md text-subtitle-md text-on-primary-container">${appointment.patientName}</h3>
                        <p class="font-body-md text-body-md text-on-primary-container/80 flex items-center gap-1">${appointment.treatment}</p>
                    </div>
                </div>
            </div>
        `;
        parentDiv.innerHTML = `<div class="absolute left-0 top-4 bottom-0 w-px bg-surface-variant -z-10"></div>` + occupiedCard;
    }

})();
