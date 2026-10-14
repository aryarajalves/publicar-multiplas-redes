import subprocess
import sys
import os

def run_npm_audit():
    print("--> Executando auditoria do Frontend de Produção (npm audit --omit=dev)...")
    try:
        res = subprocess.run(
            ["npm", "audit", "--omit=dev"],
            cwd="frontend",
            capture_output=True,
            text=True,
            shell=True
        )
        print(res.stdout)
        if res.returncode != 0:
            print("ALERTA: Vulnerabilidades detectadas nas dependências de produção do frontend!")
            return False
        print("Frontend Produção: 0 vulnerabilidades (100% aprovado).")
        return True
    except Exception as e:
        print(f"Erro ao executar npm audit: {e}")
        return False

def run_pip_audit():
    print("\n--> Executando auditoria do Backend (pip-audit no requirements.txt)...")
    try:
        res = subprocess.run(
            [sys.executable, "-m", "pip_audit", "-r", "backend/requirements.txt"],
            capture_output=True,
            text=True
        )
        print(res.stdout or res.stderr)
        if "No known vulnerabilities found" in (res.stdout or "") or res.returncode == 0:
            print("Backend Produção: 0 vulnerabilidades detectadas via pip-audit (100% aprovado).")
            return True
        else:
            print("Aviso no backend audit.")
            return False
    except Exception as e:
        print(f"Erro no pip-audit: {e}")
        return False

if __name__ == "__main__":
    npm_ok = run_npm_audit()
    pip_ok = run_pip_audit()
    if npm_ok and pip_ok:
        print("\n========================================================")
        print("AUDITORIA DE SEGURANÇA APROVADA: 0 VULNERABILIDADES (100%)")
        print("========================================================")
        sys.exit(0)
    else:
        print("\nFalha na auditoria de segurança.")
        sys.exit(1)
