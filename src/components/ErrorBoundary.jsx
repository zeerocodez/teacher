import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);

    const isChunkError = error?.message && (
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Loading chunk') ||
      error.message.includes('dynamically imported module') ||
      error.message.includes('Importing a module script failed')
    );

    if (isChunkError) {
      const reloadKey = 'eduvistar_chunk_reload_' + window.location.pathname;
      const lastReload = sessionStorage.getItem(reloadKey);
      if (!lastReload || Date.now() - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem(reloadKey, Date.now().toString());
        window.location.reload();
      }
    }
  }

  handleRetry = () => {
    const errorMessage = this.state.error?.message || '';
    const isChunkError = errorMessage.includes('Failed to fetch dynamically imported module') ||
                         errorMessage.includes('Loading chunk') ||
                         errorMessage.includes('dynamically imported module') ||
                         errorMessage.includes('Importing a module script failed');

    if (isChunkError) {
      window.location.reload();
    } else {
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error
        ? this.state.error.message || String(this.state.error)
        : 'Unknown runtime error';

      const isChunkError = errorMessage.includes('Failed to fetch dynamically imported module') ||
                           errorMessage.includes('Loading chunk') ||
                           errorMessage.includes('dynamically imported module') ||
                           errorMessage.includes('Importing a module script failed');

      return (
        <div className="min-h-[60vh] bg-[#F2F0E9] text-[#1A1A1A] flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 sm:p-12 max-w-lg w-full border border-[#2E4036]/15 flex flex-col items-center">
            <div className="w-16 h-16 bg-[#CC5833]/10 text-[#CC5833] rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={32} />
            </div>
            <span className="font-mono text-xs uppercase tracking-widest text-[#CC5833] font-bold mb-2">
              SYSTEM RECOVERY
            </span>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#2E4036] mb-3">
              Application Encountered an Error
            </h1>
            <p className="text-[#1A1A1A]/70 mb-4 text-xs sm:text-sm leading-relaxed">
              {isChunkError
                ? "A new version of EduVistar was recently deployed. Please retry or refresh to load the latest application updates."
                : "A temporary runtime component error occurred. You can retry mounting the component or refresh your session."
              }
            </p>

            <div className="w-full font-mono text-[10px] text-[#CC5833] bg-[#CC5833]/5 p-3.5 rounded-2xl border border-[#CC5833]/20 mb-6 text-left overflow-x-auto">
              <span className="font-bold uppercase tracking-wider block mb-1">Diagnostic Log:</span>
              <span>{errorMessage}</span>
            </div>

            <div className="w-full space-y-3">
              <button
                onClick={this.handleRetry}
                className="btn-magnetic flex items-center justify-center gap-2 bg-[#2E4036] hover:bg-[#CC5833] text-white font-heading font-bold py-3.5 px-6 rounded-full w-full text-xs uppercase tracking-wider transition-colors duration-300 shadow-md"
              >
                <RotateCcw size={16} />
                <span>{isChunkError ? "Reload Latest App Version" : "Retry Component"}</span>
              </button>

              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                className="flex items-center justify-center gap-2 border border-[#2E4036]/20 text-[#2E4036] hover:bg-[#2E4036]/5 font-heading font-bold py-3 px-6 rounded-full w-full text-xs uppercase tracking-wider transition-colors duration-300"
              >
                <RefreshCw size={16} />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
