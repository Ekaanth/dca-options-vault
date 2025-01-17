import { useState } from "react";
import { useAccount, useContract } from "@starknet-react/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { uint256, RpcProvider } from "starknet";
import type { Abi } from "starknet";

// STRK token contract address on Starknet
const STRK_TOKEN_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

// ERC20 ABI for approve and transfer
const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    inputs: [
      { name: "spender", type: "felt252" },
      { name: "amount", type: "Uint256" }
    ],
    outputs: [{ name: "success", type: "felt252" }],
    state_mutability: "external"
  },
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "recipient", type: "felt252" },
      { name: "amount", type: "Uint256" }
    ],
    outputs: [{ name: "success", type: "felt252" }],
    state_mutability: "external"
  }
] as const satisfies Abi;

// Initialize provider
const provider = new RpcProvider({
  nodeUrl: `https://starknet-sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY}`,
});

export function VaultDeposit() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);

  const { contract: strkToken } = useContract({
    address: STRK_TOKEN_ADDRESS,
    abi: ERC20_ABI
  });

  const handleDeposit = async () => {
    if (!address || !strkToken || !amount) return;

    try {
      setIsDepositing(true);

      // Convert amount to Uint256 format
      const amountBN = BigInt(parseFloat(amount) * 10**18);
      const amountUint256 = uint256.bnToUint256(amountBN);

      // First, approve the vault contract to spend tokens
      const approveResponse = await strkToken.invoke("approve", [
        import.meta.env.VITE_VAULT_CONTRACT_ADDRESS,
        amountUint256
      ]);

      // Wait for transaction to be accepted
      await provider.waitForTransaction(approveResponse.transaction_hash);

      // Then transfer tokens to the vault
      const transferResponse = await strkToken.invoke("transfer", [
        import.meta.env.VITE_VAULT_CONTRACT_ADDRESS,
        amountUint256
      ]);

      await provider.waitForTransaction(transferResponse.transaction_hash);

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