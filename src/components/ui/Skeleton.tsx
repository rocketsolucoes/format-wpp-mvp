import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden bg-muted/20 rounded ${className}`}
      aria-label="Loading..."
    >
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-muted/40 to-transparent" />
    </div>
  );
}
