import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Transaction {
  id: number;
  user_id: number;
  amount: string;
  tx_hash: string;
  created_at: string;
  type: 'deposit' | 'withdraw';
}

const PAGE_SIZE = 10;

export function useTransactionHistory(address: string | undefined, updateTrigger?: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTransactions = async (pageNumber: number) => {
    if (!address) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get user ID first
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', address)
        .single();

      if (!userData?.id) return;

      // Fetch deposits
      const { data: deposits, error: depositsError } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', userData.id)
        .eq('status', 'deposit');

      // Fetch withdrawals
      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userData.id)
        .eq('status', 'withdraw');

      if (depositsError) throw depositsError;
      if (withdrawalsError) throw withdrawalsError;

      // Combine and format transactions
      const allTransactions = [
        ...(deposits?.map(d => ({ ...d, type: 'deposit' })) || []),
        ...(withdrawals?.map(w => ({ ...w, type: 'withdraw' })) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setTotalCount(allTransactions.length);

      // Calculate pagination
      const start = (pageNumber - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const paginatedTransactions = allTransactions.slice(start, end);
      
      setTransactions(paginatedTransactions as Transaction[]);
      setHasMore(end < allTransactions.length);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(page);
  }, [address, page, updateTrigger]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  return {
    transactions,
    isLoading,
    error,
    hasMore,
    loadMore,
    page,
    totalCount,
    pageSize: PAGE_SIZE
  };
} 