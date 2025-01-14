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

interface Option {
  id: number;
  strike: string;
  premium: string;
  expiry: string;
  status: "Active" | "Pending" | "Expired";
  createdAt: Date;
}

const initialOptions = [
  {
    id: 1,
    strike: "35,000",
    premium: "0.05",
    expiry: "2024-03-21",
    status: "Active",
    createdAt: new Date(),
  },
  {
    id: 2,
    strike: "36,000",
    premium: "0.04",
    expiry: "2024-03-28",
    status: "Active",
    createdAt: new Date(),
  },
  {
    id: 3,
    strike: "37,000",
    premium: "0.03",
    expiry: "2024-04-04",
    status: "Pending",
    createdAt: new Date(),
  },
] as Option[];

export const ActiveOptions = () => {
  const [options, setOptions] = useState<Option[]>(initialOptions);
  const { toast } = useToast();

  // Simulate real-time option creation
  useEffect(() => {
    const interval = setInterval(() => {
      const newOption: Option = {
        id: options.length + 1,
        strike: `${35000 + Math.floor(Math.random() * 5000)}`,
        premium: (0.02 + Math.random() * 0.04).toFixed(2),
        expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "Pending",
        createdAt: new Date(),
      };

      setOptions(prev => {
        const updated = [...prev, newOption];
        // Keep only the last 5 options
        return updated.slice(-5);
      });

      toast({
        title: "New Option Created",
        description: `Strike Price: $${newOption.strike} | Premium: ${newOption.premium} ETH`,
      });
    }, 15000); // Create new option every 15 seconds

    return () => clearInterval(interval);
  }, []);

  // Update option statuses
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
      <h2 className="text-xl font-semibold mb-4">Active Options</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Strike Price</TableHead>
              <TableHead>Premium</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {options.map((option) => (
              <TableRow key={option.id}>
                <TableCell className="font-mono">${option.strike}</TableCell>
                <TableCell className="font-mono">{option.premium} ETH</TableCell>
                <TableCell>{option.expiry}</TableCell>
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
    </Card>
  );
};
