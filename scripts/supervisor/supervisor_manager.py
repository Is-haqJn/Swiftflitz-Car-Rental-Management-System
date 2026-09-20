import subprocess
import sys
import time
import os

VENV_BIN       = "/home/ordaq/virtualenv/scripts.ordaq.com/3.13/bin"
SUPERVISORD    = f"{VENV_BIN}/supervisord"
SUPERVISORCTL  = f"{VENV_BIN}/supervisorctl"
CONF           = "/home/ordaq/swiftflitzapi.ordaq.com/scripts/supervisor/supervisord.conf"
PID_FILE       = "/tmp/ordaq-supervisord.pid"


def is_running() -> bool:
    if not os.path.exists(PID_FILE):
        return False
    try:
        with open(PID_FILE) as f:
            pid = int(f.read().strip())
        os.kill(pid, 0)
        return True
    except (ValueError, ProcessLookupError, PermissionError):
        return False


def ctl(*args) -> int:
    result = subprocess.run(
        [SUPERVISORCTL, "-c", CONF, *args],
        capture_output=True, text=True,
    )
    if result.stdout.strip():
        print(result.stdout.strip())
    if result.stderr.strip():
        print(result.stderr.strip())
    return result.returncode


def stop() -> None:
    if is_running():
        print("Stopping managed processes...")
        ctl("stop", "all")
        print("Shutting down supervisord...")
        ctl("shutdown")
        time.sleep(2)

    result = subprocess.run(
        ["pkill", "-f", f"supervisord.*{CONF}"],
        capture_output=True,
    )
    if result.returncode == 0:
        print("supervisord killed via pkill.")


def start() -> None:
    result = subprocess.run(
        [SUPERVISORD, "-c", CONF],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print(f"Failed to start supervisord: {result.stderr.strip()}")
        sys.exit(1)
    time.sleep(1)
    if is_running():
        print("supervisord started successfully.")
    else:
        print("supervisord started but PID file not found - check logs.")


def ensure() -> None:
    """Start only if not already running. Safe for cron."""
    if is_running():
        print("supervisord is running - OK.")
        return
    print("supervisord not running - starting...")
    start()


def restart() -> None:
    stop()
    print("Waiting 3 seconds...")
    time.sleep(3)
    start()


COMMANDS = {"ensure": ensure, "start": start, "stop": stop, "restart": restart}

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "ensure"
    if cmd not in COMMANDS:
        print(f"Usage: python supervisor_manager.py [{' | '.join(COMMANDS)}]")
        sys.exit(1)
    COMMANDS[cmd]()
