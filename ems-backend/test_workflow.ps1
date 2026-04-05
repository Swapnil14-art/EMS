# EMS Full Event Approval Workflow Test
# Flow: Create → Upload Poster → Submit → AD Approve → Director Approve → Approved
$BASE = "http://localhost:8000"

function Step($msg) { Write-Host "`nSTEP: $msg" -ForegroundColor Yellow }
function Pass($msg) { Write-Host "  [PASS] $msg" -ForegroundColor Green }
function Fail($msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red }
function Info($msg) { Write-Host "         $msg" -ForegroundColor DarkGray }
function Divider { Write-Host "  " + ("-" * 50) }

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   EMS EVENT APPROVAL WORKFLOW TEST" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# ── Step 0: Login ────────────────────────────────────────────────────────────
Step "0. Login as Super Admin"
try {
    $r = Invoke-RestMethod -Method Post -Uri "$BASE/auth/login" `
        -ContentType "application/json" `
        -Body '{"email":"admin@nmims.in","password":"Admin@123"}'
    $TOKEN = $r.access_token
    $H = @{ Authorization = "Bearer $TOKEN" }
    Pass "Logged in: role=super_admin, id=1"
} catch {
    Fail "Login failed: $($_.ErrorDetails.Message)"
    exit 1
}

# ── Step 1: Get existing club/venue IDs ──────────────────────────────────────
Step "1. Fetch club and venue IDs"
$clubs  = Invoke-RestMethod -Uri "$BASE/clubs/" -Headers $H
$venues = Invoke-RestMethod -Uri "$BASE/venues/" -Headers $H
$clubId  = if ($clubs)  { @($clubs)[0].id  } else { $null }
$venueId = if ($venues) { @($venues)[0].id } else { $null }
Info "Using club_id=$clubId, venue_id=$venueId"

# ── Step 2: Create event (draft) ─────────────────────────────────────────────
Step "2. Create Event (status: draft)"
# Future date: 2 months from now to avoid clashes
$futureDate = (Get-Date).AddMonths(2).ToString("yyyy-MM-dd")
$eventBody = @{
    title                  = "Annual Tech Fest 2026 V2"
    event_type             = "technical"
    school_department      = "School of Technology"
    event_incharge_name    = "Super Admin"
    event_incharge_contact = "9999999999"
    target_audience        = "college_wide"
    is_club_event          = $true
    club_id                = $clubId
    is_collaborative       = $false
    is_sponsored           = $false
    event_date             = $futureDate
    start_time             = "09:00"
    end_time               = "17:00"
    venue_id               = $venueId
    venue_type             = "indoor"
    seating_arrangement    = "theatre"
    budget                 = 50000
    comments               = "Annual flagship technical event"
    it_projector           = $true
    it_audio               = $true
    it_wifi                = $true
} | ConvertTo-Json

