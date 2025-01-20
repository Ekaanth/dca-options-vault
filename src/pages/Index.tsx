import { VaultStats } from "@/components/VaultStats";
import { VaultManagement } from "@/components/vault/VaultManagement";
import { useAccount } from "@starknet-react/core";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, RefreshCw, AlertCircle, Wallet, ArrowDownRight } from "lucide-react";
import { VaultOverview } from "@/components/vault/VaultOverview";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useStarkPrice } from "@/hooks/useStarkPrice";
import { useState } from "react";

const Index = () => {
  const { address } = useAccount();
  const { price: strkPrice, isLoading: isPriceLoading, priceChange, error, refetch } = useStarkPrice();
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const handleTransactionComplete = () => {
    setUpdateTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen p-6 space-y-6 relative">
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-secondary/10 to-transparent pointer-events-none" />
      
      <header className="mb-8 relative">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-cyan-200 text-transparent bg-clip-text">
              STRK Option Vault DCA
            </h1>
            <p className="text-muted-foreground text-lg">
              Automated covered call strategy with DCA reinvestment for STRK tokens
            </p>
          </div>
          <Card className="bg-[#0A0B1E] border-[#1D1E35] shadow-glow">
            <div className="p-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-muted-foreground">Current STRK Price</p>
                {error && (
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{error}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-2xl font-mono font-bold text-cyan-400">
                    {isPriceLoading ? (
                      "Loading..."
                    ) : (
                      `$${strkPrice > 0 ? strkPrice.toLocaleString(undefined, {maximumFractionDigits: 2}) : "0.00"}`
                    )}
                  </h3>
                  {!isPriceLoading && strkPrice > 0 && (
                    <p className={`text-sm flex items-center font-medium ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}% 
                      {priceChange >= 0 ? <ArrowUpRight className="h-3 w-3 ml-1" /> :  <ArrowDownRight className="h-3 w-3 ml-1" />}
                     
                    </p>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={refetch}
                  className={`text-muted-foreground hover:text-cyan-400 transition-colors ${isPriceLoading ? 'animate-spin' : ''}`}
                  disabled={isPriceLoading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </header>

     {address ?  <VaultStats updateTrigger={updateTrigger} /> : null}

      {address ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <VaultOverview updateTrigger={updateTrigger} />
          </div>
          <div className="lg:col-span-1">
            <VaultManagement onTransactionComplete={handleTransactionComplete} />
          </div>
        </div>
      ) : (
        <Card className="stats-card p-12 text-center max-w-2xl mx-auto">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full"></div>
              <Wallet className="h-16 w-16 text-cyan-400 relative z-10" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-200 text-transparent bg-clip-text">
                Connect Your Wallet
              </h2>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                Connect your Braavos wallet to access the STRK Option Vault and start earning premium through automated covered calls
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-lg mt-4">
              <Card className="p-4 bg-[#0A0B1E] border-[#1D1E35]">
                <div className="text-center">
                  <h3 className="text-cyan-400 font-bold mb-1">Deposit STRK</h3>
                  <p className="text-sm text-muted-foreground">Provide liquidity to the vault</p>
                </div>
              </Card>
              <Card className="p-4 bg-[#0A0B1E] border-[#1D1E35]">
                <div className="text-center">
                  <h3 className="text-cyan-400 font-bold mb-1">Earn Premium</h3>
                  <p className="text-sm text-muted-foreground">Generate yield from options</p>
                </div>
              </Card>
              <Card className="p-4 bg-[#0A0B1E] border-[#1D1E35]">
                <div className="text-center">
                  <h3 className="text-cyan-400 font-bold mb-1">Auto-Compound</h3>
                  <p className="text-sm text-muted-foreground">DCA back into STRK</p>
                </div>
              </Card>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Index;