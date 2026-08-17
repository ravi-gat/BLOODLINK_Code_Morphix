import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "./app/components/ui/sonner";
import { AppRouter } from "./routes/AppRouter";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import { useAuthStore } from "./stores/useAuthStore";
import "./styles/index.css";

// Restore session on app load (uses httpOnly cookie sent by backend)
void useAuthStore.getState().restoreSession();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppRouter />
      <Toaster richColors position="top-right" />
    </ErrorBoundary>
  </StrictMode>
);
