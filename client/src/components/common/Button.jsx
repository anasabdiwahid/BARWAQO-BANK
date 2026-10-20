import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none';

  const variants = {
    primary:
      'bg-brand-red text-white hover:bg-brand-redHover focus:ring-brand-red shadow-sm active:translate-y-[1px]',
    secondary:
      'bg-brand-black text-white hover:bg-brand-dark focus:ring-brand-black shadow-sm',
    outline:
      'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-400',
    ghost:
      'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-300',
    danger:
      'bg-brand-error text-white hover:bg-red-700 focus:ring-brand-error shadow-sm',
    success:
      'bg-brand-success text-white hover:bg-emerald-700 focus:ring-brand-success shadow-sm',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5 font-semibold',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        Icon && <Icon className="w-4 h-4" />
      )}
      <span>{children}</span>
    </button>
  );
};

