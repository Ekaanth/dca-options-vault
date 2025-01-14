import { Card } from "@/components/ui/card";
import { ArrowUpRight, Wallet, Timer, LineChart, DollarSign } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";

export const VaultStats = () => {
  const [currentPrice, setCurrentPrice] = useState(35579.40);
  const [priceChange, setPriceChange] = useState(2.5);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const change = (Math.random() - 0.5) * 100;
      const newPrice = currentPrice + change;
      setCurrentPrice(newPrice);
      setPriceChange(change > 0 ? +(change/currentPrice * 100).toFixed(1) : -(change/currentPrice * 100).toFixed(1));
    }, 5000);

    return () => clearInterval(interval);
  }, [currentPrice]);

  const tvl = 124527.89;
  const lockedInOptions = 87169.52;
  const percentLocked = (lockedInOptions / tvl) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="stats-card p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Value Locked</p>
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
          </div>
          <Wallet className="h-8 w-8 text-primary animate-float" />
        </div>
      </Card>

      <Card className="stats-card p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Current STRK Price</p>
            <h3 className="text-2xl font-mono font-bold mt-2 value-text">
              ${currentPrice.toLocaleString(undefined, {maximumFractionDigits: 2})}
            </h3>
            <p className={`text-sm flex items-center mt-2 font-medium ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange}% 
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </p>
          </div>
          <DollarSign className="h-8 w-8 text-secondary animate-float" />
        </div>
      </Card>

      <Card className="stats-card p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Active STRK Options</p>
            <h3 className="text-2xl font-mono font-bold mt-2 value-text">7</h3>
            <p className="text-sm text-muted-foreground mt-2 font-medium">Next expiry in 3d</p>
          </div>
          <Timer className="h-8 w-8 text-secondary animate-float" />
        </div>
      </Card>

      <Card className="stats-card p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Premium Earned</p>
            <h3 className="text-2xl font-mono font-bold mt-2 value-text">$3,241.65</h3>
            <p className="text-sm text-green-400 flex items-center mt-2 font-medium">
              +5.2% <ArrowUpRight className="h-3 w-3 ml-1" />
            </p>
          </div>
          <LineChart className="h-8 w-8 text-primary animate-float" />
        </div>
      </Card>
    </div>
  );
};