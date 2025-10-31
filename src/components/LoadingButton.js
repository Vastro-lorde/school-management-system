import React from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function LoadingButton({
  children,
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  spinnerSize = 'sm',
  spinnerLabel = '',
  ...rest
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
        isDisabled ? 'opacity-70 cursor-not-allowed' : ''
      } ${className}`}
      {...rest}
    >
      {loading ? <LoadingSpinner size={spinnerSize} label={spinnerLabel} /> : null}
      <span>{children}</span>
    </button>
  );
}
