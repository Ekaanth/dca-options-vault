import { useState } from "react";
import { Contract, RpcProvider, uint256 } from "starknet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSelector } from "react-redux";
import { useAccount } from "@starknet-react/core";

// STRK token contract address on Starknet
const STRK_TOKEN_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

// Initialize provider
const provider = new RpcProvider({
  nodeUrl: `https://starknet-sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY}`,
});

export function VaultDeposit() {
  const { toast } = useToast();
  const { address } = useAccount();
  const [amount, setAmount] = useState<string>("");
  const [isDepositing, setIsDepositing] = useState<boolean>(false);
  const connection = useSelector((state: { connection: { provider: RpcProvider, address: string } }) => state.connection);
  console.log("connection", connection);
  const handleDeposit = async () => {
    console.log('handleDeposit called');

    try {
      setIsDepositing(true);

      // Convert amount to Uint256 format
      const amountBN = BigInt(parseFloat(amount) * 10**18);
      const amountUint256 = uint256.bnToUint256(amountBN);

      // Get contract instance
      const strkTokenABI = await provider.getClassAt(STRK_TOKEN_ADDRESS);
      console.log('strkTokenABI:', strkTokenABI);
      if (!strkTokenABI || !strkTokenABI.abi) {
        throw new Error('Failed to fetch contract ABI');
      }

      const newContract = new Contract(
        strkTokenABI.abi,
        STRK_TOKEN_ADDRESS,
        connection?.provider
      );

      console.log("wallet address", address);
      console.log("contract details", newContract);
      const response = await newContract.approve('0x015f8afd7ccaf2e33cc8b340416f29037ff8d03620f6bd7311939b01a04eec4d', 1);
      console.log(">> response", response);
      
      // Wait for transaction to be accepted
      await provider.waitForTransaction(response.transaction_hash);

      // // Then transfer tokens to the vault
      // const transferResponse = await vaultContract.transfer(
      //   import.meta.env.VITE_VAULT_CONTRACT_ADDRESS,
      //   amountUint256
      // );

      // await provider.waitForTransaction(transferResponse.transaction_hash);

      // Create deposit record in database
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', connection.address)
        .single();

      if (!userData?.id) {
        throw new Error('User not found');
      }

      const { data: deposit, error } = await supabase
        .rpc('create_deposit', {
          p_user_id: userData.id,
          p_amount: amount,
          p_token_address: STRK_TOKEN_ADDRESS,
          // p_tx_hash: transferResponse.transaction_hash
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