@echo off
chcp 65001 >nul
title PokeScanner BR - TCGdex HD + LigaPokemon (R$)
cd /d "%~dp0"

echo ==========================================================
echo   POKESCANNER BR - POKEMON TCG (TCGdex + LigaPokemon R$)
echo ==========================================================
echo.

:: Verifica se o servidor ja esta rodando na porta 3001
echo [1/2] Verificando servidor PokeScanner BR...
powershell -NoProfile -Command "try { $r = [System.Net.WebRequest]::Create('http://127.0.0.1:3001/api/session'); $r.Timeout = 1200; $resp = $r.GetResponse(); $resp.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 (
    echo [SERVIDOR] Iniciando servidor Node.js em segundo plano...
    start /min "PokeScanner_Server" cmd /c "cd /d ""%~dp0"" && node server.js"
    echo [SERVIDOR] Aguardando servidor ficar pronto na porta 3001...
    powershell -NoProfile -Command "$ready = $false; for ($i = 0; $i -lt 20; $i++) { try { $r = [System.Net.WebRequest]::Create('http://127.0.0.1:3001/api/session'); $r.Timeout = 800; $resp = $r.GetResponse(); $resp.Close(); $ready = $true; break } catch { Start-Sleep -Milliseconds 500 } }; if ($ready) { exit 0 } else { exit 1 }" >nul 2>&1
    if %errorlevel% neq 0 (
        echo [AVISO] Servidor ainda inicializando; abrindo navegador mesmo assim...
    )
) else (
    echo [SERVIDOR] Servidor PokeScanner BR ja esta ativo em http://127.0.0.1:3001
)

:: Abre a interface no navegador padrao
echo [2/2] Abrindo interface no navegador (http://127.0.0.1:3001)...
start "" "http://127.0.0.1:3001"
