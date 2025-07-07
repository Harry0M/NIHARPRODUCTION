# PowerShell script to run the wastage analysis SQL fix
# This script helps execute the SQL commands to add wastage columns

Write-Host "🔧 Wastage Analysis Database Fix" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will help you add wastage columns to your orders table." -ForegroundColor Yellow
Write-Host ""

# Check if SQL file exists
if (Test-Path "add-wastage-columns.sql") {
    Write-Host "✅ SQL file found: add-wastage-columns.sql" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "📋 SQL Commands to be executed:" -ForegroundColor Cyan
    Write-Host "• Add wastage_percentage column (NUMERIC 5,2)" -ForegroundColor Gray
    Write-Host "• Add wastage_cost column (NUMERIC 12,2)" -ForegroundColor Gray  
    Write-Host "• Update existing orders with realistic wastage data" -ForegroundColor Gray
    Write-Host "• Create automatic calculation trigger" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "💡 How to run this SQL:" -ForegroundColor Yellow
    Write-Host "1. Open your database client (pgAdmin, DBeaver, etc.)" -ForegroundColor White
    Write-Host "2. Connect to your Supabase/PostgreSQL database" -ForegroundColor White
    Write-Host "3. Open and execute the file: add-wastage-columns.sql" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🔗 Alternative methods:" -ForegroundColor Yellow
    Write-Host "psql -h your-host -U your-user -d your-db -f add-wastage-columns.sql" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "📊 After running the SQL:" -ForegroundColor Cyan
    Write-Host "• Refresh http://localhost:8080/analysis/orders" -ForegroundColor White
    Write-Host "• Orders should show varied wastage percentages (3-15%)" -ForegroundColor White
    Write-Host "• Total wastage calculations will be realistic" -ForegroundColor White
    Write-Host ""
    
    # Ask if user wants to view the SQL content
    $response = Read-Host "Would you like to view the SQL content? (y/n)"
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host ""
        Write-Host "📄 SQL Content:" -ForegroundColor Cyan
        Write-Host "===============" -ForegroundColor Cyan
        Get-Content "add-wastage-columns.sql" | Write-Host -ForegroundColor Gray
    }
    
} else {
    Write-Host "❌ SQL file not found: add-wastage-columns.sql" -ForegroundColor Red
    Write-Host "Please run this script from the project directory." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 Summary of the fix:" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green
Write-Host "✅ Frontend code updated to use database wastage values" -ForegroundColor White
Write-Host "✅ Fallback logic for orders without wastage data" -ForegroundColor White  
Write-Host "✅ SQL script ready to add wastage columns" -ForegroundColor White
Write-Host "✅ Automatic trigger for wastage cost calculation" -ForegroundColor White
Write-Host ""
Write-Host "Once you run the SQL, the wastage analysis will show realistic data!" -ForegroundColor Green
