
import React from "react";

interface ProductionHeaderProps {
  title?: string;
  subtitle?: string;
}

export const ProductionHeader = ({ 
  title = "Production", 
  subtitle = "Monitor and manage production stages" 
}: ProductionHeaderProps) => {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  );
};
