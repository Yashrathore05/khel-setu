import { useEffect, useRef } from 'react';

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

export function LottieBadge({ name, jsonPath, onDone, hideLabel, size = 'md', className = '', containerClassName = '' }: { name: string; jsonPath: string; onDone?: () => void; hideLabel?: boolean; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string; containerClassName?: string; }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    let anim: any;
    let isCancelled = false;
    (async () => {
      try {
        const lottie = await import('lottie-web');
        const container = containerRef.current;
        if (container && !isCancelled) {
          anim = lottie.default.loadAnimation({
            container,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: jsonPath,
            rendererSettings: {
              preserveAspectRatio: 'xMidYMid meet',
              progressiveLoad: true,
              hideOnTransparent: true,
            },
          });
          if (onDone) {
            anim.addEventListener('complete', onDone);
          }
        }
      } catch (error) {
        // Fail silently to avoid breaking UI if asset is missing
      }
    })();
    return () => {
      isCancelled = true;
      try {
        if (anim) {
          if (onDone) anim.removeEventListener('complete', onDone);
          anim.destroy();
        }
      } catch {}
    };
  }, [jsonPath, onDone]);
  const sizeToClass: Record<'sm'|'md'|'lg'|'xl', string> = {
    sm: 'h-8 w-8 sm:h-10 sm:w-10',
    md: 'h-12 w-12 sm:h-14 sm:w-14',
    lg: 'h-16 w-16 sm:h-20 sm:w-20',
    xl: 'h-24 w-24 sm:h-28 sm:w-28',
  };
  return (
    <div className={`${className}`}>
      <div ref={containerRef} className={`${containerClassName || sizeToClass[size]}`} aria-hidden="true" />
      {!hideLabel && (
        <span className="text-sm sm:text-base font-semibold">{name}</span>
      )}
    </div>
  );
}

