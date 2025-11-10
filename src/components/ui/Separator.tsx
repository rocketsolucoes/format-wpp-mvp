import React from 'react';

interface SeparatorProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function Separator({ className = '', orientation = 'horizontal' }: SeparatorProps) {
  return (
    <div
      className={`${
        orientation === 'horizontal'
          ? 'h-px w-full'
          : 'w-px h-full'
      } bg-slate-800 ${className}`}
    />
  );
}
