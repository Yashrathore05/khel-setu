import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  inputClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, hint, error, id, inputClassName = '', ...props }, ref) => {
    const inputId = id || props.name || 'input-' + Math.random().toString(36).slice(2);
    const base = 'w-full rounded-lg border bg-[rgb(var(--card))] text-[rgb(var(--fg))] placeholder:text-gray-400 dark:placeholder:text-gray-500';
    const state = error ? 'border-red-500 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.35)]' : 'border-[rgb(var(--border))] focus-visible:shadow-[0_0_0_3px_rgba(43,130,255,0.35)]';
    return (
      <label htmlFor={inputId} className={`block text-sm ${className}`}>
        {label && <div className="mb-1 font-medium text-[rgb(var(--fg))]">{label}</div>}
        <input id={inputId} ref={ref} className={`${base} ${state} h-10 px-3 outline-none ${inputClassName}`} {...props} />
        {(hint || error) && (
          <div className="mt-1 text-xs">
            {error ? (
              <span className="text-red-600">{error}</span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">{hint}</span>
            )}
          </div>
        )}
      </label>
    );
  }
);

Input.displayName = 'Input';

export default Input;


