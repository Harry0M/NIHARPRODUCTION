
import React, { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";

interface LayoutProps {
  children?: ReactNode;
}

export const SupplierLayout = ({ children }: LayoutProps) => {
  return <AppLayout>{children || <Outlet />}</AppLayout>;
};
