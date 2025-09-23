import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-400',
  secondary:
    'bg-[rgb(var(--card))] text-[rgb(var(--fg))] border border-[rgb(var(--border))] hover:bg-black/5 dark:hover:bg-white/5',
  ghost:
    'bg-transparent text-[rgb(var(--fg))] hover:bg-black/5 dark:hover:bg-white/5',
  danger:
    'bg-red-600 text-white hover:bg-red-500 active:bg-red-700',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading = false, disabled, children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    return (
      <button
        ref={ref}
        className={`${base} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;


