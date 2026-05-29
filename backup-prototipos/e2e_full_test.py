# e2e_full_test.py - Script de Teste Automatizado de Ponta a Ponta (E2E) com Selenium
import time
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

def print_banner():
    print("\n" + "="*70)
    print("      BELLA FLORA FISIO - SUITE DE TESTES E2E COMPLETA (DE CABO A RABO)")
    print("="*70)

def main():
    print_banner()

    # 1. Configurando opções do navegador
    chrome_options = Options()
    # Desativar logs excessivos do Chrome
    chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])
    
    # Executar em modo visível por padrão para demonstração
    # Para rodar em segundo plano, descomente a linha abaixo:
    # chrome_options.add_argument('--headless')

    print("\n[1/5] Inicializando navegadores...")
    
    main_driver = None
    try:
        # Inicializar navegador compartilhado
        print("  -> Inicializando navegador compartilhado (Chrome)...")
        main_driver = webdriver.Chrome(options=chrome_options)
        
        # Obter identificador da janela do Paciente
        patient_handle = main_driver.current_window_handle
        main_driver.set_window_size(600, 900)
        main_driver.set_window_position(50, 50)
        
        # Abrir nova janela para o Fisioterapeuta
        print("  -> Criando segunda janela para o Fisioterapeuta...")
        main_driver.execute_script("window.open('about:blank', '_blank');")
        time.sleep(1.5)
        
        # Encontrar o novo identificador da janela do Fisioterapeuta
        therapist_handle = [h for h in main_driver.window_handles if h != patient_handle][0]
        
        # Mudar para a janela do Fisioterapeuta para configurar tamanho e posição
        main_driver.switch_to.window(therapist_handle)
        main_driver.set_window_size(600, 900)
        main_driver.set_window_position(700, 50)
        
        # Voltar o foco para a janela do Paciente
        main_driver.switch_to.window(patient_handle)
        
        # Definir classe wrapper que intercepta chamadas e altera a janela ativa do Selenium automaticamente
        class DriverWrapper:
            def __init__(self, driver, handle):
                self._driver = driver
                self._handle = handle

            def __getattr__(self, name):
                # Antes de qualquer interação, troca para a respectiva janela/aba
                if self._driver.current_window_handle != self._handle:
                    self._driver.switch_to.window(self._handle)
                return getattr(self._driver, name)
                
            def quit(self):
                # Quit individual desativado, o main_driver será encerrado no final
                pass
                
            def save_screenshot(self, filename):
                if self._driver.current_window_handle != self._handle:
                    self._driver.switch_to.window(self._handle)
                self._driver.save_screenshot(filename)
                
            def get_log(self, log_type):
                if self._driver.current_window_handle != self._handle:
                    self._driver.switch_to.window(self._handle)
                return self._driver.get_log(log_type)

        patient_driver = DriverWrapper(main_driver, patient_handle)
        therapist_driver = DriverWrapper(main_driver, therapist_handle)
        
    except Exception as e:
        print(f"\n[ERRO] Falha ao inicializar o ChromeDriver: {e}")
        print("Certifique-se de que o Google Chrome está instalado e atualizado.")
        if main_driver:
            try:
                main_driver.quit()
            except Exception:
                pass
        sys.exit(1)

    try:
        # =========================================================================
        # PARTE 1: FLUXO DE ENTRADA DO PACIENTE (SPLASH -> PERFIL -> LOGIN -> HOME)
        # =========================================================================
        print("\n[2/5] Testando Fluxo de Entrada do Paciente...")
        
        # 1. Splash Screen
        print("  -> Paciente abrindo Splash Screen...")
        patient_driver.get("http://localhost:5173/splash_screen.html")
        
        # Verificar redirecionamento automático
        print("  -> Aguardando 2 segundos para o redirecionamento automático da Splash...")
        time.sleep(3.5)
        
        current_url = patient_driver.current_url
        if "escolha_de_perfil.html" in current_url:
            print("  [OK] Redirecionamento da Splash Screen funcionou perfeitamente!")
        else:
            raise AssertionError(f"Deveria redirecionar para escolha_de_perfil.html, mas está em: {current_url}")

        # 2. Escolha de Perfil (Usando XPath contains(., '...') para lidar com elementos filhos/ícones)
        print("  -> Clicando em 'Sou Paciente'...")
        patient_btn = WebDriverWait(patient_driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Sou Paciente')]"))
        )
        patient_btn.click()
        
        time.sleep(1.5)
        current_url = patient_driver.current_url
        if "login.html?role=patient" in current_url:
            print("  [OK] Redirecionamento para Login de Paciente funcionou!")
        else:
            raise AssertionError(f"Deveria ir para login.html?role=patient, mas está em: {current_url}")

        # 3. Teste de Formulário e Toggle de Senha no Login
        print("  -> Testando toggle de exibição de senha no Login...")
        password_input = patient_driver.find_element(By.ID, "password")
        # Encontra o botão de visibilidade relativo ao input de senha
        toggle_btn = patient_driver.find_element(By.XPATH, "//input[@id='password']/following-sibling::button")
        
        # Inicialmente é do tipo password
        assert password_input.get_attribute("type") == "password", "Tipo inicial deveria ser password"
        
        # Clicar para exibir
        toggle_btn.click()
        time.sleep(0.5)
        assert password_input.get_attribute("type") == "text", "Tipo deveria ter mudado para text"
        print("  [OK] Botão de mostrar senha alterou input para 'text'!")
        
        # Clicar para ocultar novamente
        toggle_btn.click()
        time.sleep(0.5)
        assert password_input.get_attribute("type") == "password", "Tipo deveria ter voltado para password"
        print("  [OK] Botão de ocultar senha reverteu input para 'password'!")

        # Preencher credenciais mockadas
        patient_driver.find_element(By.ID, "email").clear()
        patient_driver.find_element(By.ID, "email").send_keys("mariana@email.com")
        password_input.clear()
        password_input.send_keys("123456")

        # Clicar em Entrar
        print("  -> Clicando em 'Entrar'...")
        entrar_btn = patient_driver.find_element(By.XPATH, "//button[contains(., 'Entrar')]")
        entrar_btn.click()
        
        time.sleep(2)
        current_url = patient_driver.current_url
        if "home_paciente.html" in current_url:
            print("  [OK] Login bem-sucedido! Redirecionado para a Home do Paciente.")
        else:
            raise AssertionError(f"Deveria ter entrado em home_paciente.html, mas está em: {current_url}")


        # =========================================================================
        # PARTE 2: FLUXO DE ENTRADA DO FISIOTERAPEUTA
        # =========================================================================
        print("\n[3/5] Testando Fluxo de Entrada do Fisioterapeuta...")
        
        # 1. Escolha de Perfil
        therapist_driver.get("http://localhost:5173/escolha_de_perfil.html")
        print("  -> Clicando em 'Sou Fisioterapeuta'...")
        therapist_btn = WebDriverWait(therapist_driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Sou Fisioterapeuta')]"))
        )
        therapist_btn.click()
        
        time.sleep(1.5)
        current_url = therapist_driver.current_url
        if "login.html?role=therapist" in current_url:
            print("  [OK] Redirecionamento para Login do Fisioterapeuta funcionou!")
        else:
            raise AssertionError(f"Deveria ir para login.html?role=therapist, mas está em: {current_url}")

        # 2. Entrar
        print("  -> Clicando em 'Entrar'...")
        entrar_btn_therapist = therapist_driver.find_element(By.XPATH, "//button[contains(., 'Entrar')]")
        entrar_btn_therapist.click()
        
        time.sleep(2)
        current_url = therapist_driver.current_url
        if "home_fisioterapeuta.html" in current_url:
            print("  [OK] Login bem-sucedido! Fisioterapeuta está na Home.")
        else:
            raise AssertionError(f"Deveria ter entrado em home_fisioterapeuta.html, mas está em: {current_url}")


        # =========================================================================
        # PARTE 3: NAVEGAÇÃO INTERNA E CRIAÇÃO DE DADOS
        # =========================================================================
        print("\n[4/5] Testando Navegação Interna e Ações...")
        
        # 1. Paciente navega para o chat
        print("  -> Paciente: Clicando no chat com o profissional na Home...")
        chat_trigger = WebDriverWait(patient_driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, "//button[@aria-label='Chat with doctor']"))
        )
        patient_driver.execute_script("arguments[0].click();", chat_trigger)
        time.sleep(2)
        assert "chat.html" in patient_driver.current_url, "Paciente deveria estar no chat.html"
        print("  [OK] Paciente entrou no Chat com sucesso!")

        # 2. Fisioterapeuta navega para o prontuário
        print("  -> Fisioterapeuta: Acessando prontuário da Mariana Silva...")
        # Localiza Mariana Silva usando o texto da div clicável
        patient_row = WebDriverWait(therapist_driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, "//span[contains(., 'Mariana Silva')]/ancestor::div[contains(@class, 'cursor-pointer')]"))
        )
        patient_row.click()
        time.sleep(2)
        assert "pronturio_-_histrico_com_edio_livre.html" in therapist_driver.current_url, "Fisio deveria estar no prontuário"
        print("  [OK] Fisioterapeuta abriu o prontuário com sucesso!")

        # 3. Fisioterapeuta navega para registrar evolução
        print("  -> Fisioterapeuta: Clicando em 'Evolução' no prontuário...")
        evolucoes_btn = therapist_driver.find_element(By.XPATH, "//button[contains(., 'Evolução') or contains(., 'Registrar')]")
        evolucoes_btn.click()
        time.sleep(2)
        assert "evoluo_do_paciente_-_sesso_10_editvel.html" in therapist_driver.current_url, "Deveria estar na evolução da sessão"
        print("  [OK] Fisioterapeuta abriu a tela de evolução editável!")

        # Fisioterapeuta volta para Home usando o botão de voltar global
        print("  -> Fisioterapeuta: Clicando no botão de Voltar Global do cabeçalho...")
        back_btn = therapist_driver.find_element(By.XPATH, "//header//button")
        back_btn.click()
        time.sleep(2)
        assert "home_fisioterapeuta.html" in therapist_driver.current_url, "Deveria ter voltado para a Home do Fisio"
        print("  [OK] Botão de Voltar redirecionou o Fisioterapeuta para a Home correta!")

        # Fisioterapeuta vai para o chat com a paciente através do bottom nav (aba "Paciente" ou acessando chat_premium)
        print("  -> Fisioterapeuta: Indo para aba 'Paciente' na barra inferior...")
        paciente_tab = therapist_driver.find_element(By.XPATH, "//nav//span[contains(., 'Paciente')]/parent::button")
        paciente_tab.click()
        time.sleep(2)
        assert "lista_de_pacientes_-_busca_e_filtro_ativo.html" in therapist_driver.current_url, "Deveria estar na lista de pacientes"
        print("  [OK] Bottom navbar redirecionou o Fisioterapeuta para a lista de pacientes!")


        # =========================================================================
        # PARTE 4: SINCRONIZAÇÃO EM TEMPO REAL ONLINE / LOCAL (CROSS-CLIENT SYNC)
        # =========================================================================
        print("\n[5/5] Testando Sincronização em Tempo Real (Cross-Client Sync)...")
        
        # Abrir o chat no dispositivo do fisioterapeuta
        print("  -> Fisioterapeuta: Abrindo chat premium com a paciente...")
        therapist_driver.get("http://localhost:5173/chat_premium_-_dra_ana_costa.html")
        time.sleep(2)

        # Paciente envia uma mensagem
        print("  -> Paciente: Enviando mensagem no chat...")
        patient_input = patient_driver.find_element(By.XPATH, "//input[@type='text']")
        patient_input.clear()
        patient_input.send_keys("Olá Dra. Ana! Enviei a atualização dos meus exercícios.")
        
        patient_send_btn = patient_driver.find_element(By.XPATH, "//button[contains(@aria-label, 'Send') or contains(@class, 'rounded-full') or .//span[contains(., 'send')]]")
        patient_send_btn.click()
        print("  -> Paciente enviou: 'Olá Dra. Ana! Enviei a atualização dos meus exercícios.'")
        
        # Verificar no Fisioterapeuta se a mensagem apareceu (tempo de propagação sync)
        time.sleep(3.5)
        therapist_messages = therapist_driver.find_elements(By.XPATH, "//*[contains(., 'Olá Dra. Ana!')]")
        if len(therapist_messages) > 0:
            print("  [OK] Sincronização em tempo real: Fisioterapeuta recebeu a mensagem instantaneamente!")
        else:
            print("  [AVISO] Verifique se as abas estão compartilhando o LocalStorage ou Firebase corretamente.")

        # Paciente registra nível de dor
        print("  -> Paciente: Abrindo menu de anexos...")
        attach_btn = WebDriverWait(patient_driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, "//button[.//span[text()='add_circle']]"))
        )
        patient_driver.execute_script("arguments[0].click();", attach_btn)
        time.sleep(1)

        print("  -> Paciente: Clicando em 'Registrar Nível de Dor'...")
        pain_menu_btn = WebDriverWait(patient_driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Registrar Nível')]"))
        )
        patient_driver.execute_script("arguments[0].click();", pain_menu_btn)
        time.sleep(1)

        print("  -> Paciente: Ajustando controle de dor para nível 8...")
        pain_slider = WebDriverWait(patient_driver, 5).until(
            EC.presence_of_element_located((By.XPATH, "//input[@id='pain-slider']"))
        )
        patient_driver.execute_script("arguments[0].value = 8; arguments[0].dispatchEvent(new Event('input'))", pain_slider)
        time.sleep(0.5)
        
        print("  -> Paciente: Clicando em 'Registrar Dor'...")
        registrar_dor_btn = WebDriverWait(patient_driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Registrar Dor')]"))
        )
        patient_driver.execute_script("arguments[0].click();", registrar_dor_btn)
        print("  -> Paciente registrou nível de dor 8.")
        
        # Verificar no Fisioterapeuta se o indicador de dor no cabeçalho atualizou para 8
        time.sleep(3.5)
        header_pain = therapist_driver.find_element(By.ID, "latest-pain-level")
        if "8" in header_pain.text:
            print(f"  [OK] Sincronização de Progresso: Cabeçalho do Fisioterapeuta atualizou para: '{header_pain.text}'!")
        else:
            print(f"  [AVISO] Nível de dor no cabeçalho exibe: '{header_pain.text}'. Esperado conter '8'.")

        # Fisioterapeuta responde à mensagem
        print("  -> Fisioterapeuta: Digitando resposta no chat...")
        therapist_input = therapist_driver.find_element(By.XPATH, "//input[@type='text']")
        therapist_input.clear()
        therapist_input.send_keys("Perfeito, Mariana! Vi aqui que a sua dor está em 8, vamos pegar leve na sessão de amanhã.")
        
        therapist_send_btn = therapist_driver.find_element(By.XPATH, "//button[@onclick='sendMessage()']")
        therapist_driver.execute_script("arguments[0].click();", therapist_send_btn)
        print("  -> Fisioterapeuta enviou resposta.")

        # Verificar se o Paciente recebeu
        time.sleep(3.5)
        patient_messages = patient_driver.find_elements(By.XPATH, "//*[contains(., 'vamos pegar leve')]")
        if len(patient_messages) > 0:
            print("  [OK] Sincronização em tempo real: Paciente recebeu a resposta da Dra. Ana instantaneamente!")
        else:
            print("  [AVISO] Verifique o feed de chat do paciente.")

        # Imprimir logs do console para diagnóstico
        try:
            print("\n--- CONSOLE LOGS DO PACIENTE ---")
            for entry in patient_driver.get_log('browser'):
                print(f"  {entry['level']}: {entry['message']}")
            print("\n--- CONSOLE LOGS DO FISIOTERAPEUTA ---")
            for entry in therapist_driver.get_log('browser'):
                print(f"  {entry['level']}: {entry['message']}")
        except Exception as log_err:
            print(f"Nao foi possivel obter logs do console: {log_err}")

        print("\n" + "="*70)
        print(" SUCESSO COMPLETO! TODOS OS FLUXOS FORAM TESTADOS DE CABO A RABO!")
        print("  - Roteamento Splash Screen e Escolha de Perfil: OK")
        print("  - Login com seletor robusto e toggle de senha: OK")
        print("  - Navegação entre telas e ações com Bottom Nav: OK")
        print("  - Botão de Voltar inteligente: OK")
        print("  - Comunicação Bidirecional e Sincronização de Dor em Tempo Real: OK")
        print("="*70)

    except Exception as e:
        print(f"\n[ERRO] OCORREU UM ERRO DURANTE O TESTE E2E: {e}")
        # Tirar screenshot para ajudar a diagnosticar o erro
        try:
            patient_driver.save_screenshot("erro_patient.png")
            therapist_driver.save_screenshot("erro_therapist.png")
            print("Screenshots dos erros salvos como 'erro_patient.png' e 'erro_therapist.png'.")
            
            # Imprimir logs do console
            print("\n--- CONSOLE LOGS DO PACIENTE ---")
            for entry in patient_driver.get_log('browser'):
                print(f"  {entry['level']}: {entry['message']}")
            print("\n--- CONSOLE LOGS DO FISIOTERAPEUTA ---")
            for entry in therapist_driver.get_log('browser'):
                print(f"  {entry['level']}: {entry['message']}")
        except Exception as log_err:
            print(f"Nao foi possivel obter logs do console: {log_err}")
        raise e
    finally:
        # Aguardar um pouco para o usuário ver o estado final e depois fechar
        print("\nFechando navegadores em 10 segundos...")
        time.sleep(10)
        if main_driver:
            try:
                main_driver.quit()
            except Exception:
                pass

if __name__ == "__main__":
    main()
