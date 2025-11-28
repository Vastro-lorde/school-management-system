import React from 'react';

export default function StatCard({ label, value }) {
  return (
    <div className="border rounded p-4 bg-white/5 border-white/10">
      <div className="text-sm opacity-70">{label}</div>
      <div className="text-2xl font-semibold">{value?.toLocaleString?.() ?? value}</div>
    </div>
  );
}
