import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { uint256 } from "starknet";

interface Option {
  id: number;
  vault_id: number;
  option_type: 'call' | 'put';
  strike_price: string;
  expiry_timestamp: string;
  premium: string;
  locked_amount: string;
  status: 'active' | 'pending' | 'exercised' | 'expired';
  created_at: string;
  tx_hash: string;
}

interface Vault {
  id: number;
  collateral_amount: number;
}

export function ActiveOptions() {
  const [options, setOptions] = useState<(Option & { vault: Vault })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [tvl, setTvl] = useState(0);
  const { address, account } = useAccount();

  const handleBuy = async(optionId: number) => {
    console.log("Buy option with ID:", optionId);

    const optionIdBN = BigInt(1);
    const amountBN = BigInt(parseFloat("0.00000000000001") * 10**18);

    const optionIdUint256 = uint256.bnToUint256(optionIdBN);
    const amountUint256 = uint256.bnToUint256(amountBN);
    // Call withdraw_tokens function on the vault contract
    const buyResponse = await account.execute({
      contractAddress: import.meta.env.VITE_VAULT_CONTRACT_ADDRESS,
      entrypoint: "buy_option",
      calldata: [
        optionIdUint256.low,
        optionIdUint256.high,
        amountUint256.low,
        amountUint256.high
      ]
    });

    await account.waitForTransaction(buyResponse.transaction_hash);

    // Update option status and tx hash in database
    const { error } = await supabase
      .from('options')
      .update({ 
        status: 'active',
        tx_hash: buyResponse.transaction_hash 
      })
      .eq('id', optionId);

    if (error) {
      console.error('Error updating option:', error);
      toast({
        title: "Error",
        description: "Failed to update option status",
        variant: "destructive"
      });
    }
  };
  const handleExercise = async (optionId: number) => {
    if (!account) return;

    try {
      const optionIdBN = BigInt(1);
      const optionIdUint256 = uint256.bnToUint256(optionIdBN);
      const amountBN = BigInt(parseFloat("0.00000000000001") * 10**18);

    const amountUint256 = uint256.bnToUint256(amountBN);

      const cancelResponse = await account.execute({
        contractAddress: import.meta.env.VITE_VAULT_CONTRACT_ADDRESS,
        entrypoint: "exercise_option",
        calldata: [
          optionIdUint256.low,
          optionIdUint256.high,
          amountUint256.low,
          amountUint256.high
        ]
      });

      await account.waitForTransaction(cancelResponse.transaction_hash);

      // Update option status in database
      const { error } = await supabase
        .from('options')
        .update({
          status: 'exercised',
          tx_hash: cancelResponse.transaction_hash
        })
        .eq('id', optionId);

      if (error) {
        console.error('Error updating option:', error);
        toast({
          title: "Error",
          description: "Failed to update option status",
          variant: "destructive"
        });
      }

      toast({
        title: "Success",
        description: "Option exercised successfully"
      });

    } catch (error) {
      console.error('Error cancelling option:', error);
      toast({
        title: "Error",
        description: "Failed to cancel option",
        variant: "destructive"
      });
    }
  };

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
          .eq('user_id', userData.id)
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


  // console.log(options);
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
                  <TableHead>Actions</TableHead>
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
                      {Number(option.premium).toFixed(2)} STRK
                    </TableCell>
                    <TableCell>
                      {new Date(option.expiry_timestamp).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-mono">
                      ${Number(option.locked_amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
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
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 text-muted-foreground hover:text-primary"
                            onClick={() => window.open(`https://sepolia.starkscan.co/tx/${option.tx_hash}`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View transaction</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {option.status === 'pending' ? (
                        <Button onClick={() => handleBuy(option.id)}>Buy</Button>
                      ) : option.status === 'active' ? (
                        <Button onClick={() => handleExercise(option.id)}>Exercise</Button>
                      ) : null}
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