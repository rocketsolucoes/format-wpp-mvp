import React from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

export function Progress({ value, max = 100, className = '', indicatorClassName = '' }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const getColorClass = () => {
    if (indicatorClassName) return indicatorClassName;

    if (percentage >= 50) return 'bg-green-500';
    if (percentage >= 20) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className={`w-full h-2 bg-slate-800 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full transition-all duration-300 ease-out ${getColorClass()}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
