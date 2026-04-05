# EMS API Clean Test Script - Corrected Paths
$BASE = "http://localhost:8000"

function Test-Endpoint($label, $method, $path, $body = $null, $token = $null) {
    $params = @{
        Method = $method
        Uri = "$BASE$path"
        ErrorAction = "Stop"
    }
    if ($body) {
        $params.ContentType = "application/json"
        $params.Body = ($body | ConvertTo-Json)
    }
    if ($token) {
        $params.Headers = @{ Authorization = "Bearer $token" }
    }
    try {
        $r = Invoke-RestMethod @params
        Write-Host "  [PASS] $label" -ForegroundColor Green
        return $r
    } catch {
        $msg = $_.ErrorDetails.Message
        if (-not $msg) { $msg = $_.Exception.Message }
        Write-Host "  [FAIL] $label --> $msg" -ForegroundColor Red
        return $null
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host "   EMS API TEST SUITE - SUPER ADMIN"
Write-Host "========================================"
Write-Host ""

# --- AUTH ---
Write-Host "AUTH ENDPOINTS"
$login = Test-Endpoint "POST /auth/login" "POST" "/auth/login" @{ email="admin@nmims.in"; password="Admin@123" }
if (-not $login) { Write-Host "Cannot continue without token. Exiting."; exit 1 }
$t = $login.access_token
Write-Host "       require_password_change=$($login.require_password_change), require_profile_completion=$($login.require_profile_completion)"

$me = Test-Endpoint "GET  /auth/me" "GET" "/auth/me" -token $t
if ($me) { Write-Host "       id=$($me.id), name=$($me.name), role=$($me.role), status=$($me.status)" }

# --- DEPARTMENTS ---
Write-Host ""
Write-Host "DEPARTMENT ENDPOINTS"
$dl = Test-Endpoint "GET  /departments/ (list)" "GET" "/departments/" -token $t
if ($dl) { Write-Host "       Count: $(@($dl).Count)" }

$dept = Test-Endpoint "POST /departments/ (create IT)" "POST" "/departments/" @{ name="Information Technology"; code="IT" } $t
if ($dept) { Write-Host "       Created: id=$($dept.id), code=$($dept.code)" }

$deptId = if ($dept) { $dept.id } else { 1 }
Test-Endpoint "GET  /departments/$deptId (single)" "GET" "/departments/$deptId" -token $t | Out-Null
Test-Endpoint "PATCH /departments/$deptId (update)" "PATCH" "/departments/$deptId" @{ name="Information Technology Dept" } $t | Out-Null

# --- VENUES ---
Write-Host ""
Write-Host "VENUE ENDPOINTS"
$vl = Test-Endpoint "GET  /venues/ (list)" "GET" "/venues/" -token $t
if ($vl) { Write-Host "       Count: $(@($vl).Count)" }

$venue = Test-Endpoint "POST /venues/ (create)" "POST" "/venues/" @{ name="Seminar Hall B"; capacity=200; location="Block B, 2nd Floor" } $t
$venueId = if ($venue) { $venue.id } else { $null }
if ($venueId) { Write-Host "       Created: id=$venueId" }

# --- CLUBS ---
Write-Host ""
Write-Host "CLUB ENDPOINTS"
$cl = Test-Endpoint "GET  /clubs/ (list)" "GET" "/clubs/" -token $t
if ($cl) { Write-Host "       Count: $(@($cl).Count)" }

# Club requires department_id
$club = Test-Endpoint "POST /clubs/ (create with dept)" "POST" "/clubs/" @{ name="Coding Club"; description="Coding and hackathons"; department_id=$deptId } $t
$clubId = if ($club) { $club.id } else { $null }
if ($clubId) { Write-Host "       Created: id=$clubId, name=$($club.name)" }

# --- USERS ---
Write-Host ""
Write-Host "USER ENDPOINTS"
$ul = Test-Endpoint "GET  /users/ (list)" "GET" "/users/?page=1&size=10" -token $t
if ($ul) { Write-Host "       Total visible: $(@($ul).Count)" }
Test-Endpoint "GET  /users/search?email=admin" "GET" "/users/search?email=admin" -token $t | Out-Null
Test-Endpoint "GET  /users/1 (single)" "GET" "/users/1" -token $t | Out-Null

# Pre-approve a director
Write-Host ""
Write-Host "PRE-APPROVE ENDPOINT"
Test-Endpoint "POST /users/pre-approve (hod@nmims.in as director)" "POST" "/users/pre-approve" @{ email="hod@nmims.in"; role="director"; department_id=$null; club_id=$null } $t | Out-Null

# --- APPROVALS ---
Write-Host ""
Write-Host "APPROVAL ENDPOINTS"
$pending = Test-Endpoint "GET  /approvals/pending (super_admin sees all)" "GET" "/approvals/pending" -token $t
if ($pending) { Write-Host "       Pending events: $(@($pending).Count)" }

# --- EVENTS ---
Write-Host ""
Write-Host "EVENT ENDPOINTS"
$events = Test-Endpoint "GET  /events/ (list)" "GET" "/events/" -token $t
if ($events) { Write-Host "       Total events: $(@($events).Count)" }
Test-Endpoint "GET  /events/?status=approved (filter)" "GET" "/events/?status=approved" -token $t | Out-Null

# --- DASHBOARD ---
Write-Host ""
Write-Host "DASHBOARD ENDPOINTS"
$dash = Test-Endpoint "GET  /dashboard/admin (super_admin stats)" "GET" "/dashboard/admin" -token $t
if ($dash) {
    Write-Host "       total_events=$($dash.total_events), users_by_role=$($dash.users_by_role | ConvertTo-Json -Compress)"
}
Test-Endpoint "GET  /dashboard/coordinator" "GET" "/dashboard/coordinator" -token $t | Out-Null

# --- REGISTRATIONS ---
Write-Host ""
Write-Host "REGISTRATION ENDPOINTS"
Test-Endpoint "GET  /registrations/ (my registrations)" "GET" "/registrations/" -token $t | Out-Null

Write-Host ""
Write-Host "========================================"
Write-Host "         TEST SUITE COMPLETE"
Write-Host "========================================"
Write-Host ""
