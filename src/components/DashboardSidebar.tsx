import React from 'react';
import { Link, useLocation } from 'wouter';
import {
  Sparkles,
  LayoutDashboard,
  History,
  BookOpen,
  Settings,
  Zap,
  Lightbulb,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Progress } from './ui/Progress';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
  proBadge?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Format Text', icon: Sparkles, href: '/format' },
  { label: 'History', icon: History, href: '/history' },
  { label: 'Quick Tips', icon: Lightbulb, href: '/tips' },
  { label: 'Style Library', icon: BookOpen, href: '/styles', proBadge: true },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

interface DashboardSidebarProps {
  onNavigate?: () => void;
}

export function DashboardSidebar({ onNavigate }: DashboardSidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const creditUsage = user?.plan === 'free' ? (100 - (user?.credits_remaining || 0)) : 0;
  const creditPercentage = user?.plan === 'free' ? (creditUsage / 100) * 100 : 100;

  const handleNavClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto pt-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <a
                onClick={handleNavClick}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.proBadge && (
                  <Badge variant="info" className="text-xs">
                    Pro
                  </Badge>
                )}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">
              {user?.plan === 'free' ? 'Free Plan' : user?.plan === 'pro' ? 'Pro Plan' : 'Enterprise'}
            </span>
            {user?.plan !== 'free' && (
              <Badge variant="success" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
          </div>

          {user?.plan === 'free' ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Credits</span>
                  <span className={`font-semibold ${
                    (user?.credits_remaining || 0) > 10 ? 'text-emerald-400' :
                    (user?.credits_remaining || 0) > 5 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {user?.credits_remaining || 0} / 100
                  </span>
                </div>
                <Progress value={user?.credits_remaining || 0} max={100} />
                <p className="text-xs text-slate-500">
                  Resets {user?.credits_remaining === 100 ? 'monthly' : 'in 30 days'}
                </p>
              </div>

              <Button
                variant="primary"
                fullWidth
                className="text-sm py-2"
                onClick={() => window.location.href = '/pricing'}
              >
                Upgrade to Pro
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Unlimited formatting</span>
              </div>
              <Button
                variant="outline"
                fullWidth
                className="text-sm py-2"
                onClick={() => window.location.href = '/settings'}
              >
                Manage Subscription
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
