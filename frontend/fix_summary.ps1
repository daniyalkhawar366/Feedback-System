$file = 'C:\Users\pc\Desktop\Uni\AI-Engineering\Feedback-System\frontend\components\analytics\OverviewTab.tsx'
$lines = Get-Content $file -Encoding UTF8
# Remove lines 370..413 (0-indexed), also remove the border-b from line 365
# Line 369 (0-indexed) is the closing </div> of summary text area — keep through 369
# Lines 370..413 (0-indexed) = the two-column strengths/concerns block — remove
$before = $lines[0..368]
$after = $lines[413..($lines.Length - 1)]
$result = $before + $after
Set-Content -Path $file -Value $result -Encoding UTF8
Write-Host "Done. Lines:" $result.Length
