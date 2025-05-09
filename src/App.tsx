import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ColorSchemeProvider } from "./context/ColorSchemeContext";
import AppRoutes from "./AppRoutes";
import * as React from "react";

// Create a single instance of QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

// Use function declaration instead of arrow function
function App() {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(
        ColorSchemeProvider,
        null,
        React.createElement(
          TooltipProvider,
          null,
          React.createElement(BrowserRouter, null, 
            React.createElement(AppRoutes, null),
            React.createElement(Toaster, null),
            React.createElement(Sonner, null)
          )
        )
      )
    )
  );
}

export default App;
