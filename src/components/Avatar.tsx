import { CSSProperties } from 'react';

type AvatarProps = {
	name?: string;
	src?: string;
	size?: number;
	className?: string;
};

export default function Avatar({ name = '', src, size = 48, className }: AvatarProps) {
	const initials = name
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((n) => n[0]?.toUpperCase())
		.join('') || 'KS';
	const style: CSSProperties = { width: size, height: size };
	return (
		<div
			className={`inline-flex items-center justify-center overflow-hidden rounded-full bg-gray-200 text-gray-700 ${className || ''}`}
			style={style}
		>
			{src ? (
				<img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
			) : (
				<span className="text-sm font-semibold">{initials}</span>
			)}
		</div>
	);
}
