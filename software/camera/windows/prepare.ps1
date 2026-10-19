$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$tools = Join-Path $root '.tools'
New-Item -ItemType Directory -Force -Path $tools | Out-Null
$packages = @(
    @{ Name='webview2'; Package='microsoft.web.webview2'; Version='1.0.3537.50'; SHA256='5EA526BBD728ADDA0DA4D31219267E96460494A427E4894C4E09D9F320F4B9AA' },
    @{ Name='wil'; Package='microsoft.windows.implementationlibrary'; Version='1.0.260126.7'; SHA256='7D67BC71DD0EDC342DB44EA0334AC9B6A1776514F81694B0B5B3C7AC9D608E42' },
    @{ Name='cppwinrt'; Package='microsoft.windows.cppwinrt'; Version='3.0.260818.1'; SHA256='A8993608AE9263A8288E1A1D9EE2684A5632F4ACC59E1E89DDD86B3B889A7367' }
)
foreach ($package in $packages) {
    $archive = Join-Path $tools ($package.Name + '.zip')
    if (-not (Test-Path -LiteralPath $archive)) {
        $url = 'https://api.nuget.org/v3-flatcontainer/{0}/{1}/{0}.{1}.nupkg' -f $package.Package,$package.Version
        Invoke-WebRequest -Uri $url -OutFile $archive
    }
    if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne $package.SHA256) { throw "Checksum mismatch: $($package.Package)" }
    Expand-Archive -LiteralPath $archive -DestinationPath (Join-Path $tools $package.Name) -Force
}
Write-Host 'Pinned Microsoft SDK packages ready. Run windows\build.cmd.'
