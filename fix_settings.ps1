$c = Get-Content 'src/app/(dashboard)/settings/page.tsx'
$c = $c | Where-Object { $_ -notmatch 'Language' -and $_ -notmatch 'RTK compression' }
$c = $c -replace 'lang: d\.lang \|\| "en",\s*', ''
$c = $c -replace 'rtk: d\.rtk \?\?\? true,\s*', ''
$c | Set-Content 'src/app/(dashboard)/settings/page.tsx'
