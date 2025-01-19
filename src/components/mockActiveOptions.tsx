import { Card } from "@/components/ui/card";
import { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface Option {
  id: number;
  strike: string;
  premium: string;
  expiry: string;
  status: "Active" | "Pending" | "Exercised" | "Expired";
  createdAt: Date;
  lockedAmount: number;
  tokenAmount: number;
  tokenPrice: number;
}

interface VaultBalance {
  tvl: number;
  tokenBalance: number;
  tokenPrice: number;
}

const initialVaultBalance = {
  tvl: 124527.89,
  tokenBalance: 3.5,
  tokenPrice: 35579.40,
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
    tokenAmount: 0.7,
    tokenPrice: 35714.29,
  },
  {
    id: 2,
    strike: "36,000",
    premium: "0.04",
    expiry: "2024-03-28",
    status: "Active",
    createdAt: new Date(),
    lockedAmount: 30000,
    tokenAmount: 0.83,
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
    tokenAmount: 0.87,
    tokenPrice: 36977.61,
  },
] as Option[];

export const ActiveOptions = () => {
  const [options, setOptions] = useState<Option[]>(initialOptions);
  const [vaultBalance, setVaultBalance] = useState<VaultBalance>(initialVaultBalance);
  const { toast } = useToast();

  const totalLockedValue = options.reduce((acc, option) => 
    option.status === "Active" ? acc + option.lockedAmount : acc, 0
  );
  const percentageLocked = (totalLockedValue / vaultBalance.tvl) * 100;

  const handleOptionExercise = useCallback((option: Option) => {
    // Calculate the total amount paid by the buyer (strike price × token amount)
    const strikePrice = parseFloat(option.strike.replace(',', ''));
    const totalPaid = strikePrice * option.tokenAmount;
    
    // Update vault balance:
    // 1. Remove the locked tokens
    // 2. Add the total amount paid by the buyer
    setVaultBalance(prev => ({
      ...prev,
      tvl: prev.tvl - option.lockedAmount + totalPaid,
      tokenBalance: prev.tokenBalance - option.tokenAmount,
    }));

    setOptions(prev =>
      prev.map(opt =>
        opt.id === option.id
          ? { ...opt, status: "Exercised" }
          : opt
      )
    );

    toast({
      title: "Option Exercised",
      description: `${option.tokenAmount.toFixed(2)} STRK sold at $${option.strike} strike price. Total payment of $${totalPaid.toLocaleString()} added to available TVL.`,
    });
  }, [toast]);

  const createNewOption = useCallback(() => {
    if (percentageLocked < MAX_OPTIONS_PERCENTAGE) {
      const newTokenAmount = Math.random() * 0.5 + 0.3;
      const newStrikePrice = Math.floor(35000 + Math.random() * 5000);
      const newLockedAmount = newTokenAmount * newStrikePrice;
      const newTotalLocked = totalLockedValue + newLockedAmount;
      
      if ((newTotalLocked / vaultBalance.tvl) * 100 <= MAX_OPTIONS_PERCENTAGE) {
        const newOption: Option = {
          id: Date.now(),
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
          description: `${newOption.tokenAmount.toFixed(2)} ETH | Strike: $${newOption.strike} | Premium: ${newOption.premium} ETH | Locked Value: $${newOption.lockedAmount.toLocaleString()}`,
        });
      }
    }
  }, [percentageLocked, totalLockedValue, vaultBalance.tvl, toast]);

  useEffect(() => {
    const interval = setInterval(createNewOption, 15000);
    return () => clearInterval(interval);
  }, [createNewOption]);

  useEffect(() => {
    const statusInterval = setInterval(() => {
      setOptions(prev =>
        prev.map(option => {
          if (option.status === "Pending" && Math.random() > 0.5) {
            return { ...option, status: "Active" };
          }
          if (option.status === "Active" && Math.random() > 0.9) {
            setTimeout(() => handleOptionExercise(option), 0);
            return option;
          }
          return option;
        })
      );
    }, 5000);

    return () => clearInterval(statusInterval);
  }, [handleOptionExercise]);

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
                  <TableCell className="font-mono">{option.premium} STRK</TableCell>
                  <TableCell>{option.expiry}</TableCell>
                  <TableCell className="font-mono">{option.tokenAmount.toFixed(2)} STRK</TableCell>
                  <TableCell className="font-mono">${option.lockedAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        option.status === "Active"
                          ? "bg-green-500/20 text-green-500"
                          : option.status === "Exercised"
                          ? "bg-blue-500/20 text-black"
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