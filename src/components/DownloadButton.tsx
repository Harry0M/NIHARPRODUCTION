
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface DownloadButtonProps {
  onClick?: () => void;
  onCsvClick?: () => void;
  onPdfClick?: () => void;
  label?: string;
  disabled?: boolean;
}

export const DownloadButton = ({ 
  onClick, 
  onCsvClick, 
  onPdfClick, 
  label = "Download", 
  disabled = false 
}: DownloadButtonProps) => {
  // If specific format handlers are provided, show dropdown menu
  const hasFormatOptions = onCsvClick || onPdfClick;

  if (hasFormatOptions) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2"
            disabled={disabled}
          >
            <Download className="h-4 w-4" />
            {label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onCsvClick && (
            <DropdownMenuItem onClick={onCsvClick}>
              CSV Format
            </DropdownMenuItem>
          )}
          {onPdfClick && (
            <DropdownMenuItem onClick={onPdfClick}>
              PDF Format
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // If no specific format handlers, use the generic onClick
  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={onClick}
      className="gap-2"
      disabled={disabled}
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  );
};
