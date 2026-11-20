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
    window.location.hash = '';
    const basePath = window.location.pathname.startsWith('/EduVista') ? '/EduVista/' : '/';
    window.history.pushState({}, '', basePath);
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  handleClearCacheAndReload = () => {
    try {
      localStorage.removeItem('eduvista_user');
      localStorage.removeItem('eduvista_token');
    } catch (e) {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center bg-brand-cream/40 rounded-3xl m-4 border border-brand-moss/10 font-sans">
          <div className="w-14 h-14 rounded-full bg-brand-clay/10 text-brand-clay flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="font-heading font-bold text-xl sm:text-2xl text-brand-moss mb-2">
            Something went wrong loading this section
          </h2>
          <p className="font-sans text-xs text-brand-charcoal/70 max-w-md mb-4 leading-relaxed">
            The page encountered a temporary display issue. Your session data and account are completely safe.
          </p>

          {/* Diagnostic Error Details */}
          {this.state.error && (
            <div className="w-full max-w-xl mx-auto mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-left text-xs font-mono text-rose-800 overflow-x-auto shadow-xs">
              <p className="font-bold mb-1">Error: {this.state.error?.message || String(this.state.error)}</p>
              {this.state.error?.stack && (
                <pre className="text-[10px] text-rose-700/80 max-h-36 overflow-y-auto whitespace-pre-wrap mt-2">
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          )}

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
            <button
              onClick={this.handleClearCacheAndReload}
              className="py-2.5 px-5 rounded-full bg-brand-clay/10 text-brand-clay border border-brand-clay/20 font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-brand-clay hover:text-white transition-all cursor-pointer"
            >
              Reset Session Cache
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
