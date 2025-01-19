import { useState, useEffect } from "react";
import { useAccount, useContract, useBalance } from "@starknet-react/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { uint256 } from "starknet";
import { STRK_TOKEN_ABI } from "@/abi/STRKToken.abi";
import { VAULT_CONTRACT_ABI } from "@/abi/VaultContract.abi";

// STRK token contract address on Starknet
const STRK_TOKEN_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
const VAULT_CONTRACT_ADDRESS = import.meta.env.VITE_VAULT_CONTRACT_ADDRESS;

export function VaultManagement() {
  const { address, account } = useAccount();
  const { toast } = useToast();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [maxWithdraw, setMaxWithdraw] = useState<string>("0");
  const [isLoadingMax, setIsLoadingMax] = useState(true);

  // Use useBalance hook to get STRK balance
  const { data: balance, isLoading: isLoadingBalance } = useBalance({
    address: address ?? undefined,
    token: STRK_TOKEN_ADDRESS,
  });

  // Format the balance for display
  const formattedBalance = balance ? (Number(balance.value) / 1e18).toFixed(6) : "0.000000";

  const { contract: strkToken } = useContract({
    address: STRK_TOKEN_ADDRESS,
    abi: STRK_TOKEN_ABI
  });

  const { contract: vaultContract } = useContract({
    address: VAULT_CONTRACT_ADDRESS,
    abi: VAULT_CONTRACT_ABI
  });
  // Fetch max withdraw amount (sum of confirmed deposits)
  useEffect(() => {
    const fetchMaxWithdraw = async () => {
      if (!address) return;

      try {
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
    };

    fetchMaxWithdraw();
  }, [address]);

  const handleSetMaxDeposit = () => {
    setDepositAmount(formattedBalance);
  };

  const handleSetMaxWithdraw = () => {
    setWithdrawAmount(maxWithdraw);
  };

  const handleDeposit = async () => {
    if (!address || !strkToken || !depositAmount || !account) return;

    try {
      setIsDepositing(true);

      // Convert amount to Uint256 format
      const amountBN = BigInt(parseFloat(depositAmount) * 10**18);
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
          p_amount: depositAmount,
          p_token_address: STRK_TOKEN_ADDRESS,
          p_tx_hash: transferResponse.transaction_hash
        });

      if (error) throw error;

      toast({
        title: "Deposit Successful",
        description: `Deposited ${depositAmount} STRK into vault`,
      });

      // Clear input
      setDepositAmount("");
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

  const handleWithdraw = async () => {
    if (!address || !withdrawAmount || !account || !vaultContract) return;

    try {
      setIsWithdrawing(true);

      // Convert amount to Uint256 format
      const amountBN = BigInt(parseFloat(withdrawAmount) * 10**18);
      const amountUint256 = uint256.bnToUint256(amountBN);

      // Call withdraw_tokens function on the vault contract
      const withdrawResponse = await account.execute({
        contractAddress: import.meta.env.VITE_VAULT_CONTRACT_ADDRESS,
        entrypoint: "withdraw",
        calldata: [
          STRK_TOKEN_ADDRESS, // token address
          amountUint256.low,  // amount low
          amountUint256.high  // amount high
        ]
      });

      // Wait for transaction to be accepted
      await account.waitForTransaction(withdrawResponse.transaction_hash);

      // Create withdrawal record in database
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', address)
        .single();

      if (!userData?.id) {
        throw new Error('User not found');
      }

      // Create withdrawal record using the same RPC as deposits
      const { data: deposit, error } = await supabase
        .rpc('create_deposit', {
          p_user_id: userData.id,
          p_amount: withdrawAmount,
          p_token_address: STRK_TOKEN_ADDRESS,
          p_tx_hash: withdrawResponse.transaction_hash,
          p_type: 'withdraw'  // Specify this is a withdrawal
        });

      if (error) throw error;

      toast({
        title: "Withdrawal Successful",
        description: `Withdrawn ${withdrawAmount} STRK from vault`,
      });

      // Clear input
      setWithdrawAmount("");
      
      // Refresh the max withdraw amount
      const { data: deposits, error: fetchError } = await supabase
        .from('deposits')
        .select('amount')
        .eq('user_id', userData.id)
        .eq('status', 'deposit');

      if (!fetchError && deposits) {
        const total = deposits.reduce((sum, deposit) => sum + Number(deposit.amount), 0) || 0;
        setMaxWithdraw(total.toString());
      }

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
        </Tabs>
      </CardContent>
    </Card>
  );
}