# 🌿 Planta y Raíz — Injetor Automático no Console do WhatsApp Web
Add-Type -AssemblyName System.Windows.Forms

$jsPath = "c:\Users\ricod\Documents\Planta y Raiz Ltda\scratch\whatsapp_browser_script.js"
if (!(Test-Path $jsPath)) {
    Write-Host "❌ Arquivo do script JS não encontrado."
    exit 1
}

$jsCode = Get-Content -Path $jsPath -Raw

# 1. Copiar o código JavaScript para a área de transferência (Clipboard)
[System.Windows.Forms.Clipboard]::SetText($jsCode)

# 2. Localizar o processo do Chrome que possui janela ativa
$proc = Get-Process chrome | Where-Object { $_.MainWindowTitle -ne "" } | Select-Object -First 1

if ($proc) {
    Write-Host "✅ Janela do Chrome encontrada (PID: $($proc.Id) - $($proc.MainWindowTitle))"
    
    $wshell = New-Object -ComObject wscript.shell
    $wshell.AppActivate($proc.Id)
    Start-Sleep -Milliseconds 1000

    # Digitar 'allow pasting' para liberar o travamento de cola do Chrome DevTools
    [System.Windows.Forms.SendKeys]::SendWait("allow pasting{ENTER}")
    Start-Sleep -Milliseconds 800

    # Colar o código JavaScript (Ctrl+V) e apertar Enter
    [System.Windows.Forms.SendKeys]::SendWait("^v{ENTER}")
    Start-Sleep -Milliseconds 800

    Write-Host "🚀 Sucesso! O código da automação foi injetado no Console do WhatsApp Web!"
} else {
    Write-Host "⚠️ Não foi possível encontrar a janela ativa do Chrome."
}
