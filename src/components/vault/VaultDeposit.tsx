import { useState, useEffect } from "react";
import { useAccount, useContract, useBalance } from "@starknet-react/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { uint256 } from "starknet";
import { STRK_TOKEN_ABI } from "@/abi/STRKToken.abi";

// Contract addresses
const STRK_TOKEN_ADDRESS = "0x36ca7e3d294a8579a515e6721f93ad0b6c007a11ba3a5e14159bef8f5bfd7f2";
const VAULT_CONTRACT_ADDRESS = import.meta.env.VITE_VAULT_CONTRACT_ADDRESS;

interface VaultDepositProps {
  onTransactionComplete: () => void;
  updateTrigger: number;
}

export function VaultDeposit({ onTransactionComplete, updateTrigger }: VaultDepositProps) {
  const { address, account } = useAccount();
  const { toast } = useToast();
  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);

  const { data: balance, isLoading: isLoadingBalance, refetch: refetchBalance } = useBalance({
    address: address ?? undefined,
    token: STRK_TOKEN_ADDRESS,
  });

  // Refresh balance when updateTrigger changes
  useEffect(() => {
    refetchBalance();
  }, [updateTrigger, refetchBalance]);

  const formattedBalance = balance ? (Number(balance.value) / 1e18).toFixed(6) : "0.000000";

  const { contract: strkToken } = useContract({
    address: STRK_TOKEN_ADDRESS,
    abi: STRK_TOKEN_ABI
  });

  const handleSetMaxDeposit = () => {
    setDepositAmount(formattedBalance);
  };

  const handleDeposit = async () => {
    if (!address || !strkToken || !depositAmount || !account) return;

    try {
      setIsDepositing(true);

      const amountBN = BigInt(parseFloat(depositAmount) * 10**18);
      const amountUint256 = uint256.bnToUint256(amountBN);

      // Approve vault to spend tokens
      const approveResponse = await account.execute({
        contractAddress: STRK_TOKEN_ADDRESS,
        entrypoint: "approve",
        calldata: [VAULT_CONTRACT_ADDRESS, amountUint256.low, amountUint256.high]
      });
      await account.waitForTransaction(approveResponse.transaction_hash);

      // Transfer tokens to vault
      const transferResponse = await account.execute({
        contractAddress: STRK_TOKEN_ADDRESS,
        entrypoint: "transfer",
        calldata: [VAULT_CONTRACT_ADDRESS, amountUint256.low, amountUint256.high]
      });
      await account.waitForTransaction(transferResponse.transaction_hash);

      // Update database
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', address)
        .single();

      if (!userData?.id) throw new Error('User not found');

      await supabase.rpc('create_deposit', {
        p_user_id: userData.id,
        p_amount: depositAmount,
        p_token_address: STRK_TOKEN_ADDRESS,
        p_tx_hash: transferResponse.transaction_hash
      });

      toast({
        title: "Deposit Successful",
        description: `Deposited ${depositAmount} STRK into vault`,
      });
      setDepositAmount("");
      onTransactionComplete(); // Notify parent of transaction completion
    } catch (error) {
      console.error('Deposit error:', error);
      toast({
        title: "Deposit Failed",
        description: error instanceof Error ? error.message : "Failed to deposit STRK",
        variant: "destructive",
      });
    } finally {
      setIsDepositing(false);
    }
  };

  if (!address) return null;

  return (
    <TabsContent value="deposit" className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">Amount to deposit</label>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSetMaxDeposit}
              disabled={isLoadingBalance}
            >
              Max: {isLoadingBalance ? "Loading..." : `${formattedBalance} STRK`}
            </Button>
          </div>
          <Input
            type="number"
            placeholder="Amount to deposit"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            min="0"
            max={formattedBalance}
            step="0.000001"
          />
        </div>
        <Button
          className="w-full"
          onClick={handleDeposit}
          disabled={isDepositing || !depositAmount || Number(depositAmount) > Number(formattedBalance)}
        >
          {isDepositing ? "Depositing..." : "Deposit STRK"}
        </Button>
      </div>
    </TabsContent>
  );
} 