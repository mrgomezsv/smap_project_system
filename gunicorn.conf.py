# Configuración de Gunicorn para producción
import multiprocessing
import os

# Configuración básica
bind = "127.0.0.1:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 2

# Configuración de logging
#accesslog = "logs/gunicorn_access.log"
#errorlog = "logs/gunicorn_error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Configuración de seguridad
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Configuración de procesos
preload_app = True
daemon = False

# Configuración de SSL (si es necesario)
# keyfile = "/path/to/keyfile"
# certfile = "/path/to/certfile"

# Configuración de usuario/grupo (si es necesario)
# user = "www-data"
# group = "www-data"

# Configuración de archivos temporales
tmp_upload_dir = None

# Configuración de hooks
def on_starting(server):
    server.log.info("🚀 Iniciando servidor Gunicorn...")

def on_reload(server):
    server.log.info("🔄 Recargando servidor Gunicorn...")

def worker_int(worker):
    worker.log.info("👷 Worker recibió SIGINT o SIGQUIT")

def pre_fork(server, worker):
    server.log.info("🔧 Worker %s está siendo creado", worker.pid)

def post_fork(server, worker):
    server.log.info("✅ Worker %s ha sido creado", worker.pid)

def post_worker_init(worker):
    worker.log.info("🎯 Worker %s ha sido inicializado", worker.pid)

def worker_abort(worker):
    worker.log.info("💥 Worker %s ha sido abortado", worker.pid) 