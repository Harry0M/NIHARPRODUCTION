
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { FormFieldWithValidation } from "@/components/ui/form-field-with-validation";

export interface ComponentProps {
  id?: string;
  type: string;
  width?: string;
  length?: string;
  color?: string;
  gsm?: string;
  name?: string;
  customName?: string;
  details?: string;
}

interface ComponentFormProps {
  component: ComponentProps;
  index: number;
  isCustom?: boolean;
  componentOptions: {
    color: string[];
    gsm: string[];
  };
  title?: string;
  handleChange: (index: number, field: string, value: string) => void;
  onChange?: (field: string, value: string) => void;
}

export const ComponentForm = ({ 
  component, 
  index, 
  isCustom = false, 
  componentOptions,
  title,
  handleChange,
  onChange
}: ComponentFormProps) => {
  // State to track if user wants to enter custom GSM
  const [isCustomGsm, setIsCustomGsm] = useState(false);
  // State for field validation
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const onFieldChange = (field: string, value: string) => {
    // Mark field as touched
    if (!touchedFields[field]) {
      setTouchedFields({...touchedFields, [field]: true});
    }
    
    // Perform validation
    let error = '';
    if (field === 'length' || field === 'width') {
      if (value && isNaN(parseFloat(value))) {
        error = `${field.charAt(0).toUpperCase() + field.slice(1)} must be a number`;
      } else if (value && parseFloat(value) <= 0) {
        error = `${field.charAt(0).toUpperCase() + field.slice(1)} must be positive`;
      }
    }
    
    if (field === 'customName' && isCustom && value.trim() === '') {
      error = 'Component name is required';
    }
    
    // Update error state
    setValidationErrors({...validationErrors, [field]: error});
    
    // Call the appropriate change handler
    if (onChange) {
      onChange(field, value);
    } else {
      handleChange(index, field, value);
    }
  };
  
  const isFieldTouched = (field: string) => touchedFields[field];

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      {title && !isCustom && (
        <h3 className="font-medium mb-4">{title}</h3>
      )}
      <div className="grid md:grid-cols-4 gap-4">
        {isCustom && (
          <div className="space-y-2">
            <FormFieldWithValidation
              id={`component-${index}-name`}
              label="Component Name"
              value={component.name || component.customName || ''}
              onChange={(e) => onFieldChange('customName', e.target.value)}
              required={isCustom}
              error={isFieldTouched('customName') ? validationErrors.customName : undefined}
              aria-required={isCustom}
            />
          </div>
        )}
        <div className="space-y-2">
          <FormFieldWithValidation
            id={`component-${index}-length`}
            label="Length (inches)"
            type="number"
            step="0.01"
            placeholder="Length in inches"
            value={component.length || ''}
            onChange={(e) => onFieldChange('length', e.target.value)}
            error={isFieldTouched('length') ? validationErrors.length : undefined}
            success={isFieldTouched('length') && !validationErrors.length && !!component.length}
          />
        </div>
        <div className="space-y-2">
          <FormFieldWithValidation
            id={`component-${index}-width`}
            label="Width (inches)"
            type="number"
            step="0.01"
            placeholder="Width in inches"
            value={component.width || ''}
            onChange={(e) => onFieldChange('width', e.target.value)}
            error={isFieldTouched('width') ? validationErrors.width : undefined}
            success={isFieldTouched('width') && !validationErrors.width && !!component.width}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`component-${index}-color`}>Color</Label>
          <Select 
            value={component.color || undefined} 
            onValueChange={(value) => onFieldChange('color', value)}
          >
            <SelectTrigger id={`component-${index}-color`}>
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_applicable">Not Applicable</SelectItem>
              {componentOptions.color.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={isCustomGsm ? `component-${index}-gsm-custom` : `component-${index}-gsm`}>GSM</Label>
          {isCustomGsm ? (
            <div className="flex gap-2">
              <Input
                id={`component-${index}-gsm-custom`}
                type="number"
                placeholder="Enter GSM value"
                value={component.gsm || ''}
                onChange={(e) => onFieldChange('gsm', e.target.value)}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => setIsCustomGsm(false)}
                className="px-3 py-2 text-xs border rounded hover:bg-secondary focus:ring-2 focus:ring-offset-1 focus:ring-primary focus-visible:outline-none"
              >
                Use List
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select 
                value={component.gsm || undefined} 
                onValueChange={(value) => onFieldChange('gsm', value)}
              >
                <SelectTrigger id={`component-${index}-gsm`} className="flex-1">
                  <SelectValue placeholder="Select GSM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_applicable">Not Applicable</SelectItem>
                  {componentOptions.gsm.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => setIsCustomGsm(true)}
                className="px-3 py-2 text-xs border rounded hover:bg-secondary focus:ring-2 focus:ring-offset-1 focus:ring-primary focus-visible:outline-none"
              >
                Custom
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
