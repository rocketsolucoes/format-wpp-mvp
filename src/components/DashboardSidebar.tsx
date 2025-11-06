import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Sparkles,
  LayoutDashboard,
  History,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
  Coins,
  LogOut,
  Wrench,
  Shield,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Progress } from './ui/Progress';
import Avatar from './ui/Avatar';

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
  { label: 'Settings', icon: Settings, href: '/settings' },
];

interface DashboardSidebarProps {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function DashboardSidebar({ onNavigate, collapsed = false, onToggleCollapse }: DashboardSidebarProps) {
  const [location, setLocation] = useLocation();
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckDone, setAdminCheckDone] = useState(false);

  const creditUsage = user?.plan === 'free' ? (100 - (user?.credits_remaining || 0)) : 0;
  const creditPercentage = user?.plan === 'free' ? (creditUsage / 100) * 100 : 100;

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setAdminCheckDone(true);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && profile) {
          setIsAdmin(profile.is_admin || false);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      } finally {
        setAdminCheckDone(true);
      }
    };

    checkAdminStatus();
  }, [user]);

  const handleNavClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      setLocation('/');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <span className="font-bold text-sm bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap">
                Magic Formatter
              </span>
            )}
          </a>
        </Link>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white flex-shrink-0"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {user && (
        <div className={`p-3 border-b border-slate-800 ${collapsed ? 'flex justify-center' : ''}`}>
          {collapsed ? (
            <div className="relative group">
              <Avatar
                src={user.avatar_url}
                fallback={user.full_name || user.email}
                size="md"
              />
              {user.plan === 'pro' || user.plan === 'enterprise' ? (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center border-2 border-slate-950">
                  <Zap className="w-3 h-3 text-white" />
                </div>
              ) : (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center border-2 border-slate-950">
                  <Coins className="w-2.5 h-2.5 text-emerald-400" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar
                  src={user.avatar_url}
                  fallback={user.full_name || user.email}
                  size="md"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user.full_name || 'User'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {user && !collapsed && (
        <div className="px-3 py-2 border-b border-slate-800">
          {user.plan === 'pro' || user.plan === 'enterprise' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-lg">
              <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-sm font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Unlimited
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <Coins className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className={`text-sm font-semibold ${
                user.credits_remaining > 10 ? 'text-emerald-400' :
                user.credits_remaining > 5 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {user.credits_remaining} credits
              </span>
            </div>
          )}
        </div>
      )}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto pt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <a
                onClick={handleNavClick}
                className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-2.5 py-2 rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>}
                </div>
                {item.proBadge && !collapsed && (
                  <Badge variant="info" className="text-xs">
                    Pro
                  </Badge>
                )}
              </a>
            </Link>
          );
        })}

        {adminCheckDone && isAdmin && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-2 px-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <Shield className="w-3 h-3" />
                  <span>Admin</span>
                </div>
              </div>
            )}
            <Link href="/admin/prompts">
              <a
                onClick={handleNavClick}
                className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-2.5 py-2 rounded-lg transition-colors cursor-pointer ${
                  location === '/admin/prompts'
                    ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
                title={collapsed ? 'Prompt Manager' : undefined}
              >
                <div className="flex items-center gap-2.5">
                  <Wrench className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="font-medium text-sm whitespace-nowrap">Prompt Manager</span>}
                </div>
                {!collapsed && (
                  <Badge className="text-xs bg-red-500/10 text-red-400 border-red-500/20">
                    Admin
                  </Badge>
                )}
              </a>
            </Link>
          </>
        )}
      </nav>

      <div className="p-3 border-t border-slate-800 space-y-2">
        {!collapsed && user?.plan === 'free' && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 space-y-2.5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Credits</span>
                <span className={`font-semibold ${
                  (user?.credits_remaining || 0) > 10 ? 'text-emerald-400' :
                  (user?.credits_remaining || 0) > 5 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {user?.credits_remaining || 0} / 100
                </span>
              </div>
              <Progress value={user?.credits_remaining || 0} max={100} className="h-1.5" />
            </div>

            <Button
              variant="primary"
              fullWidth
              size="sm"
              className="text-sm py-2"
              onClick={() => window.location.href = '/pricing'}
            >
              Upgrade to Pro
            </Button>
          </div>
        )}

        <Button
          variant="ghost"
          fullWidth={!collapsed}
          size="sm"
          onClick={handleSignOut}
          className={`${collapsed ? 'w-full justify-center' : 'justify-start'} text-red-400 hover:text-red-300 hover:bg-red-500/10`}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </div>
    </div>
  );
}

export { DashboardSidebar as default };
