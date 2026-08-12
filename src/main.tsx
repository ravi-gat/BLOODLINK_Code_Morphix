import { createRoot } from "react-dom/client";
import { AppRouter } from "./routes/AppRouter";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(<ErrorBoundary><AppRouter /></ErrorBoundary>);
