
import React, { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";

interface LayoutProps {
  children?: ReactNode;
}

export const MainLayout = ({ children }: LayoutProps) => {
  return <AppLayout>{children || <Outlet />}</AppLayout>;
};
