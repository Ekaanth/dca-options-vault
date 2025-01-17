import { useState } from "react";
import { useAccount, useContract } from "@starknet-react/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { uint256 } from "starknet";
import { STRK_TOKEN_ABI } from "@/abi/STRKToken.abi";

// STRK token contract address on Starknet
const STRK_TOKEN_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

export function VaultDeposit() {
  const { address, account } = useAccount();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);

  const { contract: strkToken } = useContract({
    address: STRK_TOKEN_ADDRESS,
    abi: STRK_TOKEN_ABI
  });

  const handleDeposit = async () => {
    if (!address || !strkToken || !amount || !account) return;

    try {
      setIsDepositing(true);

      // Convert amount to Uint256 format
      const amountBN = BigInt(parseFloat(amount) * 10**18);
      const amountUint256 = uint256.bnToUint256(amountBN);

      // First, approve the vault contract to spend tokens
      const approveResponse = await account.execute({
        contractAddress: STRK_TOKEN_ADDRESS,
        entrypoint: "approve",
        calldata: [
          import.meta.env.VITE_VAULT_CONTRACT_ADDRESS,
          amountUint256.low,
          amountUint256.high
        ]
      });

      // Wait for transaction to be accepted
      const tx = await account.waitForTransaction(approveResponse.transaction_hash);
      console.log(tx)

      // Then transfer tokens to the vault
      const transferResponse = await account.execute({
        contractAddress: STRK_TOKEN_ADDRESS,
        entrypoint: "transfer",
        calldata: [
          import.meta.env.VITE_VAULT_CONTRACT_ADDRESS,
          amountUint256.low,
          amountUint256.high
        ]
      });

      const tx2 = await account.waitForTransaction(transferResponse.transaction_hash);
      console.log(tx2)
      // Create deposit record in database
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', address)
        .single();

      if (!userData?.id) {
        throw new Error('User not found');
      }

      const { data: deposit, error } = await supabase
        .rpc('create_deposit', {
          p_user_id: userData.id,
          p_amount: amount,
          p_token_address: STRK_TOKEN_ADDRESS,
          p_tx_hash: transferResponse.transaction_hash
        });

      if (error) throw error;

      toast({
        title: "Deposit Successful",
        description: `Deposited ${amount} STRK into vault`,
      });

      // Clear input
      setAmount("");
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

  if (!address) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit STRK</CardTitle>
        <CardDescription>
          Deposit STRK tokens to start earning yield through covered calls
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              type="number"
              placeholder="Amount to deposit"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.000001"
            />
          </div>
          <Button
            className="w-full"
            onClick={handleDeposit}
            disabled={isDepositing || !amount}
          >
            {isDepositing ? "Depositing..." : "Deposit STRK"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}