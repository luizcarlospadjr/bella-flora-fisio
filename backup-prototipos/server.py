# server.py - Servidor HTTP e Banco de Dados Local em Tempo Real para Bella Flora Fisio
import http.server
import json
import os
import urllib.parse
import threading
import socketserver

# Banco de dados em memória com thread-safety
db_lock = threading.Lock()
db = {
    "chats": {},            # { "chat_id": [messages...] }
    "patient_states": {},   # { "patient_id": state_dict }
    "appointments": []      # [appointments...]
}

# Carregar banco de dados do arquivo JSON local para persistência se existir
DB_FILE = "local_db.json"
if os.path.exists(DB_FILE):
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            db = json.load(f)
            # Garantir chaves principais
            if "chats" not in db: db["chats"] = {}
            if "patient_states" not in db: db["patient_states"] = {}
            if "appointments" not in db: db["appointments"] = []
            print(f"[Database] Banco de dados carregado com sucesso do {DB_FILE}")
    except Exception as e:
        print(f"[Database] Nao foi possivel carregar {DB_FILE}, iniciando novo: {e}")

def save_db():
    with db_lock:
        try:
            with open(DB_FILE, "w", encoding="utf-8") as f:
                json.dump(db, f, indent=4, ensure_ascii=False)
        except Exception as e:
            print(f"[Database] Erro ao salvar banco de dados: {e}")

class BellaFloraHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Habilitar CORS para permitir testes e conexões externas fáceis
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        # Responder requisições pre-flight do CORS
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query = urllib.parse.parse_qs(parsed_url.query)

        # Rota de API do Chat
        if path == "/api/chat":
            chat_id = query.get("id", ["default"])[0]
            with db_lock:
                messages = db["chats"].get(chat_id, [])
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(messages, ensure_ascii=False).encode('utf-8'))
            return

        # Rota de API do Estado de Saúde do Paciente (ex: Dor)
        elif path == "/api/patient_state":
            patient_id = query.get("id", ["default"])[0]
            with db_lock:
                state = db["patient_states"].get(patient_id, {})
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(state, ensure_ascii=False).encode('utf-8'))
            return

        # Rota de API de Agendamentos/Consultas
        elif path == "/api/appointments":
            with db_lock:
                appointments = db["appointments"]
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(appointments, ensure_ascii=False).encode('utf-8'))
            return

        # Servir os arquivos estáticos normalmente (index.html, css, js, etc)
        super().do_GET()

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query = urllib.parse.parse_qs(parsed_url.query)

        if path.startswith("/api/"):
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
            except Exception:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b"Invalid JSON")
                return

            # Adicionar mensagem no chat
            if path == "/api/chat":
                chat_id = query.get("id", ["default"])[0]
                with db_lock:
                    if chat_id not in db["chats"]:
                        db["chats"][chat_id] = []
                    db["chats"][chat_id].append(data)
                save_db()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "ok"}).encode('utf-8'))
                return

            # Atualizar estado do paciente (nível de dor, último exercício)
            elif path == "/api/patient_state":
                patient_id = query.get("id", ["default"])[0]
                with db_lock:
                    if patient_id not in db["patient_states"]:
                        db["patient_states"][patient_id] = {}
                    db["patient_states"][patient_id].update(data)
                save_db()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "ok"}).encode('utf-8'))
                return

            # Adicionar ou atualizar agendamento
            elif path == "/api/appointments":
                with db_lock:
                    # Se já existir um agendamento com o mesmo ID, atualizar, caso contrário, anexar
                    existing_idx = -1
                    for idx, app in enumerate(db["appointments"]):
                        if app.get("id") == data.get("id"):
                            existing_idx = idx
                            break
                    if existing_idx != -1:
                        db["appointments"][existing_idx].update(data)
                    else:
                        db["appointments"].append(data)
                save_db()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "ok"}).encode('utf-8'))
                return

        self.send_response(404)
        self.end_headers()

    def do_DELETE(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query = urllib.parse.parse_qs(parsed_url.query)

        # Cancelar/Remover agendamento
        if path == "/api/appointments":
            app_id = query.get("id", [""])[0]
            if app_id:
                with db_lock:
                    db["appointments"] = [app for app in db["appointments"] if app.get("id") != app_id]
                save_db()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "deleted"}).encode('utf-8'))
                return

        self.send_response(404)
        self.end_headers()

class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

def run(port=5173):
    server_address = ('', port)
    # Reutilizar a porta imediatamente para evitar erros "Address already in use"
    ThreadingHTTPServer.allow_reuse_address = True
    httpd = ThreadingHTTPServer(server_address, BellaFloraHandler)
    print(f"\n=======================================================")
    print(f" BELLA FLORA FISIO - SERVIDOR COM BANCO DE DADOS LOCAL")
    print(f" Servindo estáticos e API em: http://localhost:{port}")
    print(f"=======================================================\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nDesligando servidor...")
        httpd.server_close()

if __name__ == '__main__':
    run()
