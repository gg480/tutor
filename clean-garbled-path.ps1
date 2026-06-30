# 清理 ClaudeCode 生成的中文路径混乱目录
# 检测 C:\ClaudeState\ 下包含连续短横线的畸形目录并自动删除
# 用法: powershell -ExecutionPolicy Bypass -File clean-garbled-path.ps1

$garbledPaths = Get-ChildItem -Path "C:\ClaudeState" -Directory | Where-Object {
  $_.Name -match '-{3,}'
}

if ($garbledPaths.Count -eq 0) {
  exit 0
}

foreach ($path in $garbledPaths) {
  Remove-Item -Path $path.FullName -Recurse -Force -ErrorAction SilentlyContinue
}
