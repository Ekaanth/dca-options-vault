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
const STRK_TOKEN_ADDRESS = "0x36ca7e3d294a8579a515e6721f93ad0b6c007a11ba3a5e14159bef8f5bfd7f2";
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
  const [optionId, setOptionId] = useState("");
  const [isExercising, setIsExercising] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Use useBalance hook to get STRK balance
  const { data: balance, isLoading: isLoadingBalance } = useBalance({
    address: address ?? undefined,
    token: STRK_TOKEN_ADDRESS,
  });

  console.log("balance", balance);
  

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
          amountUint256.low        ]
      });

      // Wait for transaction to be accepted
      const tx = await account.waitForTransaction(approveResponse.transaction_hash);
      console.log(tx)

      // Then transfer tokens to the vault
      const transferResponse = await account.execute({
        contractAddress: import.meta.env.VITE_VAULT_CONTRACT_ADDRESS,
        entrypoint: "deposit",
        calldata: [
         
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

      // Call withdraw_tokens function on the vault contract
      const withdrawResponse = await account.execute({
        contractAddress: import.meta.env.VITE_VAULT_CONTRACT_ADDRESS,
        entrypoint: "withdraw",
        calldata: [
          withdrawAmount.toString() ,"0"
        ]
      });

      // Wait for transaction to be accepted
      await account.waitForTransaction(withdrawResponse.transaction_hash);

      // Get user and vault data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', address)
        .single();

      if (userError || !userData?.id) {
        throw new Error('User not found');
      }

      const { data: vaultData, error: vaultError } = await supabase
        .from('vaults')
        .select('id')
        .eq('user_id', userData.id)
        .single();

      if (vaultError || !vaultData?.id) {
        throw new Error('Vault not found');
      }

      // Create withdrawal record
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: userData.id,
          vault_id: vaultData.id,
          amount: withdrawAmount,
          token_address: STRK_TOKEN_ADDRESS,
          tx_hash: withdrawResponse.transaction_hash,
          status: 'withdraw'
        })
        .select()
        .single();

      if (withdrawalError) throw withdrawalError;

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
  const handleCreateOptions = async () => {
    if (!address || !account || !vaultContract) return;

    try {
      setIsWithdrawing(true);

      // Convert strike price and amount to Uint256 format
      const strikePriceBN = BigInt(1 * 10**18); 
      const amountBN = BigInt(0.00000001 * 10**18);
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
       "1"
        ]
      });

      console.log("createOptionResponse", createOptionResponse);
      
      // Wait for transaction and get receipt with return data
      const receipt = await account.waitForTransaction(createOptionResponse.transaction_hash);
      console.log("Transaction receipt:", receipt);

      // Get the option ID from the return data
      // const optionId = receipt.events?.[0]?.data?.[0] || '0';
      // console.log("Created option ID:", optionId);

      // Database operations with option ID...
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', address)
        .single();

      if (userError || !userData?.id) {
        throw new Error('User not found');
      }

      const { data: vaultData, error: vaultError } = await supabase
        .from('vaults')
        .select('id')
        .eq('user_id', userData.id)
        .single();

      if (vaultError || !vaultData?.id) {
        throw new Error('Vault not found');
      }

      // Create option record in database with option ID
      const { error: optionError } = await supabase
        .from('options')
        .insert({
          vault_id: vaultData.id,
          option_type: 'call',
          strike_price: (0.1).toFixed(18),
          expiry_timestamp: new Date(Date.now() + (5 * 60 * 1000)),
          premium: (10).toFixed(18),
          status: 'active',
          tx_hash: createOptionResponse.transaction_hash,
        });

      if (optionError) throw optionError;

      toast({
        title: "Option Created Successfully",
        description: `Created option  with strike price 1 STRK`,
      });

    } catch (error) {
      console.error('Create option error:', error);
      toast({
        title: "Option Creation Failed", 
        description: error instanceof Error ? error.message : "Failed to create option",
        variant: "destructive",
      });
    } finally {
      setIsWithdrawing(false);
    }
  };


  // Add this function in VaultManagement component
