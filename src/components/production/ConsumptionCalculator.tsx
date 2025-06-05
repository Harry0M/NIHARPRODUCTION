import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// Define formula types
export type ConsumptionFormulaType = 'standard' | 'linear' | 'manual';

interface ConsumptionCalculatorProps {
  length: number;
  width: number;
  quantity: number;
  rollWidth: number;
  materialRate?: number;
  selectedFormula?: ConsumptionFormulaType;
  onConsumptionCalculated: (meters: number, cost?: number, isManual?: boolean) => void;
  onFormulaChange?: (formula: ConsumptionFormulaType) => void;
  initialIsManual?: boolean;
  initialConsumption?: number;
}

export const ConsumptionCalculator = ({
  length, 
  width, 
  quantity,
  rollWidth,
  materialRate,
  selectedFormula = "standard",
  onConsumptionCalculated,
  onFormulaChange,
  initialIsManual = false,
  initialConsumption
}: ConsumptionCalculatorProps) => {
  const [consumption, setConsumption] = useState<number>(0);
  const [materialCost, setMaterialCost] = useState<number | undefined>(undefined);
  
  // Ensure initial formula respects manual mode. If initialIsManual is true,
  // set formula to 'manual' but remember the selected formula for later
  const initialFormula = initialIsManual ? 'manual' : selectedFormula;
  const [formula, setFormula] = useState<ConsumptionFormulaType>(initialFormula);
  const [isManualMode, setIsManualMode] = useState<boolean>(initialIsManual);
  
  // Initialize manualConsumption if we're starting in manual mode
  const [manualConsumption, setManualConsumption] = useState<string>(
    initialIsManual && initialConsumption ? initialConsumption.toString() : ""
  );
  
  // Track the base formula (standard/linear) separate from manual mode
  // If we're in manual mode but selectedFormula is also 'manual', default to 'standard'
  const [baseFormula, setBaseFormula] = useState<ConsumptionFormulaType>(
    selectedFormula === 'manual' ? 'standard' : selectedFormula
  );
  
  // Log initialization for debugging with more visibility
  useEffect(() => {
    console.log('%c ConsumptionCalculator initialized:', 'background:#2ecc71;color:white;font-weight:bold;padding:3px;', {
      initialIsManual,
      initialConsumption,
      selectedFormula,
      formula: initialFormula,
      baseFormula: selectedFormula === 'manual' ? 'standard' : selectedFormula,
      isManualMode
    });
    
    // If initialIsManual is true, we need to ensure that:
    // 1. formula is set to 'manual'
    // 2. isManualMode is true
    // 3. If we have an initial consumption value, use it
    if (initialIsManual) {
      if (formula !== 'manual') {
        console.log('%c Fixing initial manual mode state', 'background:#e74c3c;color:white;font-weight:bold;padding:3px;');
        setFormula('manual');
        setIsManualMode(true);
      }
      
      // If we have an initial consumption value, notify the parent immediately
      if (initialConsumption !== undefined && initialConsumption > 0) {
        console.log('%c Setting initial manual consumption:', 'background:#9b59b6;color:white;font-weight:bold;padding:3px;', initialConsumption);
        setConsumption(initialConsumption);
        onConsumptionCalculated(
          initialConsumption, 
          materialRate ? initialConsumption * materialRate : undefined, 
          true
        );
      }
    }
  }, [initialIsManual, initialConsumption, selectedFormula, initialFormula, formula, isManualMode, onConsumptionCalculated, materialRate]);

  // Memoize the calculation function to prevent unnecessary recalculations
  const calculateConsumption = useCallback(() => {
    if (!length || !quantity) return 0;
    
    // Use baseFormula for calculations, even when displaying manual mode
    const calculationFormula = isManualMode ? baseFormula : formula;
    
    try {
      let calculatedConsumption = 0;
      let canCalculate = true;
      
      if (calculationFormula === "standard") {
        // Standard formula: (length * width) / (roll_width * 39.39) * quantity
        // Width and roll_width are required for this formula
        if (!width || !rollWidth) {
          canCalculate = false;
        }
        
        if (canCalculate) {
          // Convert inches to meters:
          // 1. Calculate area in square inches: length * width
          // 2. Divide by roll width in inches
          // 3. Convert to meters (39.37 inches = 1 meter)
          // 4. Multiply by quantity
          const areaInSqInches = length * width;
          const lengthPerUnit = areaInSqInches / rollWidth; // length in inches per unit
          calculatedConsumption = (lengthPerUnit / 39.37) * quantity; // convert to meters and multiply by quantity
        }
      } else if (calculationFormula === "linear") {
        // Linear formula: (length * quantity) / 39.37 
        // This is just a direct conversion of inches to meters multiplied by quantity
        const totalLengthInInches = length * quantity;
        calculatedConsumption = totalLengthInInches / 39.37; // convert to meters
      }
      
      // Round to 4 decimal places for better precision
      return Math.round(calculatedConsumption * 10000) / 10000;
    } catch (error) {
      console.error("Error calculating consumption:", error);
      return 0;
    }
  }, [length, width, rollWidth, quantity, formula, baseFormula, isManualMode]);

  // Handle formula change
  const handleFormulaChange = (value: ConsumptionFormulaType) => {
    setFormula(value);
    
    // Update manual mode state
    if (value === 'manual') {
      setIsManualMode(true);
    } else {
      setIsManualMode(false);
      setBaseFormula(value);
    }
    
    // Notify parent component
    if (onFormulaChange) {
      onFormulaChange(value);
    }
    
    console.log(`Formula changed to: ${value}, isManualMode: ${value === 'manual'}`);
  };

  // Auto-detect formula based on provided dimensions - WITH EDIT MODE PROTECTION
  useEffect(() => {
    // Skip auto-detection in these cases:
    // 1. We're in manual mode
    // 2. This is initial mount with a specific formula already set from parent
    // 3. We're editing a product (initialIsManual is true)
    if (isManualMode || initialIsManual) return;
    
    // Auto-select formula based on available dimensions
    const newFormula: ConsumptionFormulaType = 
      // If we have length, width and roll_width, use standard formula
      (length && width && rollWidth) ? "standard" :
      // If we only have length, use linear formula
      (length && (!width || !rollWidth)) ? "linear" :
      // Default to current base formula if we can't determine
      baseFormula;
    
    // Update formula if it's different from current base formula
    if (newFormula !== baseFormula) {
      setBaseFormula(newFormula);
      setFormula(newFormula);
      if (onFormulaChange) {
        onFormulaChange(newFormula);
      }
      console.log(`Auto-selected formula: ${newFormula} based on dimensions`, 
        { length, width, rollWidth });
    }
  }, [length, width, rollWidth, baseFormula, onFormulaChange, isManualMode, initialIsManual]);

  // Calculate consumption whenever inputs change
  useEffect(() => {
    const newConsumption = calculateConsumption();
    if (newConsumption !== consumption) {
      setConsumption(newConsumption);
      if (!isManualMode) {
        onConsumptionCalculated(newConsumption, materialRate ? newConsumption * materialRate : undefined, false);
      }
    }
  }, [calculateConsumption, materialRate, onConsumptionCalculated, isManualMode, consumption]);

  // Synchronize formula with selectedFormula when it changes
  useEffect(() => {
    // Only sync if not in manual mode to avoid losing manual state
    if (!isManualMode && selectedFormula !== formula && selectedFormula !== 'manual') {
      setFormula(selectedFormula);
      setBaseFormula(selectedFormula);
      console.log(`Formula synced from parent: ${selectedFormula}`);
    }
  }, [selectedFormula, formula, isManualMode]);

  // Update manual consumption when calculated consumption changes
  useEffect(() => {
    if (!isManualMode) {
      setManualConsumption(consumption ? consumption.toString() : '');
    }
  }, [consumption, isManualMode]);

  // Handle manual consumption change
  const handleManualConsumptionChange = (value: string) => {
    setManualConsumption(value);
    const numValue = parseFloat(value) || 0;
    onConsumptionCalculated(numValue, materialRate ? numValue * materialRate : undefined, true);
  }; 

  // Toggle between manual and calculated mode
  const toggleManualMode = (checked: boolean) => {
    setIsManualMode(checked);
    const newFormula = checked ? 'manual' : baseFormula;
    setFormula(newFormula);
    if (onFormulaChange) {
      onFormulaChange(newFormula);
    }
    if (!checked) {
      // When switching back to calculated mode, update with the calculated value
      onConsumptionCalculated(consumption, materialRate ? consumption * materialRate : undefined, false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Label htmlFor="formula-select" className="whitespace-nowrap">Formula:</Label>
        <Select 
          value={formula} 
          onValueChange={(value) => {
            const newFormula = value as ConsumptionFormulaType;
            setFormula(newFormula);
            
            // Track base formula for non-manual formulas
            if (newFormula !== 'manual') {
              setBaseFormula(newFormula);
              setIsManualMode(false);
              // Recalculate consumption when switching from manual to calculated
              const newConsumption = calculateConsumption();
              if (newConsumption !== consumption) {
                setConsumption(newConsumption);
                onConsumptionCalculated(newConsumption, materialRate ? newConsumption * materialRate : undefined, false);
              }
            } else {
              setIsManualMode(true);
            }
            
            if (onFormulaChange) {
              onFormulaChange(newFormula);
            }
          }}
        >
          <SelectTrigger id="formula-select" className="flex-grow">
            <SelectValue placeholder="Select formula" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard (L×W)÷(RW×39.39)</SelectItem>
            <SelectItem value="linear">Linear (Q×L)÷39.39</SelectItem>
            <SelectItem value="manual">Manual Entry</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="consumption">Consumption (meters)</Label>
        <div className="flex items-center space-x-2">
          <Label htmlFor="manual-mode" className="text-xs text-muted-foreground">
            Manual
          </Label>
          <Switch
            id="manual-mode"
            checked={isManualMode}
            onCheckedChange={toggleManualMode}
          />
        </div>
      </div>
      <Input 
        id="consumption" 
        type="number"
        step="0.0001"
        min="0"
        value={isManualMode ? manualConsumption : (consumption ? consumption.toString() : '')}
        onChange={(e) => isManualMode && handleManualConsumptionChange(e.target.value)}
        readOnly={!isManualMode}
        className={`${isManualMode ? 'bg-white border-amber-300' : 'bg-gray-50 border-blue-300 text-blue-800 font-medium'}`}
        data-final-consumption={consumption ? consumption.toString() : ''}
      />
      {isManualMode && (
        <p className="text-xs text-muted-foreground">
          {formula === "manual" 
            ? `Manual entry (calculated: ${consumption.toFixed(4)}m using ${baseFormula} formula)`
            : `Calculated: ${consumption.toFixed(4)}m (${baseFormula} formula)`}
        </p>
      )}
      {baseFormula === "standard" && (!width || !rollWidth) && (
        <p className="text-xs text-amber-500">
          {!width && !rollWidth ? "Width and roll width required" : 
           !width ? "Width required" : "Roll width required"}
        </p>
      )}
      {materialRate && materialCost !== undefined && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Rate: ₹{materialRate}/meter
          </span>
          <span className="text-xs font-medium text-emerald-700">
            Cost: ₹{materialCost}
          </span>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {isManualMode 
          ? `Manual entry mode (base calculation: ${baseFormula === "standard" 
              ? "[(length×width)÷(roll width×39.39)]×quantity"
              : baseFormula === "linear" 
              ? "(quantity×length)÷39.39"
              : "No calculation"})`
          : formula === "standard" 
          ? "Formula: [(length×width)÷(roll width×39.39)]×quantity" 
          : formula === "linear"
          ? "Formula: (quantity×length)÷39.39"
          : "Manual consumption entry"}
      </p>
    </div>
  );
};
