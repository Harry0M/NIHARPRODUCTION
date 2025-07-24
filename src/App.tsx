
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter } from "react-router-dom";
import { ColorSchemeProvider } from "./context/ColorSchemeContext";
import AppRoutes from "./AppRoutes";
import * as React from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <ColorSchemeProvider>
          <TooltipProvider>
            <AppRoutes />
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </ColorSchemeProvider>
      </QueryClientProvider>
    </HashRouter>
  );
};

export default App;
