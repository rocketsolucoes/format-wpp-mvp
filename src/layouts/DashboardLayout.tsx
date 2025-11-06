import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { Button } from '../components/ui/Button';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <aside
        className={`hidden lg:flex flex-col border-r border-slate-800 bg-slate-950 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </aside>

      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileSidebarOpen(false)}>
          <div
            className="w-64 h-full bg-slate-950 border-r border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <DashboardSidebar onNavigate={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <span className="text-sm font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Magic Formatter
          </span>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
