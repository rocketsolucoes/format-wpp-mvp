import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import {
  User,
  Lock,
  Bell,
  Shield,
  CreditCard,
  Upload,
  Trash,
  Download,
  ExternalLink,
  Check,
  X as XIcon,
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Switch } from '../components/ui/Switch';
import Avatar from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/Dialog';
import { SimpleAlertDialog } from '../components/ui/AlertDialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { toast } from '../components/ui/Toaster';
import { PRICING, formatBRL } from '../constants/pricing';

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user, updateProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [notifications, setNotifications] = useState({
    creditsLow: true,
    weeklySummary: false,
    newsUpdates: true,
    marketing: false,
  });

  const [privacy, setPrivacy] = useState({
    analytics: true,
    anonymousData: true,
    publicProfile: false,
  });

  const [loading, setLoading] = useState(false);
  const [initialBio, setInitialBio] = useState('');

  const isPro = user?.subscription_tier === 'pro';

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        setFullName(user.full_name || '');
        const userAvatar = user.avatar_url || '';
        setAvatarUrl(userAvatar);
        setOriginalAvatarUrl(userAvatar);

        const { data } = await supabase
          .from('profiles')
          .select('bio, preferences')
          .eq('id', user.id)
          .maybeSingle();

        if (data) {
          const userBio = data.bio || '';
          setBio(userBio);
          setInitialBio(userBio);
          const prefs = data.preferences as any || {};
          if (prefs.notifications) {
            setNotifications(prefs.notifications);
          }
          if (prefs.privacy) {
            setPrivacy(prefs.privacy);
          }
        }
      }
    };
    loadUserData();
  }, [user?.id]);

  const hasProfileChanges = fullName !== (user?.full_name || '') || bio !== initialBio || avatarFile !== null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('O arquivo deve ter menos de 2MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Apenas formatos JPG, PNG e WebP são permitidos');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null;

    try {
      setUploadProgress(10);

      if (originalAvatarUrl) {
        const oldPath = originalAvatarUrl.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`avatars/${oldPath}`]);
        }
      }

      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      setUploadProgress(50);
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      setUploadProgress(80);
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setUploadProgress(100);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Falha ao enviar avatar');
      setAvatarUrl(originalAvatarUrl);
      return null;
    } finally {
      setUploadProgress(0);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);

      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar();
        if (uploadedUrl) {
          newAvatarUrl = uploadedUrl;
          setOriginalAvatarUrl(uploadedUrl);
        } else {
          setLoading(false);
          return;
        }
      }

      await updateProfile({
        full_name: fullName,
        avatar_url: newAvatarUrl,
        bio: bio,
      });

      setAvatarFile(null);
      setInitialBio(bio);
      toast.success('Perfil atualizado com sucesso');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Falha ao atualizar perfil');
      setAvatarUrl(originalAvatarUrl);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength: 33, label: 'Fraca', color: 'bg-red-500' };
    if (strength <= 3) return { strength: 66, label: 'Média', color: 'bg-yellow-500' };
    return { strength: 100, label: 'Forte', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (newPassword === currentPassword) {
      toast.error('A nova senha deve ser diferente da atual');
      return;
    }

    try {
      setLoading(true);

      if (!user?.email) {
        toast.error('E-mail do usuário não encontrado');
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast.error('Senha atual incorreta');
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Senha atualizada com sucesso');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Falha ao atualizar senha');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    if (deleteConfirmText.toLowerCase() !== 'excluir') {
      toast.error('Por favor, digite "excluir" para confirmar');
      return;
    }

    try {
      setLoading(true);

      await supabase
        .from('formatting_history')
        .delete()
        .eq('user_id', user.id);

      await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      await signOut();
      toast.success('Conta excluída com sucesso');
      setLocation('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Falha ao excluir conta');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setDeleteConfirmText('');
    }
  };

  const handleSaveNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: {
            ...((user.preferences as any) || {}),
            notifications,
          },
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Preferências de notificação salvas');
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast.error('Falha ao salvar preferências');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrivacy = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: {
            ...((user.preferences as any) || {}),
            privacy,
          },
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Preferências de privacidade salvas');
    } catch (error) {
      console.error('Error saving privacy:', error);
      toast.error('Falha ao salvar preferências');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const { data: historyData } = await supabase
        .from('formatting_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const exportData = {
        profile: profileData,
        subscription: subscriptionData,
        history: historyData || [],
        exportDate: new Date().toISOString(),
        totalFormatting: historyData?.length || 0,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `magic-formatter-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Dados exportados com sucesso');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Falha ao exportar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Por favor, faça login');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error opening portal:', error);
      toast.error('Falha ao abrir portal de cobrança');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p>Por favor, faça login para acessar as configurações</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-slate-950">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Configurações</h1>
        <p className="text-sm text-slate-400">Gerencie as configurações e preferências da sua conta</p>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-8 w-full overflow-x-auto flex-nowrap scrollbar-hide">
            <TabsTrigger value="profile" className="flex items-center justify-center gap-2 flex-shrink-0">
              <User className="w-4 h-4" />
              <span>Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center justify-center gap-2 flex-shrink-0">
              <Lock className="w-4 h-4" />
              <span>Conta</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center justify-center gap-2 flex-shrink-0">
              <Bell className="w-4 h-4" />
              <span>Notificações</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center justify-center gap-2 flex-shrink-0">
              <Shield className="w-4 h-4" />
              <span>Privacidade</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center justify-center gap-2 flex-shrink-0">
              <CreditCard className="w-4 h-4" />
              <span>Plano e Cobrança</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-slate-800 max-w-2xl mx-auto">
              <CardContent className="p-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-32 h-32 mb-4 rounded-full overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-3xl font-bold">
                        {fullName.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Alterar Foto
                  </Button>
                  {uploadProgress > 0 && (
                    <div className="w-full max-w-xs mt-2">
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    JPG, PNG ou WebP. Máximo 2MB.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="João Silva"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      value={user.email}
                      disabled
                      className="bg-slate-800/50 text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-500 mt-1">O e-mail não pode ser alterado</p>
                  </div>

                  <div>
                    <Label htmlFor="bio">
                      Bio <span className="text-slate-500">(Opcional)</span>
                    </Label>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, 200))}
                      maxLength={200}
                      rows={3}
                      placeholder="Conte-nos sobre você..."
                      className="w-full px-4 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                    <p className="text-xs text-slate-500 mt-1 text-right">
                      {bio.length}/200 caracteres
                    </p>
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={!hasProfileChanges || loading}
                    className="w-full"
                  >
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <Card className="border-slate-800">
                <CardHeader>
                  <CardTitle>Alterar Senha</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Senha Atual</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    {newPassword && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-400">Força da senha</span>
                          <span className={`text-xs font-medium ${
                            passwordStrength.label === 'Fraca' ? 'text-red-400' :
                            passwordStrength.label === 'Média' ? 'text-yellow-400' :
                            'text-green-400'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${passwordStrength.color} transition-all`}
                            style={{ width: `${passwordStrength.strength}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-xs text-red-400 mt-1">As senhas não coincidem</p>
                    )}
                  </div>

                  <Button onClick={handleChangePassword} disabled={loading} className="w-full">
                    Atualizar Senha
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-red-900/50">
                <CardHeader>
                  <CardTitle className="text-red-400">Zona de Perigo</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 mb-4">
                    Uma vez que você excluir sua conta, não há como voltar atrás. Por favor, tenha certeza.
                  </p>
                  <div className="mb-4">
                    <Label htmlFor="deleteConfirm">Digite "excluir" para confirmar</Label>
                    <Input
                      id="deleteConfirm"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="excluir"
                      className="mt-2"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="w-full"
                    disabled={deleteConfirmText.toLowerCase() !== 'excluir'}
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Excluir Conta
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-slate-800 max-w-2xl mx-auto">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Notificações por E-mail</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Créditos acabando</p>
                        <p className="text-sm text-slate-400">
                          Seja notificado quando seus créditos estiverem quase esgotados
                        </p>
                      </div>
                      <Switch
                        checked={notifications.creditsLow}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, creditsLow: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Resumo semanal</p>
                        <p className="text-sm text-slate-400">
                          Receba um resumo semanal de sua atividade
                        </p>
                      </div>
                      <Switch
                        checked={notifications.weeklySummary}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, weeklySummary: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Notícias e atualizações</p>
                        <p className="text-sm text-slate-400">
                          Fique informado sobre novos recursos e melhorias
                        </p>
                      </div>
                      <Switch
                        checked={notifications.newsUpdates}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, newsUpdates: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">E-mails de marketing</p>
                        <p className="text-sm text-slate-400">
                          Receba ofertas promocionais e dicas
                        </p>
                      </div>
                      <Switch
                        checked={notifications.marketing}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, marketing: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveNotifications} disabled={loading} className="w-full">
                  Salvar Preferências
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card className="border-slate-800 max-w-2xl mx-auto">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Coleta de Dados</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Análise de uso</p>
                        <p className="text-sm text-slate-400">
                          Ajude-nos a melhorar o produto compartilhando dados de uso
                        </p>
                      </div>
                      <Switch
                        checked={privacy.analytics}
                        onCheckedChange={(checked) =>
                          setPrivacy({ ...privacy, analytics: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Compartilhamento de dados anônimos</p>
                        <p className="text-sm text-slate-400">
                          Compartilhe dados anonimizados para melhoria do produto
                        </p>
                      </div>
                      <Switch
                        checked={privacy.anonymousData}
                        onCheckedChange={(checked) =>
                          setPrivacy({ ...privacy, anonymousData: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Perfil público</p>
                        <p className="text-sm text-slate-400">
                          Mostre seu perfil publicamente (em breve)
                        </p>
                      </div>
                      <Switch
                        checked={privacy.publicProfile}
                        onCheckedChange={(checked) =>
                          setPrivacy({ ...privacy, publicProfile: checked })
                        }
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Legal</h3>
                  <div className="space-y-2">
                    <a
                      href="/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-emerald-400 hover:text-emerald-300"
                    >
                      Política de Privacidade
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                    <a
                      href="/terms-of-service"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-emerald-400 hover:text-emerald-300"
                    >
                      Termos de Serviço
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Exportar Dados</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Baixe todos os seus dados em formato JSON (conformidade LGPD/GDPR)
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleExportData}
                    disabled={loading}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Meus Dados
                  </Button>
                </div>

                <Button onClick={handleSavePrivacy} disabled={loading} className="w-full">
                  Salvar Preferências
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <div className="space-y-6 max-w-2xl mx-auto">
              <Card className="border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold">Plano Atual</h3>
                      <p className="text-slate-400">
                        {isPro ? 'Você está no plano Pro' : 'Você está no plano Gratuito'}
                      </p>
                    </div>
                    <Badge variant={isPro ? 'default' : 'secondary'} className="text-lg px-4 py-2">
                      {isPro ? 'Pro' : 'Gratuito'}
                    </Badge>
                  </div>

                  {isPro && (
                    <div className="mb-6 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Preço</span>
                        <span className="font-semibold">{formatBRL(PRICING.PRO_MONTHLY_PRICE)}/mês</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status</span>
                        <span className="text-green-400 font-semibold">
                          {user.subscription_status === 'active' ? 'Ativo' : user.subscription_status}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">Recursos</h4>
                    <div className="space-y-2">
                      {isPro ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-emerald-400" />
                            <span>Formatação ilimitada</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-emerald-400" />
                            <span>Acesso ao histórico completo</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-emerald-400" />
                            <span>Suporte prioritário</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-emerald-400" />
                            <span>Estilos de formatação avançados</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-emerald-400" />
                            <span>30 créditos por mês</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-emerald-400" />
                            <span>7 dias de histórico</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <XIcon className="w-5 h-5 text-slate-600" />
                            <span className="text-slate-500">Suporte prioritário</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {isPro ? (
                    <Button
                      onClick={handleManageSubscription}
                      disabled={loading}
                      className="w-full"
                    >
                      Gerenciar Assinatura
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setLocation('/pricing')}
                      className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                    >
                      Fazer Upgrade para o Pro
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <SimpleAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Você tem certeza absoluta?"
        description="Esta ação não pode ser desfeita. Todos os seus dados serão excluídos permanentemente."
        cancelText="Cancelar"
        actionText="Excluir Permanentemente"
        variant="destructive"
        onAction={handleDeleteAccount}
      />
    </DashboardLayout>
  );
}
