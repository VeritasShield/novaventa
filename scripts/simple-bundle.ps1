$ErrorActionPreference = 'Stop'

$filesInOrder = @(
  "src/nv_namespace.js",
  "src/state.js",
  "src/utils.js",
  "src/renderers.js",
  "src/exporters.js",
  "automation_novaventa"
)

if (!(Test-Path -Path "dist")) { New-Item -ItemType Directory -Path "dist" | Out-Null }

$header = @(
  "// Bundled for MV3 (simple concat)",
  "// Generated: $(Get-Date -Format o)",
  "(function(){ /* bundle-scope */"
) -join "`n"

$footer = "})();`n"

Set-Content -Path "dist/content.js" -Value $header -Encoding UTF8

foreach ($f in $filesInOrder) {
  if (!(Test-Path -Path $f)) {
    throw "File not found: $f"
  }
  Add-Content -Path "dist/content.js" -Value "`n// ===== $f =====`n" -Encoding UTF8
  $src = Get-Content -Path $f -Raw -Encoding UTF8
  Add-Content -Path "dist/content.js" -Value $src -Encoding UTF8
}

Add-Content -Path "dist/content.js" -Value $footer -Encoding UTF8
Write-Host "Bundle created at dist/content.js"
