import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";

interface Option {
  id: number;
  strike: string;
  premium: string;
  expiry: string;
  status: "Active" | "Pending" | "Expired" | "Exercised";
  createdAt: Date;
  lockedAmount: number; // Amount of TVL locked by this option
  tokenAmount: number; // Amount in tokens
  tokenPrice: number; // Current price of token
}

interface VaultBalance {
  tvl: number;
  tokenBalance: number;
  tokenPrice: number;
}

const initialVaultBalance = {
  tvl: 124527.89,
  tokenBalance: 3.5, // Example: 3.5 ETH
  tokenPrice: 35579.40, // Example: Current ETH price
};

const MAX_OPTIONS_PERCENTAGE = 80;

const initialOptions = [
  {
    id: 1,
    strike: "35,000",
    premium: "0.05",
    expiry: "2024-03-21",
    status: "Active",
    createdAt: new Date(),
    lockedAmount: 25000,
    tokenAmount: 0.7, // 0.7 ETH
    tokenPrice: 35714.29, // Strike price in USD
  },
  {
    id: 2,
    strike: "36,000",
    premium: "0.04",
    expiry: "2024-03-28",
    status: "Active",
    createdAt: new Date(),
    lockedAmount: 30000,
    tokenAmount: 0.83, // ~0.83 ETH
    tokenPrice: 36144.58,
  },
  {
    id: 3,
    strike: "37,000",
    premium: "0.03",
    expiry: "2024-04-04",
    status: "Pending",
    createdAt: new Date(),
    lockedAmount: 32169.52,
    tokenAmount: 0.87, // ~0.87 ETH
    tokenPrice: 36977.61,
  },
] as Option[];

export const ActiveOptions = () => {
  const [options, setOptions] = useState<Option[]>(initialOptions);
  const [vaultBalance, setVaultBalance] = useState<VaultBalance>(initialVaultBalance);
  const { toast } = useToast();

  // Calculate total locked value
  const totalLockedValue = options.reduce((acc, option) => 
    option.status === "Active" ? acc + option.lockedAmount : acc, 0
  );
  const percentageLocked = (totalLockedValue / vaultBalance.tvl) * 100;

  // Handle option exercise
  const handleOptionExercise = (option: Option) => {
    // Update vault balance
    setVaultBalance(prev => ({
      ...prev,
      tvl: prev.tvl - option.lockedAmount + (parseFloat(option.strike.replace(',', '')) * option.tokenAmount),
      tokenBalance: prev.tokenBalance - option.tokenAmount,
    }));

    // Update option status
    setOptions(prev =>
      prev.map(opt =>
        opt.id === option.id
          ? { ...opt, status: "Exercised" }
          : opt
      )
    );

    // Notify user
    toast({
      title: "Option Exercised",
      description: `${option.tokenAmount} ETH sold at $${option.strike} strike price`,
    });
  };

  // Simulate real-time option creation
  useEffect(() => {
    const interval = setInterval(() => {
      if (percentageLocked < MAX_OPTIONS_PERCENTAGE) {
        const newTokenAmount = Math.random() * 0.5 + 0.3; // Between 0.3 and 0.8 ETH
        const newStrikePrice = Math.floor(35000 + Math.random() * 5000);
        const newLockedAmount = newTokenAmount * newStrikePrice;
        const newTotalLocked = totalLockedValue + newLockedAmount;
        
        if ((newTotalLocked / vaultBalance.tvl) * 100 <= MAX_OPTIONS_PERCENTAGE) {
          const newOption: Option = {
            id: options.length + 1,
            strike: newStrikePrice.toLocaleString(),
            premium: (0.02 + Math.random() * 0.04).toFixed(2),
            expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: "Pending",
            createdAt: new Date(),
            lockedAmount: newLockedAmount,
            tokenAmount: newTokenAmount,
            tokenPrice: newStrikePrice,
          };

          setOptions(prev => {
            const updated = [...prev, newOption];
            return updated.slice(-5);
          });

          toast({
            title: "New Option Created",
            description: `${newOption.tokenAmount.toFixed(2)} ETH | Strike: $${newOption.strike} | Premium: ${newOption.premium} ETH`,
          });
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [options, totalLockedValue, vaultBalance.tvl]);

  // Simulate option status changes
  useEffect(() => {
    const statusInterval = setInterval(() => {
      setOptions(prev =>
        prev.map(option => {
          if (option.status === "Pending" && Math.random() > 0.5) {
            return { ...option, status: "Active" };
          }
          // Randomly exercise some active options
          if (option.status === "Active" && Math.random() > 0.9) {
            handleOptionExercise(option);
          }
          return option;
        })
      );
    }, 5000);

    return () => clearInterval(statusInterval);
  }, []);

  return (
    <Card className="p-6 gradient-border">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Active Options</h2>
          <div className="text-sm text-muted-foreground">
            {percentageLocked.toFixed(1)}% TVL Locked
          </div>
        </div>
        
        <div className="w-full">
          <Progress value={percentageLocked} className="h-2" />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Strike Price</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Token Amount</TableHead>
                <TableHead>Locked Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {options.map((option) => (
                <TableRow key={option.id}>
                  <TableCell className="font-mono">${option.strike}</TableCell>
                  <TableCell className="font-mono">{option.premium} ETH</TableCell>
                  <TableCell>{option.expiry}</TableCell>
                  <TableCell className="font-mono">{option.tokenAmount.toFixed(2)} ETH</TableCell>
                  <TableCell className="font-mono">${option.lockedAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        option.status === "Active"
                          ? "bg-green-500/20 text-green-500"
                          : option.status === "Exercised"
                          ? "bg-blue-500/20 text-blue-500"
                          : "bg-yellow-500/20 text-yellow-500"
                      }`}
                    >
                      {option.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
};