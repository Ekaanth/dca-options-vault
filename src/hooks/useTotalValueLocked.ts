import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStarkPrice } from './useStarkPrice';

export function useTotalValueLocked() {
  const [tvl, setTvl] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { price: strkPrice } = useStarkPrice();

  const fetchTVL = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: dbError } = await supabase
        .from('deposits')
        .select('amount')
        .eq('status', 'deposit');

      const { data: withdrawals, error: WithdrawError } = await supabase
        .from('withdrawals')
        .select('amount')
        .eq('status', 'withdraw');

      if (dbError) throw dbError;
      if(WithdrawError) throw WithdrawError;

      const totalDeposits = data?.reduce((sum, deposit) => sum + deposit.amount, 0) || 0;
      const totalWithdrawals = withdrawals?.reduce((sum, withdrawal) => sum + withdrawal.amount, 0) || 0;

      const calculatedTvl = totalDeposits - totalWithdrawals;

      if(strkPrice > 0) {
        setTvl(calculatedTvl);
      } else {
        setTvl(0);
      }
    } catch (err) {
      console.error('Error fetching TVL:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch TVL');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTVL();
  }, [strkPrice]); // Refetch when price updates

  return { tvl, isLoading, error, refetch: fetchTVL };
}