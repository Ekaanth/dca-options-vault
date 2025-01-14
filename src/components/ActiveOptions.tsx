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
  status: "Active" | "Pending" | "Expired";
  createdAt: Date;
  lockedAmount: number; // Amount of TVL locked by this option
}

const TVL = 124527.89; // This would come from your contract
const MAX_OPTIONS_PERCENTAGE = 80; // Maximum % of TVL that can be locked in options

const initialOptions = [
  {
    id: 1,
    strike: "35,000",
    premium: "0.05",
    expiry: "2024-03-21",
    status: "Active",
    createdAt: new Date(),
    lockedAmount: 25000,
  },
  {
    id: 2,
    strike: "36,000",
    premium: "0.04",
    expiry: "2024-03-28",
    status: "Active",
    createdAt: new Date(),
    lockedAmount: 30000,
  },
  {
    id: 3,
    strike: "37,000",
    premium: "0.03",
    expiry: "2024-04-04",
    status: "Pending",
    createdAt: new Date(),
    lockedAmount: 32169.52,
  },
] as Option[];

export const ActiveOptions = () => {
  const [options, setOptions] = useState<Option[]>(initialOptions);
  const { toast } = useToast();

  // Calculate total locked value
  const totalLockedValue = options.reduce((acc, option) => 
    option.status === "Active" ? acc + option.lockedAmount : acc, 0
  );
  const percentageLocked = (totalLockedValue / TVL) * 100;

  // Simulate real-time option creation
  useEffect(() => {
    const interval = setInterval(() => {
      // Only create new option if we haven't reached the maximum locked percentage
      if (percentageLocked < MAX_OPTIONS_PERCENTAGE) {
        const newLockedAmount = Math.floor(Math.random() * 20000) + 10000;
        const newTotalLocked = totalLockedValue + newLockedAmount;
        
        // Check if adding this option would exceed our maximum
        if ((newTotalLocked / TVL) * 100 <= MAX_OPTIONS_PERCENTAGE) {
          const newOption: Option = {
            id: options.length + 1,
            strike: `${35000 + Math.floor(Math.random() * 5000)}`,
            premium: (0.02 + Math.random() * 0.04).toFixed(2),
            expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: "Pending",
            createdAt: new Date(),
            lockedAmount: newLockedAmount,
          };

          setOptions(prev => {
            const updated = [...prev, newOption];
            return updated.slice(-5); // Keep only the last 5 options
          });

          toast({
            title: "New Option Created",
            description: `Strike Price: $${newOption.strike} | Premium: ${newOption.premium} ETH | Locked: $${newOption.lockedAmount.toLocaleString()}`,
          });
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [options, totalLockedValue]);

  useEffect(() => {
    const statusInterval = setInterval(() => {
      setOptions(prev =>
        prev.map(option => {
          if (option.status === "Pending" && Math.random() > 0.5) {
            return { ...option, status: "Active" };
          }
          return option;
        })
      );
    }, 5000); // Check for status updates every 5 seconds

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
                  <TableCell className="font-mono">${option.lockedAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        option.status === "Active"
                          ? "bg-green-500/20 text-green-500"
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
