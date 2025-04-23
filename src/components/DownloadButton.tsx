
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface DownloadButtonProps {
  onClick: () => void;
  label?: string;
}

export const DownloadButton = ({ onClick, label = "Download" }: DownloadButtonProps) => (
  <Button 
    variant="outline" 
    size="sm"
    onClick={onClick}
    className="gap-2"
  >
    <Download className="h-4 w-4" />
    {label}
  </Button>
);