try {
    $created = Invoke-RestMethod -Method Post -Uri "$BASE/events/" `
        -ContentType "application/json" -Headers $H -Body $eventBody
    $EID = $created.id
    Pass "Event created: id=$EID, status=$($created.status)"
} catch {
    Fail "Create failed: $($_.ErrorDetails.Message)"
    exit 1
}

# ── Step 3: GET event (verify draft) ────────────────────────────────────────
Step "3. Verify event details (GET /events/$EID)"
try {
    $ev = Invoke-RestMethod -Uri "$BASE/events/$EID" -Headers $H
    Pass "Event fetched"
    Info "title=$($ev.title), status=$($ev.status), budget=$($ev.budget)"
    Info "venue_id=$($ev.venue_id), club_id=$($ev.club_id), date=$futureDate 09:00-17:00"
} catch {
    Fail "Fetch failed: $($_.ErrorDetails.Message)"
}

# ── Step 4: List events (should see draft as super_admin) ───────────────────
Step "4. List events (should include new draft)"
try {
    $evList = Invoke-RestMethod -Uri "$BASE/events/?my_events=true" -Headers $H
    Pass "Events listed: count=$(@($evList).Count)"
} catch {
    Fail "List failed: $($_.ErrorDetails.Message)"
}

# ── Step 5: Upload poster (required before submit) ───────────────────────────
Step "5. Upload Poster (multipart/form-data)"
# Create a tiny PNG placeholder in /tmp
$tmpPoster = "$env:TEMP\test_poster.png"
# Write minimal 1x1 red PNG bytes
[System.IO.File]::WriteAllBytes($tmpPoster, [byte[]](
    0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,
    0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,
    0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,
    0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53,
    0xDE,0x00,0x00,0x00,0x0C,0x49,0x44,0x41,
    0x54,0x08,0xD7,0x63,0xF8,0xCF,0xC0,0x00,
    0x00,0x00,0x02,0x00,0x01,0xE2,0x21,0xBC,
    0x33,0x00,0x00,0x00,0x00,0x49,0x45,0x4E,
    0x44,0xAE,0x42,0x60,0x82
))
Info "Poster file created at $tmpPoster"

# Use WebClient for multipart upload
try {
    Add-Type -AssemblyName System.Net.Http
    $httpClient = New-Object System.Net.Http.HttpClient
    $httpClient.DefaultRequestHeaders.Authorization = `
        New-Object System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", $TOKEN)
    $formData = New-Object System.Net.Http.MultipartFormDataContent
    $fileStream = [System.IO.File]::OpenRead($tmpPoster)
    $streamContent = New-Object System.Net.Http.StreamContent($fileStream)
    $streamContent.Headers.ContentType = `
        New-Object System.Net.Http.Headers.MediaTypeHeaderValue("image/png")
    $formData.Add($streamContent, "file", "test_poster.png")
    $response = $httpClient.PostAsync("$BASE/events/$EID/upload-poster", $formData).Result
    $body = $response.Content.ReadAsStringAsync().Result
    $fileStream.Close()
    if ($response.IsSuccessStatusCode) {
        Pass "Poster uploaded: $body"
    } else {
        Fail "Upload failed (HTTP $($response.StatusCode)): $body"
    }
} catch {
    Fail "Upload exception: $_"
}

# ── Step 6: Submit event ─────────────────────────────────────────────────────
Step "6. Submit Event (draft → pending_associate_dean)"
try {
    $sub = Invoke-RestMethod -Method Post -Uri "$BASE/events/$EID/submit" -Headers $H
    Pass "Submitted: status=$($sub.status)"
} catch {
    Fail "Submit failed: $($_.ErrorDetails.Message)"
}

# ── Step 7: Check pending approvals ─────────────────────────────────────────
Step "7. Check pending approvals"
try {
    $pending = Invoke-RestMethod -Uri "$BASE/approvals/pending" -Headers $H
    Pass "Pending approvals: count=$(@($pending).Count)"
    foreach ($p in $pending) {
        Info "  event_id=$($p.id), title=$($p.title), status=$($p.status)"
    }
} catch {
    Fail "Pending check failed: $($_.ErrorDetails.Message)"
}

# ── Step 8: Associated Dean approves (super_admin acts as AD) ────────────────
Step "8. Associate Dean Approval (pending_associate_dean → pending_director)"
$approveBody = @{
    action  = "approved"
    remarks = "Event looks good. Approved by Associate Dean."
} | ConvertTo-Json
try {
    $adApprove = Invoke-RestMethod -Method Post `
        -Uri "$BASE/approvals/$EID/action" `
        -ContentType "application/json" -Headers $H -Body $approveBody
    Pass "AD approval done: event_status=$($adApprove.event_status)"
} catch {
    Fail "AD approval failed: $($_.ErrorDetails.Message)"
}

# ── Step 9: Director final approval ─────────────────────────────────────────
Step "9. Director Final Approval (pending_director → approved)"
try {
    $dirApprove = Invoke-RestMethod -Method Post `
        -Uri "$BASE/approvals/$EID/action" `
        -ContentType "application/json" -Headers $H -Body $approveBody
    Pass "Director approval done: event_status=$($dirApprove.event_status)"
} catch {
    Fail "Director approval failed: $($_.ErrorDetails.Message)"
}

# ── Step 10: Verify final status ─────────────────────────────────────────────
Step "10. Verify final event status"
try {
    $final = Invoke-RestMethod -Uri "$BASE/events/$EID" -Headers $H
    Pass "Final status: $($final.status)"
    Info "title        = $($final.title)"
    Info "status       = $($final.status)"
    Info "budget       = $($final.budget)"
    Info "start        = $($final.start_datetime)"
    Info "end          = $($final.end_datetime)"
    if ($final.status -eq "approved") {
        Write-Host ""
        Write-Host "  *** EVENT FULLY APPROVED! ***" -ForegroundColor Green
    }
} catch {
    Fail "Final verify failed: $($_.ErrorDetails.Message)"
}

# ── Step 11: Approval history ────────────────────────────────────────────────
Step "11. Approval history for event $EID"
try {
    $hist = Invoke-RestMethod -Uri "$BASE/approvals/$EID/history" -Headers $H
    Pass "History entries: $(@($hist).Count)"
    foreach ($h in $hist) {
        Info "  seq=$($h.sequence_order), action=$($h.action), role=$($h.approver_role), remarks=$($h.remarks)"
    }
} catch {
    Fail "History failed: $($_.ErrorDetails.Message)"
}

# ── Step 12: Dashboard stats ─────────────────────────────────────────────────
Step "12. Admin Dashboard (after approval)"
try {
    $dash = Invoke-RestMethod -Uri "$BASE/dashboard/admin" -Headers $H
    Pass "Dashboard stats"
    Info "total_events=$($dash.total_events)"
    Info "events_by_status=$($dash.events_by_status | ConvertTo-Json -Compress)"
    Info "users_by_role=$($dash.users_by_role | ConvertTo-Json -Compress)"
} catch {
    Fail "Dashboard failed: $($_.ErrorDetails.Message)"
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "          WORKFLOW TEST COMPLETE" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
