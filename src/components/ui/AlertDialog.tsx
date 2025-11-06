import React, { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './Dialog';
import { Button } from './Button';

interface AlertDialogContentProps {
  children: ReactNode;
  className?: string;
}

export function AlertDialogContent({ children, className = '' }: AlertDialogContentProps) {
  return <DialogContent className={className}>{children}</DialogContent>;
}

interface AlertDialogHeaderProps {
  children: ReactNode;
}

export function AlertDialogHeader({ children }: AlertDialogHeaderProps) {
  return <DialogHeader>{children}</DialogHeader>;
}

interface AlertDialogTitleProps {
  children: ReactNode;
}

export function AlertDialogTitle({ children }: AlertDialogTitleProps) {
  return <DialogTitle>{children}</DialogTitle>;
}

interface AlertDialogDescriptionProps {
  children: ReactNode;
}

export function AlertDialogDescription({ children }: AlertDialogDescriptionProps) {
  return <DialogDescription>{children}</DialogDescription>;
}

interface AlertDialogFooterProps {
  children: ReactNode;
}

export function AlertDialogFooter({ children }: AlertDialogFooterProps) {
  return <div className="flex justify-end gap-3 mt-6">{children}</div>;
}

interface AlertDialogCancelProps {
  children: ReactNode;
  onClick?: () => void;
}

export function AlertDialogCancel({ children, onClick }: AlertDialogCancelProps) {
  return <Button variant="outline" onClick={onClick}>{children}</Button>;
}

interface AlertDialogActionProps {
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

export function AlertDialogAction({ children, onClick, disabled }: AlertDialogActionProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    onClick?.(e);
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </Button>
  );
}

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  cancelText?: string;
  actionText?: string;
  onAction: () => void;
  onCancel?: () => void;
  variant?: 'default' | 'destructive';
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelText = 'Cancel',
  actionText = 'Continue',
  onAction,
  onCancel,
  variant = 'default',
}: AlertDialogProps) {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleAction = () => {
    onAction();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={handleCancel}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleAction}
          >
            {actionText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
