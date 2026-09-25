Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\AMBUJ YADAV\.gemini\antigravity-ide\brain\c9f0432b-27f6-4bd1-baf5-671432de25c4\.user_uploaded\media_1790311209328.jpg"
$baseDir = "c:\Users\AMBUJ YADAV\Documents\Aspirantx"

if (-not (Test-Path $sourcePath)) {
    Write-Error "Source image not found: $sourcePath"
    exit 1
}

$sourceImg = [System.Drawing.Image]::FromFile($sourcePath)

function Resize-Image {
    param(
        [System.Drawing.Image]$Image,
        [int]$Width,
        [int]$Height,
        [string]$DestinationPath,
        [bool]$CircleCrop = $false,
        [bool]$IsForeground = $false
    )

    $targetBitmap = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($targetBitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    if ($CircleCrop) {
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddEllipse(0, 0, $Width, $Height)
        $graphics.SetClip($path)
        $graphics.DrawImage($Image, 0, 0, $Width, $Height)
    } elseif ($IsForeground) {
        # Android adaptive icon foreground is 108dp with a 72dp viewport (center 66.6% safe zone)
        $innerW = [int]($Width * 0.72)
        $innerH = [int]($Height * 0.72)
        $offsetX = [int](($Width - $innerW) / 2)
        $offsetY = [int](($Height - $innerH) / 2)
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.DrawImage($Image, $offsetX, $offsetY, $innerW, $innerH)
    } else {
        $graphics.DrawImage($Image, 0, 0, $Width, $Height)
    }

    $targetBitmap.Save($DestinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $targetBitmap.Dispose()
    Write-Host "Generated: $DestinationPath ($Width x $Height)"
}

# 1. Web Public Icons
Resize-Image -Image $sourceImg -Width 1024 -Height 1024 -DestinationPath "$baseDir\public\logo.png"
Resize-Image -Image $sourceImg -Width 512 -Height 512 -DestinationPath "$baseDir\public\pwa-512x512.png"
Resize-Image -Image $sourceImg -Width 512 -Height 512 -DestinationPath "$baseDir\public\pwa-512x512-maskable.png"
Resize-Image -Image $sourceImg -Width 192 -Height 192 -DestinationPath "$baseDir\public\pwa-192x192.png"
Resize-Image -Image $sourceImg -Width 180 -Height 180 -DestinationPath "$baseDir\public\apple-touch-icon.png"
Resize-Image -Image $sourceImg -Width 64 -Height 64 -DestinationPath "$baseDir\public\favicon.png"
Resize-Image -Image $sourceImg -Width 32 -Height 32 -DestinationPath "$baseDir\public\favicon.ico"

# 2. Android mipmap icons
$densities = @(
    @{ Name = "mdpi"; Size = 48; FgSize = 108 },
    @{ Name = "hdpi"; Size = 72; FgSize = 162 },
    @{ Name = "xhdpi"; Size = 96; FgSize = 216 },
    @{ Name = "xxhdpi"; Size = 144; FgSize = 324 },
    @{ Name = "xxxhdpi"; Size = 192; FgSize = 432 }
)

foreach ($d in $densities) {
    $folder = "$baseDir\android\app\src\main\res\mipmap-$($d.Name)"
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
    }

    Resize-Image -Image $sourceImg -Width $d.Size -Height $d.Size -DestinationPath "$folder\ic_launcher.png"
    Resize-Image -Image $sourceImg -Width $d.Size -Height $d.Size -DestinationPath "$folder\ic_launcher_round.png" -CircleCrop $true
    Resize-Image -Image $sourceImg -Width $d.FgSize -Height $d.FgSize -DestinationPath "$folder\ic_launcher_foreground.png" -IsForeground $true
}

$sourceImg.Dispose()
Write-Host "All icons generated successfully!"
