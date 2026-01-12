import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Alert({ children, variant = 'default', className = '' }: AlertProps) {
  const variantClasses = {
    default: 'bg-muted/30 border-border text-foreground',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    danger: 'bg-red-500/10 border-red-500/20 text-red-400',
    info: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
  };

  const icons = {
    default: Info,
    success: CheckCircle,
    warning: AlertCircle,
    danger: XCircle,
    info: Info,
  };

  const Icon = icons[variant];

  return (
    <div
      className={`flex items-start gap-3 p-4 border rounded-lg ${variantClasses[variant]} ${className}`}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">{children}</div>
    </div>
  );
}

interface AlertTitleProps {
  children: React.ReactNode;
}

export function AlertTitle({ children }: AlertTitleProps) {
  return <h5 className="font-semibold mb-1">{children}</h5>;
}

interface AlertDescriptionProps {
  children: React.ReactNode;
}

export function AlertDescription({ children }: AlertDescriptionProps) {
  return <div className="text-sm opacity-90">{children}</div>;
}
