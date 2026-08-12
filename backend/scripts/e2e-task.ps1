$base = 'http://localhost:3000/api'
$body = @{ prompt = "为什么很多人学 AI 学不会？"; ratio = "9:16"; duration = 15 } | ConvertTo-Json
$r = Invoke-RestMethod -Uri "$base/projects" -Method Post -Body $body -ContentType 'application/json'
$projId = $r.data.id
Write-Output "projectId=$projId"

$s = Invoke-RestMethod -Uri "$base/projects/$projId/production/start" -Method Post
Write-Output ("started: stage=" + $s.data.stage + " status=" + $s.data.jobStatus + " progress=" + $s.data.overallProgress + " taskId=" + $s.data.taskId)

Start-Sleep -Seconds 4
$st = Invoke-RestMethod -Uri "$base/projects/$projId/production" -Method Get
$d = $st.data
Write-Output ("progress: stage=" + $d.stage + " status=" + $d.jobStatus + " progress=" + $d.overallProgress + " elapsed=" + $d.elapsedMs)
$done = ($d.steps | Where-Object { $_.status -eq 'success' }).key -join ','
$run = ($d.steps | Where-Object { $_.status -eq 'running' }).key -join ','
Write-Output ("steps success=[$done] running=[$run]")

$c = Invoke-RestMethod -Uri "$base/projects/$projId/production/cancel" -Method Post
Write-Output ("cancelled: jobStatus=" + $c.data.jobStatus)
