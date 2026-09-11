$ErrorActionPreference = 'Stop'
$manager = 'D:/Projects/flowkit-next/.tmp/onboarding-039-manager/node_modules/flowkit-next'
$metadata = Get-Content -LiteralPath (Join-Path $manager 'package.json') -Raw | ConvertFrom-Json
$cli = Join-Path $manager $metadata.bin.flowkit
$target = 'D:/Projects/flowkit-next/.tmp/onboarding-039-target'
$toolHome = $env:FLOWKIT_HOME
if (-not $toolHome) { throw 'Missing FLOWKIT_HOME' }
$scratch = Join-Path $target '.tmp'
New-Item -ItemType Directory -Force -Path $scratch | Out-Null
$requestFile = Join-Path $scratch ('flowkit-query-' + [guid]::NewGuid().ToString('N') + '.json')
$request = @{ repositoryRoot = $target; flowkitHome = $toolHome }
[IO.File]::WriteAllText($requestFile, ($request | ConvertTo-Json), [Text.UTF8Encoding]::new($false))
foreach ($command in @('doctor', 'status', 'next')) {
    node $cli $command --input $requestFile
    if ($LASTEXITCODE -ne 0) { throw "$command failed" }
}
