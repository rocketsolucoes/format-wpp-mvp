import React from 'react';
import { Link, useLocation } from 'wouter';
import { Sparkles, User, History, Settings, LogOut, Coins, Zap, Sun, Moon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import Avatar from './ui/Avatar';
import Button from './ui/Button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './ui/DropdownMenu';

/**
 * Header Component
 */
const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      setLocation('/');
    }
  };

  return (
    <header className="sticky top-0 z-[100] w-full bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo - Centralizada */}
          <div className="flex-1 flex justify-center md:justify-start">
            <Link href="/">
              <a className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                <img src="/zapstyle_logo.png" alt="ZapStyle" className="h-14" />
              </a>
            </Link>
          </div>

          {/* Actions Section */}
          <div className="flex items-center gap-2 sm:gap-4 md:absolute md:right-4">
            {/* Theme Toggle - Forçando visibilidade absoluta se necessário */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleTheme();
              }}
              className="relative z-[110] p-2.5 rounded-xl border-2 border-primary/20 bg-card hover:bg-muted transition-all duration-200 text-foreground shadow-md flex items-center justify-center min-w-[44px] min-h-[44px]"
              title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-500 fill-amber-500/20" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-500 fill-indigo-500/20" />
              )}
            </button>

            {!user ? (
              <>
                <a href="/#features" className="hidden md:block text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                  Funcionalidades
                </a>
                <a href="/#how-it-works" className="hidden md:block text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                  Como Funciona
                </a>
                <a href="/pricing" className="hidden md:block text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                  Planos
                </a>
                <Button
                  variant="primary"
                  onClick={() => setLocation('/auth')}
                >
                  Entrar
                </Button>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
                    {user.plan === 'pro' || user.plan === 'enterprise' ? (
                      <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full group relative">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">
                          Ilimitado
                        </span>
                      </div>
                    ) : (
                      <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-full group relative">
                        <Coins className={`w-4 h-4 ${
                          user.credits_remaining >= 15 ? 'text-green-500' :
                          user.credits_remaining >= 6 ? 'text-amber-500' :
                          'text-red-500'
                        }`} />
                        <span className={`text-sm font-semibold ${
                          user.credits_remaining >= 15 ? 'text-green-500' :
                          user.credits_remaining >= 6 ? 'text-amber-500' :
                          'text-red-500'
                        }`}>
                          {user.credits_remaining}
                        </span>
                      </div>
                    )}

                    <Avatar
                      src={user.avatar_url}
                      fallback={user.full_name || user.email}
                      size="md"
                    />
                  </div>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="right">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm normal-case">
                        {user.full_name || 'Usuário'}
                      </span>
                      <span className="text-muted-foreground text-xs normal-case">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => setLocation('/dashboard')}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Painel
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => setLocation('/history')}>
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Histórico
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => setLocation('/settings')}>
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Configurações
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleSignOut}>
                    <div className="flex items-center gap-2 text-destructive">
                      <LogOut className="w-4 h-4" />
                      Sair
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
