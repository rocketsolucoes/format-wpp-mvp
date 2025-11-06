import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Search, Calendar, Eye, Copy, Trash, ArrowDown, X, Sparkles } from 'lucide-react';
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

      const { data, error, count } = await query
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (error) throw error;

      setRecords(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('Error loading history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRecords();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [user, searchQuery, dateFilter, currentPage]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleCopy = (text: string, type: 'original' | 'formatted') => {
    navigator.clipboard.writeText(text);
    toast.success(`${type === 'original' ? 'Original' : 'Formatted'} text copied!`);
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;

    try {
      const { error } = await supabase
        .from('formatting_history')
        .delete()
        .eq('id', recordToDelete);

      if (error) throw error;

      toast.success('Record deleted');
      setRecords(records.filter((r) => r.id !== recordToDelete));
      setTotalCount(totalCount - 1);
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Error deleting record');
    } finally {
      setRecordToDelete(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setRecordToDelete(id);
    setDeleteDialogOpen(true);
  };

  const hasActiveFilters = searchQuery || dateFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p>Please sign in to view your history</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-slate-950">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Formatting History</h1>
        <p className="text-sm text-slate-400">
          {totalCount > 0 ? `${totalCount} ${totalCount === 1 ? 'record' : 'records'} found` : 'View and manage your previous formatting requests'}
        </p>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {!isPro && !bannerDismissed && (
          <div className="mb-6 p-4 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <p className="text-slate-200">
                Upgrade to Pro and get access to complete history
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setLocation('/pricing')}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500"
              >
                Upgrade
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
                placeholder="Search in texts..."
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
                  <option value="all">All time</option>
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                  <option value="3months">Last 3 months</option>
                </Select>
              </div>
            )}

            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="border-slate-800">
                <CardContent className="p-6">
                  <div className="grid lg:grid-cols-[200px_1fr_150px] gap-6">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-8 w-8 mx-auto my-2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
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
            <h2 className="text-2xl font-bold mb-2 text-slate-300">No formatting found</h2>
            <p className="text-slate-500 mb-6">
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Start formatting text to see your history here'}
            </p>
            {!hasActiveFilters && (
              <Button
                onClick={() => setLocation('/format')}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500"
              >
                Start Formatting
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {records.map((record) => (
                <Card
                  key={record.id}
                  className="border-slate-800 hover:border-slate-700 transition-colors group"
                >
                  <CardContent className="p-6">
                    <div className="grid lg:grid-cols-[200px_1fr_150px] gap-6">
                      <div className="flex flex-col gap-2">
                        <p className="text-sm text-slate-400">{formatDate(record.created_at)}</p>
                        <Badge variant={isPro ? 'default' : 'secondary'} className="w-fit">
                          {isPro ? 'Pro' : 'Free'}
                        </Badge>
                        <p className="text-xs text-slate-500">{record.tokens_used} tokens</p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Original:</p>
                          <p className="text-sm text-slate-300">
                            {truncateText(record.input_text)}
                          </p>
                        </div>
                        <div className="flex justify-center">
                          <ArrowDown className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Formatted:</p>
                          <p className="text-sm text-slate-300">
                            {truncateText(record.output_text)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Full
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(record.output_text, 'formatted')}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(record.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <p className="text-sm text-slate-400">
                  Page {currentPage} of {totalPages}
                </p>
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRecord && formatDate(selectedRecord.created_at)}
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <>
              <div className="grid lg:grid-cols-2 gap-6 mt-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-2">Original Text</h3>
                  <textarea
                    readOnly
                    value={selectedRecord.input_text}
                    className="w-full h-64 p-4 rounded-md border border-slate-700 bg-slate-900 text-slate-200 text-sm resize-none focus:outline-none"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-2">Formatted Text</h3>
                  <textarea
                    readOnly
                    value={selectedRecord.output_text}
                    className="w-full h-64 p-4 rounded-md border border-slate-700 bg-slate-900 text-slate-200 text-sm resize-none focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => handleCopy(selectedRecord.input_text, 'original')}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Original
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCopy(selectedRecord.output_text, 'formatted')}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Formatted
                </Button>
                <Button onClick={() => setSelectedRecord(null)}>Close</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Are you sure?"
        description="This action cannot be undone. This will permanently delete this formatting record."
        cancelText="Cancel"
        actionText="Delete"
        variant="destructive"
        onAction={handleDelete}
      />
    </DashboardLayout>
  );
}
