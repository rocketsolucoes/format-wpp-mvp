import React, { useState, useRef, useEffect, ReactNode } from 'react';

/**
 * Props do DropdownMenu (container principal)
 */
interface DropdownMenuProps {
  children: ReactNode;
}

/**
 * DropdownMenu Component
 *
 * Container principal do menu dropdown.
 */
export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Fecha o dropdown ao clicar fora
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            isOpen,
            setIsOpen,
          });
        }
        return child;
      })}
    </div>
  );
};

/**
 * Props do DropdownMenuTrigger (botão que abre o menu)
 */
interface DropdownMenuTriggerProps {
  children: ReactNode;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

/**
 * DropdownMenuTrigger Component
 *
 * Botão que aciona a abertura/fechamento do menu.
 */
export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({
  children,
  isOpen,
  setIsOpen,
}) => {
  return (
    <button
      onClick={() => setIsOpen?.(!isOpen)}
      className="focus:outline-none"
    >
      {children}
    </button>
  );
};

/**
 * Props do DropdownMenuContent (conteúdo do menu)
 */
interface DropdownMenuContentProps {
  children: ReactNode;
  isOpen?: boolean;
  align?: 'left' | 'right';
  className?: string;
}

/**
 * DropdownMenuContent Component
 *
 * Conteúdo do menu dropdown que aparece quando aberto.
 */
export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  children,
  isOpen,
  align = 'right',
  className = '',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={`absolute top-full mt-2 ${
        align === 'right' ? 'right-0' : 'left-0'
      } min-w-[200px] bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-2 z-50 animate-slide-in ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * Props do DropdownMenuItem (item individual do menu)
 */
interface DropdownMenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * DropdownMenuItem Component
 *
 * Item individual do menu dropdown.
 */
export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  children,
  onClick,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors ${className}`}
    >
      {children}
    </button>
  );
};

/**
 * Props do DropdownMenuSeparator (separador visual)
 */
interface DropdownMenuSeparatorProps {
  className?: string;
}

/**
 * DropdownMenuSeparator Component
 *
 * Linha separadora entre grupos de itens.
 */
export const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps> = ({
  className = '',
}) => {
  return <div className={`h-px bg-slate-800 my-2 ${className}`} />;
};

/**
 * Props do DropdownMenuLabel (rótulo de grupo)
 */
interface DropdownMenuLabelProps {
  children: ReactNode;
  className?: string;
}

/**
 * DropdownMenuLabel Component
 *
 * Rótulo para agrupar itens relacionados.
 */
export const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide ${className}`}>
      {children}
    </div>
  );
};
