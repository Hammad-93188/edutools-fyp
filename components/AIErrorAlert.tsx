
import React from 'react';
import { AlertCircle, RefreshCcw, WifiOff, ShieldAlert, ZapOff, FileWarning } from 'lucide-react';

export type AIErrorType = 'connection' | 'quota' | 'safety' | 'generic' | 'input' | 'file';

interface AIErrorAlertProps {
  error: {
    message: string;
    type: AIErrorType;
  } | null;
  onRetry?: () => void;
  className?: string;
}

const AIErrorAlert: React.FC<AIErrorAlertProps> = ({ error, onRetry, className = "" }) => {
  if (!error) return null;

  const getIcon = () => {
    switch (error.type) {
      case 'connection': return <WifiOff className="h-5 w-5" />;
      case 'quota': return <ZapOff className="h-5 w-5" />;
      case 'safety': return <ShieldAlert className="h-5 w-5" />;
      case 'file': return <FileWarning className="h-5 w-5" />;
      default: return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getTitle = () => {
    switch (error.type) {
      case 'connection': return 'Connection Error';
      case 'quota': return 'AI Limit Reached';
      case 'safety': return 'Content Policy';
      case 'input': return 'Invalid Input';
      case 'file': return 'File Upload Issue';
      default: return 'AI Engine Error';
    }
  };

  const getColorClasses = () => {
    switch (error.type) {
      case 'quota':
      case 'safety':
      case 'file':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'input':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  return (
    <div className={`p-4 rounded-2xl border-2 animate-in fade-in slide-in-from-top-2 duration-300 ${getColorClasses()} ${className}`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-xl bg-white/50 shadow-sm`}>
          {getIcon()}
        </div>
        <div className="flex-1">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">
            {getTitle()}
          </h4>
          <p className="text-sm font-bold leading-tight mb-3">
            {error.message}
          </p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:underline transition-all"
            >
              <RefreshCcw className="h-3 w-3" /> Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIErrorAlert;
