import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VaultDeposit } from "./VaultDeposit";
import { VaultWithdraw } from "./VaultWithdraw";
import { useAccount } from "@starknet-react/core";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { uint256 } from "starknet";
import { useStarkPrice } from "@/hooks/useStarkPrice";

interface VaultManagementProps {
  onTransactionComplete: () => void;
}

export function VaultManagement({ onTransactionComplete }: VaultManagementProps) {
  const { address, account } = useAccount();
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const { price } = useStarkPrice();
  const { toast } = useToast();
  const [isCreatingOption, setIsCreatingOption] = useState(false);

  // Function to trigger updates in child components
  const handleTransactionComplete = () => {
    onTransactionComplete();
  };

  const handleCreateOptions = async () => {
    if (!address || !account) return;

    try {
      setIsCreatingOption(true);   
      const strikePrice = (price + price * 2/100);
      // Convert strike price and amount to Uint256 format
      const strikePriceBN = BigInt(strikePrice * 10**18); 
      const amountBN = BigInt(5 * 10**18);
      const strikePriceUint256 = uint256.bnToUint256(strikePriceBN);
      const amountUint256 = uint256.bnToUint256(amountBN);

      // Get current block number and add 10 blocks for expiry
      const currentBlock = await account.getBlock('latest');
      const expiryBlock = currentBlock.block_number + 10;

      // Call create_option function on the vault contract
      const createOptionResponse = await account.execute({
        contractAddress: import.meta.env.VITE_VAULT_CONTRACT_ADDRESS,
        entrypoint: "create_option",
        calldata: [
          strikePriceUint256.low,
          strikePriceUint256.high,
          expiryBlock.toString(),
          amountUint256.low,
          amountUint256.high
        ]
      });

      await account.waitForTransaction(createOptionResponse.transaction_hash);

      // Database operations
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', address)
        .single();

      if (!userData?.id) throw new Error('User not found');

      const { data: vaultData } = await supabase
        .from('vaults')
        .select('id')
        .eq('user_id', userData.id)
        .single();

      if (!vaultData?.id) throw new Error('Vault not found');

      // Create option record in database
      await supabase
        .from('options')
        .insert({
          user_id: userData.id,
          vault_id: vaultData.id,
          option_type: 'call',
          strike_price: (strikePrice).toFixed(2),
          locked_amount: (5).toFixed(2),
          expiry_timestamp: new Date(Date.now() + (5 * 60 * 1000)),
          premium: (2).toFixed(2),
          status: 'pending',
          tx_hash: createOptionResponse.transaction_hash,
        });

      toast({
        title: "Option Created Successfully",
        description: `Created option with strike price 1 STRK`,
      });
      
      onTransactionComplete();
    } catch (error) {
      console.error('Create option error:', error);
      toast({
        title: "Option Creation Failed", 
        description: error instanceof Error ? error.message : "Failed to create option",
        variant: "destructive",
      });
    } finally {
      setIsCreatingOption(false);
    }
  };

  if (!address) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vault Management</CardTitle>
        <CardDescription>
          Manage your STRK token deposits and withdrawals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>
          <VaultDeposit onTransactionComplete={handleTransactionComplete} updateTrigger={updateTrigger} />
          <VaultWithdraw onTransactionComplete={handleTransactionComplete} updateTrigger={updateTrigger} />
        </Tabs>

        <div className="mt-6">
          <Button 
            className="w-full" 
            onClick={handleCreateOptions}
            disabled={isCreatingOption}
          >
            {isCreatingOption ? "Creating Option..." : "Create Option"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 