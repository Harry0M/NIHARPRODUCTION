# Formula Field Fix - Test Plan

## Background

Fixed a critical bug where the formula field (standard/linear/manual) was not being saved when creating products in the inventory catalog system. The formula field determines how material consumption is calculated for product components.

## Changes Made

1. **useProductForm.ts** - Added formula handlers:

   - `handleFormulaChange` - for standard components
   - `handleCustomFormulaChange` - for custom components
   - `handleConsumptionCalculated` - for standard component consumption updates
   - `handleCustomConsumptionCalculated` - for custom component consumption updates

2. **ComponentContext.tsx** - Added formula handlers to context interface

3. **CatalogNew.tsx** - Connected formula handlers from useProductForm to ComponentProvider

4. **StandardComponents.tsx** - Updated to accept and use formula handlers from context

5. **CustomComponentSection.tsx** - Updated to accept and use formula handlers from context

## Test Cases

### Test 1: Standard Component Formula Selection

1. Navigate to Inventory → Add New Product
2. Fill in basic product details (name, dimensions, quantity)
3. Add a standard component (e.g., "Part")
4. Select material for the component
5. Enter dimensions (length, width, roll width)
6. **Test Formula Selection:**
   - Select "Standard" formula - verify consumption is calculated using standard formula
   - Select "Linear" formula - verify consumption is calculated using linear formula
   - Select "Manual" formula - verify consumption can be manually entered
7. Save the product
8. Edit the product and verify formula field is preserved

### Test 2: Custom Component Formula Selection

1. Navigate to Inventory → Add New Product
2. Fill in basic product details
3. Add a custom component
4. Enter component name and select material
5. Enter dimensions
6. **Test Formula Selection:**
   - Verify formula dropdown is available
   - Test all three formula options (standard/linear/manual)
   - Verify consumption calculations work correctly
7. Save the product
8. Edit the product and verify custom component formula is preserved

### Test 3: Formula Persistence in Database

1. Create a product with multiple components using different formulas
2. Save the product
3. Navigate away and return to edit the product
4. Verify all formula selections are preserved correctly
5. Check database records to confirm formula field is saved

### Test 4: Formula Change Impact on Consumption

1. Create a component with dimensions
2. Test switching between formulas and verify:
   - Standard formula: (length × width) / (roll_width × 39.39) × quantity
   - Linear formula: length / 39.39 × quantity
   - Manual formula: allows manual consumption entry
3. Verify material costs update correctly when formula changes

## Expected Results

- Formula field should be saved to database for all components
- Formula selection should persist when editing products
- Consumption calculations should work correctly for all formula types
- No regression in existing functionality
- Both standard and custom components should support all formula types

## Database Fields

The following fields should be populated:

- `components.formula` - 'standard', 'linear', or 'manual'
- `components.is_manual_consumption` - boolean indicating manual mode
- `components.consumption` - calculated or manual consumption value

## Verification Commands

```sql
-- Check formula field in components
SELECT name, component_type, formula, is_manual_consumption, consumption
FROM product_components
WHERE product_id = 'YOUR_PRODUCT_ID';
```
