# EMS Realistic Event Approval Workflow Test

$BASE = "http://localhost:8000"

function Step($msg) { Write-Host "`nSTEP: $msg" -ForegroundColor Yellow }
function Pass($msg) { Write-Host "  [PASS] $msg" -ForegroundColor Green }
function Fail($msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red }
function Info($msg) { Write-Host "         $msg" -ForegroundColor DarkGray }

function Get-Token($email, $password) {
    try {
        $r = Invoke-RestMethod -Method Post -Uri "$BASE/auth/login" `
            -ContentType "application/json" `
            -Body (@{ email = $email; password = $password } | ConvertTo-Json)
        return $r.access_token
    } catch {
        Fail "Login failed for $email"
        exit 1
    }
}

# ── 1. Club Coordinator Login & Setup ─────────────────────────────────────────
Step "1. Login as Club Coordinator"
$tok_coord = Get-Token "coordinator@nmims.in" "Test@123"
$H_coord = @{ Authorization = "Bearer $tok_coord" }
$me = Invoke-RestMethod -Uri "$BASE/auth/me" -Headers $H_coord
Pass "Logged in as coordinator (club_id=$($me.club_id), dept_id=$($me.department_id))"

# Fetch venue
$venues = Invoke-RestMethod -Uri "$BASE/venues/" -Headers $H_coord
$venueId = if ($venues) { @($venues)[0].id } else { 1 }

# ── 2. Create Event ─────────────────────────────────────────────────────────
Step "2. Create Event"
$futureDate = (Get-Date).AddMonths(3).ToString("yyyy-MM-dd")
$eventBody = @{
    title                  = "Realistic Workflow Event $($futureDate)"
    event_type             = "cultural"
    school_department      = "Test Department"
    event_incharge_name    = "Test Coordinator"
    event_incharge_contact = "9999999999"
    target_audience        = "college_wide"
    is_club_event          = $true
    club_id                = $me.club_id
    is_collaborative       = $false
    budget                 = 15000
    event_date             = $futureDate
    start_time             = "10:00"
    end_time               = "15:00"
    venue_id               = $venueId
} | ConvertTo-Json

try {
    $ev = Invoke-RestMethod -Method Post -Uri "$BASE/events/" -ContentType "application/json" -Headers $H_coord -Body $eventBody
    $EID = $ev.id
    Pass "Event created: EID=$EID, status=$($ev.status)"
} catch {
    Fail "Event creation failed: $($_.ErrorDetails.Message)"
    exit 1
}

# ── 3. Upload Poster ────────────────────────────────────────────────────────
Step "3. Upload Poster"
$tmpPoster = "$env:TEMP\poster2.png"
[System.IO.File]::WriteAllBytes($tmpPoster, [byte[]](
    0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,
    0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53,
    0xDE,0x00,0x00,0x00,0x0C,0x49,0x44,0x41,0x54,0x08,0xD7,0x63,0xF8,0xCF,0xC0,0x00,
    0x00,0x00,0x02,0x00,0x01,0xE2,0x21,0xBC,0x33,0x00,0x00,0x00,0x00,0x49,0x45,0x4E,
    0x44,0xAE,0x42,0x60,0x82
))

Add-Type -AssemblyName System.Net.Http
$httpClient = New-Object System.Net.Http.HttpClient
$httpClient.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", $tok_coord)
$formData = New-Object System.Net.Http.MultipartFormDataContent
$fileStream = [System.IO.File]::OpenRead($tmpPoster)
$streamContent = New-Object System.Net.Http.StreamContent($fileStream)
$streamContent.Headers.ContentType = New-Object System.Net.Http.Headers.MediaTypeHeaderValue("image/png")
$formData.Add($streamContent, "file", "poster2.png")

$response = $httpClient.PostAsync("$BASE/events/$EID/upload-poster", $formData).Result
$fileStream.Close()
if ($response.IsSuccessStatusCode) { Pass "Poster uploaded" } else { Fail "Upload failed" }

# ── 4. Submit Event ─────────────────────────────────────────────────────────
Step "4. Submit Event"
try {
    $sub = Invoke-RestMethod -Method Post -Uri "$BASE/events/$EID/submit" -Headers $H_coord
    Pass "Submitted: new status=$($sub.status)"
} catch {
    Fail "Submit failed: $($_.ErrorDetails.Message)"
}

# ── 5. AD Approval ──────────────────────────────────────────────────────────
Step "5. Login as Associate Dean & Approve"
$tok_adean = Get-Token "adean@nmims.in" "Test@123"
$H_adean = @{ Authorization = "Bearer $tok_adean" }

try {
    $pending_ad = Invoke-RestMethod -Uri "$BASE/approvals/pending" -Headers $H_adean
    Pass "Associate Dean pending approvals: $(@($pending_ad).Count)"
    
    $approveBody = @{ action = "approved"; remarks = "AD testing approval" } | ConvertTo-Json
    $ad_req = Invoke-RestMethod -Method Post -Uri "$BASE/approvals/$EID/action" -ContentType "application/json" -Headers $H_adean -Body $approveBody
    Pass "AD Approval Success: event is now $($ad_req.event_status)"
} catch {
    Fail "AD approval failed: $($_.ErrorDetails.Message)"
}

# ── 6. Director Approval ────────────────────────────────────────────────────
Step "6. Login as Director & Approve"
$tok_dir = Get-Token "director@nmims.in" "Test@123"
$H_dir = @{ Authorization = "Bearer $tok_dir" }

try {
    $pending_dir = Invoke-RestMethod -Uri "$BASE/approvals/pending" -Headers $H_dir
    Pass "Director pending approvals: $(@($pending_dir).Count)"
    
    $dirApproveBody = @{ action = "approved"; remarks = "Director testing approval" } | ConvertTo-Json
    $dir_req = Invoke-RestMethod -Method Post -Uri "$BASE/approvals/$EID/action" -ContentType "application/json" -Headers $H_dir -Body $dirApproveBody
    Pass "Director Approval Success: event is now $($dir_req.event_status)"
} catch {
    Fail "Director approval failed: $($_.ErrorDetails.Message)"
}

# ── 7. Fetch final event state ─────────────────────────────────────────────
Step "7. Review Final Event Status"
try {
    $finalEvent = Invoke-RestMethod -Uri "$BASE/events/$EID" -Headers $H_dir
    if ($finalEvent.status -eq "approved") {
        Write-Host "`n  *** EVENT FULLY APPROVED BY REALISTIC WORKFLOW! ***" -ForegroundColor Cyan
    } else {
        Fail "Event not approved! status=$($finalEvent.status)"
    }
} catch {
    Fail "Fetch failed: $($_.ErrorDetails.Message)"
}
