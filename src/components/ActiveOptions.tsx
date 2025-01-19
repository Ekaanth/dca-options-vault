import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useAccount } from "@starknet-react/core";
import { supabase } from "@/integrations/supabase/client";

interface Option {
  id: number;
  vault_id: number;
  option_type: 'call' | 'put';
  strike_price: string;
  expiry_timestamp: string;
  premium: string;
  status: 'active' | 'pending' | 'exercised' | 'expired';
  created_at: string;
  tx_hash: string;
}

interface Vault {
  id: number;
  collateral_amount: number;
}

export function ActiveOptions() {
  const { address } = useAccount();
  const [options, setOptions] = useState<(Option & { vault: Vault })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [tvl, setTvl] = useState(0);

  // Fetch options and TVL
  useEffect(() => {
    const fetchData = async () => {
      if (!address) return;

      try {
        setIsLoading(true);

        // Get user ID first
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('wallet_address', address)
          .single();

        if (!userData?.id) return;

        // Fetch options with their associated vaults
        const { data: optionsData, error: optionsError } = await supabase
          .from('options')
          .select(`
            *,
            vault:vaults (
              id,
              collateral_amount
            )
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (optionsError) throw optionsError;

        // Calculate TVL from deposits and withdrawals
        const { data: deposits } = await supabase
          .from('deposits')
          .select('amount')
          .eq('status', 'confirmed');

        const { data: withdrawals } = await supabase
          .from('withdrawals')
          .select('amount')
          .eq('status', 'confirmed');

        const totalDeposits = deposits?.reduce((sum, tx) => 
          sum + Number(tx.amount), 0
        ) || 0;

        const totalWithdrawals = withdrawals?.reduce((sum, tx) => 
          sum + Number(tx.amount), 0
        ) || 0;

        const calculatedTvl = totalDeposits - totalWithdrawals;
        setTvl(calculatedTvl);
        setOptions(optionsData || []);

      } catch (error) {
        console.error('Error fetching options:', error);
        toast({
          title: "Error",
          description: "Failed to fetch options data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [address, toast]);

  const totalLockedValue = options.reduce((acc, option) => 
    option.status === "active" ? acc + Number(option.vault.collateral_amount) : acc, 0
  );
  const percentageLocked = tvl > 0 ? (totalLockedValue / tvl) * 100 : 0;

  if (!address) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          Connect your wallet to view options
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">Loading options...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6 gradient-border">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Active Options</h2>
          <div className="text-sm text-muted-foreground">
            {percentageLocked.toFixed(1)}% TVL Locked
          </div>
        </div>
        
        <div className="w-full">
          <Progress value={percentageLocked} className="h-2" />
        </div>

        {options.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No active options
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Strike Price</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Locked Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {options.map((option) => (
                  <TableRow key={option.id}>
                    <TableCell className="font-mono">
                      {option.id}
                    </TableCell>
                    <TableCell className="font-mono">
                      {option.option_type.toUpperCase()}
                    </TableCell>
                    <TableCell className="font-mono">
                      ${Number(option.strike_price).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono">
                      {Number(option.premium).toFixed(6)} STRK
                    </TableCell>
                    <TableCell>
                      {new Date(option.expiry_timestamp).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-mono">
                      ${Number(option.vault.collateral_amount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          option.status === "active"
                            ? "bg-green-500/20 text-green-500"
                            : option.status === "exercised"
                            ? "bg-blue-500/20 text-black"
                            : "bg-yellow-500/20 text-yellow-500"
                        }`}
                      >
                        {option.status.charAt(0).toUpperCase() + option.status.slice(1)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Card>
  );
}