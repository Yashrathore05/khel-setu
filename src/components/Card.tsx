import type { PropsWithChildren } from 'react';

type CardProps = PropsWithChildren<{
	title?: string;
	subtitle?: string;
	className?: string;
}>;

export default function Card({ title, subtitle, className, children }: CardProps) {
	return (
        <div className={`rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-soft backdrop-blur supports-[backdrop-filter]:bg-[rgb(var(--card)/0.9)] ${className || ''}`}>
			{(title || subtitle) && (
				<div className="mb-3">
                    {title && <h3 className="text-base font-semibold tracking-tight">{title}</h3>}
                    {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
				</div>
			)}
			{children}
		</div>
	);
}
