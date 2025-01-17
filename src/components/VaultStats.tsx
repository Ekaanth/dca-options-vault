import { Card } from "@/components/ui/card";
import { ArrowUpRight, Wallet, Timer, LineChart, DollarSign, LockIcon, RefreshCw, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAccount } from "@starknet-react/core";
import { useStarkPrice } from "@/hooks/useStarkPrice";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const VaultStats = () => {
  const { address } = useAccount();
  const { price: currentPrice, priceChange, isLoading, error, refetch } = useStarkPrice();
  
  const tvl = 124527.89;
  const lockedInOptions = 87169.52;
  const percentLocked = (lockedInOptions / tvl) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="stats-card p-6">
        <div className="flex justify-between items-start">
          <div className="w-full">
            <div className="flex justify-between items-center">
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
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={refetch}
                className={isLoading ? 'animate-spin' : ''}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <h3 className="text-2xl font-mono font-bold mt-2 value-text">
              {isLoading ? (
                "Loading..."
              ) : (
                `$${currentPrice > 0 ? currentPrice.toLocaleString(undefined, {maximumFractionDigits: 2}) : "0.00"}`
              )}
            </h3>
            {!isLoading && currentPrice > 0 && (
              <p className={`text-sm flex items-center mt-2 font-medium ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}% 
                <ArrowUpRight className="h-3 w-3 ml-1" />
              </p>
            )}
          </div>
          <DollarSign className="h-8 w-8 text-secondary animate-float" />
        </div>
      </Card>

      <Card className="stats-card p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Value Locked</p>
            {address ? (
              <>
                <h3 className="text-2xl font-mono font-bold mt-2 value-text">${tvl.toLocaleString()}</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">STRK Locked in Options:</span>
                    <span className="text-primary font-semibold">{percentLocked.toFixed(1)}%</span>
                  </div>
                  <Progress value={percentLocked} className="h-2 bg-secondary/20" />
                </div>
                <p className="text-sm text-green-400 flex items-center mt-2 font-medium">
                  +2.5% <ArrowUpRight className="h-3 w-3 ml-1" />
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <LockIcon className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">Connect wallet to view TVL</p>
              </div>
            )}
          </div>
          <Wallet className="h-8 w-8 text-primary animate-float" />
        </div>
      </Card>

      <Card className="stats-card p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Active STRK Options</p>
            {address ? (
              <>
                <h3 className="text-2xl font-mono font-bold mt-2 value-text">7</h3>
                <p className="text-sm text-muted-foreground mt-2 font-medium">Next expiry in 3d</p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <LockIcon className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">Connect wallet to view options</p>
              </div>
            )}
          </div>
          <Timer className="h-8 w-8 text-secondary animate-float" />
        </div>
      </Card>

      <Card className="stats-card p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Premium Earned</p>
            {address ? (
              <>
                <h3 className="text-2xl font-mono font-bold mt-2 value-text">$3,241.65</h3>
                <p className="text-sm text-green-400 flex items-center mt-2 font-medium">
                  +5.2% <ArrowUpRight className="h-3 w-3 ml-1" />
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <LockIcon className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">Connect wallet to view earnings</p>
              </div>
            )}
          </div>
          <LineChart className="h-8 w-8 text-primary animate-float" />
        </div>
      </Card>
    </div>
  );
};