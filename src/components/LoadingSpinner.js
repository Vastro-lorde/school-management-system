import React from 'react';

// Simple, reusable loading spinner with accessible labeling
export default function LoadingSpinner({ size = 'md', label = '', className = '' }) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };
  const dim = sizeMap[size] || sizeMap.md;
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role="status" aria-live="polite" aria-busy="true">
      <span
        className={`inline-block ${dim} animate-spin rounded-full border-2 border-current border-t-transparent text-white/90`}
      />
      {label ? <span className="text-white/90 text-sm">{label}</span> : null}
    </span>
  );
}
