$latestVersion = Get-ChildItem -Path $extensionFolder -Filter "theme-display-*.vsix" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($latestVersion -ne $null) {
    code --install-extension $latestVersion.FullName
} else {
    Write-Output "File not found."
}
