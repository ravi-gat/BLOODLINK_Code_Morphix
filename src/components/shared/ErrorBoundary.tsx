import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(): State { return { hasError: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { /* Keep technical details out of the UI. */ }
  render() {
    if (this.state.hasError) return <main className="min-h-screen grid place-items-center p-6 bg-background text-center"><div><h1 className="text-2xl font-bold text-foreground">Something went wrong</h1><p className="mt-2 text-muted-foreground">Please refresh the page and try again.</p><button className="mt-5 px-4 py-2 rounded-xl bg-red-600 text-white" onClick={() => window.location.reload()}>Refresh page</button></div></main>;
    return this.props.children;
  }
}
