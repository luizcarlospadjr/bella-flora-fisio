# link_injector.py - Injetor de Dependências Automatizado para Bella Flora Fisio
import os
import re

APP_DIR = r"C:\app"
SCRIPTS_TO_INJECT = """
    <!-- Firebase CDN SDK -->
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
    <!-- Bella Flora Custom Modules -->
    <script src="navigation.js" defer></script>
    <script src="sync.js" defer></script>
</head>
"""

def inject_dependencies():
    print("=== [Link Injector] Iniciando Injeção de Dependências ===")
    
    html_files = [f for f in os.listdir(APP_DIR) if f.endswith(".html")]
    print(f"Encontrados {len(html_files)} arquivos HTML em {APP_DIR}.")

    injected_count = 0
    replacement_count = 0

    for file_name in html_files:
        file_path = os.path.join(APP_DIR, file_name)
        
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        modified = False

        # 1. Injetar scripts de navegação e sincronização antes de </head> se não estiverem presentes
        if "navigation.js" not in content:
            if "</head>" in content:
                content = content.replace("</head>", SCRIPTS_TO_INJECT)
                modified = True
                injected_count += 1
                print(f"[Injetado] Scripts adicionados ao <head> de: {file_name}")

        # 2. Substituir placeholders específicos do Stitch (ex: SCREEN_31 no Prontuário)
        if "{{DATA:SCREEN:SCREEN_31}}" in content:
            content = content.replace("{{DATA:SCREEN:SCREEN_31}}", "pronturio_-_histrico_com_edio_livre.html")
            modified = True
            replacement_count += 1
            print(f"[Substituído] Placeholder SCREEN_31 resolvido em: {file_name}")

        # 3. Salvar se houver modificações
        if modified:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            
    print(f"\n=== [Link Injector] Concluído! ===")
    print(f"-> {injected_count} arquivos atualizados com Scripts de Integração.")
    print(f"-> {replacement_count} placeholders de links resolvidos.")

if __name__ == "__main__":
    inject_dependencies()
