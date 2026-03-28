import { Component, ErrorInfo, ReactNode } from 'react';
import { X } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let message = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error && parsed.error.includes("insufficient permissions")) {
          message = "You don't have permission to perform this action. Please check your account settings.";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <X size={32} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Application Error</h2>
            <p className="text-zinc-500 mb-6">{message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}