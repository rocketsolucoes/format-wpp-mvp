import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <div className="w-full overflow-auto">
      <table className={`w-full caption-bottom text-sm ${className}`}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<TableProps> = ({ children, className = '' }) => {
  return <thead className={`border-b border-border ${className}`}>{children}</thead>;
};

export const TableBody: React.FC<TableProps> = ({ children, className = '' }) => {
  return <tbody className={`[&_tr:last-child]:border-0 ${className}`}>{children}</tbody>;
};

export const TableRow: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <tr
      className={`border-b border-border transition-colors hover:bg-muted/50 ${className}`}
    >
      {children}
    </tr>
  );
};

export const TableHead: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <th
      className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`}
    >
      {children}
    </th>
  );
};

export const TableCell: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <td className={`p-4 align-middle text-foreground [&:has([role=checkbox])]:pr-0 ${className}`}>
      {children}
    </td>
  );
};
