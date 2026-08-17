param([int]$Port = 4173)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$utf8 = New-Object System.Text.UTF8Encoding($false)
$caseData = [IO.File]::ReadAllText((Join-Path $root 'case.json'), $utf8) | ConvertFrom-Json
$hardCaseData = [IO.File]::ReadAllText((Join-Path $root 'hard-case.json'), $utf8) | ConvertFrom-Json
$easyCaseData = [IO.File]::ReadAllText((Join-Path $root 'easy-case.json'), $utf8) | ConvertFrom-Json
$cases = @($easyCaseData, $caseData, $hardCaseData)

function Send-Response($stream,[int]$status,[string]$type,[byte[]]$body){
  $reason=if($status -eq 200){'OK'}elseif($status -eq 404){'Not Found'}else{'Bad Request'}
  $head="HTTP/1.1 $status $reason`r`nContent-Type: $type`r`nContent-Length: $($body.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
  $hb=[Text.Encoding]::ASCII.GetBytes($head);$stream.Write($hb,0,$hb.Length);$stream.Write($body,0,$body.Length);$stream.Flush()
}
function Send-Json($stream,$object,[int]$status=200){$json=$object|ConvertTo-Json -Depth 8 -Compress;Send-Response $stream $status 'application/json; charset=utf-8' $utf8.GetBytes($json)}
function Read-Request($stream){
  $bytes=New-Object 'System.Collections.Generic.List[byte]';$a=-1;$b=-1;$c=-1;$d=-1
  while($bytes.Count -lt 65536){$n=$stream.ReadByte();if($n -lt 0){break};$bytes.Add([byte]$n);$a=$b;$b=$c;$c=$d;$d=$n;if($a -eq 13 -and $b -eq 10 -and $c -eq 13 -and $d -eq 10){break}}
  $lines=[Text.Encoding]::ASCII.GetString($bytes.ToArray()) -split "`r`n";$parts=$lines[0] -split ' ';$headers=@{}
  foreach($line in $lines){if($line -match '^([^:]+):\s*(.*)$'){$headers[$matches[1].ToLowerInvariant()]=$matches[2]}}
  $len=if($headers.ContainsKey('content-length')){[int]$headers['content-length']}else{0};$body=New-Object byte[] $len;$off=0
  while($off -lt $len){$read=$stream.Read($body,$off,$len-$off);if($read -le 0){break};$off+=$read}
  @{Method=$parts[0];Path=$parts[1];Body=$utf8.GetString($body,0,$off)}
}
function To-Search([string]$value){$norm=$value.Normalize([Text.NormalizationForm]::FormD);$builder=New-Object Text.StringBuilder;foreach($ch in $norm.ToCharArray()){if([Globalization.CharUnicodeInfo]::GetUnicodeCategory($ch) -ne [Globalization.UnicodeCategory]::NonSpacingMark){[void]$builder.Append($ch)}};$builder.ToString().ToLowerInvariant().Replace([char]0x0111,'d').Replace([char]0x0110,'d')}
function Public-Suspect($s){[ordered]@{id=$s.id;name=$s.name;role=$s.role;portrait=$s.portrait;motive=$s.motive;alibi=$s.alibi;tone=$s.tone}}
function Get-Case([string]$id){$selected=$cases|Where-Object{$_.id -eq $id}|Select-Object -First 1;if($null -eq $selected){return $caseData};$selected}
function Get-Answer($case,[string]$id,[string]$questionId,[string]$question){
  $s=$case.suspects|Where-Object{$_.id -eq $id}|Select-Object -First 1;if($null -eq $s){return 'Unknown suspect'}
  if($questionId){$property=$s.answers.PSObject.Properties[$questionId];if($null -ne $property){return $property.Value}}
  $q=To-Search $question
  if($q -match 'o dau|ngoai pham|alibi|thoi gian'){return $s.answers.alibi};if($q -match 'dong co|nan nhan|khang'){return $s.answers.motive};if($q -match 'dong ho'){return $s.answers.clock};if($q -match 'trang mieng|sot|hanh nhan|doc'){return $s.answers.dessert};$s.answers.default
}

$listener=New-Object Net.Sockets.TcpListener([Net.IPAddress]::Loopback,$Port);$listener.Start();Write-Host "AI Detective running at http://127.0.0.1:$Port"
try{while($true){$client=$listener.AcceptTcpClient();try{$stream=$client.GetStream();$req=Read-Request $stream;$path=($req.Path -split '\?')[0]
  if($req.Method -eq 'GET' -and ($path -eq '/api/case' -or $path -match '^/api/case/(HS-[0-9]+)$')){$requested='HS-2507';if($path -match '^/api/case/(HS-[0-9]+)$'){$requested=$matches[1]};$selected=Get-Case $requested;$public=@($selected.suspects|ForEach-Object{Public-Suspect $_});Send-Json $stream ([ordered]@{id=$selected.id;nextCaseId=$selected.nextCaseId;title=$selected.title;titleAccent=$selected.titleAccent;difficulty=$selected.difficulty;lede=$selected.lede;facts=$selected.facts;overview=$selected.overview;questions=$selected.questions;suspects=$public;evidence=$selected.evidence})}
  elseif($req.Method -eq 'POST' -and $path -eq '/api/interrogate'){$data=$req.Body|ConvertFrom-Json;$selected=Get-Case $data.caseId;Send-Json $stream ([ordered]@{answer=(Get-Answer $selected $data.suspectId $data.questionId $data.question)})}
  elseif($req.Method -eq 'POST' -and $path -eq '/api/accuse'){$data=$req.Body|ConvertFrom-Json;$selected=Get-Case $data.caseId;$correct=$data.suspectId -eq $selected.culpritId;$name=($selected.suspects|Where-Object{$_.id -eq $data.suspectId}|Select-Object -First 1).name;$message=if($correct){$selected.correctMessage}else{$selected.wrongMessage.Replace('{name}',$name)};Send-Json $stream ([ordered]@{correct=$correct;message=$message;explanation=$selected.explanation})}
  else{$rel=if($path -eq '/'){'index.html'}else{[Uri]::UnescapeDataString($path.TrimStart('/'))};$allowed=@('index.html','styles.css','suspects.css','interrogation.css','difficulty.css','app.js');$isImage=$rel -match '^assets/(suspects|suspects-hard|suspects-easy)/[a-z-]+\.png$';if($req.Method -eq 'GET' -and (($allowed -contains $rel) -or $isImage)){$file=Join-Path $root $rel;$type=if($rel.EndsWith('.css')){'text/css; charset=utf-8'}elseif($rel.EndsWith('.js')){'text/javascript; charset=utf-8'}elseif($rel.EndsWith('.png')){'image/png'}else{'text/html; charset=utf-8'};Send-Response $stream 200 $type ([IO.File]::ReadAllBytes($file))}else{Send-Json $stream @{error='Not found'} 404}}
}catch{try{Send-Json $stream @{error='Bad request'} 400}catch{}}finally{$client.Close()}}}finally{$listener.Stop()}
