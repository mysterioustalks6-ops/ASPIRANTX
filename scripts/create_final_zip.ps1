# Create complete clean final AspirantX zip archive
$ErrorActionPreference = "Stop"

$zipName = "AspirantX_Final_v2.4.1.zip"
$zipPath = Join-Path (Get-Location) $zipName

Write-Host "Creating base git archive..."
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

# 1. Use git archive for all tracked code files, android app, public APK
& git archive --format=zip -o $zipPath HEAD

# 2. Add pre-built production dist/ folder so it can be run immediately
Write-Host "Adding production dist/ assets..."
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Update')
$distFiles = Get-ChildItem -Path "dist" -Recurse -File

foreach ($f in $distFiles) {
    # Compute relative path like dist/index.html
    $rel = "dist/" + ($f.FullName.Substring((Resolve-Path "dist").Path.Length + 1).Replace("\", "/"))
    # Don't double include aspirantx.apk if present in dist
    if ($rel -eq "dist/aspirantx.apk") { continue }
    
    $existing = $zip.GetEntry($rel)
    if ($existing) { $existing.Delete() }
    
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $f.FullName, $rel) | Out-Null
}

$zip.Dispose()

$fileItem = Get-Item $zipPath
$sizeMB = [math]::Round($fileItem.Length / 1MB, 2)

Write-Host "SUCCESS: Created $zipName ($sizeMB MB) at $zipPath"
