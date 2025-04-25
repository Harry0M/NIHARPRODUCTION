
import { StageInfo } from "./StageInfo";
import { StageAction } from "./StageAction";

interface StageHeaderProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  onNewJob: () => void;
  disabled?: boolean;
}

export const StageHeader = ({ icon, title, count, onNewJob, disabled }: StageHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <StageInfo 
        icon={icon}
        title={title}
        count={count}
        disabled={disabled}
      />
      <StageAction 
        onNewJob={onNewJob}
        disabled={disabled}
      />
    </div>
  );
};