const handleExerciseOption = async () => {
  if (!address || !account || !vaultContract) return;

  try {
    setIsExercising(true);
    // Convert amount to Uint256 format
    const amountBN = BigInt(parseFloat("0.01") * 10**18);
    const amountUint256 = uint256.bnToUint256(amountBN);
    const optionIdUint256 = uint256.bnToUint256(BigInt(optionId));

    const exerciseResponse = await account.execute({
      contractAddress: VAULT_CONTRACT_ADDRESS,
      entrypoint: "exercise_option",
      calldata: [
        optionIdUint256.low,
        optionIdUint256.high,
        amountUint256.low,
        amountUint256.high
      ]
    });

    await account.waitForTransaction(exerciseResponse.transaction_hash);

    // Update option status in database
    const { error: updateError } = await supabase
      .from('options')
      .update({ 
        status: 'exercised',
        tx_hash: exerciseResponse.transaction_hash 
      })
      .eq('id', optionId);

    if (updateError) throw updateError;

    toast({
      title: "Option Exercised Successfully",
      description: `Exercised option #${optionId}`,
    });

  } catch (error) {
    console.error('Exercise option error:', error);
    toast({
      title: "Exercise Failed",
      description: error instanceof Error ? error.message : "Failed to exercise option",
      variant: "destructive",
    });
  } finally {
    setIsExercising(false);
  }
};

const handleCancelOption = async () => {
  if (!address || !account || !vaultContract) return;

  try {
    setIsCancelling(true);
    const optionIdUint256 = uint256.bnToUint256(BigInt(optionId));

    const cancelResponse = await account.execute({
      contractAddress: VAULT_CONTRACT_ADDRESS,
      entrypoint: "cancel_option",
      calldata: [
        optionIdUint256.low,
        optionIdUint256.high
      ]
    });

    await account.waitForTransaction(cancelResponse.transaction_hash);

    // Update option status in database
    const { error: updateError } = await supabase
      .from('options')
      .update({ 
        status: 'expired',
        tx_hash: cancelResponse.transaction_hash 
      })
      .eq('id', optionId);

    if (updateError) throw updateError;

    toast({
      title: "Option Cancelled Successfully",
      description: `Cancelled option #${optionId}`,
    });

  } catch (error) {
    console.error('Cancel option error:', error);
    toast({
      title: "Cancel Failed",
      description: error instanceof Error ? error.message : "Failed to cancel option",
      variant: "destructive",
    });
  } finally {
    setIsCancelling(false);
  }
};

  if (!address) {
    return null;
  }

  return (
    <>
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
                // disabled={isDepositing || !depositAmount || Number(depositAmount) > Number(formattedBalance)}
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


      <div className="mt-9">

      <button onClick={handleCreateOptions} className="w-full bg-blue-500 text-white p-2 rounded-md">
          Create Options
        </button>
      </div>
      </CardContent>

    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Options Management</CardTitle>
        <CardDescription>
          Manage your options
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-muted-foreground">Option ID</label>
                </div>
                <Input
                  type="number"
                  placeholder="Option ID"
                  value={optionId}
                  onChange={(e) => setOptionId(e.target.value)}
                  min="1"
                  // max={formattedBalance}
                  step="1"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleExerciseOption}
                // disabled={isDepositing || !depositAmount || Number(depositAmount) > Number(formattedBalance)}
              >
                {isExercising ? "Exercising..." : "Exercise Option"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="expired" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-muted-foreground">Option ID</label>
                </div>
                <Input
                  type="number"
                  placeholder="Option ID"
                  value={optionId}
                  onChange={(e) => setOptionId(e.target.value)}
                  min="0"
                  // max={maxWithdraw}
                  step="1"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCancelOption}
                // disabled={isWithdrawing || !withdrawAmount || Number(withdrawAmount) > Number(maxWithdraw)}
              >
                {isCancelling ? "Cancelling..." : "Cancel Option"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>


      <div className="mt-9">

      <button onClick={handleCreateOptions} className="w-full bg-blue-500 text-white p-2 rounded-md">
          Create Options
        </button>
      </div>
      </CardContent>

    </Card>

    </>
  );
}
