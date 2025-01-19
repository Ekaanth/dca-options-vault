import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VaultDeposit } from "./VaultDeposit";
import { VaultWithdraw } from "./VaultWithdraw";
import { useAccount } from "@starknet-react/core";
import { useState } from "react";

export function VaultManagement() {
  const { address } = useAccount();
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Function to trigger updates in child components
  const handleTransactionComplete = () => {
    setUpdateTrigger(prev => prev + 1);
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
      </CardContent>
    </Card>
  );
} 