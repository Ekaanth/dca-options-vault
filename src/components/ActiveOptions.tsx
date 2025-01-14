import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const options = [
  {
    id: 1,
    strike: "35,000",
    premium: "0.05",
    expiry: "2024-03-21",
    status: "Active",
  },
  {
    id: 2,
    strike: "36,000",
    premium: "0.04",
    expiry: "2024-03-28",
    status: "Active",
  },
  {
    id: 3,
    strike: "37,000",
    premium: "0.03",
    expiry: "2024-04-04",
    status: "Pending",
  },
];

export const ActiveOptions = () => {
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