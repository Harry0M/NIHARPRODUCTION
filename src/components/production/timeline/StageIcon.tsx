
import { LucideIcon } from "lucide-react";

interface StageIconProps {
  icon: React.ReactNode;
  status: 'active' | 'completed' | 'disabled';
}

export const StageIcon = ({ icon, status }: StageIconProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'active':
        return 'text-amber-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className={`h-5 w-5 ${getStatusColor()}`}>
      {icon}
    </div>
  );
};
