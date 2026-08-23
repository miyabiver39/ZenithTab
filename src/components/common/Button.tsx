import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'glass', size = 'md', children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400/50 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none';

    const variants = {
      primary:
        'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/25 border border-sky-400/30',
      secondary:
        'bg-white/20 hover:bg-white/30 text-white border border-white/20 shadow-sm backdrop-blur-md',
      ghost:
        'bg-transparent hover:bg-white/10 text-white/90 hover:text-white',
      danger:
        'bg-rose-500/80 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/25 border border-rose-400/30',
      glass:
        'bg-slate-900/40 hover:bg-slate-900/60 text-slate-100 border border-white/10 backdrop-blur-md hover:border-white/20 shadow-lg',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5',
      md: 'text-sm px-3.5 py-2 rounded-xl gap-2',
      lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5',
      icon: 'p-2 rounded-xl',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
