
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ComponentNotesProps {
  notes: string;
  onChange: (value: string) => void;
}

export function ComponentNotes({ notes, onChange }: ComponentNotesProps) {
  return (
    <div className="space-y-2">
      <Label>Notes</Label>
      <Textarea
        placeholder="Add any notes about the cutting process"
        value={notes}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[100px]"
      />
    </div>
  );
}
