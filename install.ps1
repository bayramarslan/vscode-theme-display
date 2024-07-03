# En son sürümü bul
$scriptDir = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition

$latestVersion = Get-ChildItem -Path $extensionFolder -Filter "theme-display-*.vsix" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($latestVersion -ne $null) {
    # Eğer en son sürüm bulunduysa yükle
    code --install-extension $latestVersion.FullName
} else {
    Write-Output "File not found."
}
