# Goldfish Setup

`GoldfishSetup.exe` is a small Windows bootstrap installer for FreeCAD and Goldfish.

It performs the following steps:

1. Detects FreeCAD 1.1.3 or a newer compatible version.
2. Downloads FreeCAD 1.1.3 from the official FreeCAD GitHub release when needed.
3. Verifies the official Windows installer using its published SHA-256 digest.
4. Installs the embedded Goldfish workbench in FreeCAD's version-specific user module folder.
5. Selects Goldfish as the startup workbench and launches FreeCAD.

An existing Goldfish folder is moved to a timestamped backup before the new version is installed.

## Build

Run `build.ps1`. By default it packages Goldfish from:

`D:\OneDrive\003_Dokumenter\002_Projekter\FreeCAD addons\Plasticity like workbench`

Pass `-GoldfishSource` to package another source directory. The resulting executable and checksum are written to `download/GoldfishSetup.exe` and `download/GoldfishSetup.exe.sha256`.

The executable targets the built-in .NET Framework 4.x runtime on 64-bit Windows, so users do not need to install a separate .NET desktop runtime.
