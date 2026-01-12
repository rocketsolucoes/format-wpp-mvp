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
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
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
  { label: 'Painel', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Formatar Texto', icon: Sparkles, href: '/format' },
  { label: 'Histórico', icon: History, href: '/history' },
  { label: 'Configurações', icon: Settings, href: '/settings' },
];

interface DashboardSidebarProps {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function DashboardSidebar({ onNavigate, collapsed = false, onToggleCollapse }: DashboardSidebarProps) {
  const [location, setLocation] = useLocation();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckDone, setAdminCheckDone] = useState(false);

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
    <div className="flex flex-col h-full bg-card">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="p-1.5 bg-primary rounded-lg flex-shrink-0">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
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
            className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
            aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {user && (
        <div className={`p-3 border-b border-border ${collapsed ? 'flex justify-center' : ''}`}>
          {collapsed ? (
            <div className="relative group">
              <Avatar
                src={user.avatar_url}
                fallback={user.full_name || user.email}
                size="md"
              />
              {user.plan === 'pro' || user.plan === 'enterprise' ? (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-card">
                  <Zap className="w-3 h-3 text-primary-foreground" />
                </div>
              ) : (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary/20 border border-primary/50 rounded-full flex items-center justify-center border-2 border-card">
                  <Coins className="w-2.5 h-2.5 text-primary" />
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
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">
                    {user.full_name || 'Usuário'}
                  </p>
                  {user.plan === 'pro' || user.plan === 'enterprise' ? (
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0 whitespace-nowrap">
                      Ilimitado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 whitespace-nowrap">
                      Gratuito
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {!collapsed && (user?.plan === 'pro' || user?.plan === 'enterprise') && (
        <div className="px-3 py-3 border-b border-border">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
            <Zap className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm font-semibold text-primary">
              Ilimitado
            </span>
          </div>
        </div>
      )}

      {!collapsed && user?.plan === 'free' && (
        <div className="px-3 py-3 border-b border-border">
          <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-2.5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Créditos</span>
                <span className={`font-semibold ${
                  (user?.credits_remaining || 0) >= 15 ? 'text-green-500' :
                  (user?.credits_remaining || 0) >= 6 ? 'text-amber-500' :
                  'text-destructive'
                }`}>
                  {user?.credits_remaining || 0} / 30
                </span>
              </div>
              <Progress value={user?.credits_remaining || 0} max={30} className="h-1.5" />
            </div>

            <Button
              variant="primary"
              fullWidth
              onClick={() => window.location.href = '/pricing'}
            >
              Upgrade para o Pro
            </Button>
          </div>
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
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Shield className="w-3 h-3" />
                  <span>Administrador</span>
                </div>
              </div>
            )}
            <Link href="/admin/prompts">
              <a
                onClick={handleNavClick}
                className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-2.5 py-2 rounded-lg transition-colors cursor-pointer ${
                  location === '/admin/prompts'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                title={collapsed ? 'Gerenciar Prompts' : undefined}
              >
                <div className="flex items-center gap-2.5">
                  <Wrench className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="font-medium text-sm whitespace-nowrap">Gerenciar Prompts</span>}
                </div>
                {!collapsed && (
                  <Badge className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                    Admin
                  </Badge>
                )}
              </a>
            </Link>
          </>
        )}
      </nav>

      <div className="p-3 border-t border-border space-y-2">
        {/* Theme Toggle no Sidebar */}
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 ${
            collapsed ? 'justify-center' : ''
          }`}
          title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
          {!collapsed && <span className="text-sm font-medium">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>}
        </button>

        <Button
          variant="ghost"
          fullWidth={!collapsed}
          onClick={handleSignOut}
          className={`${collapsed ? 'w-full justify-center' : 'justify-start'} text-destructive hover:text-destructive hover:bg-destructive/10`}
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </div>
    </div>
  );
}

export { DashboardSidebar as default };
