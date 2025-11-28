import React from 'react';

function getInitials(name) {
  if (!name) return '';
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('');
}

export default function AvatarInitials({ name, fallback = 'ST', className = '' }) {
  const initials = getInitials(name) || fallback;
  return (
    <div
      className={
        'w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 shadow-md ' +
        className
      }
    >
      {initials}
    </div>
  );
}
