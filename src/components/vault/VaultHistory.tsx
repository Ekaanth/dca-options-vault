import { useEffect, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";

interface TransactionHistory {
  id: number;
  amount: string;
  tx_hash: string;
  status: string;
  type: 'deposit' | 'withdraw';
  created_at: string;
}

export function VaultHistory() {
  const { address } = useAccount();
  const [history, setHistory] = useState<TransactionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!address) return;

      try {
        setIsLoading(true);
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('wallet_address', address)
          .single();

        if (!userData?.id) return;

        const { data: deposits, error } = await supabase
          .from('deposits')
          .select('*')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false });

        const { data: withdrawals, error: withdrawError } = await supabase
          .from('withdrawals')
          .select('*')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (withdrawError) throw withdrawError;

        setHistory([...(deposits || []), ...(withdrawals || [])]);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [address]);

  const handleRowClick = (txHash: string) => {
    window.open(`https://sepolia.starkscan.co/tx/${txHash}`, '_blank');
  };

  if (!address) return null;

  return (
    <>
      {isLoading ? (
        <div className="text-center py-4">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">No transactions yet</div>
      ) : (
        <div className="space-y-4">
          {history.map((transaction) => (
            <div
              key={transaction.id}
              onClick={() => handleRowClick(transaction.tx_hash)}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-secondary/50 cursor-pointer transition-colors"
            >
              <div className="space-y-1">
                <p className="font-medium">
                  {transaction.status === 'deposit' ? 'Deposit' : 'Withdrawal'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(transaction.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={transaction.status === 'deposit' ? 'text-green-500' : 'text-red-500'}>
                  {transaction.status === 'deposit' ? '+' : '-'}{transaction.amount} STRK
                </span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
} 