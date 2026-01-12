import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
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
    <div className="flex h-screen bg-background overflow-hidden transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-border bg-card transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-all duration-300" 
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div
            className="w-64 h-full bg-card shadow-2xl animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <DashboardSidebar 
              isMobile={true}
              onCloseMobile={() => setMobileSidebarOpen(false)}
              onNavigate={() => setMobileSidebarOpen(false)} 
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <img src="/zapstyle_logo.png" alt="ZapStyle" className="h-6" />
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        <main className="flex-1 overflow-y-auto bg-background/50">
          {children}
        </main>
      </div>
    </div>
  );
}
