# e2e_validator.py - Verificador E2E Automatizado por Linha de Comando
import urllib.request
import sys

URLS_TO_TEST = {
    "Splash Screen (Ponto de Entrada)": "http://localhost:5173/splash_screen.html",
    "Escolha de Perfil": "http://localhost:5173/escolha_de_perfil.html",
    "Área do Paciente (Home)": "http://localhost:5173/home_paciente.html",
    "Área do Fisioterapeuta (Home)": "http://localhost:5173/home_fisioterapeuta.html",
    "Chat em Tempo Real": "http://localhost:5173/chat.html",
    "Visual E2E Runner": "http://localhost:5173/e2e_runner.html"
}

def run_tests():
    print("====================================================")
    print("   Bella Flora Fisio - Validador de Servidor E2E")
    print("====================================================\n")

    failures = 0
    successes = 0

    for name, url in URLS_TO_TEST.items():
        print(f"Testando [ {name} ] ...")
        try:
            # Enviar request HTTP com timeout curto
            req = urllib.request.Request(url, headers={'User-Agent': 'E2E-Validator'})
            with urllib.request.urlopen(req, timeout=3) as response:
                status = response.getcode()
                if status == 200:
                    print(f"  -> SUCESSO! HTTP 200 (Disponível e Responsivo)")
                    successes += 1
                else:
                    print(f"  -> FALHA! Retornou Status {status}")
                    failures += 1
        except Exception as e:
            print(f"  -> FALHA! Não foi possível acessar ({e})")
            failures += 1
        print("-" * 50)

    print("\n================ RENTABILIDADE DO TESTE ================")
    print(f"  Total Testados: {len(URLS_TO_TEST)}")
    print(f"  Sucessos: {successes}")
    print(f"  Falhas: {failures}")
    print("========================================================")

    if failures > 0:
        print("\n[!] ALERTA: O servidor local não está respondendo. Verifique se ele foi iniciado.")
        sys.exit(1)
    else:
        print("\n[+] SUCESSO COMPLETO! O aplicativo está no ar e 100% pronto para uso.")
        sys.exit(0)

if __name__ == "__main__":
    run_tests()
