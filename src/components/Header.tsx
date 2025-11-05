import React from 'react';
import { Link, useLocation } from 'wouter';
import { Sparkles, User, History, Settings, LogOut, Coins, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
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
 *
 * Cabeçalho da aplicação com navegação e menu de usuário.
 *
 * Features:
 * - Logo com link para home
 * - Botão "Sign In" para usuários não autenticados
 * - Menu dropdown com avatar para usuários autenticados
 * - Badge de créditos
 * - Links de navegação
 * - Botão de logout
 */
const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const [location, setLocation] = useLocation();

  /**
   * Handle Logout
   */
  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      setLocation('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Magic Formatter
              </span>
            </a>
          </Link>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {!user ? (
              <>
                <Link href="/pricing">
                  <a className="text-slate-300 hover:text-emerald-400 transition-colors text-sm font-medium">
                    Pricing
                  </a>
                </Link>
                <Button
                  variant="primary"
                  onClick={() => setLocation('/auth')}
                >
                  Sign In
                </Button>
              </>
            ) : (
              /* Menu dropdown para usuários autenticados */
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
                    {/* Badge de créditos */}
                    {user.plan === 'pro' || user.plan === 'enterprise' ? (
                      <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-full group relative">
                        <Zap className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                          Unlimited
                        </span>
                        <div className="absolute bottom-full right-0 mb-2 w-40 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          Pro plan with unlimited formatting
                        </div>
                      </div>
                    ) : (
                      <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full group relative">
                        <Coins className="w-4 h-4 text-emerald-400" />
                        <span className={`text-sm font-semibold ${
                          user.credits_remaining > 10 ? 'text-emerald-400' :
                          user.credits_remaining > 5 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {user.credits_remaining}
                        </span>
                        <div className="absolute bottom-full right-0 mb-2 w-48 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                          {user.credits_remaining} credits remaining. Resets monthly.
                        </div>
                      </div>
                    )}

                    {/* Avatar */}
                    <Avatar
                      src={user.avatar_url}
                      fallback={user.full_name || user.email}
                      size="md"
                    />
                  </div>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="right">
                  {/* Informações do usuário */}
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-slate-100 font-semibold text-sm normal-case">
                        {user.full_name || 'User'}
                      </span>
                      <span className="text-slate-500 text-xs normal-case">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>

                  {/* Badge de créditos (mobile) */}
                  <div className="md:hidden px-4 py-2">
                    {user.plan === 'pro' || user.plan === 'enterprise' ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-full w-fit">
                        <Zap className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                          Unlimited
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full w-fit">
                        <Coins className="w-4 h-4 text-emerald-400" />
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

                  <DropdownMenuSeparator />

                  {/* Links de navegação */}
                  <DropdownMenuItem onClick={() => setLocation('/dashboard')}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Dashboard
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => setLocation('/history')}>
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4" />
                      History
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => setLocation('/settings')}>
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Botão de logout */}
                  <DropdownMenuItem onClick={handleSignOut}>
                    <div className="flex items-center gap-2 text-red-400">
                      <LogOut className="w-4 h-4" />
                      Sign Out
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
