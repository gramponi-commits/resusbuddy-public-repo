param(
  [string]$SourceRef = "main",
  [string]$PublicRepoPath = "C:\Users\User\acl-assist-now-public-030b2c3",
  [switch]$Push,
  [string]$CommitMessage
)

$ErrorActionPreference = "Stop"

function Test-DeniedPath {
  param([string]$RelativePath)

  $p = $RelativePath -replace "\\", "/"

  # Internal/private tooling and artifacts
  if ($p.StartsWith(".claude/")) { return $true }
  if ($p.StartsWith(".factory/")) { return $true }
  if ($p.StartsWith(".ralph-tui/")) { return $true }
  if ($p.StartsWith("DEPLOYMENT_ASSETS/")) { return $true }
  if ($p.StartsWith("android/wear/")) { return $true }
  if ($p.StartsWith("android/app/release/")) { return $true }

  # Specific files never intended for public sync
  if ($p -eq "CLAUDE.md") { return $true }
  if ($p -eq "agents.md") { return $true }
  if ($p -eq "NEW_MAIN_SCREEN_KT.txt") { return $true }
  if ($p -eq "prd-wearos-review.json") { return $true }
  if ($p -eq "bun.lockb") { return $true }
  if ($p -eq "(") { return $true }

  # Wear bridge implementation and related files
  if ($p -eq "android/app/src/main/java/com/resusbuddy/training/wear/WearBridgePlugin.java") { return $true }
  if ($p -eq "src/hooks/useWearSync.ts") { return $true }
  if ($p -eq "src/plugins/wear-bridge.ts") { return $true }
  if ($p -eq "src/types/wear-sync.ts") { return $true }

  # Backup/scratch naming
  if ($p.EndsWith(".backup")) { return $true }
  if ($p.EndsWith(".old")) { return $true }

  # Markdown policy: keep only root README.md
  if ($p.EndsWith(".md") -and $p -ne "README.md") { return $true }

  return $false
}

function Remove-DeniedFiles {
  param([string]$RootPath)

  $files = Get-ChildItem -Path $RootPath -Recurse -File
  foreach ($file in $files) {
    $relative = $file.FullName.Substring($RootPath.Length).TrimStart("\", "/")
    if (Test-DeniedPath -RelativePath $relative) {
      Remove-Item -LiteralPath $file.FullName -Force
    }
  }
}

Write-Host "Validating source ref '$SourceRef'..."
git rev-parse --verify $SourceRef | Out-Null
$sourceSha = (git rev-parse --short $SourceRef).Trim()

if (-not (Test-Path $PublicRepoPath)) {
  throw "Public repo path does not exist: $PublicRepoPath"
}
if (-not (Test-Path (Join-Path $PublicRepoPath ".git"))) {
  throw "Target is not a git repository: $PublicRepoPath"
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$tmpRoot = Join-Path $env:TEMP "resusbuddy-public-sync-$stamp"
$archivePath = Join-Path $tmpRoot "snapshot.zip"
$extractPath = Join-Path $tmpRoot "extract"

New-Item -Path $tmpRoot -ItemType Directory | Out-Null
New-Item -Path $extractPath -ItemType Directory | Out-Null

try {
  Write-Host "Creating archive from $SourceRef ($sourceSha)..."
  git archive --format=zip --output $archivePath $SourceRef
  Expand-Archive -Path $archivePath -DestinationPath $extractPath -Force

  Write-Host "Filtering denied paths..."
  Remove-DeniedFiles -RootPath $extractPath

  Write-Host "Mirroring filtered snapshot to public repo..."
  robocopy $extractPath $PublicRepoPath /MIR /XD ".git" /NFL /NDL /NJH /NJS /NP | Out-Null
  $robocopyCode = $LASTEXITCODE
  if ($robocopyCode -gt 7) {
    throw "Robocopy failed with exit code $robocopyCode"
  }

  git -C $PublicRepoPath add -A
  git -C $PublicRepoPath diff --cached --quiet
  $hasChanges = $LASTEXITCODE -ne 0

  if (-not $hasChanges) {
    Write-Host "No public-repo changes detected after filtering."
    return
  }

  if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    $CommitMessage = "Public sync from $SourceRef @ $sourceSha"
  }

  git -C $PublicRepoPath commit -m $CommitMessage
  Write-Host "Committed changes in public repo."

  if ($Push) {
    git -C $PublicRepoPath push
    Write-Host "Pushed to public remote."
  } else {
    Write-Host "Push skipped. Run with -Push to publish."
  }
}
finally {
  if (Test-Path $tmpRoot) {
    Remove-Item -LiteralPath $tmpRoot -Recurse -Force
  }
}
