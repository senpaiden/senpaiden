import os
import sys
import time
import subprocess
import threading
from collections import deque
import psutil
import gradio as gr

try:
    import spaces
    HAS_SPACES = True
except ImportError:
    HAS_SPACES = False

if HAS_SPACES:
    @spaces.GPU
    def dummy_gpu_check():
        """Dummy GPU function required by HF ZeroGPU startup watchdog"""
        return "ZeroGPU Active"

# Ring buffer for worker logs (keep last 300 lines)
LOG_BUFFER = deque(maxlen=300)
WORKER_PROCESS = None
WORKER_START_TIME = None
PROCESS_LOCK = threading.Lock()

def add_log(msg: str):
    timestamp = time.strftime("[%Y-%m-%d %H:%M:%S]")
    entry = f"{timestamp} {msg}"
    LOG_BUFFER.append(entry)
    print(entry, flush=True)

def read_stream(stream, prefix="[Worker]"):
    """Background thread worker to read subprocess stdout/stderr"""
    for line in iter(stream.readline, ''):
        if line:
            add_log(f"{prefix} {line.strip()}")
    stream.close()

def ensure_npm_dependencies():
    """Ensure node_modules exists, install dependencies if missing"""
    if not os.path.exists("node_modules"):
        add_log("[Supervisor] node_modules not found. Running 'npm ci'...")
        try:
            res = subprocess.run(["npm", "ci"], capture_output=True, text=True, timeout=120)
            if res.returncode == 0:
                add_log("[Supervisor] 'npm ci' completed successfully.")
            else:
                add_log(f"[Supervisor] 'npm ci' failed: {res.stderr}. Trying 'npm install'...")
                subprocess.run(["npm", "install"], capture_output=True, text=True, timeout=120)
        except Exception as e:
            add_log(f"[Supervisor] Exception during npm install: {e}")
    else:
        add_log("[Supervisor] node_modules directory verified.")

