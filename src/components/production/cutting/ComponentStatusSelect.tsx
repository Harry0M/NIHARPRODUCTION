
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JobStatus } from "@/types/production";

interface ComponentStatusSelectProps {
  status: JobStatus;
  onChange: (value: JobStatus) => void;
}

export function ComponentStatusSelect({ status, onChange }: ComponentStatusSelectProps) {
  return (
    <Select value={status || "pending"} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="in_progress">In Progress</SelectItem>
        <SelectItem value="completed">Completed</SelectItem>
      </SelectContent>
    </Select>
  );
}
