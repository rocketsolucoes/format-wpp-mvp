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
      errors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(loginEmail)) {
      errors.email = 'E-mail é inválido';
    }

    if (!loginPassword) {
      errors.password = 'Senha é obrigatória';
    } else if (loginPassword.length < 6) {
      errors.password = 'A senha deve ter pelo menos 6 caracteres';
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
      errors.fullName = 'Nome completo é obrigatório';
    } else if (signupFullName.length < 2) {
      errors.fullName = 'O nome deve ter pelo menos 2 caracteres';
    }

    if (!signupEmail) {
      errors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(signupEmail)) {
      errors.email = 'E-mail é inválido';
    }

    if (!signupPassword) {
      errors.password = 'Senha é obrigatória';
    } else if (signupPassword.length < 6) {
      errors.password = 'A senha deve ter pelo menos 6 caracteres';
    }

    if (!signupConfirmPassword) {
      errors.confirmPassword = 'Por favor, confirme sua senha';
    } else if (signupPassword !== signupConfirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem';
    }

    if (!acceptTerms) {
      errors.terms = 'Você deve aceitar os termos e condições';
    }

    setSignupErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle Login Submit
   */
  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setLoginErrors({});

    if (!validateLoginForm()) return;

    try {
      await signIn(loginEmail, loginPassword);
      setLoginEmail('');
      setLoginPassword('');
      setLocation('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  /**
   * Handle Signup Submit
   */
  const handleSignupSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setSignupErrors({});

    if (!validateSignupForm()) return;

    try {
      await signUp(signupEmail, signupPassword, signupFullName);
      setSignupFullName('');
      setSignupEmail('');
      setSignupPassword('');
      setSignupConfirmPassword('');
      setAcceptTerms(false);
      setLocation('/dashboard');
    } catch (error: any) {
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
              Bem-vindo de Volta
            </span>
          </h1>
          <p className="text-slate-400">Faça login para continuar formatando</p>
        </div>

        {/* Card com Tabs */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6 shadow-xl">
          <Tabs defaultValue="login">
            <div className="flex justify-center mb-6">
              <TabsList className="w-auto">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar Conta</TabsTrigger>
              </TabsList>
            </div>

            {/* Login Form */}
            <TabsContent value="login">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="login-email" required>
                    E-mail
                  </Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    error={loginErrors.email}
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="login-password" required>
                    Senha
                  </Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    error={loginErrors.password}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                <Button type="submit" loading={loading} fullWidth>
                  Entrar
                </Button>
              </form>
            </TabsContent>

            {/* Signup Form */}
            <TabsContent value="signup">
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="signup-name" required>
                    Nome Completo
                  </Label>
                  <Input
                    id="signup-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="João Silva"
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    error={signupErrors.fullName}
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="signup-email" required>
                    E-mail
                  </Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    error={signupErrors.email}
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="signup-password" required>
                    Senha
                  </Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    error={signupErrors.password}
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="signup-confirm-password" required>
                    Confirmar Senha
                  </Label>
                  <Input
                    id="signup-confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    error={signupErrors.confirmPassword}
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    label="Eu aceito os termos e condições"
                    disabled={loading}
                  />
                  {signupErrors.terms && (
                    <p className="mt-1 text-sm text-red-400">{signupErrors.terms}</p>
                  )}
                </div>

                <Button type="submit" loading={loading} fullWidth>
                  Criar Conta
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
            Voltar para início
          </button>
        </div>
      </div>

      {/* Modal de Reset Password */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Digite seu endereço de e-mail e enviaremos um link para redefinir sua senha.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="px-6 py-6 space-y-6">
            <div>
              <Label htmlFor="reset-email" required>
                E-mail
              </Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="seu@email.com"
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
                Cancelar
              </Button>
              <Button type="submit" loading={loading}>
                Enviar Link de Redefinição
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
