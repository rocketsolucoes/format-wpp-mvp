import React, { useState, useEffect } from 'react';
import { Settings, Lock, Clock, Save, X, TestTube2, History, User, ChevronDown, Shield, Wrench, Play, CheckCircle2, AlertCircle } from 'lucide-react';
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
import { Badge } from '../../components/ui/Badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../components/ui/Collapsible';
import { ScrollArea } from '../../components/ui/ScrollArea';

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

interface AuditLogEntry {
  id: string;
  prompt_id: string;
  user_id: string;
  action: string;
  old_value: { prompt?: string } | null;
  new_value: { prompt?: string } | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  };
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

  const [historyData, setHistoryData] = useState<Record<string, AuditLogEntry[]>>({});
  const [historyLoading, setHistoryLoading] = useState<Record<string, boolean>>({});
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [selectedDiff, setSelectedDiff] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        toast.error('Por favor, faça login para continuar');
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
          console.error('Erro ao verificar status de admin:', error);
          toast.error('Falha ao verificar permissões de acesso');
          setLocation('/dashboard');
          return;
        }

        if (!profile || !profile.is_admin) {
          toast.error('Acesso negado. Apenas administradores.');
          setLocation('/dashboard');
          return;
        }

        setCheckingAdmin(false);
      } catch (err) {
        console.error('Erro na verificação de admin:', err);
        toast.error('Ocorreu um erro. Tente novamente.');
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
          console.error('Erro ao buscar prompts:', error);
          toast.error('Falha ao carregar prompts');
          return;
        }

        setPrompts(data || []);
      } catch (err) {
        console.error('Erro em fetchPrompts:', err);
        toast.error('Ocorreu um erro ao carregar os prompts');
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
        <div className="px-4 py-4 sm:px-6 lg:px-8 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-muted-foreground animate-pulse" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Verificando Acesso...</h1>
              <p className="text-sm text-muted-foreground">Checando permissões de administrador</p>
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

  const getPromptByStyleId = (styleId: string) => {
    return prompts.find((p) => p.style_id === styleId);
  };

  const validatePrompt = (text: string): { valid: boolean; error?: string } => {
    if (!text.trim()) {
      return { valid: false, error: 'O prompt não pode estar vazio' };
    }
    if (text.length < MIN_PROMPT_LENGTH) {
      return { valid: false, error: `O prompt deve ter pelo menos ${MIN_PROMPT_LENGTH} caracteres` };
    }
    if (text.length > MAX_PROMPT_LENGTH) {
      return { valid: false, error: `O prompt não pode exceder ${MAX_PROMPT_LENGTH} caracteres` };
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

  const handleSaveConfirm = async () => {
    if (!currentEditingId) return;

    const currentPrompt = prompts.find(p => p.id === currentEditingId);
    if (!currentPrompt) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('formatting_prompts')
        .update({
          prompt: editedPrompt,
          updated_at: new Date().toISOString(),
          version: currentPrompt.version + 1,
        })
        .eq('id', currentEditingId);

      if (error) throw error;

      toast.success('Prompt salvo com sucesso!');
      
      const { data: updatedPrompts } = await supabase
        .from('formatting_prompts')
        .select('*')
        .order('style_id');
      
      if (updatedPrompts) setPrompts(updatedPrompts);

      setEditMode(false);
      setEditedPrompt('');
      setCurrentEditingId(null);
      setShowSaveDialog(false);
    } catch (err: any) {
      toast.error(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const renderPromptCard = (styleId: string) => {
    if (loading) return <Skeleton className="h-64 w-full" />;

    const prompt = getPromptByStyleId(styleId);
    if (!prompt) return <div className="p-8 text-center text-muted-foreground">Prompt não encontrado</div>;

    const isEditing = editMode && currentEditingId === prompt.id;
    const displayText = isEditing ? editedPrompt : prompt.prompt;
    const charCount = displayText.length;

    return (
      <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all">
        <CardHeader className="border-b border-border bg-muted/30">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                {prompt.name}
                <Badge variant="outline" className="font-mono text-[10px]">v{prompt.version}</Badge>
              </CardTitle>
              {prompt.description && (
                <p className="text-sm text-muted-foreground">{prompt.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 mr-4">
                <Label htmlFor={`edit-mode-${prompt.id}`} className="text-xs font-medium text-muted-foreground cursor-pointer">
                  Modo Edição
                </Label>
                <Switch
                  id={`edit-mode-${prompt.id}`}
                  checked={isEditing}
                  onCheckedChange={() => handleEditToggle(prompt)}
                />
              </div>
              <Badge variant={prompt.is_active ? 'success' : 'secondary'}>
                {prompt.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-foreground">Conteúdo do Prompt</Label>
              <span className={`text-xs font-mono ${charCount > MAX_PROMPT_LENGTH ? 'text-destructive' : 'text-muted-foreground'}`}>
                {charCount} / {MAX_PROMPT_LENGTH}
              </span>
            </div>
            <div className="relative group">
              <Textarea
                value={displayText}
                onChange={(e) => isEditing && setEditedPrompt(e.target.value)}
                readOnly={!isEditing}
                className={`min-h-[400px] font-mono text-sm p-4 transition-all duration-200 ${
                  isEditing 
                    ? 'bg-background border-primary ring-1 ring-primary/20' 
                    : 'bg-muted/50 border-border text-muted-foreground cursor-not-allowed'
                }`}
                placeholder="Instruções da IA..."
              />
              {!isEditing && (
                <div className="absolute inset-0 bg-background/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm shadow-sm">
                    Clique em "Modo Edição" para alterar
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <History className="w-3.5 h-3.5" />
              Atualizado em: {new Date(prompt.updated_at).toLocaleString('pt-BR')}
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => {
                  setCurrentEditingId(prompt.id);
                  setEditedPrompt(prompt.prompt);
                  setShowTestModal(true);
                }}
              >
                <TestTube2 className="w-4 h-4" />
                Testar
              </Button>
              {isEditing && (
                <Button 
                  onClick={() => setShowSaveDialog(true)} 
                  disabled={saving}
                  className="gap-2 bg-primary text-primary-foreground"
                  size="sm"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Prompt Manager</h1>
              <p className="text-sm text-muted-foreground">Ajuste fino das instruções de inteligência artificial</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/50 p-1 border border-border mb-6">
            <TabsTrigger value="casual" className="data-[state=active]:bg-background data-[state=active]:text-primary">Casual</TabsTrigger>
            <TabsTrigger value="sales" className="data-[state=active]:bg-background data-[state=active]:text-primary">Sales</TabsTrigger>
            <TabsTrigger value="announcement" className="data-[state=active]:bg-background data-[state=active]:text-primary">Official</TabsTrigger>
          </TabsList>

          <TabsContent value="casual">{renderPromptCard('casual')}</TabsContent>
          <TabsContent value="sales">{renderPromptCard('sales')}</TabsContent>
          <TabsContent value="announcement">{renderPromptCard('announcement')}</TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação criará uma nova versão do prompt (v{getPromptByStyleId(activeTab)?.version! + 1}). 
              As mudanças afetarão imediatamente todos os usuários que utilizarem este estilo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveConfirm} className="bg-primary text-primary-foreground">
              Salvar Nova Versão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
