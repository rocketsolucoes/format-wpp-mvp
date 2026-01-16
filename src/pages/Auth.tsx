import React, { useState, FormEvent, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import Button from '../components/ui/Button';
import Checkbox from '../components/ui/Checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/Dialog';
import { hasPendingText } from '../utils/textPersistence';
import { supabase } from '../lib/supabase';

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
  const [location, setLocation] = useLocation();
  const { signIn, signUp, loading, resetPassword, updatePassword } = useAuth();

  // Extrair parâmetros da URL
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const redirectParam = urlParams.get('redirect');

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [activeTab, setActiveTab] = useState(tabParam === 'signup' ? 'signup' : 'login');

  // Estados do formulário de Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});
  const [loginGeneralError, setLoginGeneralError] = useState<string>('');

  // Estados do formulário de Signup
  const [signupFullName, setSignupFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupWhatsapp, setSignupWhatsapp] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [signupErrors, setSignupErrors] = useState<{
    fullName?: string;
    email?: string;
    whatsapp?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});
  const [signupGeneralError, setSignupGeneralError] = useState<string>('');

  // Estados do modal de reset
  const [resetEmailError, setResetEmailError] = useState<string>('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Estados do modal de nova senha (após clicar no link de reset)
  const [showNewPasswordModal, setShowNewPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [newPasswordErrors, setNewPasswordErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [newPasswordGeneralError, setNewPasswordGeneralError] = useState<string>('');

  /**
   * Detecta quando o usuário vem do link de reset de senha
   */
  useEffect(() => {
    console.log('🔵 [Auth] Verificando se usuário vem de link de reset de senha...');

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔵 [Auth] Evento de autenticação:', event);

      // Se o evento for PASSWORD_RECOVERY, mostrar modal de nova senha
      if (event === 'PASSWORD_RECOVERY') {
        console.log('✅ [Auth] Detectado evento de PASSWORD_RECOVERY, mostrando modal...');
        setShowNewPasswordModal(true);
      }
    });

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
      whatsapp?: string;
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

    if (!signupWhatsapp) {
      errors.whatsapp = 'WhatsApp é obrigatório';
    } else {
      // Remove espaços, parênteses, hífens e outros caracteres comuns
      const cleanedWhatsapp = signupWhatsapp.replace(/[\s()+-]/g, '');
      // Aceita números com 10-15 dígitos (formato brasileiro e internacional)
      if (!/^\d{10,15}$/.test(cleanedWhatsapp)) {
        errors.whatsapp = 'Número de WhatsApp inválido. Use formato: +55 11 99999-9999';
      }
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
    console.log('🔵 [handleLoginSubmit] Iniciando submit do formulário de login...');

    // Limpar erros anteriores
    setLoginErrors({});
    setLoginGeneralError('');

    console.log('🔵 [handleLoginSubmit] Validando formulário...');
    if (!validateLoginForm()) {
      console.log('⚠️ [handleLoginSubmit] Validação falhou');
      return;
    }

    console.log('✅ [handleLoginSubmit] Validação passou, chamando signIn...');

    try {
      await signIn(loginEmail, loginPassword);
      console.log('✅ [handleLoginSubmit] signIn completou com sucesso');

      // Limpar formulário
      setLoginEmail('');
      setLoginPassword('');

      // Redirecionar para a página especificada ou padrão
      if (redirectParam) {
        console.log('🔵 [handleLoginSubmit] Redirecionando para:', redirectParam);
        setLocation(redirectParam);
        return;
      }

      if (hasPendingText()) {
        console.log('🔵 [handleLoginSubmit] Há texto pendente, redirecionando para /format');
        setLocation('/format');
        return;
      }

      console.log('🔵 [handleLoginSubmit] Redirecionando para /dashboard');
      setLocation('/dashboard');
    } catch (error: any) {
      console.error('❌ [handleLoginSubmit] Erro no processo de login:', error);
      const errorMessage = error.message || 'Erro ao fazer login. Por favor, tente novamente.';
      setLoginGeneralError(errorMessage);
    }
  };

  /**
   * Handle Signup Submit
   */
  const handleSignupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log('🔵 [handleSignupSubmit] Iniciando submit do formulário de cadastro...');

    // Limpar erros anteriores
    setSignupErrors({});
    setSignupGeneralError('');

    console.log('🔵 [handleSignupSubmit] Validando formulário...');
    if (!validateSignupForm()) {
      console.log('⚠️ [handleSignupSubmit] Validação falhou');
      return;
    }

    console.log('✅ [handleSignupSubmit] Validação passou, chamando signUp...');

    try {
      await signUp(signupEmail, signupPassword, signupFullName);
      console.log('✅ [handleSignupSubmit] signUp completou com sucesso');

      // Limpar formulário
      setSignupFullName('');
      setSignupEmail('');
      setSignupWhatsapp('');
      setSignupPassword('');
      setSignupConfirmPassword('');
      setAcceptTerms(false);

      // Redirecionar para a página especificada ou padrão
      if (redirectParam) {
        console.log('🔵 [handleSignupSubmit] Redirecionando para:', redirectParam);
        setLocation(redirectParam);
        return;
      }

      if (hasPendingText()) {
        console.log('🔵 [handleSignupSubmit] Há texto pendente, redirecionando para /format');
        setLocation('/format');
        return;
      }

      console.log('🔵 [handleSignupSubmit] Redirecionando para /dashboard');
      setLocation('/dashboard');
    } catch (error: any) {
      console.error('❌ [handleSignupSubmit] Erro no processo de cadastro:', error);
      const errorMessage = error.message || 'Erro ao criar conta. Por favor, tente novamente.';
      setSignupGeneralError(errorMessage);
    }
  };

  /**
   * Handle Reset Password Submit
   */
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    console.log('🔵 [handleResetPassword] Iniciando redefinição de senha...');

    // Limpar erros anteriores
    setResetEmailError('');
    setResetSuccess(false);

    // Validar email
    if (!resetEmail) {
      const errorMsg = 'E-mail é obrigatório';
      setResetEmailError(errorMsg);
      console.log('⚠️ [handleResetPassword] Email vazio');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(resetEmail)) {
      const errorMsg = 'E-mail é inválido';
      setResetEmailError(errorMsg);
      console.log('⚠️ [handleResetPassword] Email inválido:', resetEmail);
      return;
    }

    console.log('✅ [handleResetPassword] Email válido, enviando...');

    try {
      await resetPassword(resetEmail);
      console.log('✅ [handleResetPassword] Email enviado com sucesso');

      // Mostrar mensagem de sucesso
      setResetSuccess(true);
      setResetEmailError('');

      // Aguardar 2 segundos antes de fechar o modal
      setTimeout(() => {
        console.log('🔵 [handleResetPassword] Fechando modal...');
        setShowResetModal(false);
        setResetEmail('');
        setResetSuccess(false);
      }, 2000);
    } catch (error: any) {
      console.error('❌ [handleResetPassword] Erro ao enviar email:', error);
      const errorMessage = error.message || 'Erro ao enviar email de redefinição';
      setResetEmailError(errorMessage);
    }
  };

  /**
   * Handle New Password Submit (após clicar no link de reset)
   */
  const handleNewPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log('🔵 [handleNewPasswordSubmit] Iniciando atualização de senha...');

    // Limpar erros anteriores
    setNewPasswordErrors({});
    setNewPasswordGeneralError('');

    // Validar nova senha
    const errors: { password?: string; confirmPassword?: string } = {};

    if (!newPassword) {
      errors.password = 'Senha é obrigatória';
    } else if (newPassword.length < 6) {
      errors.password = 'A senha deve ter pelo menos 6 caracteres';
    }

    if (!confirmNewPassword) {
      errors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (newPassword !== confirmNewPassword) {
      errors.confirmPassword = 'As senhas não coincidem';
    }

    setNewPasswordErrors(errors);

    if (Object.keys(errors).length > 0) {
      console.log('⚠️ [handleNewPasswordSubmit] Validação falhou');
      return;
    }

    console.log('✅ [handleNewPasswordSubmit] Validação passou, chamando updatePassword...');

    try {
      await updatePassword(newPassword);
      console.log('✅ [handleNewPasswordSubmit] Senha atualizada, usuário foi deslogado');

      // Limpar formulário
      setNewPassword('');
      setConfirmNewPassword('');
      setShowNewPasswordModal(false);

      // Redirecionar para login com mensagem
      console.log('🔵 [handleNewPasswordSubmit] Redirecionando para login...');
      setLocation('/auth?tab=login');
    } catch (error: any) {
      console.error('❌ [handleNewPasswordSubmit] Erro ao atualizar senha:', error);
      const errorMessage = error.message || 'Erro ao atualizar senha. Por favor, tente novamente.';
      setNewPasswordGeneralError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8 overflow-y-auto">
      <div className="w-full max-w-md my-auto">
        {/* Logo e Título */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="relative">
              {activeTab === 'signup' && hasPendingText() && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
              )}
              <div className="relative p-3 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              {activeTab === 'signup' && hasPendingText()
                ? '🎁 Falta pouco para seu Trial Pro!'
                : activeTab === 'signup'
                  ? 'Ganhe 7 Dias de Pro Grátis'
                  : 'Bem-vindo de Volta'}
            </span>
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {activeTab === 'signup' && hasPendingText()
              ? 'Crie sua conta para liberar sua mensagem e ativar seu trial Pro de 7 dias!'
              : activeTab === 'signup'
                ? 'Crie sua conta e ganhe acesso completo aos recursos Pro por 7 dias'
                : 'Faça login para continuar formatando suas mensagens'}
          </p>
          {activeTab === 'signup' && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-medium text-emerald-700 dark:text-emerald-300">
                ⚡ Créditos Ilimitados
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-medium text-blue-700 dark:text-blue-300">
                🔥 Estilos Pro
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs font-medium text-purple-700 dark:text-purple-300">
                📊 Análises
              </span>
            </div>
          )}
        </div>

        {/* Card com Tabs */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 shadow-xl">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-center mb-4">
              <TabsList className="w-auto">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar Conta</TabsTrigger>
              </TabsList>
            </div>

            {/* Login Form */}
            <TabsContent value="login">
              <form onSubmit={handleLoginSubmit} className="space-y-3">
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

                {/* Erro Geral do Login */}
                {loginGeneralError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive font-medium">{loginGeneralError}</p>
                  </div>
                )}

                <Button type="submit" loading={loading} fullWidth>
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>

            {/* Signup Form */}
            <TabsContent value="signup">
              <form onSubmit={handleSignupSubmit} className="space-y-3">
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
                  <Label htmlFor="signup-whatsapp" required>
                    WhatsApp
                  </Label>
                  <Input
                    id="signup-whatsapp"
                    name="whatsapp"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+55 11 99999-9999"
                    value={signupWhatsapp}
                    onChange={(e) => setSignupWhatsapp(e.target.value)}
                    error={signupErrors.whatsapp}
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

                {/* Erro Geral do Signup */}
                {signupGeneralError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive font-medium">{signupGeneralError}</p>
                  </div>
                )}

                <Button type="submit" loading={loading} fullWidth>
                  {loading ? 'Criando conta...' : 'Criar Conta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Link para voltar */}
        <div className="text-center mt-6">
          <button
            onClick={() => setLocation('/')}
            className="text-sm text-muted-foreground hover:text-muted-foreground transition-colors"
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
                onChange={(e) => {
                  setResetEmail(e.target.value);
                  // Limpar erros ao digitar
                  setResetEmailError('');
                  setResetSuccess(false);
                }}
                error={resetEmailError}
                disabled={loading || resetSuccess}
              />
            </div>

            {/* Mensagem de Sucesso */}
            {resetSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <p className="text-sm text-emerald-400 font-medium flex items-center gap-2">
                  <span>📧</span>
                  <span>Email enviado! Verifique sua caixa de entrada.</span>
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowResetModal(false);
                  setResetEmail('');
                  setResetEmailError('');
                  setResetSuccess(false);
                }}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={loading} disabled={resetSuccess}>
                {loading ? 'Enviando...' : resetSuccess ? 'Enviado!' : 'Enviar Link'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Nova Senha (após clicar no link de reset) */}
      <Dialog open={showNewPasswordModal} onOpenChange={setShowNewPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir Nova Senha</DialogTitle>
            <DialogDescription>
              Digite sua nova senha. Após atualizar, você precisará fazer login novamente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNewPasswordSubmit} className="px-6 py-6 space-y-6">
            <div>
              <Label htmlFor="new-password" required>
                Nova Senha
              </Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Digite sua nova senha"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  // Limpar erros ao digitar
                  setNewPasswordErrors({});
                  setNewPasswordGeneralError('');
                }}
                error={newPasswordErrors.password}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="confirm-new-password" required>
                Confirmar Nova Senha
              </Label>
              <Input
                id="confirm-new-password"
                type="password"
                placeholder="Digite novamente sua nova senha"
                value={confirmNewPassword}
                onChange={(e) => {
                  setConfirmNewPassword(e.target.value);
                  // Limpar erros ao digitar
                  setNewPasswordErrors({});
                  setNewPasswordGeneralError('');
                }}
                error={newPasswordErrors.confirmPassword}
                disabled={loading}
              />
            </div>

            {/* Erro Geral */}
            {newPasswordGeneralError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive font-medium">{newPasswordGeneralError}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button type="submit" loading={loading} fullWidth>
                {loading ? 'Atualizando...' : 'Atualizar Senha'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
