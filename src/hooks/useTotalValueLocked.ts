import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@starknet-react/core";

export function useTotalValueLocked() {
  const { address } = useAccount();
  const [tvl, setTvl] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTvl = async () => {
      if (!address) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('vaults')
          .select('collateral_amount')
          .eq('user_id', address)
          .single();

        if (error) throw error;

        setTvl(data?.collateral_amount || 0);
      } catch (error) {
        console.error('Error fetching TVL:', error);
        setError('Failed to fetch TVL');
      } finally {
        setLoading(false);
      }
    };

    fetchTvl();
  }, [address]);

  return { tvl, loading, error };
}