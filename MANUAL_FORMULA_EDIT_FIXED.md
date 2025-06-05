# Manual Formula and Consumption Fix

This document outlines the fix for an issue in the product edit form where manual formulas and consumption values weren't correctly preserved when editing products.

## The Problem

When editing a product in the `CatalogEdit.tsx` component:

1. Products with components that had manual formulas (formula = 'manual' or is_manual_consumption = true) would incorrectly convert to linear or standard formulas during initialization
2. The manual consumption values would not be displayed correctly
3. This happened because the `initialIsManual` prop wasn't being passed to the `ConsumptionCalculator` component

## The Solution

We implemented multiple fixes to address the issue:

### 1. Fixed `ComponentType` Interface

Added the `baseFormula` property to the `ComponentType` interface to properly track the base formula type when in manual mode:

```typescript
interface ComponentType {
  // ...existing properties...
  formula?: "standard" | "linear" | "manual";
  is_manual_consumption?: boolean;
  baseFormula?: "standard" | "linear"; // Added this property
}
```

### 2. Added `initialIsManual` Prop to Component Sections

Both `StandardComponents.tsx` and `CustomComponentSection.tsx` now pass the `initialIsManual` prop to the `ConsumptionCalculator` component:

```tsx
<ConsumptionCalculator
  // ...other props...
  initialIsManual={
    component.formula === "manual" || !!component.is_manual_consumption
  }
  onConsumptionCalculated={handleConsumptionCalculated}
  onFormulaChange={handleFormulaChange}
/>
```

### 3. Enhanced the ConsumptionCalculator Component

Added proper initialization for manual formulas:

```tsx
useEffect(() => {
  // If initialIsManual is true, we need to ensure that:
  // 1. formula is set to 'manual'
  // 2. isManualMode is true
  if (initialIsManual && formula !== "manual") {
    setFormula("manual");
    setIsManualMode(true);
  }
}, [initialIsManual, selectedFormula, initialFormula, formula, isManualMode]);
```

### 4. Fixed TypeScript Warnings

- Replaced `Record<string, any>` with `Record<string, ComponentType>`
- Changed `catch (error: any)` to use a proper type-safe approach
- Added missing dependencies to `useEffect` hooks

### 5. Added Testing Utilities

Created a debug utility in `utils/debug-formula-state.ts` that helps diagnose formula state issues:

```typescript
export function logFormulaState(componentName, state, action) { ... }
export function createManualFormulaTest() { ... }
```

## How to Test

1. Open a product that has components with manual formulas (either through the UI or by setting them in the database)
2. Click on "Edit" to open the product in the edit form
3. Click the "Test Formula State" button to see the current formula state in the browser console
4. Manual formula components should show:
   - formula = 'manual'
   - is_manual_consumption = true
5. The consumption value should match the original manual value

## Additional Notes

- The ConsumptionCalculator component now correctly preserves the base formula (standard/linear) when switching to manual mode
- We've added extensive debug logging to help diagnose formula state issues in the future
- TypeScript warnings have been fixed in the CatalogEdit component to improve code quality
