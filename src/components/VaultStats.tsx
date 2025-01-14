import { Card } from "@/components/ui/card";
import { ArrowUpRight, Wallet, Timer, LineChart } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const VaultStats = () => {
  // Calculate percentage of TVL locked in options (this would come from your contract)
  const tvl = 124527.89;
  const lockedInOptions = 87169.52; // ~70% locked
  const percentLocked = (lockedInOptions / tvl) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="p-6 gradient-border">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground">Total Value Locked</p>
            <h3 className="text-2xl font-mono font-semibold mt-2">${tvl.toLocaleString()}</h3>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Locked in Options:</span>
                <span className="text-primary">{percentLocked.toFixed(1)}%</span>
              </div>
              <Progress value={percentLocked} className="h-2" />
            </div>
            <p className="text-sm text-green-400 flex items-center mt-2">
              +2.5% <ArrowUpRight className="h-3 w-3 ml-1" />
            </p>
          </div>
          <Wallet className="h-8 w-8 text-primary animate-float" />
        </div>
      </Card>

      <Card className="p-6 gradient-border">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground">Active Options</p>
            <h3 className="text-2xl font-mono font-semibold mt-2">7</h3>
            <p className="text-sm text-muted-foreground mt-2">Next expiry in 3d</p>
          </div>
          <Timer className="h-8 w-8 text-secondary animate-float" />
        </div>
      </Card>

      <Card className="p-6 gradient-border">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground">Total Premium Earned</p>
            <h3 className="text-2xl font-mono font-semibold mt-2">$3,241.65</h3>
            <p className="text-sm text-green-400 flex items-center mt-2">
              +5.2% <ArrowUpRight className="h-3 w-3 ml-1" />
            </p>
          </div>
          <LineChart className="h-8 w-8 text-primary animate-float" />
        </div>
      </Card>

      <Card className="p-6 gradient-border">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground">DCA Amount</p>
            <h3 className="text-2xl font-mono font-semibold mt-2">$450.00</h3>
            <p className="text-sm text-muted-foreground mt-2">Weekly average</p>
          </div>
          <Timer className="h-8 w-8 text-secondary animate-float" />
        </div>
      </Card>
    </div>
  );
};