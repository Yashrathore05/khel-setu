type BadgeProps = {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline';
  className?: string;
};

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
    default: 'bg-black/80 text-white dark:bg-white/20',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
    outline: 'border border-[rgb(var(--border))] text-[rgb(var(--fg))] bg-[rgb(var(--card))]',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}>{children}</span>
  );
}


