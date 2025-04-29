
import { Outlet } from "react-router-dom";

interface LayoutProps {
  children?: React.ReactNode;
}

export const AuthLayout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-4 py-8">
        {children || <Outlet />}
      </div>
    </div>
  );
};
