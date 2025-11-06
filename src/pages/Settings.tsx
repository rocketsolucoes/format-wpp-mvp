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
import { AlertDialog } from '../components/ui/AlertDialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { toast } from '../components/ui/Toaster';

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user, updateProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
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

  const isPro = user?.subscription_tier === 'pro';

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setAvatarUrl(user.avatar_url || '');
      setBio('');

      const prefs = user.preferences as any || {};
      if (prefs.notifications) {
        setNotifications(prefs.notifications);
      }
      if (prefs.privacy) {
        setPrivacy(prefs.privacy);
      }
    }
  }, [user?.avatar_url, user?.full_name]);

  const hasProfileChanges = fullName !== (user?.full_name || '') || bio !== '' || avatarFile !== null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, and WebP formats are allowed');
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
      toast.error('Failed to upload avatar');
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
        }
      }

      await updateProfile({
        full_name: fullName,
        avatar_url: newAvatarUrl,
        bio: bio,
      });

      setAvatarFile(null);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
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

    if (strength <= 2) return { strength: 33, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { strength: 66, label: 'Medium', color: 'bg-yellow-500' };
    return { strength: 100, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { error } = await supabase.rpc('delete_user', {
        user_id: user.id,
      });

      if (error) throw error;

      await signOut();
      toast.success('Account deleted successfully');
      setLocation('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
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

      toast.success('Notification preferences saved');
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast.error('Failed to save preferences');
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

      toast.success('Privacy preferences saved');
    } catch (error) {
      console.error('Error saving privacy:', error);
      toast.error('Failed to save preferences');
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
        .single();

      const { data: historyData } = await supabase
        .from('formatting_history')
        .select('*')
        .eq('user_id', user.id);

      const exportData = {
        profile: profileData,
        history: historyData,
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in');
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
      toast.error('Failed to open billing portal');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p>Please sign in to access settings</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-slate-950">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Settings</h1>
        <p className="text-sm text-slate-400">Manage your account settings and preferences</p>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="profile">
          <TabsList className="flex flex-wrap gap-2 mb-8 w-full">
            <TabsTrigger value="profile" className="flex items-center justify-center gap-2">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Account</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center justify-center gap-2">
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center justify-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span>Plan & Billing</span>
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
                    Change Photo
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
                    JPG, PNG, or WebP. Max 2MB.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user.email}
                      disabled
                      className="bg-slate-800/50 text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <Label htmlFor="bio">
                      Bio <span className="text-slate-500">(Optional)</span>
                    </Label>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, 200))}
                      maxLength={200}
                      rows={3}
                      placeholder="Tell us about yourself..."
                      className="w-full px-4 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                    <p className="text-xs text-slate-500 mt-1 text-right">
                      {bio.length}/200 characters
                    </p>
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={!hasProfileChanges || loading}
                    className="w-full"
                  >
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <div className="space-y-6 max-w-2xl mx-auto">
              <Card className="border-slate-800">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
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
                          <span className="text-xs text-slate-400">Password strength</span>
                          <span className={`text-xs font-medium ${
                            passwordStrength.label === 'Weak' ? 'text-red-400' :
                            passwordStrength.label === 'Medium' ? 'text-yellow-400' :
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
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                    )}
                  </div>

                  <Button onClick={handleChangePassword} disabled={loading} className="w-full">
                    Update Password
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-red-900/50">
                <CardHeader>
                  <CardTitle className="text-red-400">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="w-full"
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-slate-800 max-w-2xl mx-auto">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Email Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Credits running low</p>
                        <p className="text-sm text-slate-400">
                          Get notified when your credits are almost depleted
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
                        <p className="font-medium">Weekly summary</p>
                        <p className="text-sm text-slate-400">
                          Receive a weekly summary of your activity
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
                        <p className="font-medium">News and updates</p>
                        <p className="text-sm text-slate-400">
                          Stay informed about new features and improvements
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
                        <p className="font-medium">Marketing emails</p>
                        <p className="text-sm text-slate-400">
                          Receive promotional offers and tips
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
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card className="border-slate-800 max-w-2xl mx-auto">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Data Collection</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Usage analytics</p>
                        <p className="text-sm text-slate-400">
                          Help us improve the product by sharing usage data
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
                        <p className="font-medium">Anonymous data sharing</p>
                        <p className="text-sm text-slate-400">
                          Share anonymized data for product improvement
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
                        <p className="font-medium">Public profile</p>
                        <p className="text-sm text-slate-400">
                          Show your profile publicly (coming soon)
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
                      Privacy Policy
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                    <a
                      href="/terms-of-service"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-emerald-400 hover:text-emerald-300"
                    >
                      Terms of Service
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Data Export</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Download all your data in JSON format (LGPD/GDPR compliance)
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleExportData}
                    disabled={loading}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export My Data
                  </Button>
                </div>

                <Button onClick={handleSavePrivacy} disabled={loading} className="w-full">
                  Save Preferences
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
                      <h3 className="text-2xl font-bold">Current Plan</h3>
                      <p className="text-slate-400">
                        {isPro ? 'You are on the Pro plan' : 'You are on the Free plan'}
                      </p>
                    </div>
                    <Badge variant={isPro ? 'default' : 'secondary'} className="text-lg px-4 py-2">
                      {isPro ? 'Pro' : 'Free'}
                    </Badge>
                  </div>

                  {isPro && (
                    <div className="mb-6 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Price</span>
                        <span className="font-semibold">R$ 19,90/month</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status</span>
                        <span className="text-green-400 font-semibold">
                          {user.subscription_status === 'active' ? 'Active' : user.subscription_status}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">Features</h4>
                    <div className="space-y-2">
                      {isPro ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-emerald-400" />
                            <span>Unlimited formatting</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-emerald-400" />
                            <span>Complete history access</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-emerald-400" />
                            <span>Priority support</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-emerald-400" />
                            <span>Advanced formatting styles</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-emerald-400" />
                            <span>100 credits per month</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-emerald-400" />
                            <span>7 days history</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <XIcon className="w-5 h-5 text-slate-600" />
                            <span className="text-slate-500">Priority support</span>
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
                      Manage Subscription
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setLocation('/pricing')}
                      className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                    >
                      Upgrade to Pro
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Are you absolutely sure?"
        description="This action cannot be undone. All your data will be permanently deleted."
        cancelText="Cancel"
        actionText="Delete Permanently"
        variant="destructive"
        onAction={handleDeleteAccount}
      />
    </DashboardLayout>
  );
}
