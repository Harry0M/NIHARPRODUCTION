# Job Number Format Update - Testing Guide

## 🎯 What Changed

- **Before:** Job numbers were generated as `JOB-2025-004` (year + sequential number)
- **After:** Job numbers are now generated as `JOB-9016` (using the order number)

## ✅ Migration Applied

The SQL migration `20250102000000_update_job_number_format.sql` has been applied, which updated the `generate_job_number()` function.

## 🧪 How to Test

### Method 1: Create a New Job Card (Recommended)

1. **Open the application:** http://localhost:3000
2. **Navigate to:** Production → Job Cards → New Job Card
3. **Select any existing order** (e.g., order 9016)
4. **Fill in job details** and create the job card
5. **Expected result:** Job number should be `JOB-9016` (matching the order number)

### Method 2: Run SQL Test Query

1. **Open Supabase Dashboard** → SQL Editor
2. **Run this query** to check existing job cards:

```sql
SELECT
    jc.job_name,
    jc.job_number,
    o.order_number,
    CASE
        WHEN jc.job_number = ('JOB-' || o.order_number) THEN 'NEW FORMAT ✅'
        ELSE 'OLD FORMAT ⚠️'
    END as format_status,
    jc.created_at
FROM job_cards jc
LEFT JOIN orders o ON jc.order_id = o.id
ORDER BY jc.created_at DESC
LIMIT 10;
```

### Method 3: Browser Console Test

1. **Open the application** in browser
2. **Open Developer Tools** (F12) → Console
3. **Copy and paste** the contents of `public/test-job-number-format.js`
4. **Press Enter** to run the test
5. **Check the results** in the console

## 📊 Expected Results

### New Job Cards (Created After Migration)

- ✅ Job number format: `JOB-[ORDER_NUMBER]`
- ✅ Example: Order 9016 → Job number `JOB-9016`
- ✅ Direct correlation between order and job numbers

### Existing Job Cards (Created Before Migration)

- ⚠️ Will keep old format: `JOB-2025-004`
- ⚠️ This is expected and won't break functionality
- ⚠️ Only new job cards will use the new format

## 🔍 Verification Checklist

- [ ] Migration applied successfully (no SQL errors)
- [ ] Application starts without errors
- [ ] Can create new job cards
- [ ] New job cards have format `JOB-[ORDER_NUMBER]`
- [ ] Job card display shows correct job number
- [ ] Transaction history references correct job number

## 🚀 Next Steps

After testing confirms the new format works:

1. **Monitor** new job card creation for a few days
2. **Update documentation** if needed
3. **Train users** on the new job number format
4. **Optionally:** Consider migrating existing job cards to new format (if desired)

## 🔧 Rollback Plan (If Needed)

If issues arise, you can revert to the old format by running:

```sql
CREATE OR REPLACE FUNCTION "public"."generate_job_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.job_number := 'JOB-' || to_char(current_date, 'YYYY') || '-' ||
        LPAD(COALESCE(
            (SELECT COUNT(*) + 1 FROM public.job_cards
             WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM current_date))::TEXT,
            '1'
        ), 3, '0');
    RETURN NEW;
END;
$$;
```

---

**Status:** Ready for testing  
**Migration:** Applied  
**Next Action:** Create a test job card to verify new format
