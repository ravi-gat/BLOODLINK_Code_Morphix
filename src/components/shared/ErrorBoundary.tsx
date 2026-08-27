import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("BloodLink runtime error:", error);
    console.error("Component stack:", info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen grid place-items-center p-6 bg-background">
          <div className="max-w-2xl w-full rounded-2xl border p-6 bg-card">
            <h1 className="text-2xl font-bold text-red-600">
              Something went wrong
            </h1>

            <p className="mt-3 text-muted-foreground">
              A frontend runtime error occurred.
            </p>

            <pre className="mt-5 p-4 rounded-xl bg-muted text-sm overflow-auto whitespace-pre-wrap">
              {this.state.error?.message || "Unknown error"}
            </pre>

            <button
              className="mt-5 px-4 py-2 rounded-xl bg-red-600 text-white"
              onClick={() => window.location.reload()}
            >
              Refresh page
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}