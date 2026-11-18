import React from 'react';
import { ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.hash = '';
      const basePath = window.location.pathname.startsWith('/EduVista') ? '/EduVista/' : '/';
      window.history.pushState({}, '', basePath);
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center bg-brand-cream/40 rounded-3xl m-4 border border-brand-moss/10">
          <div className="w-14 h-14 rounded-full bg-brand-clay/10 text-brand-clay flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="font-heading font-bold text-xl sm:text-2xl text-brand-moss mb-2">
            Something went wrong loading this section
          </h2>
          <p className="font-sans text-xs text-brand-charcoal/70 max-w-md mb-6 leading-relaxed">
            The page encountered a temporary display issue. Your session data and account are completely safe.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="py-2.5 px-6 rounded-full bg-brand-moss text-white font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-brand-moss/90 transition-all shadow-md cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Homepage
            </button>
            <button
              onClick={() => window.location.reload()}
              className="py-2.5 px-6 rounded-full bg-white text-brand-moss border border-brand-moss/20 font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-brand-moss/5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
