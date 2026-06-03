# ============================================================
# TileMaster Pro - Dev Launcher (with mobile network support)
# ============================================================

# Step 1: Open Firewall ports for mobile access (runs as admin check)
Write-Host "`n[1/3] Opening Windows Firewall ports 3000 & 8000..." -ForegroundColor Cyan

$rule3000 = Get-NetFirewallRule -DisplayName "TileMaster Frontend 3000" -ErrorAction SilentlyContinue
if (-not $rule3000) {
    New-NetFirewallRule -DisplayName "TileMaster Frontend 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow | Out-Null
    Write-Host "  -> Port 3000 (Next.js) rule ADDED" -ForegroundColor Green
} else {
    Write-Host "  -> Port 3000 rule already exists" -ForegroundColor Gray
}

$rule8000 = Get-NetFirewallRule -DisplayName "TileMaster Backend 8000" -ErrorAction SilentlyContinue
if (-not $rule8000) {
    New-NetFirewallRule -DisplayName "TileMaster Backend 8000" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow | Out-Null
    Write-Host "  -> Port 8000 (FastAPI) rule ADDED" -ForegroundColor Green
} else {
    Write-Host "  -> Port 8000 rule already exists" -ForegroundColor Gray
}

# Step 2: Get and display the local Wi-Fi IP address
Write-Host "`n[2/3] Detecting your local IP address..." -ForegroundColor Cyan
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.InterfaceAlias -notlike "*Loopback*" -and
    $_.InterfaceAlias -notlike "*WSL*" -and
    $_.InterfaceAlias -notlike "*VirtualBox*" -and
    $_.IPAddress -notlike "169.*"
} | Select-Object -First 1).IPAddress

if ($localIP) {
    Write-Host ""
    Write-Host "  =================================================" -ForegroundColor Yellow
    Write-Host "  |  Open on your phone:                          |" -ForegroundColor Yellow
    Write-Host "  |                                               |" -ForegroundColor Yellow
    Write-Host "  |   http://$($localIP):3000   |" -ForegroundColor White
    Write-Host "  |                                               |" -ForegroundColor Yellow
    Write-Host "  |  (Phone must be on same Wi-Fi network)        |" -ForegroundColor Yellow
    Write-Host "  =================================================" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "  Could not detect IP. Run 'ipconfig' manually to find your IPv4 address." -ForegroundColor Red
}

# Step 3: Start FastAPI Backend in a new window
Write-Host "[3/3] Starting servers..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "Write-Host 'FastAPI Backend running on http://0.0.0.0:8000' -ForegroundColor Green; Set-Location 'C:\Personal_Work\Tile_box_calculator\backend'; .\venv\Scripts\python.exe main.py" -WindowStyle Normal

# Start Next.js Frontend in current window
Write-Host "  -> Next.js starting on http://0.0.0.0:3000" -ForegroundColor Green
Set-Location "C:\Personal_Work\Tile_box_calculator\frontend"
npm run dev