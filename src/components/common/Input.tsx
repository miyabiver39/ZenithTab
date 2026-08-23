import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && <label className="block text-xs font-medium text-slate-300">{label}</label>}
        <input
          ref={ref}
          className={cn(
            'w-full px-3.5 py-2 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50 transition-all backdrop-blur-sm',
            error && 'border-rose-500 focus:ring-rose-500/50',
            className
          )}
          {...props}
        />
        {helperText && !error && <p className="text-xs text-slate-400">{helperText}</p>}
        {error && <p className="text-xs text-rose-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
