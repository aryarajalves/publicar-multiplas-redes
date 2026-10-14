import time
import signal
import sys
import logging
from app.worker.tasks import process_due_posts_sync

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("worker.scheduler")

_running = True

def handle_signal(sig, frame):
    global _running
    logger.info(f"Sinal de encerramento recebido ({sig}). Parando agendador...")
    _running = False

def run_scheduler(interval_seconds: int = 5):
    """
    Main loop for background worker.
    Runs periodically to check and dispatch scheduled posts.
    """
    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    logger.info("=" * 60)
    logger.info("Social Content Scheduler Worker INICIADO")
    logger.info(f"Verificando publicações agendadas a cada {interval_seconds} segundos...")
    logger.info("=" * 60)

    while _running:
        try:
            process_due_posts_sync()
        except Exception as e:
            logger.error(f"Erro na execução da rotina do agendador: {e}", exc_info=True)
        
        # Sleep em blocos menores para responder rápido a sinais de interrupção
        for _ in range(interval_seconds):
            if not _running:
                break
            time.sleep(1)

    logger.info("Social Content Scheduler Worker FINALIZADO.")

if __name__ == "__main__":
    run_scheduler()
