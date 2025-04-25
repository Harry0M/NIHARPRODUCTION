
import { StageIcon } from "./StageIcon";

interface StageInfoProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  disabled?: boolean;
}

export const StageInfo = ({ icon, title, count, disabled }: StageInfoProps) => {
  return (
    <div className="flex items-center gap-2">
      <StageIcon icon={icon} status={disabled ? 'disabled' : 'active'} />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">
          {count ? `${count} job(s)` : "No jobs yet"}
        </p>
      </div>
    </div>
  );
};

