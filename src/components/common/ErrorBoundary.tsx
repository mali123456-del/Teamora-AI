import React, { Component, ErrorInfo, ReactNode } from 'react';
import { generateCorrelationId } from '../../lib/errorService.ts';
import { AlertOctagon, RotateCcw, Home, Copy, Check, Terminal } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  correlationId: string;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      correlationId: generateCorrelationId('err'),
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      correlationId: generateCorrelationId('err'),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // Safe client-side telemetry logging with correlation ID
    console.error(`[TEAMORA_KERNEL_ERROR_BOUNDARY] [${this.state.correlationId}]`, {
      message: error.message,
      name: error.name,
      componentStack: errorInfo.componentStack?.slice(0, 500),
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      correlationId: generateCorrelationId('err'),
      copied: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleCopyReport = () => {
    const report = {
      correlationId: this.state.correlationId,
      error: this.state.error?.name || 'UnknownError',
      message: this.state.error?.message || 'Component crashed',
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    };

    navigator.clipboard.writeText(JSON.stringify(report, null, 2)).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[360px] p-6 m-4 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#FF806E]/30 dark:border-[#FF806E]/20 shadow-lg flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FF806E]/15 text-[#FF806E] flex items-center justify-center">
            <AlertOctagon className="w-6 h-6" />
          </div>

          <div className="space-y-1 max-w-md">
            <h2 className="text-base font-extrabold text-[#211B2C] dark:text-[#F5F1E9]">
              {this.props.fallbackTitle || 'Component Encountered an Unexpected Issue'}
            </h2>
            <p className="text-xs text-[#77717D] dark:text-[#AFA8B8] leading-relaxed">
              TEAMORA AI isolated this error to keep your remaining workspace tabs and background agents fully operational.
            </p>
          </div>

          {/* Diagnostic Box */}
          <div className="w-full max-w-md p-3 rounded-xl bg-[#F5F1E9] dark:bg-[#181320] border border-[#E2DBD0] dark:border-[#382F47] text-left space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#77717D] dark:text-[#AFA8B8]">
              <span className="flex items-center gap-1 font-bold">
                <Terminal className="w-3 h-3 text-[#8B5CF6]" />
                CORRELATION ID:
              </span>
              <span className="text-[#8B5CF6] dark:text-[#A78BFA] font-bold">
                {this.state.correlationId}
              </span>
            </div>

            <p className="text-[11px] font-mono text-[#FF806E] truncate">
              {this.state.error?.message || 'Uncaught rendering exception'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Component</span>
            </button>

            <button
              onClick={this.handleCopyReport}
              className="px-4 py-2 rounded-xl bg-[#EBE5DB] dark:bg-[#2C2438] text-[#211B2C] dark:text-[#F5F1E9] text-xs font-medium hover:opacity-90 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              {this.state.copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#10B981]" />
                  <span className="text-[#10B981] font-bold">Copied ID</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Report</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                window.location.hash = '#dashboard';
                window.location.reload();
              }}
              className="px-4 py-2 rounded-xl border border-[#E2DBD0] dark:border-[#382F47] text-[#77717D] dark:text-[#AFA8B8] text-xs font-medium hover:text-[#211B2C] dark:hover:text-[#F5F1E9] flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Reload Workspace</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
