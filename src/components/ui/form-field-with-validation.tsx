
import { Input, InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import * as React from "react";

interface FormFieldWithValidationProps extends InputProps {
  id: string;
  label: string;
  description?: string;
  error?: string;
  success?: boolean;
  showValidation?: boolean;
  validationMessage?: string;
  validationType?: "error" | "success" | "warning" | "info";
  required?: boolean;
}

export const FormFieldWithValidation = React.forwardRef<
  HTMLInputElement,
  FormFieldWithValidationProps
>(
  (
    {
      id,
      label,
      description,
      error,
      success,
      showValidation,
      validationMessage,
      validationType = "error",
      required,
      className,
      ...props
    },
    ref
  ) => {
    // Determine if field has validation feedback to show
    const hasValidation = error || (showValidation && validationMessage);
    const isValid = success && !error;

    // Icon to show based on validation state
    const ValidationIcon = () => {
      if (error || validationType === "error") return <AlertCircle className="h-4 w-4 text-destructive" />;
      if (isValid || validationType === "success") return <Check className="h-4 w-4 text-success" />;
      if (validationType === "info") return <Info className="h-4 w-4 text-info" />;
      return <AlertCircle className="h-4 w-4 text-warning" />;
    };

    // Class for validation message
    const getValidationClass = () => {
      if (error || validationType === "error") return "text-destructive";
      if (isValid || validationType === "success") return "text-success";
      if (validationType === "info") return "text-info";
      return "text-warning";
    };

    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex justify-between items-center">
          <Label 
            htmlFor={id} 
            className={cn(
              "flex items-center gap-1",
              error && "text-destructive"
            )}
          >
            {label}
            {required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          {isValid && !hasValidation && (
            <Check className="h-4 w-4 text-success" />
          )}
        </div>

        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}

        <Input
          id={id}
          ref={ref}
          error={!!error}
          success={isValid}
          aria-describedby={hasValidation ? `${id}-validation` : undefined}
          aria-invalid={!!error}
          aria-required={required}
          {...props}
        />

        {hasValidation && (
          <div 
            id={`${id}-validation`}
            className={cn(
              "flex items-center gap-1 text-xs", 
              getValidationClass()
            )}
          >
            <ValidationIcon />
            <span>{error || validationMessage}</span>
          </div>
        )}
      </div>
    );
  }
);

FormFieldWithValidation.displayName = "FormFieldWithValidation";
