
import { Card } from "@/components/ui/card";

interface ValidationErrorsProps {
  errors: string[];
}

export const ValidationErrors = ({ errors }: ValidationErrorsProps) => {
  if (errors.length === 0) return null;
  
  return (
    <Card className="bg-destructive/10 border-destructive">
      <div className="p-4">
        <h2 className="font-semibold text-destructive">Please fix the following errors:</h2>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          {errors.map((error, index) => (
            <li key={index} className="text-sm text-destructive">{error}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
};
