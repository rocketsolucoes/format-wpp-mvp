import React, { useState, FormEvent } from 'react';
import { useLocation } from 'wouter';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import Button from '../components/ui/Button';
import Checkbox from '../components/ui/Checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/Dialog';

/**
 * Auth Page Component
 *
 * Página de autenticação com formulários de Login e Signup.
 *
 * Features:
 * - Tabs para alternar entre Login e Signup
 * - Validação de formulários
 * - Estados de loading
 * - Mensagens de erro
 * - Redirecionamento após login bem-sucedido
 */
const Auth: React.FC = () => {
  const [, setLocation] = useLocation();
  const { signIn, signUp, loading, resetPassword } = useAuth();

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Estados do formulário de Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});

  // Estados do formulário de Signup
  const [signupFullName, setSignupFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [signupErrors, setSignupErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  /**
   * Valida o formulário de login
   */
  const validateLoginForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!loginEmail) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(loginEmail)) {
      errors.email = 'Email is invalid';
    }

    if (!loginPassword) {
      errors.password = 'Password is required';
    } else if (loginPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Valida o formulário de signup
   */
  const validateSignupForm = (): boolean => {
    const errors: {
      fullName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      terms?: string;
    } = {};

    if (!signupFullName) {
      errors.fullName = 'Full name is required';
    } else if (signupFullName.length < 2) {
      errors.fullName = 'Name must be at least 2 characters';
    }

    if (!signupEmail) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(signupEmail)) {
      errors.email = 'Email is invalid';
    }

    if (!signupPassword) {
      errors.password = 'Password is required';
    } else if (signupPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!signupConfirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (signupPassword !== signupConfirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptTerms) {
      errors.terms = 'You must accept the terms and conditions';
    }

    setSignupErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle Login Submit
   */
  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateLoginForm()) return;

    try {
      await signIn(loginEmail, loginPassword);
      setLocation('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  /**
   * Handle Signup Submit
   */
  const handleSignupSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateSignupForm()) return;

    try {
      await signUp(signupEmail, signupPassword, signupFullName);
      setLocation('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
    }
  };

  /**
   * Handle Reset Password Submit
   */
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();

    if (!resetEmail || !/\S+@\S+\.\S+/.test(resetEmail)) {
      return;
    }

    try {
      await resetPassword(resetEmail);
      setShowResetModal(false);
      setResetEmail('');
    } catch (error) {
      console.error('Reset password error:', error);
    }
  };

  return (
    <div className="h-screen bg-slate-950 flex items-center justify-center px-4 overflow-hidden">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Welcome Back
            </span>
          </h1>
          <p className="text-slate-400">Sign in to continue formatting</p>
        </div>

        {/* Card com Tabs */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6 shadow-xl">
          <Tabs defaultValue="login">
            <div className="flex justify-center mb-6">
              <TabsList className="w-auto">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </div>

            {/* Login Form */}
            <TabsContent value="login">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="login-email" required>
                    Email
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    error={loginErrors.email}
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="login-password" required>
                    Password
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    error={loginErrors.password}
                    disabled={loading}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" loading={loading} fullWidth>
                  Sign In
                </Button>
              </form>
            </TabsContent>

            {/* Signup Form */}
            <TabsContent value="signup">
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="signup-name" required>
                    Full Name
                  </Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    error={signupErrors.fullName}
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="signup-email" required>
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    error={signupErrors.email}
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="signup-password" required>
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    error={signupErrors.password}
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="signup-confirm-password" required>
                    Confirm Password
                  </Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    error={signupErrors.confirmPassword}
                    disabled={loading}
                  />
                </div>

                <div>
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    label="I accept the terms and conditions"
                    disabled={loading}
                  />
                  {signupErrors.terms && (
                    <p className="mt-1 text-sm text-red-400">{signupErrors.terms}</p>
                  )}
                </div>

                <Button type="submit" loading={loading} fullWidth>
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Link para voltar */}
        <div className="text-center mt-6">
          <button
            onClick={() => setLocation('/')}
            className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
          >
            Back to home
          </button>
        </div>
      </div>

      {/* Modal de Reset Password */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="px-6 py-6 space-y-6">
            <div>
              <Label htmlFor="reset-email" required>
                Email
              </Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="your@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowResetModal(false);
                  setResetEmail('');
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Send Reset Link
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
