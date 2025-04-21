
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ComponentFormProps {
  component: {
    type: string;
    width: string;
    length: string;
    color: string;
    gsm: string;
    name?: string;
    details?: string;
  };
  index: number;
  isCustom?: boolean;
  componentOptions: {
    color: string[];
    gsm: string[];
  };
  handleChange: (index: number, field: string, value: string) => void;
}

export const ComponentForm = ({ 
  component, 
  index, 
  isCustom = false, 
  componentOptions,
  handleChange 
}: ComponentFormProps) => {
  return (
    <div className="grid md:grid-cols-4 gap-4">
      {isCustom && (
        <div className="space-y-2">
          <Label>Component Name</Label>
          <Input
            placeholder="Enter component name"
            value={component.name || ''}
            onChange={(e) => handleChange(index, 'name', e.target.value)}
            required={isCustom}
          />
        </div>
      )}
      <div className="space-y-2">
        <Label>Length (inches)</Label>
        <Input
          type="number"
          step="0.01"
          placeholder="Length in inches"
          value={component.length || ''}
          onChange={(e) => handleChange(index, 'length', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Width (inches)</Label>
        <Input
          type="number"
          step="0.01"
          placeholder="Width in inches"
          value={component.width || ''}
          onChange={(e) => handleChange(index, 'width', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Color</Label>
        <Select 
          value={component.color || undefined} 
          onValueChange={(value) => handleChange(index, 'color', value)}
        >
          <SelectTrigger>
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
        <Label>GSM</Label>
        <Select 
          value={component.gsm || undefined} 
          onValueChange={(value) => handleChange(index, 'gsm', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select GSM" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="not_applicable">Not Applicable</SelectItem>
            {componentOptions.gsm.map(option => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
