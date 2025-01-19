import { useState, useEffect, useCallback } from "react";
import { useAccount, useContract } from "@starknet-react/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { uint256 } from "starknet";
import { VAULT_CONTRACT_ABI } from "@/abi/VaultContract.abi";

// Contract addresses
const STRK_TOKEN_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
const VAULT_CONTRACT_ADDRESS = import.meta.env.VITE_VAULT_CONTRACT_ADDRESS;

interface VaultWithdrawProps {
  onTransactionComplete: () => void;
  updateTrigger: number;
}

export function VaultWithdraw({ onTransactionComplete, updateTrigger }: VaultWithdrawProps) {
  const { address, account } = useAccount();
  const { toast } = useToast();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [maxWithdraw, setMaxWithdraw] = useState<string>("0");
  const [isLoadingMax, setIsLoadingMax] = useState(true);

  const { contract: vaultContract } = useContract({
    address: VAULT_CONTRACT_ADDRESS,
    abi: VAULT_CONTRACT_ABI
  });

  // Fetch max withdraw amount
  const fetchMaxWithdraw = useCallback(async () => {
    if (!address) return;

    try {
      setIsLoadingMax(true);
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', address)
        .single();

      if (!userData?.id) return;

      const { data: deposits, error } = await supabase
        .from('deposits')
        .select('amount')
        .eq('user_id', userData.id)
        .eq('status', 'deposit');

      if (error) throw error;

      const total = deposits?.reduce((sum, deposit) => sum + Number(deposit.amount), 0) || 0;
      setMaxWithdraw(total.toString());
    } catch (error) {
      console.error('Error fetching max withdraw:', error);
    } finally {
      setIsLoadingMax(false);
    }
  }, [address]);

  // Fetch max withdraw amount on mount and when updateTrigger changes
  useEffect(() => {
    fetchMaxWithdraw();
  }, [address, fetchMaxWithdraw, updateTrigger]);

  const handleSetMaxWithdraw = () => {
    setWithdrawAmount(maxWithdraw);
  };

  const handleWithdraw = async () => {
    if (!address || !withdrawAmount || !account || !vaultContract) return;

    try {
      setIsWithdrawing(true);

      const amountBN = BigInt(parseFloat(withdrawAmount) * 10**18);
      const amountUint256 = uint256.bnToUint256(amountBN);

      // Execute withdrawal
      const withdrawResponse = await account.execute({
        contractAddress: VAULT_CONTRACT_ADDRESS,
        entrypoint: "withdraw",
        calldata: [amountUint256.low, amountUint256.high]
      });
      await account.waitForTransaction(withdrawResponse.transaction_hash);

      // Update database
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', address)
        .single();

      if (!userData?.id) throw new Error('User not found');

      await supabase.rpc('create_deposit', {
        p_user_id: userData.id,
        p_amount: withdrawAmount,
        p_token_address: STRK_TOKEN_ADDRESS,
        p_tx_hash: withdrawResponse.transaction_hash,
        p_type: 'withdraw'
      });

      toast({
        title: "Withdrawal Successful",
        description: `Withdrawn ${withdrawAmount} STRK from vault`,
      });
      setWithdrawAmount("");
      onTransactionComplete(); // Notify parent of transaction completion

      // Refresh max withdraw amount
      await fetchMaxWithdraw();
    } catch (error) {
      console.error('Withdraw error:', error);
      toast({
        title: "Withdraw Failed",
        description: error instanceof Error ? error.message : "Failed to withdraw STRK",
        variant: "destructive",
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!address) return null;

  return (
    <TabsContent value="withdraw" className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">Amount to withdraw</label>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSetMaxWithdraw}
              disabled={isLoadingMax}
            >
              Max: {isLoadingMax ? "Loading..." : `${Number(maxWithdraw).toFixed(6)} STRK`}
            </Button>
          </div>
          <Input
            type="number"
            placeholder="Amount to withdraw"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            min="0"
            max={maxWithdraw}
            step="0.000001"
          />
        </div>
        <Button
          className="w-full"
          onClick={handleWithdraw}
          disabled={isWithdrawing || !withdrawAmount || Number(withdrawAmount) > Number(maxWithdraw)}
        >
          {isWithdrawing ? "Withdrawing..." : "Withdraw STRK"}
        </Button>
      </div>
    </TabsContent>
  );
} 