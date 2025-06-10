# Transaction History Deletion Feature - Manual Setup

## Database Setup Instructions

Since the Supabase CLI configuration needs to be set up, you'll need to apply the database migration manually through your Supabase dashboard.

### Step 1: Apply Database Migration

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `supabase/migrations/20250604_add_transaction_history_deletion.sql`
4. Execute the SQL to create the required functions

### Step 2: Verify Functions

After applying the migration, verify that these functions are created:

- `clear_all_transaction_history(text)`
- `clear_transaction_history_by_date(timestamp, timestamp, text)`
- `clear_transaction_history_by_material(uuid, text)`
- `get_transaction_history_stats()`

### Step 3: Test the Feature

1. Navigate to the Transaction History page (`/analysis/transaction-history`)
2. Look for the "Clear History" button in the top-right corner
3. Or go to Settings page if you've added it to your routing

### Admin Password

The admin password for transaction deletion is: **`DELETE_HISTORY_2025`**

## Safety Features

✅ **Inventory Protection**: Deleting transaction history will NOT affect current inventory quantities
✅ **Password Protection**: Requires admin password confirmation
✅ **Multiple Confirmation**: Two-step confirmation process
✅ **Flexible Options**: Delete all, by date range, or by specific material
✅ **Statistics Preview**: Shows what will be deleted before confirmation

## Database Functions Overview

### `clear_all_transaction_history(confirmation_text)`

- Deletes ALL transaction history records
- Requires confirmation text: `'DELETE_ALL_TRANSACTION_HISTORY'`

### `clear_transaction_history_by_date(start_date, end_date, confirmation_text)`

- Deletes transaction history within date range
- Requires confirmation text: `'DELETE_TRANSACTION_HISTORY_BY_DATE'`

### `clear_transaction_history_by_material(material_id, confirmation_text)`

- Deletes transaction history for specific material
- Requires confirmation text: `'DELETE_MATERIAL_TRANSACTION_HISTORY'`

### `get_transaction_history_stats()`

- Returns statistics about current transaction history
- No confirmation required (read-only)

## Usage Examples

Once the functions are created, they can be called from the UI or directly:

```sql
-- Get current statistics
SELECT * FROM get_transaction_history_stats();

-- Clear all transaction history (DESTRUCTIVE!)
SELECT * FROM clear_all_transaction_history('DELETE_ALL_TRANSACTION_HISTORY');

-- Clear by date range (DESTRUCTIVE!)
SELECT * FROM clear_transaction_history_by_date(
  '2024-01-01'::timestamp,
  '2024-12-31'::timestamp,
  'DELETE_TRANSACTION_HISTORY_BY_DATE'
);
```

## Files Created

1. `src/hooks/useTransactionHistoryDeletion.ts` - React hook for deletion logic
2. `src/components/dialogs/TransactionHistoryDeleteDialog.tsx` - Delete dialog component
3. `src/pages/Settings/Settings.tsx` - Settings page with deletion feature
4. `supabase/migrations/20250604_add_transaction_history_deletion.sql` - Database functions

## Integration

The delete functionality has been added to:

- **Transaction History page**: "Clear History" button in the header
- **Settings page**: Complete database management section

Both locations provide the same comprehensive deletion interface with all safety features.
