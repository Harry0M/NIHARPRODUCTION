
import React from "react";

interface ShellProps {
  children: React.ReactNode;
}

export const Shell = ({ children }: ShellProps) => {
  return (
    <div className="container mx-auto px-4 py-8">
      {children}
    </div>
  );
};
