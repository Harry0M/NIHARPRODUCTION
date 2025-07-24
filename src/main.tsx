
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import AppWithDatabase from './AppWithDatabase.tsx';
import './index.css';

// Use createRoot with explicit React import
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Root element not found');
const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppWithDatabase />
  </React.StrictMode>
);
