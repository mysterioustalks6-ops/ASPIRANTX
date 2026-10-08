$sh = New-Object -ComObject Shell.Application
$rb = $sh.Namespace(0xa)
foreach ($item in $rb.Items()) {
    if ($item.Name -like "*.mp4" -or $item.Name -like "*gemini*" -or $item.Name -like "*relax*") {
        Write-Host "MATCH:" $item.Name "|" $item.Path
    }
}
