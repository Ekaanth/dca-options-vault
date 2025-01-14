import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";

export const VaultDeposit = () => {
  const { toast } = useToast();

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Deposit initiated",
      description: "Please confirm the transaction in your wallet",
    });
  };

  return (
    <Card className="p-6 gradient-border">
      <h2 className="text-xl font-semibold mb-4 value-text">Deposit Assets</h2>
      <form onSubmit={handleDeposit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-muted-foreground">Amount</Label>
          <div className="relative">
            <Input
              id="amount"
              placeholder="0.00"
              className="pl-8 font-mono bg-background/50 border-secondary/20 focus:border-secondary/50"
              type="number"
              step="0.01"
            />
            <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
          </div>
        </div>
        <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity">
          Deposit <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
};