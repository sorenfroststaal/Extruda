param(
    [string]$GoldfishSource = 'D:\OneDrive\003_Dokumenter\002_Projekter\FreeCAD addons\Plasticity like workbench'
)

$ErrorActionPreference = 'Stop'

$installerRoot = $PSScriptRoot
$siteRoot = Split-Path -Parent $installerRoot
$outputRoot = Join-Path $siteRoot 'download'
$compiler = 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe'
$frameworkRoot = 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319'
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('GoldfishSetup-build-' + [guid]::NewGuid().ToString('N'))
$payloadRoot = Join-Path $tempRoot 'payload'
$payloadZip = Join-Path $tempRoot 'Goldfish.zip'
$setupPath = Join-Path $outputRoot 'GoldfishSetup.exe'
$checksumPath = Join-Path $outputRoot 'GoldfishSetup.exe.sha256'

if (-not (Test-Path -LiteralPath $compiler)) {
    throw "C# compiler not found: $compiler"
}
if (-not (Test-Path -LiteralPath (Join-Path $GoldfishSource 'package.xml'))) {
    throw "Goldfish source not found: $GoldfishSource"
}

try {
    New-Item -ItemType Directory -Path $payloadRoot -Force | Out-Null
    New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null

    Get-ChildItem -LiteralPath $GoldfishSource -Filter 'Goldfish*.py' -File | Copy-Item -Destination $payloadRoot
    Copy-Item -LiteralPath (Join-Path $GoldfishSource 'Init.py') -Destination $payloadRoot
    Copy-Item -LiteralPath (Join-Path $GoldfishSource 'InitGui.py') -Destination $payloadRoot
    Copy-Item -LiteralPath (Join-Path $GoldfishSource 'LICENSE') -Destination $payloadRoot
    Copy-Item -LiteralPath (Join-Path $GoldfishSource 'package.xml') -Destination $payloadRoot
    Copy-Item -LiteralPath (Join-Path $GoldfishSource 'README.md') -Destination $payloadRoot
    Copy-Item -LiteralPath (Join-Path $GoldfishSource 'Resources') -Destination $payloadRoot -Recurse

    Compress-Archive -Path (Join-Path $payloadRoot '*') -DestinationPath $payloadZip -CompressionLevel Optimal

    $compilerArgs = @(
        '/nologo',
        '/target:winexe',
        '/platform:x64',
        '/optimize+',
        "/out:$setupPath",
        "/resource:$payloadZip,Goldfish.zip",
        "/win32manifest:$(Join-Path $installerRoot 'app.manifest')",
        "/win32icon:$(Join-Path $siteRoot 'Assets\Img\favicon.ico')",
        "/reference:$(Join-Path $frameworkRoot 'System.Windows.Forms.dll')",
        "/reference:$(Join-Path $frameworkRoot 'System.Drawing.dll')",
        "/reference:$(Join-Path $frameworkRoot 'System.IO.Compression.dll')",
        "/reference:$(Join-Path $frameworkRoot 'System.IO.Compression.FileSystem.dll')",
        (Join-Path $installerRoot 'Program.cs')
    )

    & $compiler @compilerArgs
    if ($LASTEXITCODE -ne 0) {
        throw "C# compiler failed with exit code $LASTEXITCODE"
    }

    $hash = Get-FileHash -LiteralPath $setupPath -Algorithm SHA256
    Set-Content -LiteralPath $checksumPath -Value ($hash.Hash.ToLowerInvariant() + '  GoldfishSetup.exe') -Encoding ascii
    Write-Output "Built $setupPath"
    Write-Output "SHA256 $($hash.Hash.ToLowerInvariant())"
}
finally {
    $resolvedTemp = [System.IO.Path]::GetFullPath($tempRoot)
    $resolvedSystemTemp = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
    if ($resolvedTemp.StartsWith($resolvedSystemTemp, [System.StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $resolvedTemp)) {
        Remove-Item -LiteralPath $resolvedTemp -Recurse -Force
    }
}
