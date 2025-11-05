import React from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

export function Progress({ value, max = 100, className = '', indicatorClassName = '' }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full h-2 bg-slate-800 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300 ease-out ${indicatorClassName}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
