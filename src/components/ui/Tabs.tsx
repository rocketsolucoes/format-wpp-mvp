import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Contexto das Tabs
 */
interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

/**
 * Props do Tabs (container principal)
 */
interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

/**
 * Tabs Component
 *
 * Container principal das tabs que gerencia o estado ativo.
 * Suporta tanto modo controlado (value + onValueChange) quanto não controlado (defaultValue).
 */
export const Tabs: React.FC<TabsProps> = ({
  defaultValue = '',
  value,
  onValueChange,
  children,
  className = ''
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultValue);

  // Determina se está em modo controlado
  const isControlled = value !== undefined;
  const activeTab = isControlled ? value : internalActiveTab;

  const setActiveTab = (newValue: string) => {
    if (!isControlled) {
      setInternalActiveTab(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

/**
 * Props do TabsList (lista de botões das tabs)
 */
interface TabsListProps {
  children: ReactNode;
  className?: string;
}

/**
 * TabsList Component
 *
 * Container dos botões de navegação das tabs.
 */
export const TabsList: React.FC<TabsListProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex gap-2 p-1 bg-slate-900/50 rounded-lg border border-slate-800 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Props do TabsTrigger (botão individual de tab)
 */
interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
}

/**
 * TabsTrigger Component
 *
 * Botão individual para alternar entre tabs.
 */
export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, className = '' }) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabsTrigger must be used within Tabs');
  }

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition-all whitespace-nowrap ${
        isActive
          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
      } ${className}`}
    >
      {children}
    </button>
  );
};

/**
 * Props do TabsContent (conteúdo de cada tab)
 */
interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

/**
 * TabsContent Component
 *
 * Conteúdo exibido quando a tab correspondente está ativa.
 */
export const TabsContent: React.FC<TabsContentProps> = ({ value, children, className = '' }) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabsContent must be used within Tabs');
  }

  const { activeTab } = context;

  if (activeTab !== value) {
    return null;
  }

  return <div className={className}>{children}</div>;
};
