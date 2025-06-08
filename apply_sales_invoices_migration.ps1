#!/usr/bin/env pwsh

# PowerShell script to apply the sales_invoices table migration
# Run this script to create the new table in your Supabase database

Write-Host "Creating sales_invoices table..." -ForegroundColor Green

# You can run this SQL file in your Supabase SQL editor or via CLI
$sqlFile = "create_sales_invoices_table.sql"

if (Test-Path $sqlFile) {
    Write-Host "Found SQL migration file: $sqlFile" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To apply this migration:" -ForegroundColor Cyan
    Write-Host "1. Copy the contents of $sqlFile" -ForegroundColor White
    Write-Host "2. Paste into your Supabase SQL Editor" -ForegroundColor White
    Write-Host "3. Run the SQL commands" -ForegroundColor White
    Write-Host ""
    Write-Host "Or if you have Supabase CLI configured:" -ForegroundColor Cyan
    Write-Host "supabase db reset --local" -ForegroundColor White
    Write-Host ""
    
    # Display the SQL content for easy copying
    Write-Host "SQL Migration Content:" -ForegroundColor Green
    Write-Host "=" * 50 -ForegroundColor Gray
    Get-Content $sqlFile
    Write-Host "=" * 50 -ForegroundColor Gray
} else {
    Write-Host "Error: $sqlFile not found!" -ForegroundColor Red
    Write-Host "Please ensure the SQL migration file exists in the current directory." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "After running the migration, the sales_invoices table will be available for use." -ForegroundColor Green
