import React, { useState, useEffect } from 'react';
import { Settings, Lock, Clock, Save, X, TestTube2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Switch } from '../../components/ui/Switch';
import { Textarea } from '../../components/ui/Textarea';
import { Label } from '../../components/ui/Label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/AlertDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/Dialog';
import { toast } from '../../components/ui/Toaster';

interface FormattingPrompt {
  id: string;
  style_id: string;
  name: string;
  description: string | null;
  prompt: string;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

const MAX_PROMPT_LENGTH = 5000;
const MIN_PROMPT_LENGTH = 50;

export default function Prompts() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [prompts, setPrompts] = useState<FormattingPrompt[]>([]);
  const [activeTab, setActiveTab] = useState('casual');

  const [editMode, setEditMode] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [currentEditingId, setCurrentEditingId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        toast.error('Please sign in to continue');
        setLocation('/auth');
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking admin status:', error);
          toast.error('Failed to verify access permissions');
          setLocation('/dashboard');
          return;
        }

        if (!profile || !profile.is_admin) {
          toast.error('Access denied. Admin only.');
          setLocation('/dashboard');
          return;
        }

        setCheckingAdmin(false);
      } catch (err) {
        console.error('Error in admin check:', err);
        toast.error('An error occurred. Please try again.');
        setLocation('/dashboard');
      }
    };

    checkAdminAccess();
  }, [user, setLocation]);

  useEffect(() => {
    const fetchPrompts = async () => {
      if (checkingAdmin) return;

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('formatting_prompts')
          .select('*')
          .order('style_id');

        if (error) {
          console.error('Error fetching prompts:', error);
          toast.error('Failed to load prompts');
          return;
        }

        setPrompts(data || []);
      } catch (err) {
        console.error('Error in fetchPrompts:', err);
        toast.error('An error occurred while loading prompts');
      } finally {
        setLoading(false);
      }
    };

    if (!checkingAdmin) {
      fetchPrompts();
    }
  }, [checkingAdmin]);

  if (checkingAdmin) {
    return (
      <DashboardLayout>
        <div className="px-4 py-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-slate-400 animate-pulse" />
            <div>
              <h1 className="text-2xl font-bold text-slate-300">Verifying Access...</h1>
              <p className="text-sm text-slate-500">Checking admin permissions</p>
            </div>
          </div>
        </div>
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Skeleton className="h-64 w-full max-w-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPromptByStyleId = (styleId: string) => {
    return prompts.find((p) => p.style_id === styleId);
  };

  const validatePrompt = (text: string): { valid: boolean; error?: string } => {
    if (!text.trim()) {
      return { valid: false, error: 'Prompt cannot be empty' };
    }
    if (text.length < MIN_PROMPT_LENGTH) {
      return { valid: false, error: `Prompt must be at least ${MIN_PROMPT_LENGTH} characters` };
    }
    if (text.length > MAX_PROMPT_LENGTH) {
      return { valid: false, error: `Prompt cannot exceed ${MAX_PROMPT_LENGTH} characters` };
    }
    return { valid: true };
  };

  const handleEditToggle = (prompt: FormattingPrompt) => {
    if (editMode) {
      setEditMode(false);
      setEditedPrompt('');
      setCurrentEditingId(null);
    } else {
      setEditMode(true);
      setEditedPrompt(prompt.prompt);
      setCurrentEditingId(prompt.id);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditedPrompt('');
    setCurrentEditingId(null);
  };

  const handleSaveClick = () => {
    const validation = validatePrompt(editedPrompt);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid prompt');
      return;
    }
    setShowSaveDialog(true);
  };

  const handleSaveConfirm = async () => {
    if (!currentEditingId) return;

    try {
      setSaving(true);

      const currentPrompt = prompts.find(p => p.id === currentEditingId);
      if (!currentPrompt) {
        toast.error('Prompt not found');
        return;
      }

      const { error } = await supabase
        .from('formatting_prompts')
        .update({
          prompt: editedPrompt,
          updated_at: new Date().toISOString(),
          version: currentPrompt.version + 1,
        })
        .eq('id', currentEditingId);

      if (error) {
        console.error('Error saving prompt:', error);
        toast.error('Failed to save prompt');
        return;
      }

      toast.success('Prompt saved successfully!');

      const { data: updatedPrompts } = await supabase
        .from('formatting_prompts')
        .select('*')
        .order('style_id');

      if (updatedPrompts) {
        setPrompts(updatedPrompts);
      }

      setEditMode(false);
      setEditedPrompt('');
      setCurrentEditingId(null);
    } catch (err) {
      console.error('Error in handleSaveConfirm:', err);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
      setShowSaveDialog(false);
    }
  };

  const handleTestPrompt = async () => {
    if (!testInput.trim()) {
      toast.error('Please enter some text to test');
      return;
    }

    const validation = validatePrompt(editedPrompt);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid prompt');
      return;
    }

    try {
      setTestLoading(true);
      setTestOutput('');

      const currentPrompt = prompts.find(p => p.id === currentEditingId);
      if (!currentPrompt) {
        toast.error('Prompt not found');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/format-text`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: testInput,
            styleId: currentPrompt.style_id,
            customPrompt: editedPrompt,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to format text');
      }

      const data = await response.json();
      setTestOutput(data.formattedText || '');
      toast.success('Test completed!');
    } catch (err) {
      console.error('Error testing prompt:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to test prompt');
    } finally {
      setTestLoading(false);
    }
  };

  const renderPromptCard = (styleId: string) => {
    if (loading) {
      return (
        <Card className="border-slate-800">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      );
    }

    const prompt = getPromptByStyleId(styleId);

    if (!prompt) {
      return (
        <Card className="border-slate-800">
          <CardContent className="py-12 text-center">
            <p className="text-slate-400">No prompt found for this style</p>
          </CardContent>
        </Card>
      );
    }

    const isEditing = editMode && currentEditingId === prompt.id;
    const displayText = isEditing ? editedPrompt : prompt.prompt;
    const charCount = displayText.length;
    const validation = validatePrompt(editedPrompt);
    const canSave = isEditing && validation.valid;

    return (
      <Card className="border-slate-800 hover:border-slate-700 transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-white">
                {prompt.name}
              </CardTitle>
              {prompt.description && (
                <p className="text-sm text-slate-400 mt-1">{prompt.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {prompt.is_active ? (
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded">
                  Active
                </span>
              ) : (
                <span className="px-2 py-1 bg-slate-700 text-slate-400 text-xs font-medium rounded">
                  Inactive
                </span>
              )}
              <span className="px-2 py-1 bg-slate-800 text-slate-400 text-xs font-medium rounded">
                v{prompt.version}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <Label htmlFor={`edit-mode-${prompt.id}`} className="text-sm font-medium text-slate-300 cursor-pointer">
              Edit Mode
            </Label>
            <Switch
              id={`edit-mode-${prompt.id}`}
              checked={isEditing}
              onCheckedChange={() => handleEditToggle(prompt)}
              disabled={editMode && currentEditingId !== prompt.id}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">
                {isEditing ? 'Edit Prompt' : 'Prompt Content'}
              </label>
              <span className={`text-xs ${
                charCount > MAX_PROMPT_LENGTH
                  ? 'text-red-400'
                  : charCount < MIN_PROMPT_LENGTH && isEditing
                  ? 'text-yellow-400'
                  : 'text-slate-500'
              }`}>
                {charCount} / {MAX_PROMPT_LENGTH} characters
              </span>
            </div>
            <div className="relative">
              {isEditing ? (
                <Textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Enter prompt text..."
                />
              ) : (
                <pre className="p-4 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 font-mono whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                  {prompt.prompt}
                </pre>
              )}
            </div>
            {isEditing && !validation.valid && (
              <p className="mt-2 text-sm text-red-400">{validation.error}</p>
            )}
          </div>

          {!isEditing && (
            <div className="flex items-center gap-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-4 h-4" />
                <span>Updated: {formatDate(prompt.updated_at)}</span>
              </div>
            </div>
          )}

          {isEditing && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800">
              <Button
                onClick={handleSaveClick}
                disabled={!canSave || saving}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                onClick={() => setShowTestModal(true)}
                variant="outline"
                disabled={!validation.valid}
                className="flex-1"
              >
                <TestTube2 className="w-4 h-4 mr-2" />
                Test Prompt
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={saving}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="px-4 py-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Settings className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Prompt Manager
            </h1>
            <p className="text-sm text-slate-400">Manage AI formatting prompts for WhatsApp</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="casual" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="casual" onClick={() => setActiveTab('casual')}>
              Casual Friendly
            </TabsTrigger>
            <TabsTrigger value="sales" onClick={() => setActiveTab('sales')}>
              Persuasive Sales
            </TabsTrigger>
            <TabsTrigger value="announcement" onClick={() => setActiveTab('announcement')}>
              Important Announcement
            </TabsTrigger>
          </TabsList>

          <TabsContent value="casual" className="space-y-4">
            {renderPromptCard('casual')}
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            {renderPromptCard('sales')}
          </TabsContent>

          <TabsContent value="announcement" className="space-y-4">
            {renderPromptCard('announcement')}
          </TabsContent>
        </Tabs>

        <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-400 mb-1">Admin Access Only</h3>
              <p className="text-xs text-yellow-300/80">
                This page is restricted to administrators. All changes to prompts are versioned and tracked.
                Editing a prompt will affect all future formatting operations.
              </p>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Prompt Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will affect all future formatting operations. The prompt version will be incremented.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveConfirm} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showTestModal} onOpenChange={setShowTestModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Test Prompt</DialogTitle>
            <DialogDescription>
              Test your edited prompt with sample text before saving
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="test-input" className="text-sm font-medium text-slate-300 mb-2 block">
                Input Text
              </Label>
              <Textarea
                id="test-input"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Enter sample text to test..."
                className="min-h-[120px] font-mono text-sm"
              />
            </div>
            <div>
              <Label htmlFor="test-output" className="text-sm font-medium text-slate-300 mb-2 block">
                Formatted Result
              </Label>
              <Textarea
                id="test-output"
                value={testOutput}
                readOnly
                placeholder="Formatted result will appear here..."
                className="min-h-[120px] font-mono text-sm bg-slate-900"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleTestPrompt}
                disabled={testLoading || !testInput.trim()}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700"
              >
                {testLoading ? 'Formatting...' : 'Format'}
              </Button>
              <Button
                onClick={() => {
                  setShowTestModal(false);
                  setTestInput('');
                  setTestOutput('');
                }}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
