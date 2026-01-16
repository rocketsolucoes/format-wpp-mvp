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
  Moon,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { TrialBadge } from './TrialBadge';
import { Progress } from './ui/Progress';
import Avatar from './ui/Avatar';
import { useTrialStatus } from '../hooks/useTrialStatus';
import { CheckCircle } from 'lucide-react';

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
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export function DashboardSidebar({
  onNavigate,
  collapsed = false,
  onToggleCollapse,
  isMobile = false,
  onCloseMobile
}: DashboardSidebarProps) {
  const [location, setLocation] = useLocation();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckDone, setAdminCheckDone] = useState(false);
  const { trialInfo } = useTrialStatus();

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
    <div className="flex flex-col h-full bg-card border-r border-border transition-colors duration-300">
      {/* Header da Sidebar */}
      <div className="p-4 border-b border-border flex items-center justify-between gap-2">
        <Link href="/">          <a className={`hover:opacity-80 transition-opacity cursor-pointer ${!collapsed || isMobile ? 'flex items-center gap-2' : 'flex justify-center w-full'}`}>
            {(!collapsed || isMobile) ? (
              <img src="/zapstyle_logo.png" alt="ZapStyle" className="h-12" />
            ) : (
              <img src="/favicon.png" alt="ZapStyle" className="h-14 w-14 rounded-xl object-contain" />
            )}
          </a>
        </Link>
        
        {isMobile ? (
          <button
            onClick={onCloseMobile}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        ) : onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
            aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Perfil do Usuário */}
      {user && (
        <div className={`p-3 border-b border-border ${collapsed && !isMobile ? 'flex justify-center' : ''}`}>
          {(collapsed && !isMobile) ? (
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
                  {/* 🛡️ Segregação: Apenas mostrar badge se NÃO for pagante */}
                  {user.subscription_status === 'active' ? (
                    <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0 whitespace-nowrap flex items-center gap-1">
                      <CheckCircle className="w-2.5 h-2.5" />
                      Pro
                    </Badge>
                  ) : (
                    <>
                      <TrialBadge />
                      {!user.trial_status && (
                        user.plan === 'pro' || user.plan === 'enterprise' ? (
                          <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0 whitespace-nowrap">
                            Ilimitado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 whitespace-nowrap">
                            Gratuito
                          </Badge>
                        )
                      )}
                    </>
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

      {/* Créditos / Upgrade / Trial Info */}
      {(!collapsed || isMobile) && (
        <div className="px-3 py-3 border-b border-border">
          {/* 🛡️ Usuários com Assinatura Ativa - Experiência Limpa */}
          {user?.subscription_status === 'active' ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Plano Pro Ativo
              </span>
            </div>
          ) : trialInfo?.isActive ? (
            /* 🎁 Usuários em Trial - Mostrar Contador e Progresso */
            <div className="bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 border border-emerald-500/20 rounded-lg p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    Trial Pro Ativo
                  </span>
                </div>
                <span className={`text-xs font-bold ${
                  trialInfo.daysLeft >= 3
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : trialInfo.daysLeft >= 1
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                }`}>
                  {trialInfo.daysLeft >= 1
                    ? `${trialInfo.daysLeft} ${trialInfo.daysLeft === 1 ? 'dia' : 'dias'}`
                    : `${trialInfo.hoursLeft}h`}
                </span>
              </div>

              {/* Barra de Progresso do Trial */}
              <div className="space-y-1">
                <Progress
                  value={trialInfo.daysLeft}
                  max={7}
                  className={`h-1.5 ${
                    trialInfo.daysLeft >= 3
                      ? '[&>div]:bg-emerald-500'
                      : trialInfo.daysLeft >= 1
                        ? '[&>div]:bg-amber-500'
                        : '[&>div]:bg-red-500'
                  }`}
                />
                <p className="text-[10px] text-muted-foreground text-center">
                  Aproveite créditos ilimitados e estilos Pro
                </p>
              </div>

              <Button
                variant="outline"
                fullWidth
                onClick={() => window.location.href = '/pricing'}
                size="sm"
                className="border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              >
                Converter para Pro
              </Button>
            </div>
          ) : user?.plan === 'pro' || user?.plan === 'enterprise' ? (
            /* Usuário Pro sem assinatura ativa (edge case) */
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
              <Zap className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm font-semibold text-primary">
                Ilimitado
              </span>
            </div>
          ) : (
            /* Usuário Free - Mostrar Créditos */
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
                size="sm"
              >
                Upgrade para o Pro
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Navegação Principal */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto pt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <a
                onClick={handleNavClick}
                className={`flex items-center ${(collapsed && !isMobile) ? 'justify-center' : 'justify-between'} px-2.5 py-2 rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                title={(collapsed && !isMobile) ? item.label : undefined}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {(!collapsed || isMobile) && <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>}
                </div>
                {item.proBadge && (!collapsed || isMobile) && (
                  <Badge variant="info" className="text-xs">
                    Pro
                  </Badge>
                )}
              </a>
            </Link>
          );
        })}

        {/* Admin Section */}
        {adminCheckDone && isAdmin && (
          <>
            {(!collapsed || isMobile) && (
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
                className={`flex items-center ${(collapsed && !isMobile) ? 'justify-center' : 'justify-between'} px-2.5 py-2 rounded-lg transition-colors cursor-pointer ${
                  location === '/admin/prompts'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                title={(collapsed && !isMobile) ? 'Gerenciar Prompts' : undefined}
              >
                <div className="flex items-center gap-2.5">
                  <Wrench className="w-4 h-4 flex-shrink-0" />
                  {(!collapsed || isMobile) && <span className="font-medium text-sm whitespace-nowrap">Gerenciar Prompts</span>}
                </div>
                {(!collapsed || isMobile) && (
                  <Badge className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                    Admin
                  </Badge>
                )}
              </a>
            </Link>
          </>
        )}
      </nav>

      {/* Footer da Sidebar (Tema e Sair) */}
      <div className="p-3 border-t border-border space-y-2 mt-auto">
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleTheme();
          }}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border border-border bg-muted/30 text-foreground hover:bg-muted transition-all duration-200 shadow-sm ${(collapsed && !isMobile) ? 'justify-center' : ''}`}
          title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-500 fill-amber-500/20" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-500 fill-indigo-500/20" />
          )}
          {(!collapsed || isMobile) && <span className="text-sm font-bold">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>}
        </button>

        <Button
          variant="ghost"
          fullWidth={(!collapsed || isMobile)}
          onClick={handleSignOut}
          className={`${(collapsed && !isMobile) ? 'w-full justify-center' : 'justify-start'} text-destructive hover:text-destructive hover:bg-destructive/10 h-11`}
          title={(collapsed && !isMobile) ? 'Sair' : undefined}
        >
          <LogOut className="w-4 h-4" />
          {(!collapsed || isMobile) && <span className="ml-2 font-medium">Sair</span>}
        </Button>
      </div>
    </div>
  );
}

export { DashboardSidebar as default };
