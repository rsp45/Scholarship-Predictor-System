# PowerShell Script: Setup-RetrainingTask.ps1
# Run this as Administrator to create the scheduled task

$TaskName = "Tejas Scholarship Model Retraining"
$Description = "Weekly automated ML model retraining for scholarship allocation - Runs Sundays at 2 AM"
$WorkingDirectory = "C:\Users\rudra\OneDrive\Documents\Hackathon 3 Og"
$PythonPath = "C:\Users\rudra\AppData\Local\Programs\Python\Python312\python.exe"
$ScriptName = "retrain_pipeline.py"

# Verify paths exist
if (-not (Test-Path $WorkingDirectory)) {
    Write-Error "Working directory not found: $WorkingDirectory"
    exit 1
}

if (-not (Test-Path "$WorkingDirectory\$ScriptName")) {
    Write-Error "Retraining script not found: $WorkingDirectory\$ScriptName"
    exit 1
}

# Create the action
$Action = New-ScheduledTaskAction `
    -Execute $PythonPath `
    -Argument "$ScriptName" `
    -WorkingDirectory $WorkingDirectory

# Create the trigger (Weekly on Sunday at 2 AM)
$Trigger = New-ScheduledTaskTrigger `
    -Weekly `
    -DaysOfWeek Sunday `
    -At "2:00 AM"

# Create task settings
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false `
    -WakeToRun

# Create the principal (run with highest privileges)
$Principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType Interactive `
    -RunLevel Highest

# Register the task
try {
    Register-ScheduledTask `
        -TaskName $TaskName `
        -Description $Description `
        -Action $Action `
        -Trigger $Trigger `
        -Settings $Settings `
        -Principal $Principal `
        -Force

    Write-Host " Scheduled task created successfully!" -ForegroundColor Green
    Write-Host "   Task Name: $TaskName" -ForegroundColor Cyan
    Write-Host "   Schedule: Every Sunday at 2:00 AM" -ForegroundColor Cyan
    Write-Host "   Working Directory: $WorkingDirectory" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To verify the task:" -ForegroundColor Yellow
    Write-Host "   1. Open Task Scheduler (taskschd.msc)" -ForegroundColor White
    Write-Host "   2. Look for '$TaskName' in the Task Scheduler Library" -ForegroundColor White
    Write-Host ""
    Write-Host "To run manually:" -ForegroundColor Yellow
    Write-Host "   Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
} catch {
    Write-Error "Failed to create scheduled task: $_"
}
