
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@starknet-react/core";
import { useEffect, useState } from "react";


export function useActivePositions() {
    const { address } = useAccount();
    const [activePositions, setActivePositions] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      const fetchActivePositions = async () => {
        if (!address) return;
  
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('users')
            .select('active_positions')
            .eq('wallet_address', address)
            .single();
  
          if (error) throw error;
  
          setActivePositions(data?.active_positions || 0);
        } catch (error) {
          console.error('Error fetching active positions:', error);
          setError('Failed to fetch active positions');
        } finally {
          setLoading(false);
        }
      };
  
      fetchActivePositions();
    }, [address]);
  
    return { activePositions, loading, error };
  }