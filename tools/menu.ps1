# Diptrade menu (PowerShell)
# Run from project root:
# powershell -ExecutionPolicy Bypass -File .\tools\menu.ps1

$Server       = "root@45.128.204.169"
$RemoteJson   = "/var/www/diptrade/runtime/data/cars.json"
$RemotePhotos = "/var/www/diptrade/runtime/assets/cars"

$ProjectRoot  = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$LocalJson    = Join-Path $ProjectRoot "data\cars.json"
$LocalCarsDir = Join-Path $ProjectRoot "assets\cars"

function Pause-AnyKey {
  Write-Host ""
  Write-Host "Press any key..." -ForegroundColor DarkGray
  [void][System.Console]::ReadKey($true)
}

function Ensure-Paths {
  if (!(Test-Path $LocalJson)) {
    Write-Host "Local JSON not found: $LocalJson" -ForegroundColor Red
    Pause-AnyKey
    return $false
  }
  if (!(Test-Path $LocalCarsDir)) {
    Write-Host "Local photos folder not found: $LocalCarsDir" -ForegroundColor Red
    Pause-AnyKey
    return $false
  }
  return $true
}

function Run-Title([string]$title) {
  Clear-Host
  Write-Host $title -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Server: $Server"
  Write-Host "Local JSON: $LocalJson"
  Write-Host "Local photos: $LocalCarsDir"
  Write-Host ""
}

function Run-SSH([string]$remoteCmd) {
  Run-Title "Running SSH command..."
  Write-Host "ssh $Server $remoteCmd" -ForegroundColor Cyan
  & ssh $Server $remoteCmd
  Pause-AnyKey
}

function Run-SCP-UploadJson {
  if (!(Ensure-Paths)) { return }
  Run-Title "Uploading cars.json..."
  Write-Host "scp $LocalJson ${Server}:$RemoteJson" -ForegroundColor Cyan
  & scp $LocalJson "${Server}:$RemoteJson"
  Pause-AnyKey
}

function Run-SCP-DownloadJson {
  Run-Title "Downloading cars.json..."
  $localDir = Split-Path $LocalJson -Parent
  if (!(Test-Path $localDir)) { New-Item -ItemType Directory -Path $localDir | Out-Null }
  Write-Host "scp ${Server}:$RemoteJson $LocalJson" -ForegroundColor Cyan
  & scp "${Server}:$RemoteJson" $LocalJson
  Pause-AnyKey
}

function Run-SCP-UploadPhotos {
  if (!(Ensure-Paths)) { return }
  Run-Title "Uploading photos..."
  # Upload folder contents (keeps folder structure if you have subfolders)
  Write-Host "scp -r $LocalCarsDir\* ${Server}:$RemotePhotos/" -ForegroundColor Cyan
  & scp -r (Join-Path $LocalCarsDir "*") "${Server}:$RemotePhotos/"
  Pause-AnyKey
}

function Run-ListPhotos {
  Run-SSH "ls -la $RemotePhotos"
}

function Run-DeleteAllPhotos {
  Run-Title "DANGER: Delete ALL photos on server"
  Write-Host "This will delete ALL files in: $RemotePhotos" -ForegroundColor Red
  Write-Host ""
  $confirm = Read-Host "Type DELETE to confirm"
  if ($confirm -ne "DELETE") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    Start-Sleep -Seconds 1
    return
  }
  # Use bash -lc to safely run rm in the correct dir (no && needed)
  Run-SSH "bash -lc 'cd $RemotePhotos && rm -rf -- * && echo deleted'"
}

function Show-Menu {
  param([string[]]$items, [int]$selected = 0)

  while ($true) {
    Clear-Host
    Write-Host "Diptrade Menu (Use Up/Down, Enter, Esc)" -ForegroundColor Yellow
    Write-Host "Project: $ProjectRoot"
    Write-Host "Server:  $Server"
    Write-Host ""

    for ($i=0; $i -lt $items.Count; $i++) {
      if ($i -eq $selected) { Write-Host ("  > " + $items[$i]) -ForegroundColor Green }
      else                  { Write-Host ("    " + $items[$i]) }
    }

    $key = [System.Console]::ReadKey($true)
    switch ($key.Key) {
      "UpArrow"   { if ($selected -gt 0) { $selected-- } }
      "DownArrow" { if ($selected -lt ($items.Count-1)) { $selected++ } }
      "Enter"     { return $selected }
      "Escape"    { return -1 }
    }
  }
}

$items = @(
  "Deploy site code (diptrade-deploy)",
  "Upload cars.json to server",
  "Download cars.json from server",
  "Upload ALL photos from assets/cars",
  "List photos on server",
  "DELETE ALL photos on server (DANGER)",
  "Exit"
)



$Quit = $false
while (-not $Quit) {
  $choice = Show-Menu -items $items
  if ($choice -lt 0) { $Quit = $true; break }

  switch ($choice) {
    0 { Run-SSH "diptrade-deploy" }
    1 { Run-SCP-UploadJson }
    2 { Run-SCP-DownloadJson }
    3 { Run-SCP-UploadPhotos }
    4 { Run-ListPhotos }
    5 { Run-DeleteAllPhotos }
    6 { $Quit = $true }
  }
}


Write-Host "Bye!"
