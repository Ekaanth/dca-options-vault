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

// STRK token contract address on Starknet
const STRK_TOKEN_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

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

  // Fetch max withdraw amount (sum of pending deposits)
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
          .eq('status', 'pending');

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
    if (!address || !depositAmount || !account) return;

    try {
      setIsDepositing(true);
      // ... rest of deposit logic ...
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
    if (!address || !withdrawAmount || !account) return;

    try {
      setIsWithdrawing(true);
      // ... rest of withdraw logic ...
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