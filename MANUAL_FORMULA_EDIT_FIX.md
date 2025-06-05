# Manual Formula Edit Form Fix - Implementation Summary

## Problem Identified

In the product edit form, components with manual formulas and manual consumption values were correctly loaded from the database but were not properly displayed in the UI. The ConsumptionCalculator component was overriding the manual setting in several scenarios:

1. The formula selector wasn't properly syncing with parent components
2. Auto-detection of formula based on dimensions was overriding manual formulas
3. There was no useEffect to update the formula when selectedFormula changed
4. Manual mode wasn't being properly preserved when switching between formulas

## Root Causes Found

### 1. Missing selectedFormula Synchronization

**File**: `src/components/production/ConsumptionCalculator.tsx`
**Issue**: No useEffect to sync the selectedFormula prop with the formula state when it changes in the parent.

### 2. Auto-detection Overriding Manual Formulas

**File**: `src/components/production/ConsumptionCalculator.tsx`
**Issue**: Auto-detection of formulas based on dimensions was running even for components loaded from the database with manual formulas.

### 3. Inconsistent Manual Mode Handling

**File**: `src/components/production/ConsumptionCalculator.tsx`
**Issue**: The formula change handler wasn't properly updating the isManualMode state.

## Changes Made

### 1. Added Formula Synchronization

Added a useEffect hook to sync the selectedFormula with the component's formula state:

```tsx
// Synchronize formula with selectedFormula when it changes
useEffect(() => {
  // Only sync if not in manual mode to avoid losing manual state
  if (
    !isManualMode &&
    selectedFormula !== formula &&
    selectedFormula !== "manual"
  ) {
    setFormula(selectedFormula);
    setBaseFormula(selectedFormula);
    console.log(`Formula synced from parent: ${selectedFormula}`);
  }
}, [selectedFormula, formula, isManualMode]);
```

### 2. Enhanced Auto-detection Logic

Modified the auto-detection useEffect to respect initialIsManual:

```tsx
// Auto-detect formula based on provided dimensions - WITH EDIT MODE PROTECTION
useEffect(() => {
  // Skip auto-detection in these cases:
  // 1. We're in manual mode
  // 2. This is initial mount with a specific formula already set from parent
  // 3. We're editing a product (initialIsManual is true)
  if (isManualMode || initialIsManual) return;

  // Auto-select formula based on available dimensions
  // ...rest of the function...
}, [
  length,
  width,
  rollWidth,
  baseFormula,
  onFormulaChange,
  isManualMode,
  initialIsManual,
]);
```

### 3. Improved Initialization Logic

Enhanced the state initialization to better handle manual mode:

```tsx
// Ensure initial formula respects manual mode
const initialFormula = initialIsManual ? "manual" : selectedFormula;
const [formula, setFormula] = useState<ConsumptionFormulaType>(initialFormula);
const [isManualMode, setIsManualMode] = useState<boolean>(initialIsManual);

// Track the base formula (standard/linear) separate from manual mode
const [baseFormula, setBaseFormula] = useState<ConsumptionFormulaType>(
  selectedFormula === "manual" ? "standard" : selectedFormula
);

// Log initialization for debugging
useEffect(() => {
  console.log("ConsumptionCalculator initialized:", {
    initialIsManual,
    selectedFormula,
    formula: initialFormula,
    baseFormula: selectedFormula === "manual" ? "standard" : selectedFormula,
  });
}, [initialIsManual, selectedFormula, initialFormula]);
```

### 4. Fixed Formula Change Handler

Updated formula change handler to properly manage manual mode state:

```tsx
// Handle formula change
const handleFormulaChange = (value: ConsumptionFormulaType) => {
  setFormula(value);

  // Update manual mode state
  if (value === "manual") {
    setIsManualMode(true);
  } else {
    setIsManualMode(false);
    setBaseFormula(value);
  }

  // Notify parent component
  if (onFormulaChange) {
    onFormulaChange(value);
  }

  console.log(
    `Formula changed to: ${value}, isManualMode: ${value === "manual"}`
  );
};
```

## Expected Behavior After Fix

### Before Fix:

1. Product components with manual formulas are loaded from database
2. The ConsumptionCalculator overrides manual mode due to auto-detection
3. Manual toggle shows as OFF despite component having is_manual_consumption=true
4. Formula displays as 'standard' or 'linear' instead of 'manual'

### After Fix:

1. Product components with manual formulas are loaded from database
2. The ConsumptionCalculator respects initialIsManual and doesn't auto-detect when true
3. Manual toggle shows as ON for components with is_manual_consumption=true
4. Formula displays as 'manual' for manual components
5. Manual values are preserved and properly displayed

## Testing Recommendations

1. **Manual Formula Display Test**:

   - Edit a product with 'manual' formula components
   - Verify manual toggle is ON
   - Verify formula selector shows 'manual'
   - Verify manual consumption value is displayed properly

2. **Formula Toggle Test**:

   - In edit mode, toggle manual mode ON/OFF
   - Verify correct formula is displayed when toggling back to auto

3. **Formula Selection Test**:
   - Change formulas between standard/linear/manual
   - Verify manual mode toggle syncs with formula selection
   - Verify formulas persist after saving

## Files Modified

1. `src/components/production/ConsumptionCalculator.tsx`

## Impact

This fix ensures that:

- Manual formulas are properly displayed when editing products
- Manual consumption values are preserved and displayed correctly
- The manual mode toggle and formula selector stay in sync
- Manual mode is not accidentally overridden during component rendering
