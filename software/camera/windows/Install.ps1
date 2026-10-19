#Requires -RunAsAdministrator
$ErrorActionPreference = 'Stop'
$destination = Join-Path $env:ProgramFiles 'Extruda Phone Camera'
New-Item -ItemType Directory -Path $destination -Force | Out-Null
foreach ($name in @('ExtrudaCamera.exe','ExtrudaCamera.dll','UPSTREAM-LICENSE.txt','THIRD_PARTY_NOTICES.txt','LICENSE.txt','README.md','Uninstall.ps1')) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot $name) -Destination (Join-Path $destination $name) -Force
}
$register = Start-Process -FilePath "$env:SystemRoot\System32\regsvr32.exe" -ArgumentList '/s',('"' + (Join-Path $destination 'ExtrudaCamera.dll') + '"') -Wait -PassThru -WindowStyle Hidden
if ($register.ExitCode -ne 0) { throw "Camera registration failed: $($register.ExitCode)" }
$shortcut = (New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path ([Environment]::GetFolderPath('CommonPrograms')) 'Extruda Phone Camera.lnk'))
$shortcut.TargetPath = Join-Path $destination 'ExtrudaCamera.exe'
$shortcut.WorkingDirectory = $destination
$shortcut.Save()
Write-Host "Installed. Open Extruda Phone Camera from the Start menu as your normal Windows user."
