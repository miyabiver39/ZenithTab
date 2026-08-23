import React from 'react';
import { cn } from '../../utils/cn';
import { useDashboardStore } from '../../store/useDashboardStore';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'solid' | 'translucent' | 'transparent';
  hoverEffect?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, variant = 'translucent', hoverEffect = false, style, ...props }, ref) => {
    const { appearance } = useDashboardStore();

    const radiusClasses = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl',
      full: 'rounded-3xl',
    }[appearance.borderRadius || '2xl'];

    const variantStyles = {
      solid: 'bg-slate-900/80 border-white/10',
      translucent: 'bg-slate-900/40 border-white/10 shadow-xl shadow-black/20',
      transparent: 'bg-transparent border-transparent',
    }[variant];

    return (
      <div
        ref={ref}
        className={cn(
          'border backdrop-blur-md transition-all duration-200',
          radiusClasses,
          variantStyles,
          hoverEffect && 'hover:bg-slate-900/50 hover:border-white/20 hover:shadow-2xl',
          className
        )}
        style={{
          backdropFilter: variant !== 'transparent' ? `blur(${appearance.glassBlur}px)` : undefined,
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
