import React from 'react';

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="relative bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="mb-6 text-center">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{title}</h1>
              {subtitle ? (
                <p className="mt-2 text-sm text-gray-300">{subtitle}</p>
              ) : null}
            </div>
            <div className="space-y-4">
              {children}
            </div>
          </div>
          {footer ? (
            <div className="px-6 sm:px-8 py-4 bg-black/20 border-t border-white/10 text-sm text-gray-300">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
