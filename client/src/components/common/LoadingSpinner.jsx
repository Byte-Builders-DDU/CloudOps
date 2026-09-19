import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ text = 'Loading cloud resources...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 gap-3 ${className}`}>
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      {text && <p className="text-xs font-medium text-slate-500">{text}</p>}
    </div>
  );
}