def start_worker_process():
    global WORKER_PROCESS, WORKER_START_TIME
    with PROCESS_LOCK:
        if WORKER_PROCESS is not None and WORKER_PROCESS.poll() is None:
            return "Worker is already running."

        ensure_npm_dependencies()
        add_log("[Supervisor] Spawning Node.js Worker engine (npx tsx src/index.ts)...")
        
        try:
            # Set PORT=7861 so Node Express doesn't conflict with Gradio on 7860
            env = os.environ.copy()
            env["PORT"] = "7861"

            WORKER_PROCESS = subprocess.Popen(
                ["npx", "tsx", "src/index.ts"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                env=env
            )
            WORKER_START_TIME = time.time()

            threading.Thread(target=read_stream, args=(WORKER_PROCESS.stdout, "[Worker Out]"), daemon=True).start()
            threading.Thread(target=read_stream, args=(WORKER_PROCESS.stderr, "[Worker Err]"), daemon=True).start()

            add_log(f"[Supervisor] Worker process started with PID {WORKER_PROCESS.pid}")
            return f"Started worker (PID {WORKER_PROCESS.pid})"
        except Exception as e:
            add_log(f"[Supervisor] Failed to start worker process: {e}")
            return f"Error: {e}"

def stop_worker_process():
    global WORKER_PROCESS, WORKER_START_TIME
    with PROCESS_LOCK:
        if WORKER_PROCESS is None or WORKER_PROCESS.poll() is not None:
            WORKER_PROCESS = None
            return "Worker is not running."

        add_log(f"[Supervisor] Terminating worker process PID {WORKER_PROCESS.pid}...")
        try:
            WORKER_PROCESS.terminate()
            try:
                WORKER_PROCESS.wait(timeout=5)
            except subprocess.TimeoutExpired:
                WORKER_PROCESS.kill()
            add_log("[Supervisor] Worker process stopped.")
        except Exception as e:
            add_log(f"[Supervisor] Error stopping worker: {e}")
        finally:
            WORKER_PROCESS = None
            WORKER_START_TIME = None

    return "Worker stopped."

def restart_worker_process():
    stop_worker_process()
    time.sleep(1)
    return start_worker_process()

def supervisor_thread():
    """Background supervisor: Auto-restarts worker if it crashes unexpectedly"""
    global WORKER_PROCESS
    while True:
        time.sleep(10)
        with PROCESS_LOCK:
            if WORKER_PROCESS is not None and WORKER_PROCESS.poll() is not None:
                exit_code = WORKER_PROCESS.poll()
                add_log(f"[Supervisor WARNING] Worker process exited unexpectedly with code {exit_code}. Auto-restarting...")
                WORKER_PROCESS = None
                start_worker_process()

# Launch background supervisor thread
threading.Thread(target=supervisor_thread, daemon=True).start()

# Auto-start worker on launch
start_worker_process()

def get_telemetry():
    is_running = WORKER_PROCESS is not None and WORKER_PROCESS.poll() is None
    status_str = "🟢 RUNNING" if is_running else "🔴 STOPPED"
    pid_str = str(WORKER_PROCESS.pid) if is_running else "N/A"
    
    if is_running and WORKER_START_TIME:
        uptime_sec = int(time.time() - WORKER_START_TIME)
        uptime_str = f"{uptime_sec // 60}m {uptime_sec % 60}s"
    else:
        uptime_str = "0s"

    try:
        cpu_usage = f"{psutil.cpu_percent(interval=None)}%"
        mem_info = psutil.virtual_memory()
        mem_usage = f"{mem_info.used // (1024*1024)}MB / {mem_info.total // (1024*1024)}MB ({mem_info.percent}%)"
    except Exception:
        cpu_usage = "N/A"
        mem_usage = "N/A"

    return status_str, pid_str, uptime_str, cpu_usage, mem_usage

def get_logs():
    return "\n".join(LOG_BUFFER) or "No logs recorded yet."

# ── Gradio UI ──────────────────────────────────────────────────────────────────
with gr.Blocks(title="Senpai Den Worker Engine", theme=gr.themes.Soft()) as demo:
    gr.Markdown(
        """
        # 🥷 Senpai Den — Image Processing Worker Engine
        **Status & Telemetry Dashboard for Hugging Face Space (ZeroGPU)**
        """
    )

    with gr.Row():
        status_box = gr.Textbox(label="Worker Status", value="Checking...", interactive=False)
        pid_box = gr.Textbox(label="Process PID", value="N/A", interactive=False)
        uptime_box = gr.Textbox(label="Uptime", value="0s", interactive=False)
        cpu_box = gr.Textbox(label="System CPU", value="N/A", interactive=False)
        mem_box = gr.Textbox(label="System RAM", value="N/A", interactive=False)

    with gr.Row():
        btn_refresh = gr.Button("🔄 Refresh Telemetry & Logs", variant="primary")
        btn_restart = gr.Button("⚡ Restart Worker", variant="warning")
        btn_stop = gr.Button("⏹️ Stop Worker", variant="stop")
        btn_start = gr.Button("▶️ Start Worker", variant="secondary")

    gr.Markdown("### 📜 Real-Time Worker Console Logs")
    log_viewer = gr.Code(label="Console Output", language="shell", value=get_logs, interactive=False, lines=18)

    # Event handlers
    def update_all():
        s, p, u, c, m = get_telemetry()
        logs = get_logs()
        return s, p, u, c, m, logs

    btn_refresh.click(fn=update_all, outputs=[status_box, pid_box, uptime_box, cpu_box, mem_box, log_viewer])
    
    def on_restart():
        restart_worker_process()
        return update_all()

    def on_stop():
        stop_worker_process()
        return update_all()

    def on_start():
        start_worker_process()
        return update_all()

    btn_restart.click(fn=on_restart, outputs=[status_box, pid_box, uptime_box, cpu_box, mem_box, log_viewer])
    btn_stop.click(fn=on_stop, outputs=[status_box, pid_box, uptime_box, cpu_box, mem_box, log_viewer])
    btn_start.click(fn=on_start, outputs=[status_box, pid_box, uptime_box, cpu_box, mem_box, log_viewer])

    # Auto-refresh telemetry on load
    demo.load(fn=update_all, outputs=[status_box, pid_box, uptime_box, cpu_box, mem_box, log_viewer])

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
