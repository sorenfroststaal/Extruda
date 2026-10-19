#Requires -RunAsAdministrator
$ErrorActionPreference = 'Stop'
$destination = Join-Path $env:ProgramFiles 'Extruda Phone Camera'
if (Get-Process ExtrudaCamera -ErrorAction SilentlyContinue) { throw 'Close Extruda Phone Camera before uninstalling.' }
$dll = Join-Path $destination 'ExtrudaCamera.dll'
if (Test-Path -LiteralPath $dll) {
    $unregister = Start-Process -FilePath "$env:SystemRoot\System32\regsvr32.exe" -ArgumentList '/s','/u',('"' + $dll + '"') -Wait -PassThru -WindowStyle Hidden
    if ($unregister.ExitCode -ne 0) { throw "Camera unregistration failed: $($unregister.ExitCode)" }
}
$shortcut = Join-Path ([Environment]::GetFolderPath('CommonPrograms')) 'Extruda Phone Camera.lnk'
if (Test-Path -LiteralPath $shortcut) { Remove-Item -LiteralPath $shortcut }
# Only known application files are removed, never a recursively computed folder.
foreach ($name in @('ExtrudaCamera.exe','ExtrudaCamera.dll','UPSTREAM-LICENSE.txt','THIRD_PARTY_NOTICES.txt','LICENSE.txt','README.md','Uninstall.ps1')) {
    $item = Join-Path $destination $name
    if (Test-Path -LiteralPath $item) { Remove-Item -LiteralPath $item }
}
Write-Host 'Extruda camera registration and application files removed. WebView2 user data is retained.'
