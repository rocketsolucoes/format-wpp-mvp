import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Search, Calendar, Eye, Copy, Trash, X, Sparkles, Star, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { AlertDialog } from '../components/ui/AlertDialog';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { toast } from '../components/ui/Toaster';

interface FormattingRecord {
  id: string;
  input_text: string;
  output_text: string;
  tokens_used: number;
  created_at: string;
  is_favorite?: boolean;
  style_id?: string;
}

interface StyleBadgeConfig {
  label: string;
  icon: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const STYLE_CONFIGS: Record<string, StyleBadgeConfig> = {
  casual: {
    label: 'Casual',
    icon: '😊',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
  },
  sales: {
    label: 'Sales',
    icon: '🔥',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/20',
  },
  announcement: {
    label: 'Official',
    icon: '📢',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/20',
  },
};

function StyleBadge({ styleId }: { styleId?: string }) {
  if (!styleId) return null;

  const config = STYLE_CONFIGS[styleId];
  if (!config) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

const ITEMS_PER_PAGE = 10;

export default function History() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [records, setRecords] = useState<FormattingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState<FormattingRecord | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [favoriteFilter, setFavoriteFilter] = useState('all');
  const [favoriteLoading, setFavoriteLoading] = useState<string | null>(null);

  const isPro = user?.subscription_tier === 'pro';

  useEffect(() => {
    const dismissed = localStorage.getItem('history-banner-dismissed');
    setBannerDismissed(dismissed === 'true');
  }, []);

  const dismissBanner = () => {
    setBannerDismissed(true);
    localStorage.setItem('history-banner-dismissed', 'true');
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date | null = null;

    if (!isPro) {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      switch (dateFilter) {
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3months':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
        default:
          startDate = null;
      }
    }

    return startDate;
  };

  const fetchRecords = async () => {
    if (!user) return;

    try {
      setLoading(true);

      let query = supabase
        .from('formatting_history')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const startDate = getDateRange();
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (searchQuery) {
        query = query.or(`input_text.ilike.%${searchQuery}%,output_text.ilike.%${searchQuery}%`);
      }

      if (favoriteFilter === 'favorites') {
        query = query.eq('is_favorite', true);
      } else if (favoriteFilter === 'non-favorites') {
        query = query.eq('is_favorite', false);
      }

      const { data, error, count } = await query
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (error) throw error;

      setRecords(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRecords();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [user, searchQuery, dateFilter, currentPage, favoriteFilter]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleCopy = (text: string, type: 'original' | 'formatted') => {
    navigator.clipboard.writeText(text);
    toast.success(`Texto ${type === 'original' ? 'original' : 'formatado'} copiado!`);
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;

    try {
      const { error } = await supabase
        .from('formatting_history')
        .delete()
        .eq('id', recordToDelete);

      if (error) throw error;

      toast.success('Registro excluído');
      setRecords(records.filter((r) => r.id !== recordToDelete));
      setTotalCount(totalCount - 1);
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Erro ao excluir registro');
    } finally {
      setRecordToDelete(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setRecordToDelete(id);
    setDeleteDialogOpen(true);
  };

  const hasActiveFilters = searchQuery || dateFilter !== 'all' || favoriteFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setFavoriteFilter('all');
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return '1 dia atrás';
    if (diffDays < 30) return `${diffDays} dias atrás`;

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getCharacterChange = (inputText: string, outputText: string) => {
    const inputLength = inputText.length;
    const outputLength = outputText.length;
    const diff = outputLength - inputLength;

    if (diff > 0) {
      return `${inputLength} → ${outputLength} chars (+${diff})`;
    } else if (diff < 0) {
      return `${inputLength} → ${outputLength} chars (${diff})`;
    }
    return `${inputLength} chars`;
  };

  const handleReformat = (record: FormattingRecord) => {
    localStorage.setItem('reformat_text', record.input_text);
    localStorage.setItem('reformat_style', record.style_id || 'casual');
    setLocation('/format');
    toast.info('Texto carregado para reformatação');
  };

  const handleToggleFavorite = async (record: FormattingRecord) => {
    if (favoriteLoading === record.id) return;

    setFavoriteLoading(record.id);
    const newFavoriteState = !record.is_favorite;

    setRecords(prevRecords =>
      prevRecords.map(r =>
        r.id === record.id ? { ...r, is_favorite: newFavoriteState } : r
      )
    );

    if (selectedRecord?.id === record.id) {
      setSelectedRecord({ ...selectedRecord, is_favorite: newFavoriteState });
    }

    try {
      const { error } = await supabase
        .from('formatting_history')
        .update({ is_favorite: newFavoriteState })
        .eq('id', record.id);

      if (error) throw error;

      toast.success(newFavoriteState ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Erro ao atualizar favorito');

      setRecords(prevRecords =>
        prevRecords.map(r =>
          r.id === record.id ? { ...r, is_favorite: !newFavoriteState } : r
        )
      );

      if (selectedRecord?.id === record.id) {
        setSelectedRecord({ ...selectedRecord, is_favorite: !newFavoriteState });
      }
    } finally {
      setFavoriteLoading(null);
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p>Por favor, faça login para ver seu histórico</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-slate-950">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Histórico de Formatação</h1>
        <p className="text-sm text-slate-400">
          {totalCount > 0 ? `${totalCount} ${totalCount === 1 ? 'registro encontrado' : 'registros encontrados'}` : 'Visualize e gerencie suas solicitações de formatação anteriores'}
        </p>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {!isPro && !bannerDismissed && (
          <div className="mb-6 p-4 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <p className="text-slate-200">
                Faça upgrade para o Pro e tenha acesso ao histórico completo
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setLocation('/pricing')}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500"
              >
                Fazer Upgrade
              </Button>
              <Button variant="ghost" size="sm" onClick={dismissBanner}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm pb-4 mb-6 border-b border-slate-800">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar nos textos..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>

            {isPro && (
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <Select
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 w-full md:w-48"
                >
                  <option value="all">Todo o período</option>
                  <option value="7days">Últimos 7 dias</option>
                  <option value="30days">Últimos 30 dias</option>
                  <option value="3months">Últimos 3 meses</option>
                </Select>
              </div>
            )}

            <div className="relative">
              <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <Select
                value={favoriteFilter}
                onChange={(e) => {
                  setFavoriteFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 w-full md:w-48"
              >
                <option value="all">Todos</option>
                <option value="favorites">Apenas Favoritos</option>
                <option value="non-favorites">Não Favoritos</option>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="border-slate-800">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-24" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-48" />
                    <div className="flex gap-2 pt-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center">
                <Search className="w-12 h-12 text-slate-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-slate-300">Nenhuma formatação encontrada</h2>
            <p className="text-slate-500 mb-6">
              {hasActiveFilters
                ? 'Tente ajustar seus filtros'
                : 'Comece a formatar textos para ver seu histórico aqui'}
            </p>
            {!hasActiveFilters && (
              <Button
                onClick={() => setLocation('/format')}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500"
              >
                Começar a Formatar
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="p-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-all border border-slate-800 hover:border-slate-700 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <StyleBadge styleId={record.style_id} />
                      {record.is_favorite && (
                        <span className="text-yellow-400" title="Favorito">
                          <Star className="w-4 h-4 fill-yellow-400" />
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 line-clamp-2">
                        {record.output_text}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{getRelativeTime(record.created_at)}</span>
                      <span>•</span>
                      <span>{getCharacterChange(record.input_text, record.output_text)}</span>
                      {record.is_favorite && (
                        <>
                          <span>•</span>
                          <span className="text-yellow-400">★ Salvo</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRecord(record)}
                        className="flex-1 sm:flex-none text-xs h-8"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        Ver
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(record.output_text, 'formatted')}
                        className="flex-1 sm:flex-none text-xs h-8"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                        Copiar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReformat(record)}
                        className="flex-1 sm:flex-none text-xs h-8"
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                        Re-formatar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFavorite(record)}
                        disabled={favoriteLoading === record.id}
                        className={`flex-1 sm:flex-none text-xs h-8 ${
                          record.is_favorite ? 'text-yellow-400 hover:text-yellow-300' : ''
                        }`}
                      >
                        <Star
                          className={`w-3.5 h-3.5 mr-1.5 ${
                            favoriteLoading === record.id ? 'animate-pulse' : ''
                          } ${record.is_favorite ? 'fill-yellow-400' : ''}`}
                        />
                        {record.is_favorite ? 'Salvo' : 'Salvar'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Anterior
                </Button>
                <p className="text-sm text-slate-400">
                  Página {currentPage} de {totalPages}
                </p>
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-3">
                <span>{selectedRecord && formatDate(selectedRecord.created_at)}</span>
                {selectedRecord?.is_favorite && (
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <>
              <div className="px-6 py-6 overflow-y-auto flex-1">
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">Texto Original</h3>
                    <textarea
                      readOnly
                      value={selectedRecord.input_text}
                      className="w-full h-80 p-4 rounded-lg border-2 border-slate-700 bg-slate-900/50 text-slate-200 text-sm resize-none focus:outline-none focus:border-slate-600 transition-colors"
                    />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">Texto Formatado</h3>
                    <textarea
                      readOnly
                      value={selectedRecord.output_text}
                      className="w-full h-80 p-4 rounded-lg border-2 border-slate-700 bg-slate-900/50 text-slate-200 text-sm resize-none focus:outline-none focus:border-slate-600 transition-colors"
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/30">
                <div className="flex flex-wrap justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleToggleFavorite(selectedRecord)}
                    disabled={favoriteLoading === selectedRecord.id}
                    className={selectedRecord.is_favorite ? 'text-yellow-400 hover:text-yellow-300 border-yellow-500/30' : ''}
                  >
                    <Star
                      className={`w-4 h-4 mr-2 ${
                        favoriteLoading === selectedRecord.id ? 'animate-pulse' : ''
                      } ${selectedRecord.is_favorite ? 'fill-yellow-400' : ''}`}
                    />
                    <span className="hidden sm:inline">{selectedRecord.is_favorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}</span>
                    <span className="sm:hidden">{selectedRecord.is_favorite ? 'Remover' : 'Favoritar'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCopy(selectedRecord.input_text, 'original')}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Copiar Original</span>
                    <span className="sm:hidden">Original</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCopy(selectedRecord.output_text, 'formatted')}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Copiar Formatado</span>
                    <span className="sm:hidden">Formatado</span>
                  </Button>
                  <Button
                    onClick={() => setSelectedRecord(null)}
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Tem certeza?"
        description="Esta ação não pode ser desfeita. Isso excluirá permanentemente este registro de formatação."
        cancelText="Cancelar"
        actionText="Excluir"
        variant="destructive"
        onAction={handleDelete}
      />
    </DashboardLayout>
  );
}
