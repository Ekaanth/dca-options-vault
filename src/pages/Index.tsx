import { VaultStats } from "@/components/VaultStats";
import { VaultDeposit } from "@/components/VaultDeposit";
import { ActiveOptions } from "@/components/ActiveOptions";
import { useAccount } from "@starknet-react/core";
import { Card } from "@/components/ui/card";
import { LockIcon } from "lucide-react";

const Index = () => {
  const { address } = useAccount();

  return (
    <div className="min-h-screen p-6 space-y-6 relative">
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-secondary/10 to-transparent pointer-events-none" />
      
      <header className="mb-8 relative">
        <h1 className="text-4xl font-bold mb-2 value-text">STRK Option Vault DCA</h1>
        <p className="text-muted-foreground">
          Automated covered call strategy with DCA reinvestment for STRK tokens
        </p>
      </header>

      <VaultStats />

      {address ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ActiveOptions />
          </div>
          <div>
            <VaultDeposit />
          </div>
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <LockIcon className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-muted-foreground">
                Connect your Braavos wallet to view active options and start depositing assets
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Index;